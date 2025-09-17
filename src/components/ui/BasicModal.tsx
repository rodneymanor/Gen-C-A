import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/react';

interface BasicModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const overlayStyles = css`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const dialogStyles = css`
  background: var(--color-neutral-0, #fff);
  color: var(--color-text-primary, #172b4d);
  border-radius: var(--radius-medium, 8px);
  border: 1px solid var(--color-neutral-200, #e4e6ea);
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  min-width: 320px;
  max-width: 640px;
  width: 92%;
`;

const headerStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-5, 20px);
  border-bottom: 1px solid var(--color-neutral-200, #e4e6ea);
  h3 { margin: 0; font-size: var(--font-size-h5, 18px); }
  button { background: none; border: none; cursor: pointer; font-size: 18px; }
`;

const bodyStyles = css`
  padding: var(--space-5, 20px);
`;

const footerStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px) var(--space-5, 20px);
  border-top: 1px solid var(--color-neutral-200, #e4e6ea);
`;

export const BasicModal: React.FC<BasicModalProps> = ({ open, title, onClose, children, footer }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const focusTimer = window.setTimeout(() => {
      try {
        const root = modalRef.current;
        if (!root) return;
        const focusable = root.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      } catch {}
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    onClose();
  };
  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };
  return createPortal(
    <div
      css={overlayStyles}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div
        ref={modalRef}
        css={dialogStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div css={headerStyles}>
          <h3 id={titleId}>{title}</h3>
          <button aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div css={bodyStyles}>{children}</div>
        {footer && <div css={footerStyles}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default BasicModal;
