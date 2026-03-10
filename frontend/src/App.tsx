import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import DriftMonitoring from '@/pages/DriftMonitoring'
import Reports from '@/pages/Reports'
import PredictionTester from '@/pages/PredictionTester'
import Settings from '@/pages/Settings'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/drift" element={<DriftMonitoring />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/predict" element={<PredictionTester />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
