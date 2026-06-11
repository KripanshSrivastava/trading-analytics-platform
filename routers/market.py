# routers/market.py
from fastapi import APIRouter, Query

from services.market_service import fetch_market_data

router = APIRouter(prefix="/market", tags=["Market Data"])

# Available symbols
AVAILABLE_SYMBOLS = [
    {"symbol": "^NSEI",    "name": "Nifty 50 Index"},
    {"symbol": "^BSESN",   "name": "BSE Sensex Index"},
    {"symbol": "^NSEBANK", "name": "Bank Nifty Index"},
]

INTRADAY_INTERVALS = ["1m", "2m", "5m", "15m", "30m", "60m", "1h", "4h"]
DAILY_INTERVALS    = ["1d", "1wk", "1mo"]
ALL_INTERVALS      = INTRADAY_INTERVALS + DAILY_INTERVALS


@router.get("/")
def get_market_data(
    symbol: str = Query(
        default="^NSEI",
        description="^NSEI, ^BSESN, ^NSEBANK"
    ),
    period: str = Query(
        default="3mo",
        description="1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max (daily) | 1d, 5d, 1mo (intraday)"
    ),
    interval: str = Query(
        default="1d",
        description="1d, 1wk, 1mo, 1m, 5m, 15m, 30m, 60m, 4h"
    ),
):
    """
    Fetch OHLC market data.
    Supports daily and intraday intervals.
    Intraday data is limited by yfinance: 1m=7d, 5m/15m/30m=60d, 60m/4h=730d.
    """
    return fetch_market_data(symbol=symbol, period=period, interval=interval)


@router.get("/intraday")
def get_intraday_data(
    symbol: str = Query(
        default="^NSEI",
        description="^NSEI, ^BSESN, ^NSEBANK"
    ),
    interval: str = Query(
        default="5m",
        description="1m, 2m, 5m, 15m, 30m, 60m, 4h"
    ),
    period: str = Query(
        default="5d",
        description="Lookback period — 1d, 5d, 1mo, 3mo (depends on interval)"
    ),
):
    """
    Optimised intraday endpoint.
    Sensible period defaults per interval:
      1m  → 1d  (max 7d)
      5m  → 5d  (max 60d)
      15m → 5d
      30m → 1mo
      60m → 1mo
      4h  → 3mo
    """
    return fetch_market_data(symbol=symbol, period=period, interval=interval)


@router.get("/price")
def get_price():
    """Quick price snapshot for a single symbol."""
    return {
        "symbol": "BTCUSD",
        "price":  60000,
    }


@router.get("/symbols")
def get_available_symbols():
    """Get list of available symbols."""
    return {
        "symbols":   AVAILABLE_SYMBOLS,
        "count":     len(AVAILABLE_SYMBOLS),
        "intervals": {
            "intraday": INTRADAY_INTERVALS,
            "daily":    DAILY_INTERVALS,
        },
    }
