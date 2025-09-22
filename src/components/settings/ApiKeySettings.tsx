import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Button from '@atlaskit/button';
import DynamicTable from '@atlaskit/dynamic-table';
import ModalDialog, { ModalTransition } from '@atlaskit/modal-dialog';
import Form, { Field, ErrorMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import SectionMessage from '@atlaskit/section-message';
import Lozenge from '@atlaskit/lozenge';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';

import AddIcon from '@atlaskit/icon/glyph/add';
import MoreIcon from '@atlaskit/icon/glyph/more';
import TrashIcon from '@atlaskit/icon/glyph/trash';

import { useAuth } from '@/contexts/AuthContext';

interface ApiKeyStatus {
  keyId: string;
  status: 'active' | 'disabled';
  createdAt?: string;
  lastUsed?: string;
  requestCount: number;
  violations: number;
  lockoutUntil?: string;
  revokedAt?: string;
  apiKey?: string;
}

interface ApiKeyResponse {
  success: boolean;
  hasActiveKey: boolean;
  activeKey: ApiKeyStatus | null;
  keyHistory: ApiKeyStatus[];
  limits: {
    requestsPerMinute: number;
    violationLockoutHours: number;
    maxViolationsBeforeLockout: number;
  };
}

const sectionStyles = css`
  margin-bottom: ${token('space.400')};
  &:last-child {
    margin-bottom: 0;
  }
`;

const sectionHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${token('space.300')};
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${token('space.200')};
  }
`;

export function ApiKeySettings() {
  const { firebaseUser } = useAuth();
  const [status, setStatus] = useState<ApiKeyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error('Failed to load API keys', await response.text());
        setStatus(null);
        return;
      }
      const data = (await response.json()) as ApiKeyResponse;
      setStatus(data);
    } catch (error) {
      console.error('Failed to load API keys', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleCreate = useCallback(
    async (formData: { name: string }) => {
      if (!firebaseUser) return;
      setIsSaving(true);
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: formData.name }),
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data?.message || data?.error || 'Failed to generate API key';
          alert(message);
          return;
        }
        setNewApiKey(data.apiKey as string);
        setShowNewKey(true);
        setIsCreateModalOpen(false);
        await fetchStatus();
      } catch (error) {
        console.error('Failed to create API key', error);
        alert('Failed to create API key. See console for details.');
      } finally {
        setIsSaving(false);
      }
    },
    [firebaseUser, fetchStatus]
  );

  const handleRevoke = useCallback(async () => {
    if (!firebaseUser) return;
    setRevoking(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.message || data?.error || 'Failed to revoke API key';
        alert(message);
        return;
      }
      setNewApiKey(null);
      setShowNewKey(false);
      await fetchStatus();
    } catch (error) {
      console.error('Failed to revoke API key', error);
      alert('Failed to revoke API key. See console for details.');
    } finally {
      setRevoking(false);
    }
  }, [firebaseUser, fetchStatus]);

  const rows = useMemo(() => {
    if (!status?.keyHistory?.length) return [];
    return status.keyHistory.map((key) => ({
      key: key.keyId,
      cells: [
        {
          key: 'id',
          content: <span css={css`font-family: ${token('font.family.code')};`}>{key.keyId}</span>,
        },
        {
          key: 'created',
          content: key.createdAt ? new Date(key.createdAt).toLocaleString() : '—',
        },
        {
          key: 'status',
          content: (
            <Lozenge appearance={key.status === 'active' ? 'success' : 'removed'}>
              {key.status === 'active' ? 'Active' : 'Disabled'}
            </Lozenge>
          ),
        },
        {
          key: 'requests',
          content: key.requestCount.toLocaleString(),
        },
        {
          key: 'violations',
          content: key.violations.toLocaleString(),
        },
      ],
    }));
  }, [status]);

  if (loading) {
    return <div css={css`padding: ${token('space.400')};`}>Loading API key status…</div>;
  }

  return (
    <div>
      <div css={sectionStyles}>
        <div css={sectionHeaderStyles}>
          <h3 css={css`font-size: ${token('font.size.300')}; font-weight: ${token('font.weight.semibold')};`}>
            Chrome Extension API Key
          </h3>
          <Button
            appearance="primary"
            iconBefore={<AddIcon size="small" label="Generate" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {status?.hasActiveKey ? 'Rotate Key' : 'Generate New Key'}
          </Button>
        </div>

        <SectionMessage appearance="info">
          <p>
            API keys let you authenticate the Chrome extension and other integrations. Only one active key is allowed at a time.
          </p>
        </SectionMessage>

        {newApiKey && (
          <SectionMessage appearance="warning" css={css`margin-top: ${token('space.300')};`}>
            <p><strong>Your new API key:</strong></p>
            <div css={css`
              display: flex;
              align-items: center;
              gap: ${token('space.200')};
              margin-top: ${token('space.200')};
              font-family: ${token('font.family.code')};
              background: ${token('color.background.neutral')};
              padding: ${token('space.150')};
              border-radius: ${token('border.radius.100')};
            `}>
              <span>{showNewKey ? newApiKey : '••••••••••••••••••••••••••••••••'} </span>
              <Button appearance="subtle" onClick={() => setShowNewKey((prev) => !prev)}>
                {showNewKey ? 'Hide' : 'Show'}
              </Button>
              <Button
                appearance="primary"
                onClick={() => navigator.clipboard.writeText(newApiKey)}
              >
                Copy
              </Button>
            </div>
            <p css={css`margin-top: ${token('space.200')};`}>
              This key will only be shown once. Store it securely.
            </p>
          </SectionMessage>
        )}

        {status?.hasActiveKey ? (
          <div css={css`
            margin-top: ${token('space.300')};
            padding: ${token('space.300')};
            border: 1px solid ${token('color.border')};
            border-radius: ${token('border.radius.200')};
            background: ${token('color.background.neutral.subtlest')};
          `}>
            <h4 css={css`margin-bottom: ${token('space.200')};`}>Active key</h4>
            <p><strong>Key ID:</strong> {status.activeKey?.keyId}</p>
            <p><strong>Created:</strong> {status.activeKey?.createdAt ? new Date(status.activeKey.createdAt).toLocaleString() : '—'}</p>
            <p><strong>Requests:</strong> {status.activeKey?.requestCount.toLocaleString() ?? 0}</p>
            <p><strong>Violations:</strong> {status.activeKey?.violations.toLocaleString() ?? 0}</p>
            <div css={css`margin-top: ${token('space.200')};`}>
              <Button appearance="warning" onClick={handleRevoke} isLoading={revoking}>
                Revoke API Key
              </Button>
            </div>
          </div>
        ) : (
          <div css={css`
            margin-top: ${token('space.300')};
            padding: ${token('space.200')};
            border: 1px dashed ${token('color.border')};
            border-radius: ${token('border.radius.200')};
            color: ${token('color.text.subtlest')};
            text-align: center;
          `}>
            No active API key. Generate one to get started.
          </div>
        )}
      </div>

      <div css={sectionStyles}>
        <h3 css={css`font-size: ${token('font.size.300')}; font-weight: ${token('font.weight.semibold')}; margin-bottom: ${token('space.200')};`}>
          Key history
        </h3>
        <DynamicTable
          head={{
            cells: [
              { key: 'id', content: 'Key ID' },
              { key: 'created', content: 'Created' },
              { key: 'status', content: 'Status' },
              { key: 'requests', content: 'Requests' },
              { key: 'violations', content: 'Violations' },
            ],
          }}
          rows={rows}
          isLoading={loading}
          emptyView={
            <div css={css`padding: ${token('space.300')}; text-align: center; color: ${token('color.text.subtlest')};`}>
              No key history yet.
            </div>
          }
        />
      </div>

      {/* Shared form content for modal and fallback */}
      {(() => {
        const form = (
          <Form onSubmit={(data) => handleCreate(data as { name: string })}>
            {({ formProps }) => (
              <form {...formProps}>
                <Field name="name" label="Key name" isRequired defaultValue="Chrome Extension">
                  {({ fieldProps, error }) => (
                    <>
                      <Textfield {...fieldProps} placeholder="e.g. Chrome Extension" />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>
                  )}
                </Field>

                <div css={css`margin-top: ${token('space.200')};`}>
                  <SectionMessage appearance="discovery">
                    <p>You will only see the key once after creation. Copy it immediately and keep it secure.</p>
                  </SectionMessage>
                </div>

                <div css={css`display: flex; justify-content: flex-end; gap: ${token('space.150')}; margin-top: ${token('space.300')};`}>
                  <Button appearance="subtle" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" appearance="primary" isLoading={isSaving}>
                    Generate Key
                  </Button>
                </div>
              </form>
            )}
          </Form>
        );

        return (
          <>
            <ModalTransition>
              {isCreateModalOpen && (
                <ModalDialog heading="Generate New API Key" onClose={() => setIsCreateModalOpen(false)}>
                  {form}
                </ModalDialog>
              )}
            </ModalTransition>

            {/* Fallback dev overlay in case Atlaskit modal fails to render */}
            {isCreateModalOpen && (
              <div
                data-testid="api-key-fallback-modal"
                css={css`
                  position: fixed;
                  inset: 0;
                  background: rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 9999;
                `}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <div
                  css={css`
                    background: white;
                    padding: ${token('space.300')};
                    border-radius: ${token('border.radius.200')};
                    width: min(560px, 90vw);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                  `}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 css={css`margin-top: 0;`}>Generate New API Key</h4>
                  {form}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
