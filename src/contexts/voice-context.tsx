import React, { createContext, useContext, useMemo, useState } from 'react';

export type VoiceType = string;

interface VoiceContextValue {
  currentVoice: VoiceType;
  availableVoices: VoiceType[];
  setCurrentVoice: (voice: VoiceType) => void;
}

const defaultVoices: VoiceType[] = ['default'];
const VoiceContext = createContext<VoiceContextValue | undefined>(undefined);

interface VoiceProviderProps {
  children: React.ReactNode;
  initialVoices?: VoiceType[];
  defaultVoice?: VoiceType;
}

export function VoiceProvider({ children, initialVoices = defaultVoices, defaultVoice = initialVoices[0] }: VoiceProviderProps) {
  const [currentVoice, setCurrentVoice] = useState<VoiceType>(defaultVoice ?? 'default');
  const value = useMemo(
    () => ({
      currentVoice,
      availableVoices: initialVoices.length > 0 ? initialVoices : defaultVoices,
      setCurrentVoice,
    }),
    [currentVoice, initialVoices],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext);
  if (!context) {
    return {
      currentVoice: 'default',
      availableVoices: defaultVoices,
      setCurrentVoice: () => {
        // no-op when provider missing
      },
    };
  }
  return context;
}
