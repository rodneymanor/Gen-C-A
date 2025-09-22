import React from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashShape, gcDashSpacing } from './styleUtils';
import { GcDashAvatar } from './GcDashAvatar';
import { GcDashButton } from './GcDashButton';
import { GcDashInput } from './GcDashInput';
import { GcDashLoadingSpinner } from './GcDashLoadingSpinner';

export type GcDashChatAuthorType = 'assistant' | 'user' | 'system' | 'tool';

export interface GcDashChatMessage {
  id: string;
  author: GcDashChatAuthorType;
  name?: string;
  avatarUrl?: string;
  roleLabel?: string;
  timestamp?: string;
  content: React.ReactNode;
  status?: 'sending' | 'sent' | 'read' | 'error';
  actions?: React.ReactNode;
}

export interface GcDashChatMessageProps extends GcDashChatMessage {}

export const GcDashChatMessageBubble: React.FC<GcDashChatMessageProps> = ({
  author,
  name,
  avatarUrl,
  roleLabel,
  timestamp,
  content,
  status = 'sent',
  actions,
}) => {
  const isUser = author === 'user';
  const bubbleColor = isUser ? gcDashColor.primary : gcDashColor.surfaceAlt;
  const textColor = isUser ? 'var(--color-neutral-0)' : gcDashColor.textPrimary;

  return (
    <article
      css={css`
        display: flex;
        align-items: flex-start;
        gap: ${gcDashSpacing.sm};
        flex-direction: ${isUser ? 'row-reverse' : 'row'};
      `}
    >
      <GcDashAvatar
        name={name}
        src={avatarUrl}
        size="sm"
        showMeta={false}
        className="gc-dash-chat__avatar"
      />
      <div
        css={css`
          max-width: min(720px, 80vw);
          display: flex;
          flex-direction: column;
          gap: ${gcDashSpacing.xs};
          align-items: ${isUser ? 'flex-end' : 'flex-start'};
        `}
      >
        <header
          css={css`
            display: inline-flex;
            gap: ${gcDashSpacing.xs};
            align-items: baseline;
            color: ${gcDashColor.textMuted};
            font-size: 12px;
          `}
        >
          {name && (
            <strong
              css={css`
                color: ${gcDashColor.textPrimary};
                font-weight: 600;
              `}
            >
              {name}
            </strong>
          )}
          {roleLabel && <span>{roleLabel}</span>}
          {timestamp && <time>{timestamp}</time>}
        </header>
        <div
          css={css`
            position: relative;
            padding: ${gcDashSpacing.sm} ${gcDashSpacing.md};
            border-radius: ${gcDashShape.radiusLg};
            background: ${bubbleColor};
            color: ${textColor};
            border: 1px solid ${isUser ? gcDashColor.primary : gcDashColor.border};
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, ${isUser ? 0.12 : 0});
          `}
        >
          <div className="gc-dash-chat__content">{content}</div>
        </div>
        <footer
          css={css`
            display: flex;
            align-items: center;
            gap: ${gcDashSpacing.xs};
            color: ${gcDashColor.textMuted};
            font-size: 12px;
          `}
        >
          {status === 'sending' && (
            <span css={css`display: inline-flex; align-items: center; gap: 4px;`}>
              <GcDashLoadingSpinner size={14} />
              Sending…
            </span>
          )}
          {status === 'error' && <span style={{ color: gcDashColor.danger }}>Failed to send</span>}
          {status === 'read' && <span>Read</span>}
          {actions}
        </footer>
      </div>
    </article>
  );
};

export interface GcDashChatThreadProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: GcDashChatMessage[];
  emptyState?: React.ReactNode;
}

export const GcDashChatThread: React.FC<GcDashChatThreadProps> = ({
  messages,
  emptyState,
  className,
  ...props
}) => (
  <div
    className={className}
    css={css`
      display: flex;
      flex-direction: column;
      gap: ${gcDashSpacing.lg};
      padding: ${gcDashSpacing.lg};
      background: ${gcDashColor.surface};
      border-radius: ${gcDashShape.radiusXl};
      border: 1px solid ${gcDashColor.border};
      height: 100%;
      overflow-y: auto;
    `}
    {...props}
  >
    {messages.length === 0 && emptyState}
    {messages.map((message) => (
      <GcDashChatMessageBubble key={message.id} {...message} />
    ))}
  </div>
);

export interface GcDashChatComposerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  placeholder?: string;
  onSend?: (value: string) => void;
  attachments?: React.ReactNode;
  disabled?: boolean;
}

export const GcDashChatComposer: React.FC<GcDashChatComposerProps> = ({
  placeholder = 'Type a message…',
  onSend,
  attachments,
  disabled,
  className,
  ...rest
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { onSubmit, ...formProps } = rest;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    onSubmit?.(event);
    event.preventDefault();
    if (disabled) return;
    const value = inputRef.current?.value?.trim();
    if (value) {
      onSend?.(value);
      inputRef.current!.value = '';
    }
  };

  return (
    <form
      className={className}
      css={css`
        display: flex;
        align-items: center;
        gap: ${gcDashSpacing.sm};
        padding: ${gcDashSpacing.sm} ${gcDashSpacing.md};
        border: 1px solid ${gcDashColor.border};
        border-radius: ${gcDashShape.radiusXl};
        background: ${gcDashColor.surface};
      `}
      onSubmit={handleSubmit}
      {...formProps}
    >
      {attachments && <div css={css`display: inline-flex; align-items: center; gap: ${gcDashSpacing.xs};`}>{attachments}</div>}
      <GcDashInput
        ref={inputRef}
        placeholder={placeholder}
        disabled={disabled}
        leadingIcon={<span aria-hidden="true">💬</span>}
        style={{ flex: 1 }}
      />
      <GcDashButton type="submit" disabled={disabled} variant="primary">
        Send
      </GcDashButton>
    </form>
  );
};
