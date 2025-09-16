export const DEFAULT_BRAND_VOICE_ID = 'aronsogi';
export const DEFAULT_BRAND_VOICE_NAME = 'Default';

type BrandVoiceLike = { id: string; isDefault?: boolean | null };

export function isDefaultBrandVoice(voice: BrandVoiceLike): boolean {
  return voice.isDefault === true || voice.id === DEFAULT_BRAND_VOICE_ID;
}

export function resolveDefaultBrandVoiceId<T extends BrandVoiceLike>(voices: T[]): string {
  const defaultVoice = voices.find((voice) => voice.isDefault === true);
  return defaultVoice?.id || DEFAULT_BRAND_VOICE_ID;
}

export function normalizeBrandVoiceName<T extends { id: string; name: string; isDefault?: boolean | null }>(voice: T): T {
  if (!isDefaultBrandVoice(voice)) {
    return voice;
  }
  return { ...voice, name: DEFAULT_BRAND_VOICE_NAME };
}
