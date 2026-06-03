// src/pages/Dashboard.jsx

import { useState, useCallback } from 'react'
import { useMarket }             from '../hooks/useMarket'
import { useIndicators, useLatestSignals } from '../hooks/useIndicators'
import { useFiiDiiToday }        from '../hooks/useFiiDii'
import { useMarketMood }         from '../hooks/useNews'
import { useOpenFvgs }           from '../hooks/useFvg'

import CandlestickChart  from '../components/charts/CandlestickChart'
import ChartToolbar      from '../components/charts/ChartToolbar'
import CrosshairTooltip  from '../components/charts/CrosshairTooltip'
import LivePriceTicker   from '../components/panels/LivePriceTicker'
import SymbolSelector    from '../components/ui/SymbolSelector'
import { StatCard }      from '../components/ui/StatCard'
import { Badge }         from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage }  from '../components/ui/ErrorMessage'

import {
  formatPrice, formatPct, formatCrore,
  getSentimentColor, getSignalColor,
} from '../utils/formatters'

export default function Dashboard() {
  const [symbol,   setSymbol]   = useState('^NSEI')
  const [period,   setPeriod]   = useState('1y')
  const [interval, setInterval] = useState('1d')
  const [overlays, setOverlays] = useState({
    ema:    true,
    volume: true,
    fvg:    false,
  })
  const [hoveredCandle, setHoveredCandle] = useState(null)

  // ChartToolbar now passes (interval, recommendedPeriod)
  const handleIntervalChange = useCallback((newInterval, newPeriod) => {
    setInterval(newInterval)
    if (newPeriod) setPeriod(newPeriod)
  }, [])

  // Data hooks
  const { data: market,     isLoading: mLoading, error: mError, refetch } =
    useMarket(symbol, period, interval)
  const { data: indicators, isLoading: iLoading } =
    useIndicators(symbol, period)
  const { data: signals } =
    useLatestSignals(symbol)
  const { data: fiiToday } =
    useFiiDiiToday()
  const { data: mood } =
    useMarketMood()
  const { data: fvgData } =
    useOpenFvgs(symbol)

  const handleOverlayToggle = useCallback((key) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const isLoading = mLoading || iLoading

  if (mError)    return <ErrorMessage message={mError.message} onRetry={refetch} />

  const summary  = market?.summary    || {}
  const latest   = signals?.latest    || {}
  const candles  = market?.data       || []
  const indData  = indicators?.data   || []
  const fii      = fiiToday?.fii      || {}
  const dii      = fiiToday?.dii      || {}
  const signal   = fiiToday?.signal   || {}
  const fvgZones = fvgData?.fvgs      || []

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '1.25rem',
        flexWrap:       'wrap',
        gap:            '10px',
      }}>
        <div>
          <h1 style={{
            fontSize:   '20px',
            fontWeight: '500',
            margin:     '0 0 3px',
            color:      'var(--color-text-primary)',
          }}>
            {isLoading ? 'Loading Market...' : (market?.name || 'Market Dashboard')}
          </h1>
          <p style={{
            fontSize: '12px',
            color:    'var(--color-text-secondary)',
            margin:   0,
          }}>
            {isLoading ? 'Waiting for backend to start...' : (
              <>
                {market?.count} candles · {market?.period} ·{' '}
                <span style={{ color: market?._cache === 'HIT' ? '#1D9E75' : '#BA7517' }}>
                  {market?._cache === 'HIT' ? 'cached' : 'live'}
                </span>
              </>
            )}
          </p>
        </div>
        <SymbolSelector
          symbol={symbol}
          period={period}
          onSymbolChange={setSymbol}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap:                 '8px',
        marginBottom:        '1.25rem',
      }}>
        <StatCard
          label="Last close"
          value={isLoading ? "—" : formatPrice(summary.latest_close)}
          change={isLoading ? 0 : summary.change_pct}
        />
        <StatCard
          label="Change"
          value={isLoading ? "—" : formatPct(summary.change_pct)}
          color={isLoading ? "var(--color-text-secondary)" : (summary.change_pct >= 0 ? '#1D9E75' : '#E24B4A')}
        />
        <StatCard
          label="Period high"
          value={isLoading ? "—" : formatPrice(summary.period_high)}
          color="#1D9E75"
        />
        <StatCard
          label="Period low"
          value={isLoading ? "—" : formatPrice(summary.period_low)}
          color="#E24B4A"
        />
        <StatCard
          label="RSI (14)"
          value={isLoading ? "—" : (latest.rsi_value || '—')}
          color={
            isLoading ? "var(--color-text-secondary)" :
            latest.rsi_signal === 'overbought' ? '#E24B4A' :
            latest.rsi_signal === 'oversold'   ? '#1D9E75' :
            'var(--color-text-primary)'
          }
        />
        <StatCard
          label="EMA position"
          value={isLoading ? "—" : (latest.price_vs_ema || '—')}
          color={isLoading ? "var(--color-text-secondary)" : (latest.price_vs_ema === 'above' ? '#1D9E75' : '#E24B4A')}
        />
      </div>

      {/* ── Main chart card ──────────────────────────────────────── */}
      <div style={{
        background:    'var(--color-background-primary)',
        border:        '0.5px solid var(--color-border-tertiary)',
        borderRadius:  'var(--border-radius-lg)',
        padding:       '1rem 1.25rem',
        marginBottom:  '10px',
      }}>
        <ChartToolbar
          interval={interval}
          overlays={overlays}
          onIntervalChange={handleIntervalChange}
          onOverlayToggle={handleOverlayToggle}
        />

        {isLoading ? (
          <div style={{ height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            <LoadingSpinner />
            <div style={{ marginTop: '16px', fontSize: '13px' }}>Backend is starting up...</div>
          </div>
        ) : (
          <CandlestickChart
            data={candles}
            emaData={indData}
            fvgZones={fvgZones}
            showVolume={overlays.volume}
            showEMA={overlays.ema}
            showFVG={overlays.fvg}
            height={380}
            isIntraday={!['1d','1wk','1mo'].includes(interval)}
            onCrosshair={setHoveredCandle}
          />
        )}

        <CrosshairTooltip data={hoveredCandle} />
      </div>

      {/* ── Live ticker ──────────────────────────────────────────── */}
      {!isLoading && (
        <LivePriceTicker
          symbol={symbol}
          lastClose={summary.latest_close}
        />
      )}

      {/* ── Bottom row — FII/DII + News mood ────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '10px',
        marginTop:           '10px',
      }}>

        {/* FII/DII today */}
        <div style={{
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '1rem 1.25rem',
        }}>
          <p style={{
            fontSize:     '13px',
            fontWeight:   '500',
            margin:       '0 0 12px',
            color:        'var(--color-text-primary)',
          }}>
            Institutional flows today
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'FII net', value: fii.net, action: fii.action },
              { label: 'DII net', value: dii.net, action: dii.action },
            ].map(({ label, value, action }) => (
              <div key={label} style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
              }}>
                <span style={{
                  fontSize: '12px',
                  color:    'var(--color-text-secondary)',
                }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize:   '13px',
                    fontWeight: '500',
                    color:      action === 'buy' ? '#1D9E75' : '#E24B4A',
                  }}>
                    {value != null ? formatCrore(value) : '—'}
                  </span>
                  <Badge
                    label={action || '—'}
                    color={action === 'buy' ? '#1D9E75' : '#E24B4A'}
                  />
                </div>
              </div>
            ))}

            {signal.signal && (
              <div style={{
                marginTop:    '8px',
                paddingTop:   '8px',
                borderTop:    '0.5px solid var(--color-border-tertiary)',
                fontSize:     '11px',
                color:        signal.color || 'var(--color-text-secondary)',
                fontWeight:   '500',
              }}>
                {signal.signal}
              </div>
            )}
          </div>
        </div>

        {/* News mood */}
        <div style={{
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '1rem 1.25rem',
        }}>
          <p style={{
            fontSize:     '13px',
            fontWeight:   '500',
            margin:       '0 0 12px',
            color:        'var(--color-text-primary)',
          }}>
            Market sentiment
          </p>

          {mood?.market_mood ? (
            <div>
              <div style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '10px',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize:   '20px',
                  fontWeight: '500',
                  color:      mood.market_mood.overall_color,
                }}>
                  {mood.market_mood.overall_label?.toUpperCase()}
                </span>
                <span style={{
                  fontSize: '12px',
                  color:    'var(--color-text-secondary)',
                }}>
                  {mood.market_mood.total} articles analysed
                </span>
              </div>

              {/* Sentiment bar */}
              <div style={{
                display:      'flex',
                height:       '6px',
                borderRadius: '3px',
                overflow:     'hidden',
                gap:          '2px',
              }}>
                {[
                  { pct: mood.market_mood.sentiment_distribution?.positive_pct, color: '#1D9E75' },
                  { pct: mood.market_mood.sentiment_distribution?.neutral_pct,  color: '#888780' },
                  { pct: mood.market_mood.sentiment_distribution?.negative_pct, color: '#E24B4A' },
                ].map(({ pct, color }, i) => (
                  <div key={i} style={{
                    width:      `${pct || 0}%`,
                    background: color,
                  }} />
                ))}
              </div>

              <div style={{
                display:  'flex',
                gap:      '12px',
                marginTop: '6px',
              }}>
                {[
                  { label: 'Positive', count: mood.market_mood.positive_count, color: '#1D9E75' },
                  { label: 'Neutral',  count: mood.market_mood.neutral_count,  color: '#888780' },
                  { label: 'Negative', count: mood.market_mood.negative_count, color: '#E24B4A' },
                ].map(({ label, count, color }) => (
                  <span key={label} style={{ fontSize: '11px', color }}>
                    {label}: {count}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Loading sentiment data...
            </p>
          )}
        </div>

      </div>

      {/* ── FVG summary panel ────────────────────────────────────── */}
      {fvgZones.length > 0 && (
        <div style={{
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '1rem 1.25rem',
          marginTop:    '10px',
        }}>
          <p style={{
            fontSize:   '13px',
            fontWeight: '500',
            margin:     '0 0 12px',
            color:      'var(--color-text-primary)',
          }}>
            Open Fair Value Gaps ({fvgZones.length})
          </p>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap:                 '8px',
          }}>
            {fvgZones.slice(0, 6).map((fvg, i) => {
              const isBull = fvg.type === 'bullish'
              const color  = isBull ? '#1D9E75' : '#E24B4A'
              return (
                <div key={i} style={{
                  background:   isBull ? '#E1F5EE' : '#FCEBEB',
                  border:       `0.5px solid ${color}44`,
                  borderRadius: 'var(--border-radius-md)',
                  padding:      '10px 12px',
                }}>
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   '4px',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color }}>
                      {isBull ? '▲ Bullish' : '▼ Bearish'} FVG
                    </span>
                    <span style={{
                      fontSize:     '10px',
                      padding:      '1px 6px',
                      borderRadius: '10px',
                      background:   `${color}20`,
                      color,
                    }}>
                      {fvg.strength || 'open'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    {fvg.gap_bottom?.toFixed(1)} – {fvg.gap_top?.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                    {fvg.candle_3}
                  </div>
                </div>
              )
            })}
          </div>

          {fvgData?.nearest_open_fvg && (
            <div style={{
              marginTop:  '10px',
              paddingTop: '10px',
              borderTop:  '0.5px solid var(--color-border-tertiary)',
              fontSize:   '12px',
              color:      'var(--color-text-secondary)',
            }}>
              <span style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                Nearest zone:{' '}
              </span>
              {fvgData.nearest_open_fvg.gap_bottom?.toFixed(1)}–{fvgData.nearest_open_fvg.gap_top?.toFixed(1)}
              {' · '}{fvgData.nearest_open_fvg.type} · strength: {fvgData.nearest_open_fvg.strength}
            </div>
          )}
        </div>
      )}
    </div>
  )
}