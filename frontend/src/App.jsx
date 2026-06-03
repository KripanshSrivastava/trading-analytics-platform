// src/App.jsx — complete final version

import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery }       from '@tanstack/react-query'
import {
  BarChart2, TrendingUp, Brain, Shield,
  FlaskConical, Newspaper, Building2,
  CandlestickChart, Layers, BookOpen, Waves,
  Menu, X,
} from 'lucide-react'

import { useTheme }         from './hooks/useTheme'
import { useWatchlist }     from './hooks/useWatchlist'
import ThemeToggle          from './components/ui/ThemeToggle'
import WatchlistPanel       from './components/panels/WatchlistPanel'

const Dashboard            = lazy(() => import('./pages/Dashboard'))
const Indicators           = lazy(() => import('./pages/Indicators'))
const AdvancedIndicators   = lazy(() => import('./pages/AdvancedIndicators'))
const SMC                  = lazy(() => import('./pages/SMC'))
const Predict              = lazy(() => import('./pages/Predict'))
const Risk                 = lazy(() => import('./pages/Risk'))
const Backtest             = lazy(() => import('./pages/Backtest'))
const News                 = lazy(() => import('./pages/News'))
const FiiDii               = lazy(() => import('./pages/FiiDii'))
const Journal              = lazy(() => import('./pages/Journal'))
const Charts               = lazy(() => import('./pages/Charts'))
const Liquidity            = lazy(() => import('./pages/Liquidity'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
})

const NAV_ITEMS = [
  { to: '/',           icon: BarChart2,       label: 'Dashboard'  },
  { to: '/indicators', icon: TrendingUp,      label: 'Indicators' },
  { to: '/advanced',   icon: Layers,          label: 'Advanced'   },
  { to: '/smc',        icon: CandlestickChart, label: 'SMC / FVG' },
  { to: '/liquidity',  icon: Waves,           label: 'Liquidity'  },
  { to: '/predict',    icon: Brain,           label: 'Predict'    },
  { to: '/charts',     icon: CandlestickChart,label: 'Index Charts'},
  { to: '/risk',       icon: Shield,          label: 'Risk'       },
  { to: '/backtest',   icon: FlaskConical,    label: 'Backtest'   },
  { to: '/news',       icon: Newspaper,       label: 'News'       },
  { to: '/fii-dii',    icon: Building2,       label: 'FII / DII'  },
  { to: '/journal',    icon: BookOpen,        label: 'Journal'    },
]

function AppInner() {
  const { isDark, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSymbol, setActiveSymbol] = useState('^NSEI')

  const navLinkStyle = (isActive) => ({
    display:        'flex',
    alignItems:     'center',
    gap:            '8px',
    padding:        '7px 10px',
    borderRadius:   'var(--border-radius-md)',
    fontSize:       '13px',
    fontWeight:     '500',
    textDecoration: 'none',
    color:          isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    background:     isActive ? 'var(--color-background-secondary)' : 'transparent',
    transition:     'all 0.12s',
  })

  const Sidebar = ({ mobile = false }) => (
    <aside style={{
      width:          mobile ? '100%' : '200px',
      flexShrink:     0,
      borderRight:    mobile ? 'none' : '0.5px solid var(--color-border-tertiary)',
      padding:        '1.25rem 1rem',
      display:        'flex',
      flexDirection:  'column',
      gap:            '2px',
      background:     'var(--color-background-primary)',
      height:         mobile ? 'auto' : '100vh',
      overflowY:      'auto',
      position:       mobile ? 'fixed' : 'sticky',
      top:            0,
      left:           mobile ? 0 : 'auto',
      right:          mobile ? 0 : 'auto',
      bottom:         mobile ? 0 : 'auto',
      zIndex:         mobile ? 100 : 'auto',
    }}>
      {/* Logo + theme toggle */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '1.25rem',
        padding:        '0 2px',
      }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', margin: 0 }}>
            TradeHelp
          </p>
          <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: '1px 0 0' }}>
            Indian Markets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <ThemeToggle isDark={isDark} onToggle={toggle} />
          {mobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width:          '32px',
                height:         '32px',
                borderRadius:   'var(--border-radius-md)',
                border:         '0.5px solid var(--color-border-tertiary)',
                background:     'var(--color-background-secondary)',
                color:          'var(--color-text-secondary)',
                cursor:         'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => mobile && setSidebarOpen(false)}
          style={({ isActive }) => navLinkStyle(isActive)}
        >
          <Icon size={14} strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}

      {/* Divider */}
      <div style={{
        height:    '0.5px',
        background: 'var(--color-border-tertiary)',
        margin:    '8px 0',
      }} />

      {/* Watchlist */}
      <WatchlistPanel
        onSelectSymbol={setActiveSymbol}
        currentSymbol={activeSymbol}
      />

      {/* Backend status */}
      <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
        <BackendStatus />
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Desktop sidebar */}
      <div className="sidebar" style={{ display: 'flex' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position:   'fixed',
              inset:      0,
              background: 'rgba(0,0,0,0.5)',
              zIndex:     99,
            }}
          />
          <Sidebar mobile />
        </>
      )}

      {/* Main content */}
      <main style={{
        flex:       1,
        minWidth:   0,
        background: 'var(--color-background-tertiary)',
      }}>
        {/* Mobile top bar */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          padding:        '12px 16px',
          borderBottom:   '0.5px solid var(--color-border-tertiary)',
          background:     'var(--color-background-primary)',
          position:       'sticky',
          top:            0,
          zIndex:         50,
        }}
          className="mobile-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '32px',
              height:         '32px',
              borderRadius:   'var(--border-radius-md)',
              border:         '0.5px solid var(--color-border-tertiary)',
              background:     'transparent',
              color:          'var(--color-text-secondary)',
              cursor:         'pointer',
            }}
          >
            <Menu size={15} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
            TradeHelp
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle isDark={isDark} onToggle={toggle} />
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Loading page...
            </div>
          }>
            <Routes>
              <Route path="/"           element={<Dashboard />}          />
              <Route path="/indicators" element={<Indicators />}         />
              <Route path="/advanced"   element={<AdvancedIndicators />} />
              <Route path="/smc"        element={<SMC />}                />
              <Route path="/liquidity"  element={<Liquidity />}          />
              <Route path="/charts"     element={<Charts />}             />
              <Route path="/predict"    element={<Predict />}            />
              <Route path="/risk"       element={<Risk />}               />
              <Route path="/backtest"   element={<Backtest />}           />
              <Route path="/news"       element={<News />}               />
              <Route path="/fii-dii"    element={<FiiDii />}             />
              <Route path="/journal"    element={<Journal />}            />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}

// Hide desktop sidebar and mobile topbar at correct breakpoints
const responsiveStyle = `
  .sidebar { display: flex; }
  .mobile-topbar { display: none; }

  @media (max-width: 768px) {
    .sidebar { display: none; }
    .mobile-topbar { display: flex; }
  }
`

function BackendStatus() {
  const { data, isError } = useQuery({
    queryKey:        ['health'],
    queryFn:         () => fetch('/api/health').then((r) => r.json()),
    refetchInterval: 30000,
    retry:           false,
  })

  const isOk = !isError && data?.status === 'healthy'
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '6px',
      fontSize:   '10px',
      color:      'var(--color-text-tertiary)',
      padding:    '4px',
    }}>
      <span style={{
        width:        '6px',
        height:       '6px',
        borderRadius: '50%',
        background:   isOk ? '#1D9E75' : '#E24B4A',
        display:      'inline-block',
      }} />
      {isOk ? 'API connected' : 'API offline'}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <style>{responsiveStyle}</style>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
