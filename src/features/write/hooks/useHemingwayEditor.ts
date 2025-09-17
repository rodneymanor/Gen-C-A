import { useCallback, useState } from 'react'

import type { ScriptElements } from '@/lib/script-analysis'

import {
  deriveScriptElementsFromContent,
  formatScriptElementsToContent
} from '../utils/script-format'

interface UseHemingwayEditorOptions {
  initialContent?: string
  initialTitle?: string
  initialScriptElements?: ScriptElements | null
  initialIsScriptMode?: boolean
}

export const useHemingwayEditor = ({
  initialContent = '',
  initialTitle = 'Untitled Document',
  initialScriptElements = null,
  initialIsScriptMode = false
}: UseHemingwayEditorOptions = {}) => {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [scriptElements, setScriptElements] = useState<ScriptElements | null>(initialScriptElements)
  const [isScriptMode, setIsScriptMode] = useState(initialIsScriptMode)

  const handleContentChange = useCallback(
    (nextContent: string, shouldDeriveElements = true) => {
      setContent(nextContent)

      if (!shouldDeriveElements) {
        return
      }

      if (isScriptMode) {
        setScriptElements(deriveScriptElementsFromContent(nextContent))
      }
    },
    [isScriptMode]
  )

  const handleTitleChange = useCallback((nextTitle: string) => {
    setTitle(nextTitle)
  }, [])

  const handleScriptElementsChange = useCallback((elements: ScriptElements) => {
    setScriptElements(elements)
    setContent(formatScriptElementsToContent(elements))
  }, [])

  const applyStructuredContent = useCallback((nextContent: string) => {
    setContent(nextContent)
    const parsed = deriveScriptElementsFromContent(nextContent)
    const hasStructuredContent = parsed.hook || parsed.bridge || parsed.goldenNugget || parsed.wta

    if (hasStructuredContent) {
      setScriptElements(parsed)
      setIsScriptMode(true)
    } else {
      setScriptElements(null)
      setIsScriptMode(false)
    }
  }, [])

  const toggleScriptMode = useCallback(
    (enable: boolean) => {
      setIsScriptMode(enable)
      if (enable) {
        setScriptElements((existing) => existing ?? deriveScriptElementsFromContent(content))
      } else {
        setScriptElements(null)
      }
    },
    [content]
  )

  return {
    content,
    title,
    scriptElements,
    isScriptMode,
    setContent,
    setTitle,
    setScriptElements,
    setIsScriptMode,
    handleContentChange,
    handleTitleChange,
    handleScriptElementsChange,
    applyStructuredContent,
    toggleScriptMode
  }
}
