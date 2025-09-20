import React from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';

const dashboardStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const heroStyles = css`
  text-align: center;
  margin-bottom: var(--space-12);
  
  @media (max-width: 768px) {
    margin-bottom: var(--space-8);
  }
`;

const heroTextStyles = css`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin: 0 0 var(--space-4) 0;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
  
  .hero-line-1 {
    color: var(--color-text-primary);
    display: block;
    margin-bottom: var(--space-2);
  }
  
  .hero-line-2 {
    color: var(--color-primary-500);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    justify-content: center;
    
    .hero-emoji {
      font-size: 1.25em;
      line-height: 1;
    }
  }
`;

const startSectionStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);
  
  h2 {
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-8) 0;
  }
`;

const cardsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  max-width: 1000px;
  width: 100%;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
`;

const cardStyles = css`
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-large);
  padding: var(--space-8);
  box-shadow: var(--shadow-card);
  transition: var(--transition-card);
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  min-height: 200px;
  justify-content: center;
  position: relative;
  z-index: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: transparent;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, background-color 0.2s ease;
  }

  &:hover {
    box-shadow: var(--card-hover-shadow);
    transform: translateY(-2px);
    border-color: var(--card-hover-border);
  }

  &:hover::after {
    background: var(--card-hover-overlay);
    opacity: 1;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--card-focus-shadow);
    border-color: var(--card-focus-border);
    transform: translateY(-2px);
  }

  &:focus-visible::after {
    background: var(--card-focus-overlay);
    opacity: 1;
  }

  .card-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }
  
  .card-description {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
`;



interface DashboardCard {
  id: string;
  title: string;
  description: string;
  action: () => void;
}


const DashboardCard: React.FC<{ card: DashboardCard }> = ({ card }) => (
  <div
    css={cardStyles}
    onClick={card.action}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.action();
      }
    }}
    aria-label={`${card.title}: ${card.description}`}
  >
    <h3 className="card-title">{card.title}</h3>
    <p className="card-description">{card.description}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardCards: DashboardCard[] = [
    {
      id: 'write-scripts',
      title: 'Write Scripts Instantly',
      description: 'Transform ideas into ready-to-use scripts in seconds. Leverage proven frameworks to create high-quality content with zero guesswork.',
      action: () => navigate('/write')
    },
    {
      id: 'creators',
      title: "Discover What's Going Viral",
      description: "Follow top creators and track trending content so you're always inspired and never short on ideas.",
      action: () => navigate('/creators')
    },
    {
      id: 'collections',
      title: 'Get Inspired by the Best',
      description: 'Explore top-performing scripts and delivery styles from leading creators to elevate your own content strategy.',
      action: () => navigate('/collections')
    }
  ];

  return (
    <div css={dashboardStyles}>
      {/* Hero Section */}
      <section css={heroStyles} aria-labelledby="main-heading">
        <h1 css={heroTextStyles} id="main-heading">
          <span className="hero-line-1">Ready to create something amazing?</span>
          <span className="hero-line-2">
            Let's write your script.
            <span role="img" aria-label="light bulb" className="hero-emoji">💡</span>
          </span>
        </h1>
      </section>
      
      {/* Cards Section */}
      <section css={startSectionStyles}>
        <div css={cardsGridStyles}>
          {dashboardCards.map(card => (
            <DashboardCard key={card.id} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
};
