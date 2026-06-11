// src/pages/Backtest.jsx

import { useState }    from 'react'
import { useMutation } from '@tanstack/react-query'
import { backtestApi } from '../api/endpoints'

import BacktestResultCard from '../components/panels/BacktestResultCard'
import { ErrorMessage }   from '../components/ui/ErrorMessage'
import { STRATEGIES, SYMBOLS, PERIODS } from '../utils/constants'

const selectStyle = {
  fontSize:     '12px',
  padding:      '6px 10px',
  border:       '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  background:   'var(--color-background-secondary)',
  color:        'var(--color-text-primary)',
  outline:      'none',
  width:        '100%',
  cursor:       'pointer',
}

export default function Backtest() {
  const [config, setConfig] = useState({
    strategy:        'rsi',
    symbol:          '^NSEI',
    period:          '2y',
    initial_capital: '100000',
  })
  const [result, setResult] = useState(null)
  const [compareResults, setCompareResults] = useState(null)

  const set = (key) => (e) =>
    setConfig((p) => ({ ...p, [key]: e.target.value }))

  const runMutation = useMutation({
    mutationFn: () => backtestApi.run(
      config.strategy,
      config.symbol,
      config.period,
      parseFloat(config.initial_capital),
    ),
    onSuccess: (data) => {
      setResult(data)
      setCompareResults(null)
    },
  })

  const compareMutation = useMutation({
    mutationFn: () => backtestApi.compare(config.symbol, config.period),
    onSuccess:  (data) => {
      setCompareResults(data)
      setResult(null)
    },
  })

  const isLoading = runMutation.isPending || compareMutation.isPending

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 3px' }}>
          Backtesting
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Test strategies on historical Nifty 50 data
        </p>
      </div>

      {/* Config panel */}
      <div style={{
        background:   'var(--color-background-primary)',
        border:       '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding:      '1rem 1.25rem',
        marginBottom: '12px',
      }}>
        <p style={{ fontSize: '13px', fontWeight: '500', margin: '0 0 14px' }}>
          Strategy configuration
        </p>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap:                 '12px',
          marginBottom:        '14px',
        }}>
          <div>
            <label style={{
              display:      'block',
              fontSize:     '11px',
              color:        'var(--color-text-secondary)',
              marginBottom: '4px',
            }}>
              Strategy
            </label>
            <select value={config.strategy} onChange={set('strategy')} style={selectStyle}>
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display:      'block',
              fontSize:     '11px',
              color:        'var(--color-text-secondary)',
              marginBottom: '4px',
            }}>
              Symbol
            </label>
            <select value={config.symbol} onChange={set('symbol')} style={selectStyle}>
              {SYMBOLS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display:      'block',
              fontSize:     '11px',
              color:        'var(--color-text-secondary)',
              marginBottom: '4px',
            }}>
              Test period
            </label>
            <select value={config.period} onChange={set('period')} style={selectStyle}>
              {PERIODS.filter((p) => ['1y', '2y', '5y', '10y', 'max'].includes(p.value)).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display:      'block',
              fontSize:     '11px',
              color:        'var(--color-text-secondary)',
              marginBottom: '4px',
            }}>
              Starting capital (₹)
            </label>
            <input
              type="number"
              value={config.initial_capital}
              onChange={set('initial_capital')}
              style={{ ...selectStyle, fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => runMutation.mutate()}
            disabled={isLoading}
            style={{
              flex:         1,
              padding:      '8px',
              fontSize:     '13px',
              fontWeight:   '500',
              border:       'none',
              borderRadius: 'var(--border-radius-md)',
              background:   isLoading ? 'var(--color-border-secondary)' : 'var(--color-text-primary)',
              color:        'var(--color-background-primary)',
              cursor:       isLoading ? 'wait' : 'pointer',
            }}
          >
            {runMutation.isPending ? 'Running...' : 'Run backtest'}
          </button>

          <button
            onClick={() => compareMutation.mutate()}
            disabled={isLoading}
            style={{
              flex:         1,
              padding:      '8px',
              fontSize:     '13px',
              fontWeight:   '500',
              border:       '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              background:   'var(--color-background-secondary)',
              color:        'var(--color-text-secondary)',
              cursor:       isLoading ? 'wait' : 'pointer',
            }}
          >
            {compareMutation.isPending ? 'Comparing...' : 'Compare all strategies'}
          </button>
        </div>

        {isLoading && (
          <p style={{
            fontSize:   '11px',
            color:      'var(--color-text-secondary)',
            margin:     '8px 0 0',
            textAlign:  'center',
          }}>
            Running backtest... this takes 5–10 seconds
          </p>
        )}
      </div>

      {/* Error */}
      {(runMutation.isError || compareMutation.isError) && (
        <ErrorMessage
          message={runMutation.error?.message || compareMutation.error?.message}
        />
      )}

      {/* Single strategy result */}
      {result && (
        <div style={{
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '1rem 1.25rem',
        }}>
          <BacktestResultCard result={result} />
        </div>
      )}

      {/* Compare results */}
      {compareResults?.results && (
        <div>
          <p style={{
            fontSize:     '13px',
            fontWeight:   '500',
            margin:       '0 0 10px',
            color:        'var(--color-text-secondary)',
          }}>
            Best strategy: {compareResults.winner} ·{' '}
            {compareResults.symbol} · {compareResults.period}
          </p>
          {compareResults.results.map((r) => !r.error && (
            <div
              key={r.strategy}
              style={{
                background:   'var(--color-background-primary)',
                border:       '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
                padding:      '1rem 1.25rem',
                marginBottom: '10px',
              }}
            >
              <BacktestResultCard
                result={{
                  ...r,
                  description:   STRATEGIES.find((s) => s.value === r.strategy)?.label || r.strategy,
                  equity_curve:  [],
                  config:        { initial_capital: parseFloat(config.initial_capital) },
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}