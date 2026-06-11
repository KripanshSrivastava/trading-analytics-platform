// src/pages/Charts.jsx
// Multi-index, multi-timeframe OHLC chart page
// Shows Nifty 50, Bank Nifty, and Sensex in a 3-panel layout
// with a shared timeframe switcher

import { useState, useCallback } from 'react'
import { useQuery }              from '@tanstack/react-query'
import { marketApi }             from '../api/endpoints'
import CandlestickChart          from '../components/charts/CandlestickChart'
import { LoadingSpinner }        from '../components/ui/LoadingSpinner'

// ── Timeframe config ──────────────────────────────────────────────────────────
const TIMEFRAMES = [
  { label: '1m',  value: '1m',  period: '1d',  intraday: true  },
  { label: '3m',  value: '2m',  period: '5d',  intraday: true  },
  { label: '5m',  value: '5m',  period: '5d',  intraday: true  },
  { label: '15m', value: '15m', period: '5d',  intraday: true  },
  { label: '30m', value: '30m', period: '1mo', intraday: true  },
  { label: '1H',  value: '60m', period: '3mo', intraday: true  },
  { label: '4H',  value: '4h',  period: '6mo', intraday: true  },
  { label: '1D',  value: '1d',  period: '2y',  intraday: false },
  { label: '1W',  value: '1wk', period: '5y',  intraday: false },
  { label: '1M',  value: '1mo', period: '10y', intraday: false },
]

const INDEXES = [
  { symbol: '^NSEI',   name: 'Nifty 50',   color: '#1D9E75' },
  { symbol: '^NSEBANK', name: 'Bank Nifty', color: '#378ADD' },
  { symbol: '^BSESN',  name: 'Sensex',     color: '#BA7517' },
]

// ── Single index panel ────────────────────────────────────────────────────────
function IndexPanel({ symbol, name, color, interval, period, isIntraday }) {
  const { data, isLoading, error } = useQuery({
    queryKey:  ['charts', symbol, interval, period],
    queryFn:   () => marketApi.getData(symbol, period, interval),
    staleTime: 3 * 60 * 1000,
    retry:     1,
  })

  const candles = data?.data || []
  const summary = data?.summary || {}
  const changePos = summary.change_pct >= 0

  return (
    <div style={{
      background:   'var(--color-background-primary)',
      border:       '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow:     'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '12px 16px',
        borderBottom:   '0.5px solid var(--color-border-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width:        '3px',
            height:       '16px',
            borderRadius: '2px',
            background:   color,
          }} />
          <span style={{
            fontSize:   '13px',
            fontWeight: '500',
            color:      'var(--color-text-primary)',
          }}>
            {name}
          </span>
          <span style={{
            fontSize: '11px',
            color:    'var(--color-text-tertiary)',
          }}>
            {symbol}
          </span>
        </div>

        {summary.latest_close && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize:   '14px',
              fontWeight: '500',
              color:      'var(--color-text-primary)',
            }}>
              {summary.latest_close?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span style={{
              fontSize:   '11px',
              fontWeight: '500',
              color:      changePos ? '#1D9E75' : '#E24B4A',
            }}>
              {changePos ? '▲' : '▼'} {Math.abs(summary.change_pct).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart body */}
      <div style={{ padding: '0 4px 4px' }}>
        {isLoading ? (
          <div style={{
            height:         '260px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width:        '20px',
              height:       '20px',
              border:       '2px solid var(--color-border-tertiary)',
              borderTop:    `2px solid ${color}`,
              borderRadius: '50%',
              animation:    'spin 0.8s linear infinite',
            }} />
          </div>
        ) : error ? (
          <div style={{
            height:         '260px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexDirection:  'column',
            gap:            '6px',
            color:          'var(--color-text-tertiary)',
            fontSize:       '12px',
          }}>
            <span>⚠️</span>
            <span>{error.message || 'Failed to load data'}</span>
          </div>
        ) : (
          <CandlestickChart
            data={candles}
            height={260}
            showVolume={true}
            showEMA={false}
            showFVG={false}
            isIntraday={isIntraday}
          />
        )}
      </div>
    </div>
  )
}

// ── Main Charts page ──────────────────────────────────────────────────────────
export default function Charts() {
  const [activeTf, setActiveTf] = useState(TIMEFRAMES[4])  // default 30m

  const chipStyle = (active) => ({
    fontSize:     '12px',
    padding:      '5px 12px',
    borderRadius: '20px',
    border:       `0.5px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border-tertiary)'}`,
    background:   active
      ? 'var(--color-text-primary)'
      : 'var(--color-background-secondary)',
    color:        active
      ? 'var(--color-background-primary)'
      : 'var(--color-text-secondary)',
    cursor:       'pointer',
    fontWeight:   active ? '500' : '400',
    transition:   'all 0.15s',
  })

  return (
    <div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '1.25rem',
        flexWrap:       'wrap',
        gap:            '12px',
      }}>
        <div>
          <h1 style={{
            fontSize:   '20px',
            fontWeight: '500',
            margin:     '0 0 3px',
            color:      'var(--color-text-primary)',
          }}>
            Index Charts
          </h1>
          <p style={{
            fontSize: '12px',
            color:    'var(--color-text-secondary)',
            margin:   0,
          }}>
            Nifty 50 · Bank Nifty · Sensex — {activeTf.label} candles
            {activeTf.intraday && (
              <span style={{
                marginLeft:   '6px',
                fontSize:     '10px',
                padding:      '2px 6px',
                borderRadius: '10px',
                background:   'var(--color-accent-bg)',
                color:        'var(--color-accent)',
              }}>
                Intraday
              </span>
            )}
          </p>
        </div>

        {/* Timeframe selector */}
        <div style={{
          display:      'flex',
          gap:          '4px',
          flexWrap:     'wrap',
          alignItems:   'center',
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '6px 8px',
        }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setActiveTf(tf)}
              style={chipStyle(activeTf.value === tf.value)}
              id={`tf-btn-${tf.value}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Index note for intraday ───────────────────────────────── */}
      {activeTf.intraday && (
        <div style={{
          background:   '#FFF8E6',
          border:       '0.5px solid #BA751740',
          borderRadius: 'var(--border-radius-md)',
          padding:      '8px 14px',
          marginBottom: '14px',
          fontSize:     '12px',
          color:        '#BA7517',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
        }}>
          <span>⏱</span>
          <span>
            Intraday data is available only during and after market hours (9:15 AM – 3:30 PM IST).
            Showing last <strong>{activeTf.period}</strong> of <strong>{activeTf.label}</strong> candles.
          </span>
        </div>
      )}

      {/* ── 3-panel grid ─────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap:                 '12px',
      }}>
        {INDEXES.map((idx) => (
          <IndexPanel
            key={idx.symbol}
            symbol={idx.symbol}
            name={idx.name}
            color={idx.color}
            interval={activeTf.value}
            period={activeTf.period}
            isIntraday={activeTf.intraday}
          />
        ))}
      </div>

      {/* ── Intraday limitations note ─────────────────────────────── */}
      <div style={{
        marginTop:    '16px',
        padding:      '12px 16px',
        background:   'var(--color-background-primary)',
        border:       '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-md)',
        fontSize:     '11px',
        color:        'var(--color-text-tertiary)',
      }}>
        <strong style={{ color: 'var(--color-text-secondary)' }}>Data limits (Yahoo Finance):</strong>
        {' '}1m → last 7 days · 5m/15m/30m → last 60 days · 1H/4H → last 730 days · 1D/1W/1M → up to 10 years (or max available).
        Data refreshes automatically on interval change.
      </div>
    </div>
  )
}
