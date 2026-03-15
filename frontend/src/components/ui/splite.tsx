import { Suspense, lazy, useEffect, useRef, useState } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
    scene: string
    className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className={className} style={{ willChange: 'transform' }}>
            <Suspense
                fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="loader"></span>
                    </div>
                }
            >
                {isVisible && <Spline scene={scene} className="w-full h-full" />}
            </Suspense>
        </div>
    )
}
