import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark'
        }
        return true
    })

    useEffect(() => {
        const root = window.document.documentElement
        if (isDark) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [isDark])

    const toggleTheme = () => setIsDark(!isDark)

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                'relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300',
                'glassmorphism hover:scale-110 active:scale-95 shadow-lg group'
            )}
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                    >
                        <Moon className="h-[18px] w-[18px] text-primary group-hover:text-primary-foreground group-hover:fill-primary transition-colors" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                    >
                        <Sun className="h-[18px] w-[18px] text-amber-500 group-hover:text-amber-600 transition-colors" />
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Subtle gloss effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        </button>
    )
}
