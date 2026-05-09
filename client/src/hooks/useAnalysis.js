import { useState, useCallback } from 'react'
import {
  analyzeDrawing as analyzeService,
  getDrawingAnalysis,
} from '../services/analysis.service'

export function useAnalysis(drawingId) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalysis = useCallback(async () => {
    if (!drawingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getDrawingAnalysis(drawingId)
      setAnalysis(res.data?.analysis || null)
    } catch (err) {
      // 404 just means no analysis yet
      if (err.status !== 404) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [drawingId])

  const triggerAnalysis = useCallback(async () => {
    if (!drawingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeService(drawingId)
      setAnalysis(res.data?.analysis || null)
      return res.data?.analysis
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [drawingId])

  return { analysis, loading, error, fetchAnalysis, triggerAnalysis }
}
