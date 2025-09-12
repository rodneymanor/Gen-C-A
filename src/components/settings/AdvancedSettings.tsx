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

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Language</div>
            <div className="setting-description">Select your preferred language</div>
          </div>
          <div className="setting-control">
            <Select
              options={languageOptions}
              value={languageOptions.find(option => option.value === settings.language)}
              onChange={(option) => handleSettingChange('language', option?.value)}
              placeholder="Select language"
              isSearchable
            />
          </div>
        </div>
      </div>

      {/* Accessibility Settings */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Accessibility</h3>
        
        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Reduced Motion</div>
            <div className="setting-description">Minimize animations and transitions</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.reducedMotion}
              onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">High Contrast</div>
            <div className="setting-description">Increase contrast for better visibility</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.highContrast}
              onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Font Size</div>
            <div className="setting-description">Adjust text size for better readability</div>
          </div>
          <div className="setting-control">
            <Select
              options={fontSizeOptions}
              value={fontSizeOptions.find(option => option.value === settings.fontSize)}
              onChange={(option) => handleSettingChange('fontSize', option?.value)}
              placeholder="Select font size"
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Screen Reader Optimized</div>
            <div className="setting-description">Enhanced compatibility with screen readers</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.screenReaderOptimized}
              onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* App Behavior Settings */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>App Behavior</h3>
        
        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Auto-save</div>
            <div className="setting-description">Automatically save your work as you type</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Keyboard Shortcuts</div>
            <div className="setting-description">Enable keyboard shortcuts for faster navigation</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.keyboardShortcuts}
              onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.checked)}
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Beta Features</div>
            <div className="setting-description">Access experimental features (may be unstable)</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.betaFeatures}
              onChange={(e) => handleSettingChange('betaFeatures', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Privacy</h3>
        
        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Analytics</div>
            <div className="setting-description">Help improve Gen.C by sharing anonymous usage data</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.analyticsEnabled}
              onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
            />
          </div>
        </div>

        <div css={settingItemStyles}>
          <div className="setting-info">
            <div className="setting-title">Error Reporting</div>
            <div className="setting-description">Automatically send error reports to help us fix issues</div>
          </div>
          <div className="setting-toggle">
            <Toggle
              isChecked={settings.errorReporting}
              onChange={(e) => handleSettingChange('errorReporting', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Data Management</h3>
        
        <SectionMessage>
          <p>
            You can export all your data or request account deletion. 
            These actions may take some time to complete.
          </p>
        </SectionMessage>

        <div css={css`
          display: flex;
          gap: ${token('space.200', '0.5rem')};
          margin-top: ${token('space.300', '0.75rem')};
          
          @media (max-width: 768px) {
            flex-direction: column;
          }
        `}>
          <Button 
            appearance="default" 
            onClick={() => setIsExportModalOpen(true)}
          >
            Export My Data
          </Button>
          <Button 
            appearance="link" 
            onClick={() => console.log('Clear cache')}
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div css={sectionStyles}>
        <div css={dangerZoneStyles}>
          <h4>Danger Zone</h4>
          <p css={css`margin-bottom: ${token('space.300', '0.75rem')};`}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button 
            appearance="danger" 
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Form Actions */}
      <div css={formActionsStyles}>
        <ButtonGroup>
          <Button appearance="primary" onClick={handleSave}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button appearance="subtle">
            Reset to Defaults
          </Button>
        </ButtonGroup>
      </div>

      {/* Export Data Modal */}
      <ModalTransition>
        {isExportModalOpen && (
          <ModalDialog
            onClose={() => setIsExportModalOpen(false)}
            actions={[
              { text: 'Cancel', onClick: () => setIsExportModalOpen(false) },
              { 
                text: isLoading ? 'Exporting...' : 'Export Data', 
                appearance: 'primary',
                onClick: handleExportData
              },
            ]}
          >
            <div>
              <h2>Export Your Data</h2>
              <p>
                This will create a downloadable file containing all your Gen.C data including:
              </p>
              <ul>
                <li>Account information</li>
                <li>Scripts and content</li>
                <li>Collections and saved videos</li>
                <li>Settings and preferences</li>
                <li>API keys and usage data</li>
              </ul>
              <SectionMessage>
                <p>The export may take a few minutes to generate depending on how much data you have.</p>
              </SectionMessage>
            </div>
          </ModalDialog>
        )}
      </ModalTransition>

      {/* Delete Account Modal */}
      <ModalTransition>
        {isDeleteModalOpen && (
          <ModalDialog
            onClose={() => setIsDeleteModalOpen(false)}
            actions={[
              { text: 'Cancel', onClick: () => setIsDeleteModalOpen(false) },
              { 
                text: isLoading ? 'Deleting...' : 'Delete My Account', 
                appearance: 'danger',
                onClick: handleDeleteAccount
              },
            ]}
          >
            <div>
              <h2>Delete Account</h2>
              <SectionMessage>
                <p>
                  <strong>This action cannot be undone.</strong>
                </p>
              </SectionMessage>
              
              <p>Deleting your account will permanently remove:</p>
              <ul>
                <li>Your profile and account data</li>
                <li>All scripts, content, and collections</li>
                <li>API keys and usage history</li>
                <li>Billing and subscription information</li>
              </ul>
              
              <p>
                If you're sure you want to delete your account, we'll send you an email 
                with instructions to complete the process.
              </p>
            </div>
          </ModalDialog>
        )}
      </ModalTransition>
    </div>
  );
}