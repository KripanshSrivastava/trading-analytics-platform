// src/utils/constants.js

export const SYMBOLS = [
  { value: '^NSEI', label: 'Nifty 50' },
  { value: '^BSESN', label: 'Sensex' },
  { value: '^NSEBANK', label: 'Bank Nifty' },
]

export const PERIODS = [
  { value: '1mo',  label: '1 Month'   },
  { value: '3mo',  label: '3 Months'  },
  { value: '6mo',  label: '6 Months'  },
  { value: '1y',   label: '1 Year'    },
  { value: '2y',   label: '2 Years'   },
  { value: '5y',   label: '5 Years'   },
  { value: '10y',  label: '10 Years'  },
  { value: 'max',  label: 'Max'       },
]

export const STRATEGIES = [
  { value: 'rsi', label: 'RSI Mean Reversion' },
  { value: 'ema_cross', label: 'EMA Crossover' },
  { value: 'macd', label: 'MACD Momentum' },
]

export const TOPICS = [
  { value: 'rbi_policy', label: 'RBI Policy' },
  { value: 'fii_dii', label: 'FII / DII' },
  { value: 'earnings', label: 'Earnings' },
  { value: 'ipo', label: 'IPO' },
  { value: 'global', label: 'Global' },
  { value: 'economy', label: 'Economy' },
  { value: 'budget', label: 'Budget' },
  { value: 'commodities', label: 'Commodities' },
]

// Chart colours
export const CHART_COLORS = {
  bullish: '#1D9E75',
  bearish: '#E24B4A',
  neutral: '#888780',
  ema: '#378ADD',
  rsi: '#7F77DD',
  macd: '#BA7517',
  signal: '#E24B4A',
  histogram: '#1D9E75',
  fii: '#1D9E75',
  dii: '#378ADD',
  volume: '#B4B2A9',
}

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/live/ws/feed'

export const NEWS_SOURCES = [
  { value: null, label: 'All sources' },
  { value: 'Moneycontrol', label: 'Moneycontrol' },
  { value: 'Economic Times', label: 'Economic Times' },
  { value: 'LiveMint', label: 'LiveMint' },
  { value: 'BusinessLine', label: 'BusinessLine' },
  { value: 'CNBC TV18', label: 'CNBC TV18' },
  { value: 'NSE India', label: 'NSE India' },
  { value: 'Business Standard', label: 'Business Standard' },
  { value: 'Financial Express', label: 'Financial Express' },
]