import type { ScriptComponents } from '../utils/script-format'
import type { AIGenerationRequest, BrandPersona, Script } from '@/types'

export type WriteView = 'generate' | 'edit'

export interface GenerationState {
  isGenerating: boolean
  progress: number
  stage: string
  estimatedTimeRemaining?: number
}

export interface PersistGeneratedScriptParams {
  request: AIGenerationRequest
  scriptContent: string
  mappedLength: '15' | '20' | '30' | '45' | '60' | '90'
  components: ScriptComponents
  title: string
}

export interface WriteSessionState {
  view: WriteView
  generatedScript: Script | null
  personas: BrandPersona[]
  defaultPersonaId: string
  generationState: GenerationState
}
