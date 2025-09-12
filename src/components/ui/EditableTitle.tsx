import React, { useState, useRef, useEffect, useCallback } from 'react';
import { styled, css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
import EditTitleIcon from '@atlaskit/icon/glyph/edit';

export interface EditableTitleProps {
  /** Initial title value */
  value: string;
  /** Callback when title changes */
  onChange: (value: string) => void;
  /** Placeholder text when title is empty */
  placeholder?: string;
  /** Maximum length for the title */
  maxLength?: number;
  /** Whether the title is required */
  required?: boolean;
  /** Custom class name */
  className?: string;
  /** ARIA label for the title input */
  ariaLabel?: string;
}

const TitleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: ${token('space.300')};
  background: transparent;
  transition: all ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  border-radius: ${token('border.radius')};
  
  &:hover {
    background: ${token('color.background.neutral.subtle.hovered')};
  }
  
  &:focus-within {
    background: ${token('color.background.input')};
    box-shadow: ${token('elevation.shadow.raised')};
  }
`;

const TitleInput = styled.input<{ isEditing: boolean }>`
  font-size: ${token('font.size.600')};
  font-weight: ${token('font.weight.bold')};
  color: ${token('color.text')};
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
  line-height: 1.2;
  
  /* Hide cursor when not editing */
  ${props => !props.isEditing && css`
    caret-color: transparent;
    cursor: pointer;
    
    &:hover {
      cursor: text;
    }
  `}
  
  &::placeholder {
    color: ${token('color.text.subtlest')};
    font-style: italic;
  }
  
  &:focus {
    caret-color: ${token('color.text')};
    cursor: text;
  }
`;

const EditIcon = styled.button<{ visible: boolean }>`
  position: absolute;
  right: ${token('space.200')};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: ${token('space.100')};
  border-radius: ${token('border.radius')};
  color: ${token('color.text.subtle')};
  cursor: pointer;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${token('color.background.neutral.subtle.hovered')};
    color: ${token('color.text')};
  }
  
  &:focus {
    opacity: 1;
    outline: 2px solid ${token('color.border.focused')};
    outline-offset: 2px;
  }
`;

const CharacterCount = styled.div<{ isNearLimit: boolean; isOverLimit: boolean }>`
  position: absolute;
  right: ${token('space.200')};
  bottom: -${token('space.200')};
  font-size: ${token('font.size.075')};
  color: ${props => {
    if (props.isOverLimit) return token('color.text.danger');
    if (props.isNearLimit) return token('color.text.warning');
    return token('color.text.subtlest');
  }};
  transition: color ${token('motion.duration.fast')} ${token('motion.easing.standard')};
`;

const ValidationMessage = styled.div`
  position: absolute;
  left: 0;
  bottom: -${token('space.300')};
  font-size: ${token('font.size.075')};
  color: ${token('color.text.danger')};
  margin-top: ${token('space.050')};
`;

export const EditableTitle: React.FC<EditableTitleProps> = ({
  value,
  onChange,
  placeholder = "Enter title here...",
  maxLength = 100,
  required = false,
  className,
  ariaLabel = "Document title",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const [showEditIcon, setShowEditIcon] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateTitle = useCallback((title: string): string => {
    if (required && !title.trim()) {
      return 'Title is required';
    }
    if (maxLength && title.length > maxLength) {
      return `Title must be ${maxLength} characters or less`;
    }
    return '';
  }, [required, maxLength]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
    setShowEditIcon(false);
    setValidationError('');
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    
    const error = validateTitle(internalValue);
    setValidationError(error);
    
    if (!error) {
      onChange(internalValue);
    } else {
      // Revert to original value if validation fails
      setInternalValue(value);
    }
  }, [internalValue, onChange, validateTitle, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setInternalValue(value); // Revert to original value
      inputRef.current?.blur();
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // Clear validation error as user types
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!isEditing) {
      setShowEditIcon(true);
    }
  }, [isEditing]);

  const handleMouseLeave = useCallback(() => {
    setShowEditIcon(false);
  }, []);

  // Calculate character count indicators
  const characterCount = internalValue.length;
  const isNearLimit = maxLength ? characterCount > maxLength * 0.8 : false;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  return (
    <TitleContainer
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TitleInput
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        isEditing={isEditing}
        aria-label={ariaLabel}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? 'title-error' : undefined}
      />
      
      <EditIcon
        visible={showEditIcon && !isEditing}
        onClick={handleEditClick}
        aria-label="Edit title"
        tabIndex={-1}
      >
        <EditTitleIcon label="" size="small" />
      </EditIcon>
      
      {maxLength && isEditing && (
        <CharacterCount 
          isNearLimit={isNearLimit} 
          isOverLimit={isOverLimit}
          aria-live="polite"
        >
          {characterCount}/{maxLength}
        </CharacterCount>
      )}
      
      {validationError && (
        <ValidationMessage id="title-error" role="alert">
          {validationError}
        </ValidationMessage>
      )}
    </TitleContainer>
  );
};