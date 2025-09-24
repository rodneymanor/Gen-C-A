import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';

import { BasicModal } from '@/components/ui/BasicModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AddViralVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

const formStyles = css`
  display: grid;
  gap: 16px;

  .helper {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .detected {
    font-size: var(--font-size-caption);
    color: var(--color-success-600);
  }

  .error {
    color: var(--color-danger-600);
    font-size: var(--font-size-caption);
  }
`;

const footerStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const AddViralVideoModal: React.FC<AddViralVideoModalProps> = ({
  open,
  onClose,
  onSuccess,
  onSubmitStart,
  onSubmitEnd,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInputValue('');
  }, [open]);

  const detectedShortcode = useMemo(() => {
    const value = inputValue.trim();
    if (!value) return null;
    const match = value.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (match) return match[1];
    const sanitized = value.replace(/\s+/g, '').replace(/\//g, '');
    if (!sanitized) return null;
    return /^[A-Za-z0-9_-]+$/.test(sanitized) ? sanitized : null;
  }, [inputValue]);

  const canSubmit = Boolean(detectedShortcode) && !isSubmitting;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;

      const trimmedShortcode = detectedShortcode;
      if (!trimmedShortcode) {
        setError('Enter a valid Instagram shortcode.');
        return;
      }

      setIsSubmitting(true);
      onSubmitStart?.();
      setError(null);

      try {
        const response = await fetch('/api/viral-content/admin/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'instagram', shortcode: trimmedShortcode }),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json?.success) {
          throw new Error(json?.error ?? `Request failed with ${response.status}`);
        }

        await onSuccess();
        onClose();
      } catch (err) {
        console.error('[viral-content] add video failed', err);
        setError(err instanceof Error ? err.message : 'Failed to add video.');
      } finally {
        setIsSubmitting(false);
        onSubmitEnd?.();
      }
    },
    [isSubmitting, detectedShortcode, onClose, onSuccess, onSubmitStart, onSubmitEnd],
  );

  const submitFooter = (
    <div css={footerStyles}>
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={!canSubmit}>
        Add Video
      </Button>
    </div>
  );

  return (
    <BasicModal open={open} onClose={onClose} title="Add video" footer={submitFooter}>
      <form css={formStyles} onSubmit={handleSubmit}>
        <Input
          label="Instagram shortcode"
          placeholder="e.g. DOwMDS1ja3A or https://www.instagram.com/p/DOwMDS1ja3A/"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          required
        />
        <div className="helper">
          Paste the Instagram shortcode or full post URL; we’ll extract the code automatically.
        </div>
        {detectedShortcode && (
          <div className="detected">Detected shortcode: {detectedShortcode}</div>
        )}

        {error && <div className="error">{error}</div>}
      </form>
    </BasicModal>
  );
};

export default AddViralVideoModal;
