# main.py

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.cache import get_cache_stats
from core.config import settings
from core.error_handlers import register_error_handlers
from core.logging_config import setup_logging
from core.middleware import RequestLoggingMiddleware
from core.scheduler import get_scheduler_status, start_scheduler, stop_scheduler
from core.database import init_db
from routers import auth_upstox, backtest, cache, fii_dii, fvg, indicators, live, market, news, predict, risk, options, smc_full, watchlist, journal, liquidity
from services.websocket_manager import is_connected, start_websocket_feed, stop_websocket_feed

setup_logging(debug=settings.debug)
logger = logging.getLogger(__name__)

# Check if running in test mode
TESTING = os.environ.get("TESTING") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v0.16.0")

    # Initialize database tables on startup
    try:
        init_db()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # Skip scheduler and WebSocket in test mode
    if not TESTING:
        start_scheduler()

        if settings.upstox_access_token:
            await start_websocket_feed()
            logger.info("Upstox WebSocket feed started")
        else:
            logger.info("No Upstox token — WebSocket feed skipped")
    else:
        logger.info("Running in TEST mode — scheduler and WebSocket skipped")

    yield

    if not TESTING:
        await stop_websocket_feed()
        stop_scheduler()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered trading analytics for Indian markets",
    version="0.16.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tradehelp.tech",
        "https://www.tradehelp.tech",
        "https://tradehelp.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(market.router)
app.include_router(indicators.router)
app.include_router(fvg.router)
app.include_router(predict.router)
app.include_router(risk.router)
app.include_router(backtest.router)
app.include_router(news.router)
app.include_router(fii_dii.router)
app.include_router(live.router)
app.include_router(auth_upstox.router)
app.include_router(cache.router)
app.include_router(options.router)
app.include_router(smc_full.router)
app.include_router(watchlist.router)
app.include_router(journal.router)
app.include_router(liquidity.router)


@app.get("/ping", tags=["Health"])
def ping():
    """Lightweight health check for Railway — never fails."""
    return {"status": "ok"}


@app.get("/", tags=["Health"])
def root():
    return {
        "app":      settings.app_name,
        "status":   "running",
        "version":  "0.16.0",
        "provider": settings.data_provider,
        "docs":     "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status":        "healthy",
        "data_provider": settings.data_provider,
        "ws_connected":  is_connected(),
        "cache":         get_cache_stats(),
        "scheduler":     get_scheduler_status(),
    }