import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import Lozenge from '@atlaskit/lozenge';
import { Card } from '../ui/Card';
import { User } from '../../types';

interface BillingSettingsProps {
  user: User;
}

// Plan configuration data
const PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'month',
    features: [
      '10 script generations per month',
      '5 video collections',
      'Basic templates',
      'Community support',
    ],
    limitations: [
      'Limited AI models',
      'Basic analytics',
      'Gen.C watermark',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$19',
    period: 'month',
    features: [
      'Unlimited script generations',
      'Unlimited collections',
      'All templates & styles',
      'Priority support',
      'Advanced AI models',
      'Custom personas',
      'Analytics dashboard',
      'API access',
    ],
    limitations: [],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$99',
    period: 'month',
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'Custom branding',
      'SSO integration',
      'API rate limits increased',
    ],
    limitations: [],
  },
} as const;

// Mock billing history
const BILLING_HISTORY = [
  {
    id: '1',
    date: '2024-09-01',
    description: 'Premium Plan - Monthly',
    amount: '$19.00',
    status: 'paid' as const,
  },
  {
    id: '2',
    date: '2024-08-01',
    description: 'Premium Plan - Monthly',
    amount: '$19.00',
    status: 'paid' as const,
  },
  {
    id: '3',
    date: '2024-07-01',
    description: 'Premium Plan - Monthly',
    amount: '$19.00',
    status: 'paid' as const,
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

const currentPlanStyles = css`
  background: ${token('color.background.discovery')};
  border: 2px solid ${token('color.border.discovery')};
  border-radius: ${token('border.radius.200')};
  padding: ${token('space.300')};
  margin-bottom: ${token('space.300')};
`;

const planGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${token('space.300')};
  margin-bottom: ${token('space.400')};
`;

const planCardStyles = css`
  padding: ${token('space.300')};
  border: 2px solid ${token('color.border')};
  border-radius: ${token('border.radius.200')};
  background: ${token('color.background.neutral')};
  position: relative;

  &.current-plan {
    border-color: ${token('color.border.discovery')};
    background: ${token('color.background.discovery.hovered')};
  }

  &.recommended {
    border-color: ${token('color.border.brand')};
    background: ${token('color.background.brand.subtlest')};
    
    &::before {
      content: 'Recommended';
      position: absolute;
      top: -${token('space.150')};
      right: ${token('space.300')};
      background: ${token('color.background.brand.bold')};
      color: ${token('color.text.inverse')};
      padding: ${token('space.050')} ${token('space.200')};
      border-radius: ${token('border.radius.100')};
      font-size: ${token('font.size.075')};
      font-weight: ${token('font.weight.semibold')};
    }
  }
`;

const planHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${token('space.200')};
`;

const planPriceStyles = css`
  font-size: ${token('font.size.500')};
  font-weight: ${token('font.weight.bold')};
  color: ${token('color.text.brand')};
  
  .period {
    font-size: ${token('font.size.200')};
    font-weight: ${token('font.weight.regular')};
    color: ${token('color.text.subtlest')};
  }
`;

const featureListStyles = css`
  list-style: none;
  padding: 0;
  margin: ${token('space.200')} 0;
  
  li {
    display: flex;
    align-items: center;
    padding: ${token('space.050')} 0;
    font-size: ${token('font.size.100')};
    
    &::before {
      content: '✓';
      color: ${token('color.text.success')};
      font-weight: bold;
      margin-right: ${token('space.150')};
    }
    
    &.limitation {
      color: ${token('color.text.subtlest')};
      
      &::before {
        content: '−';
        color: ${token('color.text.subtlest')};
      }
    }
  }
`;

const billingHistoryStyles = css`
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${token('space.200')} 0;
    border-bottom: 1px solid ${token('color.border')};
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .item-info {
    flex: 1;
  }
  
  .item-date {
    font-size: ${token('font.size.075')};
    color: ${token('color.text.subtlest')};
    margin-top: ${token('space.050')};
  }
  
  .item-amount {
    font-weight: ${token('font.weight.semibold')};
    margin-right: ${token('space.200')};
  }
`;

export function BillingSettings({ user }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const currentPlan = user.plan || 'free';

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    // TODO: Implement Stripe integration
    console.log('Upgrading to plan:', planId);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleDowngrade = async () => {
    setIsLoading(true);
    // TODO: Implement plan downgrade
    console.log('Downgrading plan');
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      setIsLoading(true);
      // TODO: Implement subscription cancellation
      console.log('Cancelling subscription');
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  return (
    <div>
      {/* Current Plan Status */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Current Plan</h3>
        <div css={currentPlanStyles}>
          <div css={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${token('space.200')};
          `}>
            <div>
              <h4 css={css`margin: 0; font-size: ${token('font.size.300')};`}>
                {PLANS[currentPlan].name} Plan
              </h4>
              <div css={planPriceStyles}>
                {PLANS[currentPlan].price}
                <span className="period">/{PLANS[currentPlan].period}</span>
              </div>
            </div>
            <Lozenge appearance="success">Active</Lozenge>
          </div>
          
          {currentPlan !== 'free' && (
            <p css={css`
              margin: 0;
              font-size: ${token('font.size.100')};
              color: ${token('color.text.subtlest')};
            `}>
              Next billing date: October 1, 2024
            </p>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Available Plans</h3>
        <div css={planGridStyles}>
          {Object.entries(PLANS).map(([planId, plan]) => (
            <div
              key={planId}
              css={planCardStyles}
              className={`
                ${planId === currentPlan ? 'current-plan' : ''}
                ${planId === 'premium' ? 'recommended' : ''}
              `}
            >
              <div css={planHeaderStyles}>
                <div>
                  <h4 css={css`margin: 0; font-size: ${token('font.size.200')};`}>
                    {plan.name}
                  </h4>
                  <div css={planPriceStyles}>
                    {plan.price}
                    <span className="period">/{plan.period}</span>
                  </div>
                </div>
                {planId === currentPlan && <Lozenge appearance="inprogress">Current</Lozenge>}
              </div>

              <ul css={featureListStyles}>
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={`limitation-${index}`} className="limitation">{limitation}</li>
                ))}
              </ul>

              <div css={css`margin-top: ${token('space.300')};`}>
                {planId === currentPlan ? (
                  currentPlan === 'free' ? (
                    <Button appearance="primary" onClick={() => handleUpgrade('premium')} isLoading={isLoading}>
                      Upgrade Now
                    </Button>
                  ) : (
                    <ButtonGroup>
                      <Button appearance="subtle" onClick={handleCancelSubscription} isLoading={isLoading}>
                        Cancel
                      </Button>
                      {currentPlan !== 'enterprise' && (
                        <Button appearance="primary" onClick={() => handleUpgrade('enterprise')} isLoading={isLoading}>
                          Upgrade
                        </Button>
                      )}
                    </ButtonGroup>
                  )
                ) : (
                  <Button 
                    appearance={planId === 'premium' ? 'primary' : 'default'}
                    onClick={() => handleUpgrade(planId)}
                    isLoading={isLoading}
                  >
                    {planId === 'premium' ? 'Choose Premium' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      {currentPlan !== 'free' && (
        <div css={sectionStyles}>
          <h3 css={sectionTitleStyles}>Billing History</h3>
          <div css={billingHistoryStyles}>
            {BILLING_HISTORY.map((item) => (
              <div key={item.id} className="history-item">
                <div className="item-info">
                  <div>{item.description}</div>
                  <div className="item-date">{new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div className="item-amount">{item.amount}</div>
                <Lozenge appearance={item.status === 'paid' ? 'success' : 'default'}>
                  {item.status.toUpperCase()}
                </Lozenge>
              </div>
            ))}
          </div>
          <div css={css`margin-top: ${token('space.300')};`}>
            <Button appearance="link">View all billing history</Button>
          </div>
        </div>
      )}

      {/* Information Message */}
      <div css={sectionStyles}>
        <SectionMessage appearance="info">
          <p>
            <strong>Need help?</strong> Contact our billing support team if you have questions about your subscription or billing.
          </p>
          <p>
            All plan changes take effect immediately. Downgrades will be processed at the end of your current billing period.
          </p>
        </SectionMessage>
      </div>
    </div>
  );
}