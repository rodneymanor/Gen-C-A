import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import PageHeader from '@atlaskit/page-header';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { useAuth } from '../contexts/AuthContext';

// Import tab components (we'll create these)
import { AccountSettings } from '../components/settings/AccountSettings';
import { BillingSettings } from '../components/settings/BillingSettings';
import { ApiKeySettings } from '../components/settings/ApiKeySettings';
import { AdvancedSettings } from '../components/settings/AdvancedSettings';

// Settings page styles using Atlaskit tokens
const pageStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${token('space.400', '1rem')};
`;

const headerStyles = css`
  margin-bottom: ${token('space.400', '1rem')};
`;

const tabsStyles = css`
  .atlaskit-tabs__tab {
    font-weight: ${token('font.weight.medium', '500')};
  }
  
  .atlaskit-tabs__content {
    padding-top: ${token('space.300', '0.75rem')};
  }
`;

const contentAreaStyles = css`
  background: ${token('color.background.default', '#ffffff')};
  border-radius: ${token('border.radius.200', '0.5rem')};
  padding: ${token('space.400', '1rem')};
  box-shadow: ${token('elevation.shadow.raised', '0 4px 6px rgba(0, 0, 0, 0.07)')};
`;

// Tab configuration
const TABS = [
  { id: 'account', label: 'Account', component: AccountSettings },
  { id: 'billing', label: 'Billing', component: BillingSettings },
  { id: 'api-keys', label: 'API Keys', component: ApiKeySettings },
  { id: 'advanced', label: 'Advanced', component: AdvancedSettings },
] as const;

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  if (!currentUser) {
    return null; // This should be handled by auth guards in routing
  }

  return (
    <div css={pageStyles}>
      {/* Page Header with title and description */}
      <div css={headerStyles}>
        <PageHeader>Settings</PageHeader>
        <p css={css`
          color: ${token('color.text.subtlest', '#97a0af')};
          margin-top: ${token('space.100', '0.25rem')};
          font-size: 14px;
        `}>
          Manage your account and preferences
        </p>
      </div>

      {/* Tab Navigation and Content */}
      <div css={tabsStyles}>
        <Tabs
          id="settings-tabs"
          onChange={(index: number) => setSelectedTabIndex(index)}
          selected={selectedTabIndex}
        >
          <TabList>
            {TABS.map((tab) => (
              <Tab key={tab.id} testId={`settings-tab-${tab.id}`}>
                {tab.label}
              </Tab>
            ))}
          </TabList>

          {/* Tab Panels */}
          {TABS.map((tab, index) => (
            <TabPanel key={tab.id}>
              <div css={contentAreaStyles}>
                <tab.component user={currentUser} />
              </div>
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </div>
  );
}