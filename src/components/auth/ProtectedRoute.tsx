import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const loadingStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
  gap: ${token('space.300')};
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${token('color.border')};
    border-top: 3px solid ${token('color.background.accent.blue.subtler')};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    color: ${token('color.text.subtle')};
    font-size: ${token('font.size.200')};
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingSpinner: React.FC = () => (
  <div css={loadingStyles} className="auth-loading">
    <div className="spinner" aria-hidden="true" />
    <p className="loading-text">Checking authentication...</p>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = false 
}) => {
  const { currentUser, firebaseUser, loading } = useAuth();
  const location = useLocation();

  // Development/test bypass for E2E: allow localStorage flag or env var
  const bypassAuth = (import.meta as any).env?.VITE_BYPASS_AUTH === '1' 
    || (typeof window !== 'undefined' && window?.localStorage?.getItem('bypassAuth') === '1');

  // Show loading spinner while auth state is being determined
  if (loading && !bypassAuth) {
    return <LoadingSpinner />;
  }

  // If no user is authenticated, redirect to login
  if (!bypassAuth && (!currentUser || !firebaseUser)) {
    // Store the intended destination to redirect after login
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If email verification is required and user is not verified
  if (!bypassAuth && requireVerification && !firebaseUser.emailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // User is authenticated (and verified if required), render the protected content
  return <>{children}</>;
};
