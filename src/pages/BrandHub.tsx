import React, { useEffect, useMemo, useState } from 'react'
import { css } from '@emotion/react'
import AddIcon from '@atlaskit/icon/glyph/add'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { VoiceLibrary } from '../features/brandhub/components/VoiceLibrary'
import { OnboardingSection } from '../features/brandhub/components/OnboardingSection'
import { OnboardingModal } from '../features/brandhub/components/OnboardingModal'
import { ContentBlueprint } from '../features/brandhub/components/ContentBlueprint'
import { CreateVoiceModal } from '../features/brandhub/components/CreateVoiceModal'
import { WorkflowSpotlightModal } from '../features/brandhub/components/WorkflowSpotlightModal'
import { defaultIntentSelection, intentOptions, onboardingPrompts } from '../features/brandhub/constants/onboarding'
import { useBrandVoices } from '../features/brandhub/hooks/useBrandVoices'
import { useBrandHubOnboarding } from '../features/brandhub/hooks/useBrandHubOnboarding'
import { TabKey } from '../features/brandhub/types/brandHub'
import { useVoiceCreationWorkflow } from '../features/brandhub/hooks/useVoiceCreationWorkflow'

const pageContainerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`

const headerStyles = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;

  .header-text {
    flex: 1;
    min-width: 260px;

    h1 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    p {
      margin: 0;
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      line-height: var(--line-height-relaxed, 1.6);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
`

const tabListStyles = css`
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-neutral-200);
  padding-bottom: var(--space-2);
  overflow-x: auto;
`

const tabTriggerStyles = (isActive: boolean) => css`
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-medium) var(--radius-medium) 0 0;
  cursor: pointer;
  position: relative;
  color: ${isActive ? 'var(--color-neutral-900)' : 'var(--color-neutral-600)'};
  font-size: var(--font-size-body);
  font-weight: ${isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)'};
  display: grid;
  gap: 4px;
  transition: var(--transition-all);

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .tab-hint {
    font-size: var(--font-size-caption);
    color: ${isActive ? 'var(--color-neutral-600)' : 'var(--color-neutral-500)'};
    white-space: nowrap;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -9px;
    height: 3px;
    width: 100%;
    background: ${isActive ? 'var(--color-primary-500)' : 'transparent'};
    border-radius: var(--radius-pill, 999px);
    transition: var(--transition-all);
  }
`

const voicesLayoutStyles = css`
  display: grid;
  gap: var(--space-6);
`

const tabConfig: Array<{ id: TabKey; label: string; hint: string }> = [
  { id: 'voices', label: 'Voice library', hint: 'Manage active brand voices' },
  {
    id: 'onboarding',
    label: 'Interactive onboarding',
    hint: 'Capture strategic context with audio'
  },
  { id: 'blueprint', label: 'Content blueprint', hint: 'Translate answers into pillars' }
]

export const BrandHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('voices')
  const [isCreateVoiceModalOpen, setIsCreateVoiceModalOpen] = useState(false)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false)
  const [isWorkflowSpotlightOpen, setIsWorkflowSpotlightOpen] = useState(false)
  const [selectedIntents, setSelectedIntents] = useState<string[]>(
    () => Array.from(defaultIntentSelection)
  )

  const { firebaseUser, currentUser } = useAuth()
  const { brandVoices, isLoading, error, refresh } = useBrandVoices()
  const {
    responses,
    setResponse,
    hasCompleted,
    setCompleted,
    activeQuestionIndex,
    setActiveQuestionIndex,
    completedCount,
    isQuestionnaireComplete
  } = useBrandHubOnboarding({ userId: firebaseUser?.uid })

  const {
    workflow,
    videosForDisplay,
    displayHandle,
    fetchVideos,
    analyzeVideos,
    createPersona,
    reset: resetVoiceWorkflow
  } = useVoiceCreationWorkflow({ onVoiceSaved: refresh })

  const canManageBrandVoices = useMemo(() => {
    const role = currentUser?.role
    if (!role) return false
    return role === 'super_admin' || role === 'admin' || role === 'coach'
  }, [currentUser?.role])

  const totalQuestions = onboardingPrompts.length

  useEffect(() => {
    if (!isCreateVoiceModalOpen) {
      resetVoiceWorkflow()
    }
  }, [isCreateVoiceModalOpen, resetVoiceWorkflow])

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'blueprint' && !isQuestionnaireComplete) {
      setActiveTab('onboarding')
      return
    }
    setActiveTab(tab)
  }

  const handleIntentToggle = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent) ? prev.filter((item) => item !== intent) : [...prev, intent]
    )
  }

  const handleOpenCreateVoiceModal = () => {
    if (!canManageBrandVoices) {
      return
    }
    resetVoiceWorkflow()
    setIsCreateVoiceModalOpen(true)
  }

  const handleCloseCreateVoiceModal = () => {
    setIsCreateVoiceModalOpen(false)
  }

  const firstIncompleteIndex = useMemo(
    () =>
      onboardingPrompts.findIndex((prompt) => (responses[prompt.id] ?? '').trim().length === 0),
    [responses]
  )

  const handleOpenOnboardingModal = () => {
    if (firstIncompleteIndex >= 0) {
      setActiveQuestionIndex(firstIncompleteIndex)
    } else {
      setActiveQuestionIndex(0)
    }
    setIsOnboardingModalOpen(true)
  }

  const handleCompleteOnboarding = () => {
    setCompleted(true)
    setIsOnboardingModalOpen(false)
    setActiveTab('blueprint')
  }

  const handleCloseOnboardingModal = () => {
    setIsOnboardingModalOpen(false)
  }

  return (
    <div css={pageContainerStyles}>
      <header css={headerStyles}>
        <div className="header-text">
          <h1>Brand Hub</h1>
          <p>
            Choose the voice you want to write in, spin up new voices from your favorite creators, and
            shape onboarding inputs that unlock strategy-ready content pillars.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => setIsWorkflowSpotlightOpen(true)}>
            How voice creation works
          </Button>
          {canManageBrandVoices && (
            <Button
              variant="primary"
              iconBefore={<AddIcon label="New" />}
              onClick={handleOpenCreateVoiceModal}
            >
              New brand voice
            </Button>
          )}
        </div>
      </header>

      <nav css={tabListStyles} aria-label="Brand hub sections">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            css={tabTriggerStyles(activeTab === tab.id)}
            onClick={() => handleTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-hint">{tab.hint}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'voices' && (
        <div css={voicesLayoutStyles}>
          <VoiceLibrary
            brandVoices={brandVoices}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
            onCreateVoice={handleOpenCreateVoiceModal}
            canManage={canManageBrandVoices}
          />
        </div>
      )}

      {activeTab === 'onboarding' && (
        <OnboardingSection
          hasCompleted={hasCompleted}
          completedCount={completedCount}
          totalQuestions={totalQuestions}
          onStartInterview={handleOpenOnboardingModal}
          onViewBlueprint={() => setActiveTab('blueprint')}
          selectedIntents={selectedIntents}
          onToggleIntent={handleIntentToggle}
          intentOptions={intentOptions}
        />
      )}

      {activeTab === 'blueprint' && (
        <ContentBlueprint
          isComplete={isQuestionnaireComplete}
          responses={responses}
          selectedIntents={selectedIntents}
          onReturnToOnboarding={() => setActiveTab('onboarding')}
        />
      )}

      <OnboardingModal
        open={isOnboardingModalOpen}
        onClose={handleCloseOnboardingModal}
        activeQuestionIndex={activeQuestionIndex}
        setActiveQuestionIndex={setActiveQuestionIndex}
        responses={responses}
        setResponse={setResponse}
        completedCount={completedCount}
        onComplete={handleCompleteOnboarding}
      />

      {canManageBrandVoices && (
        <CreateVoiceModal
          open={isCreateVoiceModalOpen}
          onClose={handleCloseCreateVoiceModal}
          workflow={workflow}
          videos={videosForDisplay}
          displayHandle={displayHandle}
          onFetchVideos={fetchVideos}
          onAnalyzeVideos={analyzeVideos}
          onCreatePersona={createPersona}
        />
      )}

      <WorkflowSpotlightModal
        open={isWorkflowSpotlightOpen}
        onClose={() => setIsWorkflowSpotlightOpen(false)}
      />
    </div>
  )
}

export default BrandHub
