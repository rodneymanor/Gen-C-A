import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Button, { ButtonGroup } from '@atlaskit/button';
import DynamicTable from '@atlaskit/dynamic-table';
import ModalDialog, { ModalTransition } from '@atlaskit/modal-dialog';
import Form, { Field, ErrorMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import SectionMessage from '@atlaskit/section-message';
import Lozenge from '@atlaskit/lozenge';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import { User } from '../../types';

// Icons
import AddIcon from '@atlaskit/icon/glyph/add';
import CopyIcon from '@atlaskit/icon/glyph/copy';
import MoreIcon from '@atlaskit/icon/glyph/more';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import EditIcon from '@atlaskit/icon/glyph/edit';

interface ApiKeySettingsProps {
  user: User;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: Date;
  lastUsed?: Date;
  usage: number;
  limit: number;
  permissions: string[];
  isActive: boolean;
}

// Mock API keys data
const MOCK_API_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production App',
    key: 'genc_live_4f6h9k2m8n5q1r3s7t9v',
    created: new Date('2024-08-15'),
    lastUsed: new Date('2024-09-10'),
    usage: 2847,
    limit: 10000,
    permissions: ['scripts:generate', 'content:read'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Development Testing',
    key: 'genc_test_8a2c4e6g9h1j3k5m7n9p',
    created: new Date('2024-08-20'),
    lastUsed: new Date('2024-09-08'),
    usage: 156,
    limit: 1000,
    permissions: ['scripts:generate'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Legacy Integration',
    key: 'genc_live_1b3d5f7h9j2k4m6n8p0q',
    created: new Date('2024-07-10'),
    lastUsed: new Date('2024-08-25'),
    usage: 9876,
    limit: 10000,
    permissions: ['scripts:generate', 'content:read', 'content:write'],
    isActive: false,
  },
];

// Component styles
const sectionStyles = css`
  margin-bottom: ${token('space.400')};

  &:last-child {
    margin-bottom: 0;
  }
`;

const sectionTitleStyles = css`
  font-size: ${token('font.size.300')};
  font-weight: ${token('font.weight.semibold')};
  color: ${token('color.text.medium')};
  margin-bottom: ${token('space.300')};
  padding-bottom: ${token('space.100')};
  border-bottom: 2px solid ${token('color.border')};
`;

const sectionHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${token('space.300')};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${token('space.200')};
    align-items: stretch;
  }
`;

const keyDisplayStyles = css`
  display: flex;
  align-items: center;
  gap: ${token('space.150')};
  font-family: ${token('font.family.code')};
  font-size: ${token('font.size.100')};
  
  .key-text {
    color: ${token('color.text.subtlest')};
  }
  
  .copy-button {
    opacity: 0.7;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const usageBarStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${token('space.050')};
  min-width: 120px;
  
  .usage-text {
    font-size: ${token('font.size.075')};
    color: ${token('color.text.subtlest')};
  }
  
  .usage-bar {
    height: 4px;
    background: ${token('color.background.neutral')};
    border-radius: ${token('border.radius.100')};
    overflow: hidden;
    
    .usage-fill {
      height: 100%;
      background: ${token('color.background.brand.bold')};
      transition: width 0.3s ease;
      
      &.high-usage {
        background: ${token('color.background.warning.bold')};
      }
      
      &.over-limit {
        background: ${token('color.background.danger.bold')};
      }
    }
  }
`;

export function ApiKeySettings({ user }: ApiKeySettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Utility functions
  const maskApiKey = (key: string) => {
    const prefix = key.split('_')[0] + '_' + key.split('_')[1] + '_';
    const suffix = key.slice(-4);
    return prefix + '••••••••••••' + suffix;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    return Math.min((usage / limit) * 100, 100);
  };

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = getUsagePercentage(usage, limit);
    if (percentage >= 100) return 'over-limit';
    if (percentage >= 80) return 'high-usage';
    return '';
  };

  // Event handlers
  const handleCopyApiKey = async (keyId: string, keyValue: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const handleCreateApiKey = async (data: { name: string; permissions: string[] }) => {
    setIsLoading(true);
    
    try {
      // TODO: Call API to create new key
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: data.name,
        key: `genc_live_${Math.random().toString(36).substring(2, 18)}`,
        created: new Date(),
        usage: 0,
        limit: user.plan === 'free' ? 1000 : user.plan === 'premium' ? 10000 : 50000,
        permissions: ['scripts:generate'],
        isActive: true,
      };
      
      setApiKeys(prev => [...prev, newKey]);
      setIsCreateModalOpen(false);
      
      // Show the full key once in a modal or notification
      alert(`Your new API key: ${newKey.key}\n\nPlease copy this key now - you won't be able to see it again!`);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        // TODO: Call API to delete key
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
      } catch (error) {
        console.error('Failed to delete API key:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleApiKey = async (keyId: string) => {
    setIsLoading(true);
    try {
      // TODO: Call API to toggle key status
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, isActive: !key.isActive } : key
      ));
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Table configuration
  const head = {
    cells: [
      {
        key: 'name',
        content: 'Key Name',
        isSortable: true,
      },
      {
        key: 'key',
        content: 'API Key',
      },
      {
        key: 'created',
        content: 'Created',
        isSortable: true,
      },
      {
        key: 'usage',
        content: 'Usage',
        isSortable: true,
      },
      {
        key: 'status',
        content: 'Status',
      },
      {
        key: 'actions',
        content: 'Actions',
        width: 8,
      },
    ],
  };

  const rows = apiKeys.map(key => ({
    key: key.id,
    cells: [
      {
        key: 'name',
        content: (
          <div>
            <div css={css`font-weight: ${token('font.weight.medium')};`}>
              {key.name}
            </div>
            <div css={css`
              font-size: ${token('font.size.075')};
              color: ${token('color.text.subtlest')};
            `}>
              {key.permissions.join(', ')}
            </div>
          </div>
        ),
      },
      {
        key: 'key',
        content: (
          <div css={keyDisplayStyles}>
            <span className="key-text">{maskApiKey(key.key)}</span>
            <Button
              appearance="subtle"
              iconBefore={<CopyIcon size="small" label="Copy" />}
              onClick={() => handleCopyApiKey(key.id, key.key)}
              className="copy-button"
            >
              {copiedKeyId === key.id ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        ),
      },
      {
        key: 'created',
        content: (
          <div>
            <div>{formatDate(key.created)}</div>
            {key.lastUsed && (
              <div css={css`
                font-size: ${token('font.size.075')};
                color: ${token('color.text.subtlest')};
              `}>
                Last used: {formatDate(key.lastUsed)}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'usage',
        content: (
          <div css={usageBarStyles}>
            <div className="usage-text">
              {key.usage.toLocaleString()} / {key.limit.toLocaleString()}
            </div>
            <div className="usage-bar">
              <div
                className={`usage-fill ${getUsageColor(key.usage, key.limit)}`}
                style={{ width: `${getUsagePercentage(key.usage, key.limit)}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        content: (
          <Lozenge appearance={key.isActive ? 'success' : 'removed'}>
            {key.isActive ? 'Active' : 'Disabled'}
          </Lozenge>
        ),
      },
      {
        key: 'actions',
        content: (
          <DropdownMenu
            trigger={({ triggerRef, ...props }) => (
              <Button
                {...props}
                iconBefore={<MoreIcon size="small" label="More actions" />}
                ref={triggerRef}
                appearance="subtle"
              />
            )}
          >
            <DropdownItemGroup>
              <DropdownItem onClick={() => handleToggleApiKey(key.id)}>
                {key.isActive ? 'Disable' : 'Enable'}
              </DropdownItem>
              <DropdownItem onClick={() => console.log('Edit key:', key.id)}>
                Edit
              </DropdownItem>
            </DropdownItemGroup>
            <DropdownItemGroup>
              <DropdownItem onClick={() => handleDeleteApiKey(key.id)}>
                Delete
              </DropdownItem>
            </DropdownItemGroup>
          </DropdownMenu>
        ),
      },
    ],
  }));

  return (
    <div>
      {/* API Keys Section */}
      <div css={sectionStyles}>
        <div css={sectionHeaderStyles}>
          <h3 css={sectionTitleStyles}>API Keys</h3>
          <Button
            appearance="primary"
            iconBefore={<AddIcon size="small" label="Add" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Generate New Key
          </Button>
        </div>

        <SectionMessage appearance="info">
          <p>
            API keys allow you to access Gen.C features programmatically. 
            Keep your keys secure and never share them publicly.
          </p>
        </SectionMessage>

        <div css={css`margin-top: ${token('space.300')};`}>
          <DynamicTable
            head={head}
            rows={rows}
            isLoading={isLoading}
            loadingSpinnerSize="large"
            emptyView={
              <div css={css`
                text-align: center;
                padding: ${token('space.400')};
                color: ${token('color.text.subtlest')};
              `}>
                <p>No API keys found.</p>
                <p>Create your first API key to get started.</p>
              </div>
            }
          />
        </div>
      </div>

      {/* Usage Information */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Usage Limits</h3>
        <SectionMessage appearance="warning">
          <p>
            <strong>{user.plan || 'Free'} Plan Limits:</strong>
          </p>
          <ul>
            <li>Script Generation: {user.plan === 'free' ? '1,000' : user.plan === 'premium' ? '10,000' : '50,000'} requests/month</li>
            <li>Content Analysis: {user.plan === 'free' ? '500' : user.plan === 'premium' ? '5,000' : '25,000'} requests/month</li>
            <li>Rate Limit: {user.plan === 'free' ? '10' : user.plan === 'premium' ? '100' : '1,000'} requests/minute</li>
          </ul>
          <p>
            Upgrade your plan to increase these limits and access more features.
          </p>
        </SectionMessage>
      </div>

      {/* Create API Key Modal */}
      <ModalTransition>
        {isCreateModalOpen && (
          <ModalDialog
            heading="Generate New API Key"
            onClose={() => setIsCreateModalOpen(false)}
            actions={[
              { text: 'Cancel', onClick: () => setIsCreateModalOpen(false) },
              { 
                text: 'Generate Key', 
                appearance: 'primary',
                isLoading,
                onClick: () => {
                  // This will be handled by the form submission
                }
              },
            ]}
          >
            <Form
              onSubmit={(data) => handleCreateApiKey(data as { name: string; permissions: string[] })}
            >
              {({ formProps }) => (
                <form {...formProps}>
                  <Field name="name" label="Key Name" isRequired>
                    {({ fieldProps, error }) => (
                      <>
                        <Textfield
                          {...fieldProps}
                          placeholder="e.g., Production App, Development Testing"
                        />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                      </>
                    )}
                  </Field>

                  <div css={css`margin-top: ${token('space.200')};`}>
                    <SectionMessage appearance="discovery">
                      <p>
                        <strong>Important:</strong> You'll only see the full API key once after creation. 
                        Make sure to copy and store it securely.
                      </p>
                    </SectionMessage>
                  </div>
                </form>
              )}
            </Form>
          </ModalDialog>
        )}
      </ModalTransition>
    </div>
  );
}