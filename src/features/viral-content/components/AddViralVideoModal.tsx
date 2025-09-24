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

const YOUTUBE_PATTERNS = [
  /[?&]v=([A-Za-z0-9_-]{11})/i,
  /youtu\.be\/([A-Za-z0-9_-]{11})/i,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
];

function extractYouTubeId(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export const AddViralVideoModal: React.FC<AddViralVideoModalProps> = ({
  open,
  onClose,
  onSuccess,
  onSubmitStart,
  onSubmitEnd,
}) => {
  const [platform, setPlatform] = useState<Exclude<Platform, 'all'>>('instagram');
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

  const youtubeId = useMemo(() => {
    if (platform !== 'youtube') return null;
    return extractYouTubeId(inputValue);
  }, [inputValue, platform]);

  const canSubmit = !isSubmitting && (
    platform === 'instagram' ? Boolean(detectedShortcode) : platform === 'tiktok' ? isTikTokUrlValid : Boolean(youtubeId)
  );

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
        } else if (platform === 'tiktok') {
          const trimmedUrl = inputValue.trim();
          if (!/tiktok\.com\//i.test(trimmedUrl)) {
            throw new Error('Enter a valid TikTok URL.');
          }
          payload = { ...payload, videoUrl: trimmedUrl };
        } else {
          const id = youtubeId;
          if (!id) {
            throw new Error('Enter a valid YouTube video URL.');
          }
          payload = { ...payload, videoUrl: `https://www.youtube.com/watch?v=${id}` };
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
          <option value="youtube">YouTube</option>
        </select>

        <Input
          label={
            platform === 'instagram'
              ? 'Instagram shortcode or URL'
              : platform === 'tiktok'
              ? 'TikTok URL'
              : 'YouTube URL'
          }
          placeholder={
            platform === 'instagram'
              ? 'e.g. DOwMDS1ja3A or https://www.instagram.com/p/DOwMDS1ja3A/'
              : platform === 'tiktok'
              ? 'https://www.tiktok.com/@username/video/1234567890'
              : 'https://www.youtube.com/watch?v=G33j5Qi4rE8'
          }
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          required
        />
        <div className="helper">
          {platform === 'instagram'
            ? 'Paste the Instagram shortcode or full post URL; we’ll extract the code automatically.'
            : platform === 'tiktok'
            ? 'Paste the full TikTok video URL.'
            : 'Paste the YouTube video URL (any format).'}
        </div>
        {platform === 'instagram' && detectedShortcode && (
          <div className="detected">Detected shortcode: {detectedShortcode}</div>
        )}
        {platform === 'youtube' && youtubeId && (
          <div className="detected">Detected video ID: {youtubeId}</div>
        )}

        {error && <div className="error">{error}</div>}
      </form>
    </BasicModal>
  );
};

export default AddViralVideoModal;
