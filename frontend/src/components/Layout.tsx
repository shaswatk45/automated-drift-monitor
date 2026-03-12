import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Activity, FileText, FlaskConical, Settings, Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
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
        <div className="flex flex-col min-h-screen">
            {/* ── Floating Top Navbar ── */}
            <header className={cn(
                'fixed top-5 left-1/2 -translate-x-1/2 z-50',
                'flex flex-col items-center',
                'px-6 py-3 backdrop-blur-md',
                headerShape,
                'border border-[#333] bg-[rgba(15,15,15,0.72)]',
                'w-[calc(100%-2rem)] sm:w-auto',
                'transition-[border-radius] duration-200'
            )}>
                {/* Desktop row */}
                <div className="flex items-center justify-between w-full gap-x-8">
                    {/* Brand */}
                    <NavLink to="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
                            <Cpu className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-white hidden sm:inline uppercase font-['Syncopate']">
                            Drift Monitor
                        </span>
                    </NavLink>

                    {/* Desktop nav links */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className="group"
                            >
                                {({ isActive }) => (
                                    <div className={cn(
                                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                                        isActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}>
                                        <Icon className="h-3.5 w-3.5" />
                                        <AnimatedNavText isActive={isActive}>{label}</AnimatedNavText>
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Status pill */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(31,31,31,0.62)] border border-[#333] px-3 py-1.5 text-xs text-gray-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            v1.0.0
                        </span>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300"
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
                                end={to === '/'}
                                className={({ isActive }) => cn(
                                    'flex items-center gap-2 w-full justify-center rounded-lg px-4 py-2.5 text-sm transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
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
