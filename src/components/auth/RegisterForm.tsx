import React, { useState } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import { Link, useNavigate } from 'react-router-dom';
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
  
  .password-requirements {
    font-size: ${token('font.size.100')};
    color: ${token('color.text.subtle')};
    margin-top: ${token('space.100')};
    
    ul {
      margin: ${token('space.100')} 0 0 ${token('space.300')};
      padding: 0;
      
      li {
        margin-bottom: ${token('space.050')};
      }
    }
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
  }
`;

const validatePassword = (password: string): string[] => {
  const issues: string[] = [];
  
  if (password.length < 6) {
    issues.push('Password must be at least 6 characters long');
  }
  
  return issues;
};

const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please use a different email or try signing in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please enable pop-ups for this site.';
    case 'auth/popup-closed-by-user':
      return 'Sign-up was cancelled. Please try again.';
    default:
      return 'An error occurred during registration. Please try again.';
  }
};

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { name, email, password, confirmPassword } = formData;
    
    // Validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    
    const passwordIssues = validatePassword(password);
    if (passwordIssues.length > 0) {
      setError(passwordIssues[0]);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await register(email, password, name);
      
      setSuccess(
        'Account created successfully! Please check your email for a verification link before signing in.'
      );
      
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please verify your email and sign in.' 
          } 
        });
      }, 3000);
      
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(error));
      } else {
        setError('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(error));
      } else {
        setError('An unexpected error occurred with Google sign-up.');
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
      
      {success && (
        <div className="success-message" role="alert">
          {success}
        </div>
      )}
      
      <div className="form-field">
        <label htmlFor="name" className="field-label">
          Full Name
        </label>
        <Textfield
          id="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          placeholder="Enter your full name"
          isRequired
          isDisabled={loading}
          autoComplete="name"
        />
      </div>

      <div className="form-field">
        <label htmlFor="email" className="field-label">
          Email Address
        </label>
        <Textfield
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
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
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="Create a password"
          isRequired
          isDisabled={loading}
          autoComplete="new-password"
        />
        <div className="password-requirements">
          <ul>
            <li>At least 6 characters long</li>
            <li>Use a mix of letters, numbers, and symbols for better security</li>
          </ul>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword" className="field-label">
          Confirm Password
        </label>
        <Textfield
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          placeholder="Confirm your password"
          isRequired
          isDisabled={loading}
          autoComplete="new-password"
        />
      </div>

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          isDisabled={loading || !!success}
          fullWidth
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleSignup}
          isDisabled={loading || !!success}
          fullWidth
        >
          Continue with Google
        </Button>
      </div>

      <div className="form-links">
        <Link to="/login">
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
};