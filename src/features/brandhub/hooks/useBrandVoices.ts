import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandVoice } from '../types/brandHub'
import { listBrandVoices } from '../services/brandVoiceService'

interface UseBrandVoicesResult {
  brandVoices: BrandVoice[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export const useBrandVoices = (): UseBrandVoicesResult => {
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadBrandVoices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const voices = await listBrandVoices()
      if (!isMountedRef.current) {
        return
      }
      setBrandVoices(voices)
    } catch (err) {
      console.error('Failed to load brand voices:', err)
      if (isMountedRef.current) {
        setError('Unable to load brand voices right now. Please try again.')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadBrandVoices()
  }, [loadBrandVoices])

  const refresh = useCallback(() => {
    void loadBrandVoices()
  }, [loadBrandVoices])

  return {
    brandVoices,
    isLoading,
    error,
    refresh
  }
}
