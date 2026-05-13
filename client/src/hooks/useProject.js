import { useState, useEffect, useCallback } from 'react'
import { getProject } from '../services/project.service'

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getProject(projectId)
      // Backend uses "projects" key even for single project
      setProject(res.data?.projects || res.data?.project || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    Promise.resolve().then(fetchProject)
  }, [fetchProject])

  return { project, loading, error, refetch: fetchProject }
}
