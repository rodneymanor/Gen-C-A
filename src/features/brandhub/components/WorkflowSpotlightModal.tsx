import React from 'react'
import { css } from '@emotion/react'
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'
import DownloadIcon from '@atlaskit/icon/glyph/download'
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line'
import { BasicModal } from '../../../components/ui/BasicModal'

const workflowSpotlightStyles = css`
  display: grid;
  gap: var(--space-4);

  .workflow-intro {
    display: grid;
    gap: var(--space-2);

    p {
      margin: 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-normal, 1.55);
    }
  }

  .workflow-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .workflow-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px dashed var(--color-neutral-200);
    background: var(--color-neutral-50);

    .icon {
      color: var(--color-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .details {
      flex: 1;

      h4 {
        margin: 0 0 var(--space-1);
        font-size: var(--font-size-body);
        color: var(--color-neutral-800);
      }

      p {
        margin: 0;
        color: var(--color-neutral-600);
        font-size: var(--font-size-body-small);
        line-height: var(--line-height-normal, 1.55);
      }
    }
  }

  .workflow-hint {
    margin: 0;
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }
`

type WorkflowSpotlightModalProps = {
  open: boolean
  onClose: () => void
}

export const WorkflowSpotlightModal: React.FC<WorkflowSpotlightModalProps> = ({ open, onClose }) => (
  <BasicModal open={open} title="How voice creation works" onClose={onClose} size="medium">
    <div css={workflowSpotlightStyles}>
      <div className="workflow-intro">
        <p>
          Follow the same three-step workflow our team uses to turn any creator into a fully documented
          voice workspace.
        </p>
      </div>
      <div className="workflow-list">
        <div className="workflow-item">
          <div className="icon" aria-hidden="true">
            <VidPlayIcon label="" />
          </div>
          <div className="details">
            <h4>Pull creator library</h4>
            <p>
              Paste a handle and we&apos;ll fetch the latest clips, transcripts, and engagement metrics ready
              for review in the modal.
            </p>
          </div>
        </div>
        <div className="workflow-item">
          <div className="icon" aria-hidden="true">
            <DownloadIcon label="" />
          </div>
          <div className="details">
            <h4>Cluster the voice DNA</h4>
            <p>
              We identify recurring hooks, narrative beats, and tonal cues before turning them into reusable
              brand voice ingredients.
            </p>
          </div>
        </div>
        <div className="workflow-item">
          <div className="icon" aria-hidden="true">
            <GraphLineIcon label="" />
          </div>
          <div className="details">
            <h4>Publish your workspace</h4>
            <p>
              Approve the analysis, add onboarding inputs, and your writers immediately get playbooks,
              prompts, and tone sliders.
            </p>
          </div>
        </div>
      </div>
      <p className="workflow-hint">Need a refresher later? Open this spotlight any time.</p>
    </div>
  </BasicModal>
)
