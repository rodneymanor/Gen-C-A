import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Form, { Field } from '@atlaskit/form';
import Toggle from '@atlaskit/toggle';
import Select from '@atlaskit/select';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import { User } from '../../types';

interface NotificationSettingsProps {
  user: User;
}

// Notification frequency options
const frequencyOptions = [
  { label: 'Immediately', value: 'immediate' },
  { label: 'Daily digest', value: 'daily' },
  { label: 'Weekly digest', value: 'weekly' },
  { label: 'Never', value: 'never' },
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

const notificationItemStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${token('space.300')} 0;
  border-bottom: 1px solid ${token('color.border')};

  &:last-child {
    border-bottom: none;
  }

  .notification-info {
    flex: 1;
    margin-right: ${token('space.300')};

    .notification-title {
      font-size: ${token('font.size.200')};
      font-weight: ${token('font.weight.medium')};
      color: ${token('color.text')};
      margin-bottom: ${token('space.050')};
    }

    .notification-description {
      font-size: ${token('font.size.100')};
      color: ${token('color.text.subtlest')};
    }
  }

  .notification-controls {
    display: flex;
    align-items: center;
    gap: ${token('space.200')};
    flex-shrink: 0;
  }
`;

const categoryHeaderStyles = css`
  font-size: ${token('font.size.200')};
  font-weight: ${token('font.weight.semibold')};
  color: ${token('color.text.medium')};
  margin: ${token('space.400')} 0 ${token('space.200')} 0;
  padding-bottom: ${token('space.100')};
  border-bottom: 1px solid ${token('color.border')};

  &:first-of-type {
    margin-top: 0;
  }
`;

const formActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  padding-top: ${token('space.300')};
  border-top: 1px solid ${token('color.border')};
`;

// Notification settings configuration
const NOTIFICATION_CATEGORIES = [
  {
    id: 'content',
    title: 'Content & Scripts',
    notifications: [
      {
        id: 'script_generated',
        title: 'Script Generation Complete',
        description: 'When your AI-generated scripts are ready',
        channels: ['email', 'push', 'inApp'],
      },
      {
        id: 'script_failed',
        title: 'Script Generation Failed',
        description: 'When script generation encounters an error',
        channels: ['email', 'inApp'],
      },
      {
        id: 'content_imported',
        title: 'Content Import Complete',
        description: 'When imported content has been processed',
        channels: ['email', 'push', 'inApp'],
      },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration & Sharing',
    notifications: [
      {
        id: 'collection_shared',
        title: 'Collection Shared',
        description: 'When someone shares a collection with you',
        channels: ['email', 'push', 'inApp'],
      },
      {
        id: 'comment_added',
        title: 'Comments & Feedback',
        description: 'When someone comments on your content',
        channels: ['email', 'push', 'inApp'],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Billing',
    notifications: [
      {
        id: 'payment_succeeded',
        title: 'Payment Successful',
        description: 'Confirmation of successful payments',
        channels: ['email'],
      },
      {
        id: 'payment_failed',
        title: 'Payment Failed',
        description: 'When a payment attempt fails',
        channels: ['email', 'inApp'],
      },
      {
        id: 'usage_limit',
        title: 'Usage Limits',
        description: 'When you approach your plan limits',
        channels: ['email', 'inApp'],
      },
    ],
  },
  {
    id: 'product',
    title: 'Product Updates',
    notifications: [
      {
        id: 'feature_updates',
        title: 'New Features',
        description: 'Announcements about new features and improvements',
        channels: ['email', 'inApp'],
      },
      {
        id: 'maintenance',
        title: 'Maintenance & Downtime',
        description: 'Scheduled maintenance notifications',
        channels: ['email', 'inApp'],
      },
    ],
  },
];

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(() => {
    // Initialize with user preferences or defaults
    const initialSettings: Record<string, any> = {
      frequency: user.preferences?.notifications?.frequency || 'immediate',
    };

    // Initialize all notification toggles
    NOTIFICATION_CATEGORIES.forEach(category => {
      category.notifications.forEach(notification => {
        notification.channels.forEach(channel => {
          const key = `${notification.id}_${channel}`;
          initialSettings[key] = user.preferences?.notifications?.[channel as keyof typeof user.preferences.notifications] ?? true;
        });
      });
    });

    return initialSettings;
  });

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFrequencyChange = (option: any) => {
    setSettings(prev => ({
      ...prev,
      frequency: option.value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Update user notification preferences in Firebase
      console.log('Updating notification settings:', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to default settings
    const defaultSettings: Record<string, any> = {
      frequency: 'immediate',
    };

    NOTIFICATION_CATEGORIES.forEach(category => {
      category.notifications.forEach(notification => {
        notification.channels.forEach(channel => {
          const key = `${notification.id}_${channel}`;
          defaultSettings[key] = true;
        });
      });
    });

    setSettings(defaultSettings);
  };

  return (
    <div>
      {/* Global Notification Settings */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Global Settings</h3>
        
        <div css={notificationItemStyles}>
          <div className="notification-info">
            <div className="notification-title">Notification Frequency</div>
            <div className="notification-description">
              How often you want to receive email notifications
            </div>
          </div>
          <div className="notification-controls">
            <div css={css`min-width: 200px;`}>
              <Select
                options={frequencyOptions}
                value={frequencyOptions.find(option => option.value === settings.frequency)}
                onChange={handleFrequencyChange}
                placeholder="Select frequency"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Notification Preferences</h3>
        
        {NOTIFICATION_CATEGORIES.map(category => (
          <div key={category.id}>
            <h4 css={categoryHeaderStyles}>{category.title}</h4>
            
            {category.notifications.map(notification => (
              <div key={notification.id} css={notificationItemStyles}>
                <div className="notification-info">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-description">{notification.description}</div>
                </div>
                
                <div className="notification-controls">
                  {notification.channels.includes('email') && (
                    <div css={css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: ${token('space.050')};
                    `}>
                      <Toggle
                        isChecked={settings[`${notification.id}_email`] ?? true}
                        onChange={(e) => handleToggle(`${notification.id}_email`, e.target.checked)}
                      />
                      <span css={css`
                        font-size: ${token('font.size.075')};
                        color: ${token('color.text.subtlest')};
                      `}>
                        Email
                      </span>
                    </div>
                  )}
                  
                  {notification.channels.includes('push') && (
                    <div css={css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: ${token('space.050')};
                    `}>
                      <Toggle
                        isChecked={settings[`${notification.id}_push`] ?? true}
                        onChange={(e) => handleToggle(`${notification.id}_push`, e.target.checked)}
                      />
                      <span css={css`
                        font-size: ${token('font.size.075')};
                        color: ${token('color.text.subtlest')};
                      `}>
                        Push
                      </span>
                    </div>
                  )}
                  
                  {notification.channels.includes('inApp') && (
                    <div css={css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: ${token('space.050')};
                    `}>
                      <Toggle
                        isChecked={settings[`${notification.id}_inApp`] ?? true}
                        onChange={(e) => handleToggle(`${notification.id}_inApp`, e.target.checked)}
                      />
                      <span css={css`
                        font-size: ${token('font.size.075')};
                        color: ${token('color.text.subtlest')};
                      `}>
                        In-App
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Information Message */}
      <div css={sectionStyles}>
        <SectionMessage appearance="info">
          <p>
            <strong>Note:</strong> Some critical notifications (like security alerts and billing issues) 
            cannot be disabled and will always be sent via email.
          </p>
        </SectionMessage>
      </div>

      {/* Form Actions */}
      <div css={formActionsStyles}>
        <ButtonGroup>
          <Button type="button" appearance="primary" onClick={handleSubmit} isLoading={isLoading}>
            Save Preferences
          </Button>
          <Button type="button" appearance="subtle" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}