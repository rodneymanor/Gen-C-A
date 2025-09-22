import type { BrandVoice } from '@/types';

const scoreVoice = (voice: BrandVoice): number => {
  let score = 0;
  if (voice.creatorId) score += 4;
  if (voice.description) score += 1;
  if (voice.keywords?.length) score += 1;
  return score;
};

export function dedupeBrandVoices(voices: BrandVoice[]): BrandVoice[] {
  const map = new Map<string, BrandVoice>();

  for (const voice of voices) {
    if (!voice || typeof voice !== 'object') continue;
    const id = voice.id?.trim();
    if (!id) continue;

    const existing = map.get(id);
    if (!existing) {
      map.set(id, voice);
      continue;
    }

    if (scoreVoice(voice) > scoreVoice(existing)) {
      map.set(id, voice);
    }
  }

  return Array.from(map.values());
}
