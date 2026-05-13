import { useState, useEffect, useCallback } from 'react'
import { getDrawings } from '../services/drawing.service'

export function useDrawings(projectId) {
  const [drawings, setDrawings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDrawings = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getDrawings(projectId)
      setDrawings(res.data?.drawings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    Promise.resolve().then(fetchDrawings)
  }, [fetchDrawings])

  return { drawings, loading, error, refetch: fetchDrawings }
}
