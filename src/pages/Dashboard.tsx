import React from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';

// Lucide React Icons
import { 
  Lightbulb,
  Folder, 
  PenTool, 
  Radio
} from 'lucide-react';

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
  
  &:hover {
    box-shadow: var(--shadow-elevated);
    transform: translateY(-2px);
    border-color: var(--color-primary-500);
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
    color: var(--color-primary-500);
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
  icon: React.ReactNode;
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
    <div className="card-icon">
      {card.icon}
    </div>
    <h3 className="card-title">{card.title}</h3>
    <p className="card-description">{card.description}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardCards: DashboardCard[] = [
    {
      id: 'collections',
      title: 'Collections',
      description: 'Get inspiration',
      icon: <Folder size={48} />,
      action: () => navigate('/collections')
    },
    {
      id: 'script-writing',
      title: 'Write Script',
      description: 'AI-powered script writing',
      icon: <PenTool size={48} />,
      action: () => navigate('/write')
    },
    {
      id: 'channels',
      title: 'Channels',
      description: 'Follow your favorite creators',
      icon: <Radio size={48} />,
      action: () => navigate('/channels')
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
            <Lightbulb size={32} />
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