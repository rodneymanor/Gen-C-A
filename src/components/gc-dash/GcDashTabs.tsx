import React from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashFocus, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';

export interface GcDashTabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface GcDashTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: GcDashTabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pill' | 'segmented';
  stretch?: boolean;
}

export const GcDashTabs: React.FC<GcDashTabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId,
  onChange,
  variant = 'underline',
  stretch = false,
  className,
  ...props
}) => {
  const controlled = typeof activeTabId !== 'undefined';
  const [internalTab, setInternalTab] = React.useState(() => defaultTabId ?? tabs[0]?.id);
  const currentTabId = controlled ? activeTabId : internalTab;

  const handleSelect = (tabId: string) => {
    if (!controlled) {
      setInternalTab(tabId);
    }
    onChange?.(tabId);
  };

  const activeTab = tabs.find((tab) => tab.id === currentTabId) ?? tabs[0];

  const variantStyles = {
    underline: css`
      border-bottom: 1px solid ${gcDashColor.border};

      button[role='tab'] {
        border: none;
        border-radius: 0;
        padding: ${gcDashSpacing.sm} ${gcDashSpacing.md};
        margin-bottom: -1px;
        color: ${gcDashColor.textMuted};

        &[aria-selected='true'] {
          color: ${gcDashColor.textPrimary};
          font-weight: 600;
          box-shadow: inset 0 -3px 0 0 ${gcDashColor.primary};
          background: transparent;
        }

        &:hover:not([aria-selected='true']):not(:disabled) {
          color: ${gcDashColor.textPrimary};
        }
      }
    `,
    pill: css`
      background: rgba(9, 30, 66, 0.06);
      padding: 4px;
      border-radius: ${gcDashShape.radiusLg};

      button[role='tab'] {
        border-radius: ${gcDashShape.radiusSm};
        padding: ${gcDashSpacing.xs} ${gcDashSpacing.md};
        color: ${gcDashColor.textMuted};
        transition: ${gcDashMotion.transition};

        &[aria-selected='true'] {
          background: ${gcDashColor.surface};
          color: ${gcDashColor.textPrimary};
          box-shadow: 0 6px 16px rgba(9, 30, 66, 0.12);
        }
      }
    `,
    segmented: css`
      border: 1px solid ${gcDashColor.border};
      padding: 4px;
      border-radius: ${gcDashShape.radiusLg};

      button[role='tab'] {
        border-radius: ${gcDashShape.radiusMd};
        padding: ${gcDashSpacing.xs} ${gcDashSpacing.md};
        color: ${gcDashColor.textMuted};

        &[aria-selected='true'] {
          background: ${gcDashColor.primary};
          color: var(--color-neutral-0);
          box-shadow: none;
        }
      }
    `,
  } as const;

  return (
    <div className={className} {...props}>
      <div
        role="tablist"
        css={css`
          display: inline-flex;
          align-items: center;
          gap: ${gcDashSpacing.xs};
          overflow-x: auto;
          ${variantStyles[variant]};
          width: ${stretch ? '100%' : 'auto'};
        `}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === currentTabId}
            aria-controls={`gc-dash-tab-panel-${tab.id}`}
            id={`gc-dash-tab-${tab.id}`}
            disabled={tab.disabled}
            css={css`
              display: inline-flex;
              align-items: center;
              gap: ${gcDashSpacing.xs};
              background: transparent;
              border: none;
              cursor: ${tab.disabled ? 'not-allowed' : 'pointer'};
              font-size: 14px;
              font-weight: 500;
              padding: ${gcDashSpacing.sm} ${gcDashSpacing.md};
              transition: ${gcDashMotion.transition};

              &:focus-visible {
                outline: none;
                box-shadow: ${gcDashFocus.ring};
              }

              ${stretch ? 'flex: 1;' : ''}
            `}
            onClick={() => !tab.disabled && handleSelect(tab.id)}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                css={css`
                  font-size: 12px;
                  font-weight: 600;
                  border-radius: 999px;
                  padding: 2px 8px;
                  background: rgba(11, 92, 255, 0.12);
                  color: ${gcDashColor.primary};
                `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`gc-dash-tab-panel-${activeTab?.id}`}
        aria-labelledby={`gc-dash-tab-${activeTab?.id}`}
        css={css`
          margin-top: ${gcDashSpacing.lg};
        `}
      >
        {activeTab?.content}
      </section>
    </div>
  );
};
