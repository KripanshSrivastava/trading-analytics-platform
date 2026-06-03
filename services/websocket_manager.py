# services/websocket_manager.py

import asyncio
import json
import logging
import struct
from datetime import datetime
from typing import Any

import websockets
from google.protobuf.message import DecodeError

from core.config import settings

logger = logging.getLogger(__name__)

# Upstox WebSocket URL
UPSTOX_WS_URL = "wss://api.upstox.com/v2/feed/market-data-feed"

# Instrument keys to subscribe to — same as your symbol map
SUBSCRIBE_KEYS = [
    "NSE_INDEX|Nifty 50",
    "BSE_INDEX|SENSEX",
    "NSE_INDEX|Nifty Bank",
]

# In-memory store of latest tick per instrument
# { "NSE_INDEX|Nifty 50": { "ltp": 22450.5, "timestamp": "..." } }
_live_ticks: dict[str, dict] = {}

# Set of active FastAPI WebSocket clients to broadcast to
_clients: set = set()

# Connection state
_ws_task: asyncio.Task | None = None
_connected: bool = False


def get_live_tick(instrument_key: str) -> dict | None:
    """Get the latest tick for a given instrument key."""
    return _live_ticks.get(instrument_key)


def get_all_ticks() -> dict:
    """Get all stored ticks — used by /live endpoint."""
    return dict(_live_ticks)


def is_connected() -> bool:
    return _connected


async def register_client(websocket) -> None:
    """Register a new React frontend client for broadcasting."""
    _clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(_clients)}")


async def unregister_client(websocket) -> None:
    """Remove a disconnected client."""
    _clients.discard(websocket)
    logger.info(f"Client disconnected. Total clients: {len(_clients)}")


async def _broadcast(data: dict) -> None:
    """Send tick update to all connected React clients."""
    if not _clients:
        return

    message = json.dumps(data)
    dead_clients = set()

    for client in _clients:
        try:
            await client.send_text(message)
        except Exception:
            dead_clients.add(client)

    # Clean up disconnected clients
    for client in dead_clients:
        _clients.discard(client)


def _parse_market_data(data: bytes) -> dict | None:
    """
    Parse the binary protobuf message from Upstox WebSocket.
    Upstox sends data in protobuf format — we decode the key fields.
    Returns a clean dict with LTP and metadata.
    """
    try:
        # Upstox market feed uses protobuf
        # Import the generated protobuf class from Upstox SDK
        from upstox_client.feeder.proto.MarketDataFeed_pb2 import FeedResponse

        feed_response = FeedResponse()
        feed_response.ParseFromString(data)

        result = {}
        for key, feed in feed_response.feeds.items():
            if feed.HasField("ff"):
                market_ff = feed.ff.marketFF
                ltpc = market_ff.ltpc
                result[key] = {
                    "ltp": ltpc.ltp,
                    "close": ltpc.cp,  # previous close
                    "timestamp": datetime.now().isoformat(),
                    "change": round(ltpc.ltp - ltpc.cp, 2),
                    "change_pct": (
                        round((ltpc.ltp - ltpc.cp) / ltpc.cp * 100, 2) if ltpc.cp else 0
                    ),
                }
        return result if result else None

    except (DecodeError, Exception) as e:
        logger.debug(f"Protobuf parse error: {e}")
        return None


async def _upstox_ws_connect() -> None:
    """
    Main WebSocket connection loop.
    Connects to Upstox, subscribes to instruments, receives ticks.
    Automatically reconnects if connection drops.
    """
    global _connected

    if not settings.upstox_access_token:
        logger.warning("No Upstox access token — WebSocket feed disabled")
        return

    reconnect_delay = 5  # initial delay in seconds
    max_reconnect_delay = 160  # cap backoff at ~2.5 minutes
    max_retries = 10  # stop after this many consecutive failures
    consecutive_failures = 0

    while consecutive_failures < max_retries:
        try:
            headers = {
                "Authorization": f"Bearer {settings.upstox_access_token}",
                "Api-Version": "2.0",
            }

            import ssl
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            logger.info("Connecting to Upstox WebSocket feed...")

            async with websockets.connect(
                UPSTOX_WS_URL,
                additional_headers=headers,
                ping_interval=30,
                ping_timeout=10,
                ssl=ssl_context,
            ) as ws:
                _connected = True
                consecutive_failures = 0  # reset on successful connection
                reconnect_delay = 5  # reset backoff
                logger.info("Upstox WebSocket connected")

                # Subscribe to instruments
                subscribe_msg = {
                    "guid": "trading-platform-feed",
                    "method": "sub",
                    "data": {
                        "mode": "full",
                        "instrumentKeys": SUBSCRIBE_KEYS,
                    },
                }
                await ws.send(json.dumps(subscribe_msg).encode())
                logger.info(f"Subscribed to: {SUBSCRIBE_KEYS}")

                # Listen for ticks
                async for message in ws:
                    if isinstance(message, bytes):
                        parsed = _parse_market_data(message)
                        if parsed:
                            # Update in-memory store
                            _live_ticks.update(parsed)

                            # Broadcast to all connected React clients
                            await _broadcast(
                                {
                                    "type": "tick",
                                    "data": parsed,
                                    "time": datetime.now().isoformat(),
                                }
                            )

        except websockets.exceptions.ConnectionClosed as e:
            _connected = False
            consecutive_failures += 1
            logger.warning(
                f"Upstox WebSocket closed: {e}. "
                f"Retry {consecutive_failures}/{max_retries} in {reconnect_delay}s..."
            )

        except Exception as e:
            _connected = False
            consecutive_failures += 1
            logger.error(
                f"Upstox WebSocket error: {e}. "
                f"Retry {consecutive_failures}/{max_retries} in {reconnect_delay}s..."
            )

        await asyncio.sleep(reconnect_delay)
        # Exponential backoff, capped at max_reconnect_delay
        reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)

    # Exhausted all retries
    logger.error(
        f"Upstox WebSocket gave up after {max_retries} consecutive failures. "
        f"Your access token is likely expired. "
        f"Re-authenticate at /auth/upstox/login to get a new token, then restart."
    )


async def start_websocket_feed() -> None:
    """
    Start the WebSocket feed as a background asyncio task.
    Called once during FastAPI startup.
    """
    global _ws_task
    _ws_task = asyncio.create_task(_upstox_ws_connect())
    logger.info("Upstox WebSocket feed task started")


async def stop_websocket_feed() -> None:
    """Cancel the WebSocket task on app shutdown."""
    global _ws_task
    if _ws_task and not _ws_task.done():
        _ws_task.cancel()
        try:
            await _ws_task
        except asyncio.CancelledError:
            pass
    logger.info("WebSocket feed stopped")
