import { useCallback, useEffect, useState } from 'react'
import { sampleModels } from '../data/models'

function normalize(model) {
  return {
    shape: 'tool',
    scale: 1,
    material: 'baked',
    polyCount: model.file ? 'GLB' : '—',
    targetSize: 2.6,
    file: null,
    thumbnail: null,
    ...model,
    source: 'local',
  }
}

function normalizeList(list) {
  return (list ?? []).map(normalize)
}

export function useModels() {
  const [models, setModels] = useState(() => normalizeList(sampleModels))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [writable, setWritable] = useState(false)

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/models')
      const type = response.headers.get('content-type') || ''
      if (!response.ok || !type.includes('json')) {
        const fallback = normalizeList(sampleModels)
        setModels(fallback)
        setWritable(false)
        setLoading(false)
        return fallback
      }

      const data = await response.json()
      const next = normalizeList(data.models)
      setModels(next)
      setWritable(Boolean(data.writable))
      setLoading(false)
      return next
    } catch (err) {
      console.error('[local models]', err)
      const fallback = normalizeList(sampleModels)
      setModels(fallback)
      setWritable(false)
      setError(err.message || 'Could not read local models.')
      setLoading(false)
      return fallback
    }
  }, [])

  useEffect(() => {
    refresh({ silent: true })
  }, [refresh])

  return {
    models,
    loading,
    error,
    writable,
    refresh,
  }
}
