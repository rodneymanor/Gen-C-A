import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';

import { BasicModal } from '@/components/ui/BasicModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Platform } from '../types';

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
  const [platform, setPlatform] = useState<Exclude<Platform, 'all' | 'youtube'>>('instagram');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPlatform('instagram');
    setInputValue('');
  }, [open]);

  const detectedShortcode = useMemo(() => {
    if (platform !== 'instagram') return null;
    const value = inputValue.trim();
    if (!value) return null;
    const match = value.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (match) return match[1];
    const sanitized = value.replace(/\s+/g, '').replace(/\//g, '');
    if (!sanitized) return null;
    return /^[A-Za-z0-9_-]+$/.test(sanitized) ? sanitized : null;
  }, [inputValue, platform]);

  const isTikTokUrlValid = useMemo(() => {
    if (platform !== 'tiktok') return false;
    const value = inputValue.trim();
    if (!value) return false;
    return /tiktok\.com\//i.test(value);
  }, [inputValue, platform]);

  const canSubmit = !isSubmitting && (platform === 'instagram' ? Boolean(detectedShortcode) : isTikTokUrlValid);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      onSubmitStart?.();
      setError(null);

      try {
        let payload: Record<string, unknown> = { platform };

        if (platform === 'instagram') {
          const trimmedShortcode = detectedShortcode;
          if (!trimmedShortcode) {
            throw new Error('Enter a valid Instagram shortcode.');
          }
          payload = { ...payload, shortcode: trimmedShortcode };
        } else {
          const trimmedUrl = inputValue.trim();
          if (!/tiktok\.com\//i.test(trimmedUrl)) {
            throw new Error('Enter a valid TikTok URL.');
          }
          payload = { ...payload, videoUrl: trimmedUrl };
        }

        const response = await fetch('/api/viral-content/admin/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
    [isSubmitting, detectedShortcode, inputValue, platform, onClose, onSuccess, onSubmitStart, onSubmitEnd],
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
        <label
          htmlFor="viral-video-platform"
          style={{ fontSize: 'var(--font-size-body-small)', fontWeight: 500, color: 'var(--color-neutral-700)' }}
        >
          Platform
        </label>
        <select
          id="viral-video-platform"
          value={platform}
          disabled={isSubmitting}
          onChange={(event) => {
            setPlatform(event.target.value as 'instagram' | 'tiktok');
            setInputValue('');
            setError(null);
          }}
          style={{
            width: '100%',
            minHeight: 40,
            borderRadius: 8,
            border: '1px solid var(--color-neutral-200)',
            padding: '0 12px',
            fontSize: 14,
            background: 'var(--color-neutral-0)',
            color: 'var(--color-neutral-800)',
          }}
        >
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>

        <Input
          label={platform === 'instagram' ? 'Instagram shortcode or URL' : 'TikTok URL'}
          placeholder={
            platform === 'instagram'
              ? 'e.g. DOwMDS1ja3A or https://www.instagram.com/p/DOwMDS1ja3A/'
              : 'https://www.tiktok.com/@username/video/1234567890'
          }
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          required
        />
        <div className="helper">
          {platform === 'instagram'
            ? 'Paste the Instagram shortcode or full post URL; we’ll extract the code automatically.'
            : 'Paste the full TikTok video URL.'}
        </div>
        {platform === 'instagram' && detectedShortcode && (
          <div className="detected">Detected shortcode: {detectedShortcode}</div>
        )}

        {error && <div className="error">{error}</div>}
      </form>
    </BasicModal>
  );
};

export default AddViralVideoModal;
