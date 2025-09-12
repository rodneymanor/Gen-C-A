import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Button, { ButtonGroup } from '@atlaskit/button';
import Toggle from '@atlaskit/toggle';
import Select from '@atlaskit/select';
import SectionMessage from '@atlaskit/section-message';
import ModalDialog, { ModalTransition } from '@atlaskit/modal-dialog';
import { User } from '../../types';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AdvancedSettingsProps {
  user: User;
}

// Language options
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
];

// Theme options
const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

// Font size options
const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

// Component styles - Perplexity flat design using proper tokens
const sectionStyles = css`
  margin-bottom: ${token('space.500', '1.25rem')};

  &:last-child {
    margin-bottom: 0;
  }
`;

const sectionTitleStyles = css`
  font-size: 18px;
  font-weight: 600;
  color: ${token('color.text', '#172b4d')};
  margin-bottom: ${token('space.300', '0.75rem')};
  padding-bottom: ${token('space.100', '0.25rem')};
  border-bottom: 1px solid ${token('color.border', '#e4e6ea')};
`;

const settingItemStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${token('space.300', '0.75rem')} 0;
  border-bottom: 1px solid ${token('color.border', '#e4e6ea')};

  &:last-child {
    border-bottom: none;
  }

  .setting-info {
    flex: 1;
    margin-right: ${token('space.300', '0.75rem')};

    .setting-title {
      font-size: 16px;
      font-weight: 500;
      color: ${token('color.text', '#172b4d')};
      margin-bottom: ${token('space.050', '0.125rem')};
    }

    .setting-description {
      font-size: 14px;
      color: ${token('color.text.subtlest', '#97a0af')};
    }
  }

  .setting-control {
    flex-shrink: 0;
    min-width: 200px;
  }

  .setting-toggle {
    flex-shrink: 0;
  }
`;

const dangerZoneStyles = css`
  border: 1px solid ${token('color.border.danger', '#bf2600')};
  border-radius: ${token('border.radius.200', '0.5rem')};
  padding: ${token('space.300', '0.75rem')};
  background: ${token('color.background.neutral', '#f4f5f7')};

  h4 {
    color: ${token('color.text.danger', '#bf2600')};
    margin-bottom: ${token('space.200', '0.5rem')};
  }
`;

const formActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  padding-top: ${token('space.300', '0.75rem')};
  border-top: 1px solid ${token('color.border', '#e4e6ea')};
`;

export function AdvancedSettings({ user }: AdvancedSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState(() => ({
    theme: user.preferences?.theme || 'system',
    language: user.preferences?.language || 'en',
    reducedMotion: user.preferences?.accessibility?.reducedMotion || false,
    highContrast: user.preferences?.accessibility?.highContrast || false,
    fontSize: user.preferences?.accessibility?.fontSize || 'medium',
    screenReaderOptimized: user.preferences?.accessibility?.screenReaderOptimized || false,
    analyticsEnabled: true,
    errorReporting: true,
    betaFeatures: false,
    autoSave: true,
    keyboardShortcuts: true,
  }));

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Update user preferences in Firebase
      console.log('Updating advanced settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // TODO: Generate and download user data export
      console.log('Exporting user data...');
      
      // Simulate data export
      const userData = {
        user: user,
        settings: settings,
        exportDate: new Date().toISOString(),
        // Add other user data here
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `genc-data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement account deletion
      console.log('Deleting account...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would typically redirect to a goodbye page or login
      setIsDeleteModalOpen(false);
      alert('Account deletion process initiated. You will receive an email confirmation.');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Appearance Settings */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Appearance</h3>
        
        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Theme</div>
            <div className="setting-description">Choose your preferred color theme</div>
          </div>
          <div className="setting-control">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}