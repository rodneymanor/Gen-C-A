import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import Textfield from '@atlaskit/textfield';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

const formStyles = css`
  .form-field {
    margin-bottom: ${token('space.300')};
    
    .field-label {
      display: block;
      font-size: ${token('font.size.200')};
      font-weight: ${token('font.weight.medium')};
      color: ${token('color.text')};
      margin-bottom: ${token('space.100')};
    }
  }
  
  .error-message {
    background: ${token('color.background.danger')};
    color: ${token('color.text.danger')};
    padding: ${token('space.200')};
    border-radius: ${token('border.radius.100')};
    font-size: ${token('font.size.100')};
    margin-bottom: ${token('space.300')};
    border: 1px solid ${token('color.border.danger')};
  }
  
  .success-message {
    background: ${token('color.background.success')};
    color: ${token('color.text.success')};
    padding: ${token('space.200')};
    border-radius: ${token('border.radius.100')};
    font-size: ${token('font.size.100')};
    margin-bottom: ${token('space.300')};
    border: 1px solid ${token('color.border.success')};
  }
  
  .form-actions {
    margin-top: ${token('space.400')};
    display: flex;
    flex-direction: column;
    gap: ${token('space.200')};
  }
  
  .divider {
    display: flex;
    align-items: center;
    margin: ${token('space.300')} 0;
    
    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${token('color.border')};
    }
    
    span {
      padding: 0 ${token('space.200')};
      color: ${token('color.text.subtle')};
      font-size: ${token('font.size.100')};
    }
  }
  
  .form-links {
    text-align: center;
    margin-top: ${token('space.400')};
    
    a {
      color: ${token('color.link')};
      text-decoration: none;
      font-size: ${token('font.size.200')};
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .register-link {
      display: block;
      margin-top: ${token('space.200')};
    }
  }
`;

const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please enable pop-ups for this site.';
    default:
      return 'An error occurred during sign-in. Please try again.';
  }
};

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(error));
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(error));
      } else {
        setError('An unexpected error occurred with Google sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form css={formStyles} onSubmit={handleSubmit}>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <div className="form-field">
        <label htmlFor="email" className="field-label">
          Email Address
        </label>
        <Textfield
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="Enter your email"
          isRequired
          isDisabled={loading}
          autoComplete="email"
        />
      </div>

      <div className="form-field">
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <Textfield
          id="password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="Enter your password"
          isRequired
          isDisabled={loading}
          autoComplete="current-password"
        />
      </div>

      <div className="form-actions">
        <Button
          type="submit"
          appearance="primary"
          isLoading={loading}
          isDisabled={loading}
          shouldFitContainer
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <Button
          type="button"
          appearance="subtle"
          onClick={handleGoogleLogin}
          isDisabled={loading}
          shouldFitContainer
        >
          Continue with Google
        </Button>
      </div>

      <div className="form-links">
        <Link to="/forgot-password">
          Forgot your password?
        </Link>
        <Link to="/register" className="register-link">
          Don't have an account? Sign up
        </Link>
      </div>
    </form>
  );
};