# services/yfinance_service.py

"""
Yahoo Finance integration for live market data.
Fetches real historical OHLC data from yfinance.
Supports daily (1d/1wk/1mo) and intraday (1m/2m/5m/15m/30m/60m/4h) intervals.
"""

import logging
from typing import Dict

import yfinance as yf

from utils.formatters import format_number

logger = logging.getLogger(__name__)

# Symbol mapping
YFINANCE_SYMBOLS = {
    "^NSEI":   "Nifty 50 Index",
    "^BSESN":  "BSE Sensex Index",
    "^NSEBANK": "Bank Nifty Index",
}

INTRADAY_INTERVALS = {"1m", "2m", "5m", "15m", "30m", "60m", "1h", "4h"}


def fetch_yfinance_market_data(
    symbol: str, period: str = "3mo", interval: str = "1d"
) -> Dict:
    """
    Fetch real market data from Yahoo Finance.

    Args:
        symbol:   Ticker symbol (^NSEI, ^BSESN, ^NSEBANK)
        period:   Time period ("1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max")
        interval: Candle interval ("1d", "1wk", "1mo", "1m", "5m", "15m", "30m", "60m", "4h")

    Returns:
        Dictionary with OHLCV data and summary
    """
    if symbol not in YFINANCE_SYMBOLS:
        raise ValueError(f"Unknown symbol: {symbol}")

    is_intraday = interval in INTRADAY_INTERVALS

    try:
        logger.info(f"Fetching Yahoo Finance data: {symbol} ({period}, {interval})")

        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            logger.warning(f"No data returned from yfinance for {symbol}")
            raise ValueError(f"No market data available for {symbol}")

        # Format the data — intraday uses datetime, daily uses date only
        data = []
        for ts, row in df.iterrows():
            if is_intraday:
                # Unix seconds (epoch) — timezone-independent, display in IST on frontend
                date_str = int(ts.timestamp())
            else:
                date_str = ts.strftime("%Y-%m-%d")

            data.append({
                "date":   date_str,
                "open":   format_number(row["Open"]),
                "high":   format_number(row["High"]),
                "low":    format_number(row["Low"]),
                "close":  format_number(row["Close"]),
                "volume": int(row["Volume"]),
            })

        # Calculate summary
        closes      = [d["close"] for d in data]
        latest_close = closes[-1]
        prev_close  = closes[-2] if len(closes) > 1 else closes[-1]
        change_pct  = (
            ((latest_close - prev_close) / prev_close * 100) if prev_close else 0
        )

        period_high = max(d["high"] for d in data)
        period_low  = min(d["low"]  for d in data)

        summary = {
            "latest_close": latest_close,
            "change_pct":   round(change_pct, 3),
            "period_high":  period_high,
            "period_low":   period_low,
        }

        result = {
            "symbol":     symbol,
            "name":       YFINANCE_SYMBOLS[symbol],
            "interval":   interval,
            "period":     period,
            "is_intraday": is_intraday,
            "summary":    summary,
            "data":       data,
            "count":      len(data),
        }

        logger.info(f"Successfully fetched {len(data)} candles for {symbol} ({interval})")
        return result

    except Exception as e:
        logger.error(f"Yahoo Finance fetch failed: {e}")
        raise
