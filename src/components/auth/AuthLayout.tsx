import React from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const layoutStyles = css`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${token('elevation.surface')};
  padding: ${token('space.400')};
  
  @media (max-width: 768px) {
    padding: ${token('space.200')};
  }
`;

const containerStyles = css`
  width: 100%;
  max-width: 400px;
  background: ${token('elevation.surface.raised')};
  border-radius: ${token('border.radius.300')};
  padding: ${token('space.600')};
  box-shadow: ${token('elevation.shadow.raised')};
  
  @media (max-width: 480px) {
    padding: ${token('space.400')};
  }
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: ${token('space.500')};
  
  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${token('space.150')};
    margin-bottom: ${token('space.400')};
    text-decoration: none;
    
    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: ${token('space.050')};
    }

    .brand-mark span {
      font-family: 'Poppins', 'Space Grotesk', 'Geist', 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', system-ui, sans-serif;
      font-weight: ${token('font.weight.bold')};
      font-size: ${token('font.size.400')};
      color: ${token('color.text')};
      line-height: 1;
    }

    .brand-dot {
      width: 10px;
      height: 10px;
      background: ${token('color.background.brand.bold')};
      border-radius: 9999px;
      display: inline-block;
    }
    
    .brand-text {
      font-family: 'Poppins', 'Space Grotesk', 'Geist', 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', system-ui, sans-serif;
      font-size: ${token('font.size.300')};
      font-weight: ${token('font.weight.semibold')};
      color: ${token('color.text')};
      margin: 0;
    }
  }
  
  .title {
    font-size: ${token('font.size.500')};
    font-weight: ${token('font.weight.semibold')};
    color: ${token('color.text')};
    margin: 0 0 ${token('space.200')} 0;
  }
  
  .subtitle {
    font-size: ${token('font.size.200')};
    color: ${token('color.text.subtle')};
    margin: 0;
  }
`;

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  return (
    <div css={layoutStyles}>
      <div css={containerStyles}>
        <div css={headerStyles}>
          <Link to="/" className="brand" aria-label="Gen C">
            <div className="brand-mark" aria-hidden="true">
              <span>Gen</span>
              <span className="brand-dot"></span>
              <span>C</span>
            </div>
          </Link>
          
          <h2 className="title">{title}</h2>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        
        {children}
      </div>
    </div>
  );
};
