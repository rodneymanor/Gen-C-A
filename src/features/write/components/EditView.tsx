import { Button } from '@/components/ui/Button'
import { writeContentStyles } from '../layout/WriteLayout'
import { ScriptEditor } from './ScriptEditor'

import type { Script } from '@/types'

interface EditViewProps {
  script: Script | null
  onBack: () => void
  onSave: (script: Script) => void
  onExport: (script: Script) => void
  onRegenerate: () => void
  onVoicePreview: (script: Script) => void
}

export const EditView = ({
  script,
  onBack,
  onSave,
  onExport,
  onRegenerate,
  onVoicePreview
}: EditViewProps) => {
  return (
    <div css={writeContentStyles}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <Button variant="tertiary" size="medium" onClick={onBack}>
          ← Back to Generator
        </Button>
      </div>

      {script ? (
        <ScriptEditor
          script={script}
          onSave={onSave}
          onExport={onExport}
          onRegenerate={onRegenerate}
          onVoicePreview={onVoicePreview}
        />
      ) : null}
    </div>
  )
}
