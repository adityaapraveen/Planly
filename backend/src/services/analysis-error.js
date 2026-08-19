const normalizeCode = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    return 'ANALYSIS_FAILED'
}

export const analysisFailureData = (error, durationMs) => ({
    status: 'FAILED',
    errorCode: normalizeCode(error?.code ?? error?.status).slice(0, 120),
    errorMessage: String(error?.message || 'Analysis failed').slice(0, 2000),
    durationMs,
    completedAt: new Date()
})
