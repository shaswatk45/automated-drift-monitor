import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import LandingPage from '@/pages/LandingPage'
import Dashboard from '@/pages/Dashboard'
import DriftMonitoring from '@/pages/DriftMonitoring'
import Reports from '@/pages/Reports'
import PredictionTester from '@/pages/PredictionTester'
import Settings from '@/pages/Settings'

export default function App() {
    return (
        <BrowserRouter>
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
        </BrowserRouter>
    )
}
