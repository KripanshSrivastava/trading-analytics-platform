import datetime
import logging
import random
from typing import Dict, List

from core.cache import cache
from core.config import settings
from core.exceptions import InvalidParameterError, SymbolNotFoundError
from utils.formatters import format_number

logger = logging.getLogger(__name__)

KNOWN_SYMBOLS = {
    "^NSEI": "Nifty 50",
    "^BSESN": "BSE Sensex",
    "^NSEBANK": "Bank Nifty",
}


# Intraday intervals and the maximum period yfinance allows for each
INTRADAY_INTERVAL_PERIODS = {
    "1m":  {"max_days": 7,   "allowed_periods": {"1d", "5d"}},
    "2m":  {"max_days": 60,  "allowed_periods": {"1d", "5d", "1mo", "3mo"}},
    "5m":  {"max_days": 60,  "allowed_periods": {"1d", "5d", "1mo", "3mo"}},
    "15m": {"max_days": 60,  "allowed_periods": {"1d", "5d", "1mo", "3mo"}},
    "30m": {"max_days": 60,  "allowed_periods": {"1d", "5d", "1mo", "3mo"}},
    "60m": {"max_days": 730, "allowed_periods": {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"}},
    "1h":  {"max_days": 730, "allowed_periods": {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"}},
    "4h":  {"max_days": 730, "allowed_periods": {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"}},
}

DAILY_INTERVALS   = {"1d", "1wk", "1mo"}
DAILY_PERIODS     = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max"}
INTRADAY_PERIODS  = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"}


def validate_params(period: str, interval: str) -> None:
    if interval in DAILY_INTERVALS:
        if period not in DAILY_PERIODS:
            raise InvalidParameterError(
                param="period", value=period,
                reason=f"For {interval} interval, valid periods: {DAILY_PERIODS}"
            )
    elif interval in INTRADAY_INTERVAL_PERIODS:
        allowed = INTRADAY_INTERVAL_PERIODS[interval]["allowed_periods"]
        if period not in allowed:
            raise InvalidParameterError(
                param="period", value=period,
                reason=f"For {interval} interval, valid periods: {allowed}"
            )
    else:
        all_intervals = DAILY_INTERVALS | set(INTRADAY_INTERVAL_PERIODS.keys())
        raise InvalidParameterError(
            param="interval", value=interval,
            reason=f"Valid options: {all_intervals}"
        )


def _count_for_period(period: str) -> int:
    mapping = {
        "1mo": 22,
        "3mo": 66,
        "6mo": 132,
        "1y": 252,
        "2y": 504,
        "5y": 1260,
        "10y": 2520,
        "max": 5040,
    }
    return mapping.get(period, 22)


def format_ohlc_row(date, row) -> dict:
    """Format a single OHLCV row from yfinance."""
    return {
        "date": str(date.date()),
        "open": format_number(row["Open"]),
        "high": format_number(row["High"]),
        "low": format_number(row["Low"]),
        "close": format_number(row["Close"]),
        "volume": int(row["Volume"]),
    }


def fetch_market_data(symbol: str, period: str = "3mo", interval: str = "1d") -> Dict:
    """
    Fetch market data from configured provider (yfinance, Upstox, or deterministic stub).

    Uses settings.data_provider to determine which backend to use:
    - "yfinance": Real data from Yahoo Finance
    - "upstox": Live data from Upstox API
    - "deterministic": Stub data for testing/development
    """
    validate_params(period, interval)

    # Route to appropriate provider
    if settings.data_provider.lower() == "yfinance":
        try:
            logger.info(f"Fetching from Yahoo Finance: {symbol}")
            from services.yfinance_service import fetch_yfinance_market_data

            return fetch_yfinance_market_data(symbol, period, interval)
        except Exception as e:
            logger.error(
                f"Yahoo Finance fetch failed, falling back to deterministic: {e}"
            )
            return _fetch_deterministic_data(symbol, period, interval)
    elif settings.data_provider.lower() == "upstox":
        try:
            logger.info(f"Fetching from Upstox: {symbol}")
            from services.upstox_service import fetch_upstox_market_data

            return fetch_upstox_market_data(symbol, period, interval)
        except Exception as e:
            logger.error(f"Upstox fetch failed, falling back to deterministic: {e}")
            return _fetch_deterministic_data(symbol, period, interval)
    else:
        logger.info(f"Fetching from deterministic provider: {symbol}")
        return _fetch_deterministic_data(symbol, period, interval)


def _fetch_deterministic_data(
    symbol: str, period: str = "3mo", interval: str = "1d"
) -> Dict:
    """Return a deterministic, in-memory OHLCV dataset and a small summary.

    This is a stub implementation used for tests and local development so
    the project does not depend on external market data providers.
    """
    supported = {
        "^NSEI": "Nifty 50",
        "^BSESN": "BSE Sensex",
        "^NSEBANK": "Bank Nifty",
    }

    if symbol not in supported:
        raise SymbolNotFoundError(symbol)

    name = supported[symbol]
    count = _count_for_period(period)

    # Choose a sensible base price per symbol so numbers look realistic
    # Updated for current market prices (2026)
    base_prices = {"^NSEI": 23000.0, "^BSESN": 77000.0, "^NSEBANK": 48000.0}
    base = base_prices.get(symbol, 1000.0)

    # Make deterministic but varied data per symbol+period
    seed = (hash(symbol) ^ hash(period)) & 0xFFFFFFFF
    rnd = random.Random(seed)

    today = datetime.date.today()
    data: List[Dict] = []

    prev_close = base + rnd.uniform(-50, 50)
    for i in range(count):
        # generate a pseudo-date (not skipping weekends) moving backwards
        dt = today - datetime.timedelta(days=(count - i))
        # simulate small moves
        open_price = prev_close + rnd.uniform(-20, 20)
        close_price = open_price + rnd.uniform(-30, 30)
        high = max(open_price, close_price) + rnd.uniform(0, 10)
        low = min(open_price, close_price) - rnd.uniform(0, 10)
        volume = int(rnd.uniform(1_000_000, 5_000_000))

        row = {
            "date": dt.isoformat(),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close_price, 2),
            "volume": volume,
        }
        data.append(row)
        prev_close = close_price

    # summary
    closes = [r["close"] for r in data]
    latest_close = closes[-1]
    prev_close_for_change = closes[-2] if len(closes) > 1 else closes[-1]
    change_pct = (
        ((latest_close - prev_close_for_change) / prev_close_for_change) * 100
        if prev_close_for_change
        else 0.0
    )

    period_high = max(r["high"] for r in data) if data else None
    period_low = min(r["low"] for r in data) if data else None

    summary = {
        "latest_close": round(latest_close, 2),
        "change_pct": round(change_pct, 3),
        "period_high": round(period_high, 2) if period_high is not None else None,
        "period_low": round(period_low, 2) if period_low is not None else None,
    }

    result = {
        "symbol": symbol,
        "name": name,
        "summary": summary,
        "data": data,
        "count": len(data),
    }

    return result
