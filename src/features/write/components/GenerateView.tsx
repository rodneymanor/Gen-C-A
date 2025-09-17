import { useMemo } from 'react'
import { writeContentStyles } from '../layout/WriteLayout'
import { ScriptGenerator } from './ScriptGenerator'
import { TrendingIdeas, type TrendingIdea } from './TrendingIdeas'

import type { AIGenerationRequest, BrandPersona } from '@/types'

interface GenerateViewProps {
  onGenerate: (request: AIGenerationRequest) => void | Promise<void>
  isLoading: boolean
  personas: BrandPersona[]
  defaultPersonaId: string
  onUseIdea: (idea: TrendingIdea) => void
  onExploreMore: () => void
}

const defaultIdeas: TrendingIdea[] = [
  {
    id: 'idea-1',
    title: 'The hidden productivity system that top creators use daily',
    views: 1284000,
    platform: 'tiktok',
    emoji: '🚀'
  },
  {
    id: 'idea-2',
    title: '3 skincare myths ruining your summer glow',
    views: 864200,
    platform: 'instagram',
    emoji: '🌞'
  },
  {
    id: 'idea-3',
    title: 'Behind the scenes: editing a viral storytelling video',
    views: 452300,
    platform: 'youtube',
    emoji: '🎬'
  }
]

export const GenerateView = ({
  onGenerate,
  isLoading,
  personas,
  defaultPersonaId,
  onUseIdea,
  onExploreMore
}: GenerateViewProps) => {
  const ideas = useMemo(() => defaultIdeas, [])

  return (
    <div css={writeContentStyles}>
      <ScriptGenerator
        onGenerate={onGenerate}
        isLoading={isLoading}
        personas={personas}
        defaultPersonaId={defaultPersonaId}
      />

      <TrendingIdeas ideas={ideas} onUseIdea={onUseIdea} onExploreMore={onExploreMore} />
    </div>
  )
}
