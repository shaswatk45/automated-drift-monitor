import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Activity, FileText, FlaskConical, Settings, Cpu, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getHealth } from '@/lib/api'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/drift', label: 'Drift', icon: Activity },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/predict', label: 'Predict', icon: FlaskConical },
    { to: '/settings', label: 'Settings', icon: Settings },
]

/** Live backend status dot - polls /health every 30s. */
function BackendStatusDot() {
    const [status, setStatus] = useState<'up' | 'down' | 'checking'>('checking')

    useEffect(() => {
        let cancelled = false
        const check = () =>
            getHealth()
                .then(() => { if (!cancelled) setStatus('up') })
                .catch(() => { if (!cancelled) setStatus('down') })
        check()
        const id = setInterval(check, 30_000)
        return () => { cancelled = true; clearInterval(id) }
    }, [])

    const color =
        status === 'up' ? 'var(--success)' :
            status === 'down' ? 'var(--critical)' : 'var(--muted-foreground)'
    const label = status === 'up' ? 'API online' : status === 'down' ? 'API offline' : 'Checking...'

    return (
        <span
            title={label}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)]/60 px-3 py-1.5 text-xs text-[var(--muted-foreground)]"
        >
            <span className="relative flex h-2 w-2">
                {status === 'up' && (
                    <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                        style={{ backgroundColor: color }}
                    />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            </span>
            {label}
        </span>
    )
}

export function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [headerShape, setHeaderShape] = useState('rounded-full')
    const shapeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const location = useLocation()

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (shapeTimeout.current) clearTimeout(shapeTimeout.current)
        if (mobileOpen) {
            setHeaderShape('rounded-2xl')
        } else {
            shapeTimeout.current = setTimeout(() => setHeaderShape('rounded-full'), 300)
        }
        return () => { if (shapeTimeout.current) clearTimeout(shapeTimeout.current) }
    }, [mobileOpen])

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500">
            {/* One shared, subtle backdrop for the whole console (theme-aware) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-60">
                <AuroraBackground />
            </div>

            {/* Floating top navbar */}
            <header className={cn(
                'fixed top-4 left-1/2 -translate-x-1/2 z-50',
                'flex flex-col items-center',
                'px-5 sm:px-6 py-3 glassmorphism shadow-lg',
                headerShape,
                'w-[calc(100%-2rem)] sm:w-auto',
                'transition-all duration-300 ease-in-out'
            )}>
                <div className="flex items-center justify-between w-full gap-x-6">
                    {/* Brand */}
                    <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/25">
                            <Cpu className="h-4.5 w-4.5 text-white" />
                        </div>
                        <span className="text-[11px] font-bold tracking-[0.25em] uppercase font-['Syncopate']">
                            Drift Monitor
                        </span>
                    </NavLink>

                    {/* Desktop nav links */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink key={to} to={to} end={to === '/dashboard'} className="group">
                                {({ isActive }) => (
                                    <div className={cn(
                                        'flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-[var(--primary)]/15 text-[var(--primary)] shadow-sm'
                                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                                    )}>
                                        <Icon className="h-4 w-4" />
                                        <span>{label}</span>
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <BackendStatusDot />
                        <ThemeToggle />

                        {/* Mobile hamburger */}
                        <button
                            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--secondary)] transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                <div className={cn(
                    'sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden',
                    mobileOpen ? 'max-h-[500px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'
                )}>
                    <nav className="flex flex-col items-center gap-2 w-full">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/dashboard'}
                                className={({ isActive }) => cn(
                                    'flex items-center gap-2 w-full justify-center rounded-lg px-4 py-2.5 text-sm transition-colors',
                                    isActive
                                        ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 pt-24">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-6 pt-10">
                <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Automated Drift Monitor</span>
                    <span className="font-mono">PSI &middot; KS-Test &middot; SHAP</span>
                </div>
            </footer>
        </div>
    )
}
