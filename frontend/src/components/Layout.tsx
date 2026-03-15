import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Activity, FileText, FlaskConical, Settings, Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/drift', label: 'Drift Monitoring', icon: Activity },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/predict', label: 'Prediction Tester', icon: FlaskConical },
    { to: '/settings', label: 'Settings', icon: Settings },
]

/* ── Animated nav link text ── */
function AnimatedNavText({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
    return (
        <span className={cn(
            'transition-colors duration-200',
            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
        )}>
            {children}
        </span>
    )
}

import { ThemeToggle } from './ThemeToggle'

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
            {/* ── Floating Top Navbar ── */}
            <header className={cn(
                'fixed top-5 left-1/2 -translate-x-1/2 z-50',
                'flex flex-col items-center',
                'px-8 py-4 glassmorphism',
                headerShape,
                'w-[calc(100%-2rem)] sm:w-auto',
                'transition-all duration-300 ease-in-out'
            )}>
                {/* Desktop row */}
                <div className="flex items-center justify-between w-full gap-x-8">
                    {/* Brand */}
                    <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/20">
                            <Cpu className="h-4.5 w-4.5 text-white" />
                        </div>
                        <span className="text-[11px] font-bold tracking-[0.3em] text-[var(--foreground)] hidden sm:inline uppercase font-['Syncopate']">
                            Drift Monitor
                        </span>
                    </NavLink>

                    {/* Desktop nav links */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/dashboard'}
                                className="group"
                            >
                                {({ isActive }) => (
                                    <div className={cn(
                                        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-[var(--primary)]/15 text-[var(--primary)] shadow-sm'
                                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                                    )}>
                                        <Icon className="h-4.5 w-4.5" />
                                        <span className="transition-colors duration-200">{label}</span>
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* Status pill */}
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--secondary)]/60 border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                v1.0.0
                            </span>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Mobile hamburger */}
                        <button
                            className="sm:hidden flex items-center justify-center w-8 h-8 text-[var(--foreground)]"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
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

            {/* ── Main Content ── */}
            <main className="flex-1 pt-20">
                <Outlet />
            </main>
        </div>
    )
}
