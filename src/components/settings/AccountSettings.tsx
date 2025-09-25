import React, { useState, useRef } from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import Form, { Field, ErrorMessage, HelperMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Button, { ButtonGroup } from '@atlaskit/button';
import LoadingButton from '@atlaskit/button/loading-button';
import Avatar from '@atlaskit/avatar';
import SectionMessage from '@atlaskit/section-message';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AccountSettingsProps {
  user: User;
}

// Timezone options for the select component
const timezoneOptions = [
  { label: 'UTC-12:00 Baker Island Time', value: 'UTC-12' },
  { label: 'UTC-11:00 Hawaii-Aleutian Standard Time', value: 'UTC-11' },
  { label: 'UTC-10:00 Hawaii-Aleutian Standard Time', value: 'UTC-10' },
  { label: 'UTC-09:00 Alaska Standard Time', value: 'UTC-9' },
  { label: 'UTC-08:00 Pacific Standard Time', value: 'UTC-8' },
  { label: 'UTC-07:00 Mountain Standard Time', value: 'UTC-7' },
  { label: 'UTC-06:00 Central Standard Time', value: 'UTC-6' },
  { label: 'UTC-05:00 Eastern Standard Time', value: 'UTC-5' },
  { label: 'UTC-04:00 Atlantic Standard Time', value: 'UTC-4' },
  { label: 'UTC-03:00 Argentina Time', value: 'UTC-3' },
  { label: 'UTC-02:00 South Georgia Time', value: 'UTC-2' },
  { label: 'UTC-01:00 Azores Time', value: 'UTC-1' },
  { label: 'UTC+00:00 Coordinated Universal Time', value: 'UTC+0' },
  { label: 'UTC+01:00 Central European Time', value: 'UTC+1' },
  { label: 'UTC+02:00 Eastern European Time', value: 'UTC+2' },
  { label: 'UTC+03:00 Moscow Time', value: 'UTC+3' },
  { label: 'UTC+04:00 Gulf Standard Time', value: 'UTC+4' },
  { label: 'UTC+05:00 Pakistan Standard Time', value: 'UTC+5' },
  { label: 'UTC+06:00 Bangladesh Standard Time', value: 'UTC+6' },
  { label: 'UTC+07:00 Indochina Time', value: 'UTC+7' },
  { label: 'UTC+08:00 China Standard Time', value: 'UTC+8' },
  { label: 'UTC+09:00 Japan Standard Time', value: 'UTC+9' },
  { label: 'UTC+10:00 Australian Eastern Standard Time', value: 'UTC+10' },
  { label: 'UTC+11:00 Solomon Islands Time', value: 'UTC+11' },
  { label: 'UTC+12:00 New Zealand Standard Time', value: 'UTC+12' },
];

// Form validation functions
const validateFullName = (value?: string) => {
  if (!value || value.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return undefined;
};

const validateEmail = (value?: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) {
    return 'Email is required';
  }
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

const validateUsername = (value?: string) => {
  if (!value || value.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return undefined;
};

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

const profileSectionStyles = css`
  display: flex;
  align-items: flex-start;
  gap: ${token('space.300')};
  margin-bottom: ${token('space.400')};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const avatarActionsStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${token('space.150')};

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const formFieldsStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${token('space.300')};
  margin-bottom: ${token('space.400')};
`;

const formActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  padding-top: ${token('space.300')};
  border-top: 1px solid ${token('color.border')};
`;

export function AccountSettings({ user }: AccountSettingsProps) {
  const { updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form initial values
  const initialValues = {
    fullName: user.name || '',
    email: user.email || '',
    username: user.id || '',
    timezone: 'UTC-5', // Default timezone
  };

  // Handle avatar upload
  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      // TODO: Upload to storage and update user profile
      console.log('Avatar file selected:', file.name);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    // TODO: Remove avatar from storage and update user profile
    console.log('Avatar removed');
  };

  // Handle form submission
  const handleSubmit = async (data: typeof initialValues) => {
    setIsLoading(true);
    setSuccessMessage('');

    try {
      // Update user profile
      await updateUserProfile(data.fullName);
      
      // TODO: Update other fields like email, username, timezone
      console.log('Profile updated:', data);
      
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div css={sectionStyles}>
          <SectionMessage appearance="success">
            <p>{successMessage}</p>
          </SectionMessage>
        </div>
      )}

      {/* Profile Picture Section */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Profile Picture</h3>
        <div css={profileSectionStyles}>
          <Avatar
            size="xlarge"
            src={avatarFile ? URL.createObjectURL(avatarFile) : user.avatar}
            name={user.name}
          />
          <div css={avatarActionsStyles}>
            <Button appearance="primary" onClick={handleAvatarUpload}>
              Upload New
            </Button>
            <Button 
              appearance="subtle" 
              onClick={handleRemoveAvatar}
              isDisabled={!user.avatar && !avatarFile}
            >
              Remove
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload profile picture"
            />
          </div>
        </div>
        <HelperMessage>
          Recommended: Square image, at least 200x200 pixels. Max file size: 5MB.
        </HelperMessage>
      </div>

      {/* Account Details Form */}
      <div css={sectionStyles}>
        <h3 css={sectionTitleStyles}>Account Details</h3>
        <Form onSubmit={handleSubmit}>
          {({ formProps }) => (
            <form {...formProps}>
              <div css={formFieldsStyles}>
                <Field name="fullName" label="Full Name" isRequired validate={validateFullName} defaultValue={initialValues.fullName}>
                  {({ fieldProps, error }) => (
                    <>
                      <Textfield {...fieldProps} />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>
                  )}
                </Field>

                <Field name="email" label="Email Address" isRequired validate={validateEmail} defaultValue={initialValues.email}>
                  {({ fieldProps, error }) => (
                    <>
                      <Textfield {...fieldProps} type="email" />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                      <HelperMessage>This email is used for login and notifications</HelperMessage>
                    </>
                  )}
                </Field>

                <Field name="username" label="Username" isRequired validate={validateUsername} defaultValue={initialValues.username}>
                  {({ fieldProps, error }) => (
                    <>
                      <Textfield {...fieldProps} />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                      <HelperMessage>Used in your public profile URL</HelperMessage>
                    </>
                  )}
                </Field>

                <Field name="timezone" label="Timezone" defaultValue={initialValues.timezone}>
                  {({ fieldProps }) => {
                    const {
                      value,
                      onChange,
                      onBlur,
                      id,
                      name,
                      isDisabled,
                      ['aria-describedby']: ariaDescribedBy,
                    } = fieldProps as {
                      value?: string;
                      onChange: (value?: string) => void;
                      onBlur?: React.FocusEventHandler;
                      id?: string;
                      name?: string;
                      isDisabled?: boolean;
                      'aria-describedby'?: string;
                    };

                    const selectedOption = timezoneOptions.find((option) => option.value === value) ?? null;

                    return (
                      <>
                        <Select
                          inputId={id}
                          name={name}
                          value={selectedOption}
                          options={timezoneOptions}
                          placeholder="Select your timezone"
                          isSearchable
                          isDisabled={isDisabled}
                          aria-describedby={ariaDescribedBy}
                          onBlur={onBlur}
                          onChange={(option) => {
                            const next = Array.isArray(option) ? option[0] : option;
                            onChange(next?.value);
                          }}
                        />
                        <HelperMessage>Used for displaying dates and scheduling</HelperMessage>
                      </>
                    );
                  }}
                </Field>
              </div>

              <div css={formActionsStyles}>
                <ButtonGroup>
                  <LoadingButton type="submit" appearance="primary" isLoading={isLoading}>
                    Save Changes
                  </LoadingButton>
                  <Button appearance="subtle" type="button">
                    Cancel
                  </Button>
                </ButtonGroup>
              </div>
            </form>
          )}
        </Form>
      </div>

      {/* Account Information */}
      <div css={sectionStyles}>
        <SectionMessage appearance="information">
          <p>
            <strong>Account created:</strong> {user.id ? 'Recently' : 'Unknown'}
          </p>
          <p>
            <strong>Plan:</strong> {user.plan || 'Free'} plan
          </p>
          <p>
            Changes to your email address will require verification before taking effect.
          </p>
        </SectionMessage>
      </div>
    </div>
  );
}
