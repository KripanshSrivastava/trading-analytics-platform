# core/logging_config.py

import logging
import sys


def setup_logging(debug: bool = False) -> None:
    """
    Configure logging for the entire application.
    - INFO level in production
    - DEBUG level when debug=True (shows cache hits/misses etc.)
    - Timestamps, level, logger name, and message in every line
    """
    level = logging.DEBUG if debug else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler — writes to terminal
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Root logger — applies to all loggers in the app
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)

    # Quieten noisy third-party libraries
    logging.getLogger("yfinance").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("websockets").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
