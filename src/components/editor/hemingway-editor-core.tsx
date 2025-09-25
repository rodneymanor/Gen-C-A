import React from 'react';
import { type HighlightConfig, type ScriptAnalysis } from '@/lib/script-analysis';

export interface HemingwayEditorCoreProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  highlightConfig?: HighlightConfig;
  elements?: unknown;
  onAnalysisChange?: (analysis: ScriptAnalysis) => void;
  onVoiceCommand?: (command: string) => void;
}

export function HemingwayEditorCore({ value, onChange, placeholder, readOnly = false, autoFocus = false }: HemingwayEditorCoreProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      autoFocus={autoFocus}
      style={{
        width: '100%',
        minHeight: '240px',
        resize: 'vertical',
        padding: '1rem',
        fontSize: '1rem',
        lineHeight: 1.5,
        fontFamily: 'var(--font-family-primary, sans-serif)',
      }}
    />
  );
}
