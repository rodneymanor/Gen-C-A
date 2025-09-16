export const DEFAULT_BRAND_VOICE_ID = 'aronsogi';
export const DEFAULT_BRAND_VOICE_NAME = 'Default';

export function normalizeBrandVoiceName<T extends { id: string; name: string }>(voice: T): T {
  if (voice.id !== DEFAULT_BRAND_VOICE_ID) {
    return voice;
  }
  return { ...voice, name: DEFAULT_BRAND_VOICE_NAME };
}
