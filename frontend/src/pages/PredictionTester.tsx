import { useState } from 'react'
import { predict, type PredictionInput, type PredictionResult } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { CheckCircle, XCircle, FlaskConical } from 'lucide-react'

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

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Prediction Tester</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Test loan predictions using the deployed model</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Applicant Details</CardTitle>
                        <CardDescription>Fill in the features below and click Predict</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Select fields */}
                            {Object.entries(selectFields).map(([field, options]) => (
                                <div key={field} className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--muted-foreground)]">{field.replace(/_/g, ' ')}</label>
                                    <select
                                        value={input[field as keyof PredictionInput] as string}
                                        onChange={(e) => handleChange(field, e.target.value)}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors"
                                    >
                                        {options.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            {/* Number fields */}
                            {numberFields.map((field) => (
                                <div key={field} className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--muted-foreground)]">{field.replace(/_/g, ' ')}</label>
                                    <input
                                        type="number"
                                        value={input[field as keyof PredictionInput] as number}
                                        onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <LiquidButton onClick={handleSubmit} size="lg" disabled={loading}>
                                <FlaskConical className="h-4 w-4 mr-1" />
                                {loading ? 'Predicting...' : 'Predict'}
                            </LiquidButton>
                            <button
                                onClick={() => { setInput(defaultInput); setResult(null); setError(null) }}
                                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                    </CardContent>
                </Card>

                {/* Result Card */}
                <Card className={`relative overflow-hidden transition-colors ${result ? (isApproved ? 'border-emerald-500/30' : 'border-red-500/30') : ''
                    }`}>
                    <CardHeader>
                        <CardTitle className="text-base">Prediction Result</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[280px]">
                        {!result && !loading && (
                            <div className="text-center text-[var(--muted-foreground)]">
                                <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Submit the form to see the prediction</p>
                            </div>
                        )}
                        {loading && <span className="loader" />}
                        {result && (
                            <div className="text-center space-y-4">
                                {isApproved ? (
                                    <CheckCircle className="h-16 w-16 mx-auto text-emerald-400" />
                                ) : (
                                    <XCircle className="h-16 w-16 mx-auto text-red-400" />
                                )}
                                <div>
                                    <p className={`text-3xl font-bold ${isApproved ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isApproved ? 'Approved' : 'Rejected'}
                                    </p>
                                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                        Prediction: {result.prediction}
                                    </p>
                                </div>

                                {/* Probability bar */}
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                                        <span>Probability</span>
                                        <span>{(result.probability * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-[var(--secondary)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${result.probability * 100}%`,
                                                backgroundColor: isApproved ? 'var(--success)' : 'var(--critical)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
