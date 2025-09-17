import { EditView, GenerateView, LoadingOverlay } from '@/features/write/components'
import { useWriteSession } from '@/features/write/hooks/useWriteSession'
import { WriteLayout } from '@/features/write/layout/WriteLayout'

import type { ReactNode } from 'react'

const WriteHeader = (): ReactNode => (
  <>
    <h1>Write Page</h1>
    <p className="header-subtitle">
      Generate scripts, explore trending ideas, and jump into the Hemingway editor without digging
      through nested components.
    </p>
  </>
)

export const Write = () => {
  const {
    view,
    generatedScript,
    personas,
    defaultPersonaId,
    generationState,
    isLoading,
    handleGenerate,
    handleUseIdea,
    handleExploreMore,
    handleSaveScript,
    handleExportScript,
    handleRegenerateScript,
    handleVoicePreview,
    handleBackToGenerate
  } = useWriteSession()

  return (
    <WriteLayout header={<WriteHeader />}>
      <LoadingOverlay
        isOpen={isLoading || generationState.isGenerating}
        stage={generationState.stage}
        progress={generationState.progress}
        estimatedTime={generationState.estimatedTimeRemaining}
      />

      {view === 'generate' ? (
        <GenerateView
          onGenerate={handleGenerate}
          isLoading={isLoading}
          personas={personas}
          defaultPersonaId={defaultPersonaId}
          onUseIdea={handleUseIdea}
          onExploreMore={handleExploreMore}
        />
      ) : (
        <EditView
          script={generatedScript}
          onBack={handleBackToGenerate}
          onSave={handleSaveScript}
          onExport={handleExportScript}
          onRegenerate={handleRegenerateScript}
          onVoicePreview={handleVoicePreview}
        />
      )}
    </WriteLayout>
  )
}
