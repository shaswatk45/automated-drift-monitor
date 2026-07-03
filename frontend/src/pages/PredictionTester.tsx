import { useState } from 'react'
import { predict, type PredictionInput, type PredictionResult } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageShell, PageHeader } from '@/components/PageShell'
import { CheckCircle, XCircle, FlaskConical } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const defaultInput: PredictionInput = {
    Gender: 'Male',
    Married: 'Yes',
    Dependents: '0',
    Education: 'Graduate',
    Self_Employed: 'No',
    ApplicantIncome: 5000,
    CoapplicantIncome: 0,
    LoanAmount: 150,
    Loan_Amount_Term: 360,
    Credit_History: 1,
    Property_Area: 'Urban',
}

const selectFields: Record<string, string[]> = {
    Gender: ['Male', 'Female'],
    Married: ['Yes', 'No'],
    Dependents: ['0', '1', '2', '3+'],
    Education: ['Graduate', 'Not Graduate'],
    Self_Employed: ['Yes', 'No'],
    Property_Area: ['Urban', 'Semiurban', 'Rural'],
}

const numberFields = ['ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term', 'Credit_History']

const fieldClasses =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm ' +
    'text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] ' +
    'focus:ring-1 focus:ring-[var(--primary)]/40'

export default function PredictionTester() {
    const [input, setInput] = useState<PredictionInput>(defaultInput)
    const [result, setResult] = useState<PredictionResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (field: string, value: string | number) => {
        setInput((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const res = await predict(input)
            setResult(res)
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Prediction failed.')
        } finally {
            setLoading(false)
        }
    }

    const isApproved = result?.prediction === 'Y'
    const resultColor = isApproved ? 'var(--success)' : 'var(--critical)'

    return (
        <PageShell>
            <PageHeader
                icon={FlaskConical}
                title="Prediction Tester"
                subtitle="Score a loan application with the deployed model and inspect the SHAP explanation"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Applicant Details</CardTitle>
                        <CardDescription>Fill in the features below and click Predict</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(selectFields).map(([field, options]) => (
                                <div key={field} className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--muted-foreground)]">
                                        {field.replace(/_/g, ' ')}
                                    </label>
                                    <select
                                        value={input[field as keyof PredictionInput] as string}
                                        onChange={(e) => handleChange(field, e.target.value)}
                                        className={fieldClasses}
                                    >
                                        {options.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            {numberFields.map((field) => (
                                <div key={field} className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--muted-foreground)]">
                                        {field.replace(/_/g, ' ')}
                                    </label>
                                    <input
                                        type="number"
                                        value={input[field as keyof PredictionInput] as number}
                                        onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                                        className={fieldClasses}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <Button size="lg" onClick={handleSubmit} disabled={loading}>
                                <FlaskConical className="h-4 w-4" />
                                {loading ? 'Predicting...' : 'Predict'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { setInput(defaultInput); setResult(null); setError(null) }}
                            >
                                Reset
                            </Button>
                        </div>
                        {error && <p className="mt-3 text-sm text-[var(--critical)]">{error}</p>}
                    </CardContent>
                </Card>

                {/* Result card */}
                <Card
                    className="relative overflow-hidden transition-colors"
                    style={result ? { borderColor: `color-mix(in srgb, ${resultColor} 30%, transparent)` } : undefined}
                >
                    <CardHeader>
                        <CardTitle className="text-base">Prediction Result</CardTitle>
                    </CardHeader>
                    <CardContent className="flex min-h-[280px] flex-col items-center justify-center">
                        {!result && !loading && (
                            <div className="text-center text-[var(--muted-foreground)]">
                                <FlaskConical className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                <p className="text-sm">Submit the form to see the prediction</p>
                            </div>
                        )}
                        {loading && <span className="loader" />}
                        {result && (
                            <div className="w-full space-y-4 text-center">
                                {isApproved ? (
                                    <CheckCircle className="mx-auto h-16 w-16" style={{ color: resultColor }} />
                                ) : (
                                    <XCircle className="mx-auto h-16 w-16" style={{ color: resultColor }} />
                                )}
                                <div>
                                    <p className="text-3xl font-bold" style={{ color: resultColor }}>
                                        {isApproved ? 'Approved' : 'Rejected'}
                                    </p>
                                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                        Prediction: {result.prediction}
                                    </p>
                                </div>

                                {/* Probability bar */}
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                                        <span>Approval probability</span>
                                        <span className="tabular-nums">{(result.probability * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-[var(--secondary)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${result.probability * 100}%`, backgroundColor: resultColor }}
                                        />
                                    </div>
                                </div>

                                {/* SHAP reasoning */}
                                {result.reasoning && result.reasoning.length > 0 && (
                                    <div className="mt-6 w-full border-t border-[var(--border)] pt-6 text-left">
                                        <p className="mb-1 text-sm font-medium">Top Influencing Factors</p>
                                        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
                                            SHAP contribution toward approval (green pushes up, red pushes down)
                                        </p>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={result.reasoning.slice(0, 5)}
                                                    layout="vertical"
                                                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                                >
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="feature"
                                                        type="category"
                                                        width={110}
                                                        tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload
                                                                return (
                                                                    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs shadow-lg">
                                                                        <p className="font-medium text-[var(--foreground)]">
                                                                            {data.feature}: {data.value}
                                                                        </p>
                                                                        <p className="text-[var(--muted-foreground)]">
                                                                            Impact: {data.importance > 0 ? '+' : ''}{data.importance.toFixed(3)}
                                                                        </p>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        }}
                                                    />
                                                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                                                        {result.reasoning.slice(0, 5).map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.importance > 0 ? 'var(--success)' : 'var(--critical)'}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    )
}
