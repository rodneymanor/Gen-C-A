import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionInstance
} from '../types/speech'

type UseSpeechTranscriptionOptions = {
  transcript: string
  onTranscriptChange: (value: string) => void
  language?: string
}

type UseSpeechTranscriptionResult = {
  liveTranscript: string
  updateTranscript: (value: string) => void
  clearTranscript: () => void
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  elapsedSeconds: number
  recordingError: string | null
  sessionTranscript: string
  setSegmentStartAtCurrentPosition: (options?: { resetLiveTranscript?: boolean; initialValue?: string }) => void
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const getSpeechRecognitionClass = (): SpeechRecognitionConstructor | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const globalWindow = window as WindowWithSpeechRecognition
  return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition ?? undefined
}

export const useSpeechTranscription = (
  options: UseSpeechTranscriptionOptions
): UseSpeechTranscriptionResult => {
  const { transcript, onTranscriptChange, language = 'en-US' } = options
  const [liveTranscript, setLiveTranscript] = useState(transcript)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [sessionTranscript, setSessionTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerIntervalRef = useRef<number | null>(null)
  const sessionTranscriptRef = useRef('')
  const segmentStartRef = useRef(0)

  useEffect(() => {
    setLiveTranscript(transcript)
  }, [transcript])

  useEffect(() => {
    sessionTranscriptRef.current = sessionTranscript
  }, [sessionTranscript])

  const stopInterval = useCallback(() => {
    if (timerIntervalRef.current && typeof window !== 'undefined') {
      window.clearInterval(timerIntervalRef.current)
    }
    timerIntervalRef.current = null
  }, [])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch (error) {
        // Stopping an inactive recognition instance can throw; ignore.
      }
      recognitionRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    stopInterval()
    stopRecognition()
    setIsRecording(false)
    onTranscriptChange(liveTranscript.trim())
  }, [liveTranscript, onTranscriptChange, stopInterval, stopRecognition])

  useEffect(() => {
    return () => {
      stopInterval()
      stopRecognition()
    }
  }, [stopInterval, stopRecognition])

  const updateTranscript = useCallback(
    (value: string) => {
      setLiveTranscript(value)
      onTranscriptChange(value)
    },
    [onTranscriptChange]
  )

  const clearTranscript = useCallback(() => {
    updateTranscript('')
  }, [updateTranscript])

  const setSegmentStartAtCurrentPosition = useCallback(
    (options?: { resetLiveTranscript?: boolean; initialValue?: string }) => {
      const resetLive = options?.resetLiveTranscript ?? true
      const initialValue = options?.initialValue ?? ''
      const current = sessionTranscriptRef.current
      segmentStartRef.current = current.length
      if (resetLive) {
        setLiveTranscript(initialValue)
        onTranscriptChange(initialValue)
      }
    },
    [onTranscriptChange]
  )

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return
    }

    if (typeof window === 'undefined') {
      setRecordingError('Live transcription is unavailable in this environment.')
      return
    }

    const speechRecognitionClass = getSpeechRecognitionClass()

    if (!speechRecognitionClass) {
      setRecordingError(
        'Live transcription is not supported in this browser. You can type your answer below.'
      )
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }
    } catch (error) {
      setRecordingError('Microphone permission is required to capture your answers.')
      return
    }

    setRecordingError(null)

    const recognition = new speechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const aggregatedTranscript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index]?.[0]?.transcript?.trim?.() ?? '')
        .join(' ')
        .trim()

      setSessionTranscript(aggregatedTranscript)

      const segmentStart = segmentStartRef.current
      const segmentText = aggregatedTranscript.slice(segmentStart).trimStart()
      setLiveTranscript(segmentText)
      onTranscriptChange(segmentText)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'no-speech') {
        setRecordingError('We could not detect audio. Try speaking closer to the microphone.')
      } else if (event.error === 'not-allowed') {
        setRecordingError('Microphone access is blocked. Update your browser permissions to record.')
      } else {
        setRecordingError(
          event.message ?? 'Something interrupted the recording. You can continue typing your response.'
        )
      }
      setIsRecording(false)
      stopInterval()
    }

    recognition.onend = () => {
      stopInterval()
      recognitionRef.current = null
      setIsRecording(false)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      setElapsedSeconds(0)
      stopInterval()
      segmentStartRef.current = sessionTranscriptRef.current.length
      setSessionTranscript('')
      sessionTranscriptRef.current = ''
      if (typeof window !== 'undefined') {
        timerIntervalRef.current = window.setInterval(() => {
          setElapsedSeconds((prev) => prev + 1)
        }, 1000)
      }
    } catch (error) {
      setRecordingError('We were unable to start recording. Try refreshing or typing your response.')
      recognitionRef.current = null
      setIsRecording(false)
    }
  }, [isRecording, language, onTranscriptChange, stopInterval])

  return {
    liveTranscript,
    updateTranscript,
    clearTranscript,
    isRecording,
    startRecording,
    stopRecording,
    elapsedSeconds,
    recordingError,
    sessionTranscript,
    setSegmentStartAtCurrentPosition
  }
}
