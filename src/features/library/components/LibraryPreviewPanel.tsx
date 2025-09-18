import { css } from '@emotion/react';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import ViewIcon from '@atlaskit/icon/glyph/watch';
import EditIcon from '@atlaskit/icon/glyph/edit';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ContentItem } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import { AGENT_PRIMARY, AGENT_PRIMARY_HOVER, AGENT_TINT_20 } from '../constants/palette';

const previewPanelStyles = css`
  position: sticky;
  top: var(--space-4);
  height: fit-content;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);

    .preview-title {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }

  .preview-content {
    margin-bottom: var(--space-6);

    .preview-description {
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
      line-height: var(--line-height-relaxed);
      margin: 0 0 var(--space-5) 0;
      padding: var(--space-4);
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-medium);
    }

    .script-preview {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);

      .script-section {
        border: 1px solid var(--color-neutral-200);
        border-radius: var(--radius-medium);
        padding: var(--space-3);
        background: var(--color-neutral-0);

        .section-title {
          font-size: var(--font-size-body-small);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin: 0 0 var(--space-2) 0;
        }

        .section-content {
          font-size: var(--font-size-body);
          color: var(--color-neutral-800);
          line-height: var(--line-height-relaxed);
          white-space: pre-wrap;
          margin: 0;
        }
      }

      .script-raw {
        border: 1px dashed var(--color-neutral-300);
        border-radius: var(--radius-medium);
        padding: var(--space-3);
        white-space: pre-wrap;
        font-size: var(--font-size-body);
        color: var(--color-neutral-700);
        margin: 0;
      }
    }

    .preview-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-body-small);

        .meta-label {
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-medium);
        }

        .meta-value {
          color: var(--color-neutral-800);
        }
      }
    }
  }

  .preview-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

type LibraryPreviewPanelProps = {
  item: ContentItem;
  onClose: () => void;
};

export function LibraryPreviewPanel({ item, onClose }: LibraryPreviewPanelProps) {
  const selectedScriptElements =
    item.type === 'script'
      ? (item.metadata?.elements as Record<string, string> | undefined)
      : undefined;
  const selectedScriptContent =
    item.type === 'script'
      ? (item.metadata?.content as string | undefined)
      : undefined;

  return (
    <Card appearance="elevated" spacing="comfortable" css={previewPanelStyles}>
      <div className="preview-header">
        <h3 className="preview-title">{item.title}</h3>
        <Button
          variant="subtle"
          size="small"
          onClick={onClose}
          iconBefore={<CrossIcon label="" />}
          css={css`
            min-height: 32px;
            height: 32px;
            width: 32px;
            border-radius: 8px;
            background: var(--color-neutral-100);
            &:hover {
              background: var(--color-neutral-200);
            }
          `}
        />
      </div>

      <div className="preview-content">
        {item.description && <p className="preview-description">{item.description}</p>}

        {item.type === 'script' && (
          <div className="script-preview">
            {selectedScriptElements ? (
              <>
                {selectedScriptElements.hook && (
                  <div className="script-section">
                    <h4 className="section-title">Hook</h4>
                    <p className="section-content">{selectedScriptElements.hook}</p>
                  </div>
                )}
                {selectedScriptElements.bridge && (
                  <div className="script-section">
                    <h4 className="section-title">Bridge</h4>
                    <p className="section-content">{selectedScriptElements.bridge}</p>
                  </div>
                )}
                {selectedScriptElements.goldenNugget && (
                  <div className="script-section">
                    <h4 className="section-title">Golden Nugget</h4>
                    <p className="section-content">{selectedScriptElements.goldenNugget}</p>
                  </div>
                )}
                {selectedScriptElements.wta && (
                  <div className="script-section">
                    <h4 className="section-title">Call to Action</h4>
                    <p className="section-content">{selectedScriptElements.wta}</p>
                  </div>
                )}
              </>
            ) : selectedScriptContent ? (
              <pre className="script-raw">{selectedScriptContent}</pre>
            ) : null}
          </div>
        )}

        <div className="preview-meta">
          <div className="meta-row">
            <span className="meta-label">Type</span>
            <span className="meta-value">{item.type}</span>
          </div>
          {item.platform && (
            <div className="meta-row">
              <span className="meta-label">Platform</span>
              <span className="meta-value">{item.platform}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="meta-label">Created</span>
            <span className="meta-value">{formatRelativeTime(item.created)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Status</span>
            <span className="meta-value">{item.status}</span>
          </div>
        </div>
      </div>

      <div className="preview-actions">
        <Button
          variant="secondary"
          fullWidth
          iconBefore={<ViewIcon label="" />}
          css={css`
            background: transparent;
            color: ${AGENT_PRIMARY};
            border: var(--border-width-thin) solid ${AGENT_PRIMARY};
            border-radius: var(--radius-medium);
            font-weight: var(--font-weight-medium);
            &:hover {
              background: ${AGENT_TINT_20};
              border-color: ${AGENT_PRIMARY_HOVER};
            }
          `}
        >
          View
        </Button>
        <Button
          variant="secondary"
          fullWidth
          iconBefore={<EditIcon label="" />}
          css={css`
            background: transparent;
            color: ${AGENT_PRIMARY};
            border: var(--border-width-thin) solid ${AGENT_PRIMARY};
            border-radius: var(--radius-medium);
            font-weight: var(--font-weight-medium);
            &:hover {
              background: ${AGENT_TINT_20};
              border-color: ${AGENT_PRIMARY_HOVER};
            }
          `}
        >
          Edit
        </Button>
      </div>
    </Card>
  );
}
