// src/components/charts/ChartToolbar.jsx

// Timeframe groups
const TIMEFRAMES = [
  { label: '1m',  value: '1m',  period: '1d'  },
  { label: '3m',  value: '2m',  period: '5d'  },   // yfinance has no 3m, use 2m
  { label: '5m',  value: '5m',  period: '5d'  },
  { label: '15m', value: '15m', period: '5d'  },
  { label: '30m', value: '30m', period: '1mo' },
  { label: '1H',  value: '60m', period: '3mo' },
  { label: '4H',  value: '4h',  period: '6mo' },
  { label: '1D',  value: '1d',  period: '2y'  },
  { label: '1W',  value: '1wk', period: '5y'  },
  { label: '1M',  value: '1mo', period: '10y' },
]

const OVERLAYS = [
  { key: 'ema',    label: 'EMA' },
  { key: 'volume', label: 'Volume' },
  { key: 'fvg',    label: 'FVG zones' },
]

export default function ChartToolbar({
  interval,
  overlays,
  onIntervalChange,
  onOverlayToggle,
}) {
  const chipStyle = (active) => ({
    fontSize:     '11px',
    padding:      '4px 9px',
    borderRadius: '20px',
    border:       '0.5px solid var(--color-border-tertiary)',
    background:   active
      ? 'var(--color-text-primary)'
      : 'var(--color-background-secondary)',
    color:        active
      ? 'var(--color-background-primary)'
      : 'var(--color-text-secondary)',
    cursor:       'pointer',
    fontWeight:   active ? '500' : '400',
    transition:   'all 0.15s',
    whiteSpace:   'nowrap',
  })

  const handleTimeframe = (tf) => {
    // Pass both interval + the recommended period for that timeframe
    onIntervalChange(tf.value, tf.period)
  }

  return (
    <div style={{
      display:     'flex',
      gap:         '4px',
      alignItems:  'center',
      marginBottom: '12px',
      flexWrap:    'wrap',
    }}>
      {/* Timeframe chips */}
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          onClick={() => handleTimeframe(tf)}
          style={chipStyle(interval === tf.value)}
        >
          {tf.label}
        </button>
      ))}

      <div style={{
        width:      '0.5px',
        height:     '18px',
        background: 'var(--color-border-tertiary)',
        margin:     '0 4px',
      }} />

      {/* Overlay toggles */}
      {OVERLAYS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onOverlayToggle(key)}
          style={chipStyle(overlays?.[key])}
        >
          {label}
        </button>
      ))}
    </div>
  )
}