export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

export interface SpeechRecognitionAlternativeLike {
  transcript: string
}

export interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike | undefined
  length: number
  isFinal: boolean
}

export interface SpeechRecognitionResultListLike {
  length: number
  item: (index: number) => SpeechRecognitionResultLike
  [index: number]: SpeechRecognitionResultLike
}

export interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}
