import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Layout } from '@/components/Layout'

// Code-split every route so a visitor to the landing page never downloads the
// dashboard's charts (and vice-versa). Each page becomes its own lazy chunk.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const DriftMonitoring = lazy(() => import('@/pages/DriftMonitoring'))
const Reports = lazy(() => import('@/pages/Reports'))
const PredictionTester = lazy(() => import('@/pages/PredictionTester'))
const Settings = lazy(() => import('@/pages/Settings'))

function PageFallback() {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <span className="loader" />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/drift" element={<DriftMonitoring />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/predict" element={<PredictionTester />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
