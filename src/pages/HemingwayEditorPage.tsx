import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { HemingwayEditor } from '@/components/ui/HemingwayEditor'
import { useHemingwayEditor } from '@/features/write/hooks/useHemingwayEditor'
import { deriveScriptElementsFromContent } from '@/features/write/utils/script-format'

const initialContent = `The sun shone brightly over the quiet village. Children played in the streets while their parents watched from nearby porches. It was a perfect day for a walk in the countryside.

Despite the beauty of the morning, Sarah felt restless. She had been working on her novel for months, but the words seemed to elude her. Every sentence she wrote felt clunky and awkward.

She decided to try a different approach. Instead of fighting against the resistance, she would embrace it. She opened her laptop and began typing, letting the words flow naturally without judgment.

The result was surprising. The sentences became clearer. The story began to take shape. Sometimes the best writing comes not from forcing creativity, but from allowing it to happen organically.

As the afternoon wore on, Sarah found herself completely absorbed in her work. The outside world faded away, leaving only her characters and their journey. This was what she had been searching for all along - that perfect state of flow where writing becomes effortless.`

export default function HemingwayEditorPage() {
  const [searchParams] = useSearchParams()
  const {
    content,
    title,
    scriptElements,
    isScriptMode,
    handleContentChange,
    handleTitleChange,
    handleScriptElementsChange,
    applyStructuredContent,
    setTitle
  } = useHemingwayEditor({
    initialContent,
    initialTitle: "The Writer's Journey"
  })

  useEffect(() => {
    const paramContent = searchParams.get('content')
    const paramTitle = searchParams.get('title')

    if (paramContent) {
      const decodedContent = decodeURIComponent(paramContent)
      console.log('📝 [HemingwayEditorPage] Decoded content:', decodedContent)
      applyStructuredContent(decodedContent)
    }

    if (paramTitle) {
      const decodedTitle = decodeURIComponent(paramTitle)
      console.log('📑 [HemingwayEditorPage] Setting title:', decodedTitle)
      setTitle(decodedTitle)
    }
  }, [searchParams, applyStructuredContent, setTitle])

  useEffect(() => {
    if (!isScriptMode) {
      const parsed = deriveScriptElementsFromContent(content)
      const hasStructuredContent = parsed.hook || parsed.bridge || parsed.goldenNugget || parsed.wta
      if (hasStructuredContent) {
        handleScriptElementsChange(parsed)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HemingwayEditor
      initialContent={content}
      initialTitle={title}
      initialSidebarCollapsed={false}
      initialFocusMode={false}
      onContentChange={handleContentChange}
      onTitleChange={handleTitleChange}
      scriptElements={scriptElements}
      isScriptMode={isScriptMode}
      onScriptElementsChange={handleScriptElementsChange}
      enableAIActions={isScriptMode}
    />
  )
}
