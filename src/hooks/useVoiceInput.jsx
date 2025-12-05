import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * VoiceInput Hook
 * 
 * Integrates Web Speech API for voice-to-text transcription.
 * Handles browser compatibility and errors gracefully.
 * 
 * TODO: Replace with professional service (Google Cloud Speech, Azure, etc.)
 * TODO: Add language selection
 * TODO: Add confidence levels and alternative suggestions
 */

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + text + ' ');
        } else {
          interim += text;
        }
      }
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
      
      // User-friendly error messages
      const errorMessages = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check permissions.',
        'network': 'Network error. Please try again.',
        'permission-denied': 'Microphone permission denied.'
      };
      
      const message = errorMessages[event.error] || `Voice error: ${event.error}`;
      toast.error(message);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
}

/**
 * VoiceInputButton Component
 * 
 * Button to toggle voice input recording
 */

export function VoiceInputButton({ onTranscriptChange, className = '' }) {
  const { isListening, isSupported, transcript, startListening, stopListening } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-white/60 text-sm ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Voice input not supported</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isListening ? 'destructive' : 'outline'}
      onClick={isListening ? stopListening : startListening}
      className={`flex items-center gap-2 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''} ${className}`}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={isListening}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span>Voice Input</span>
        </>
      )}
    </Button>
  );
}

/**
 * VoiceInputStatus Component
 * 
 * Shows current voice input status and transcript preview
 */

export function VoiceInputStatus({ isListening, transcript }) {
  if (!isListening && !transcript) {
    return null;
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-2">
      <div className="flex items-center gap-2 mb-1">
        {isListening && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        <span className="text-sm text-white/80">
          {isListening ? 'Recording...' : 'Transcript preview:'}
        </span>
      </div>
      {transcript && (
        <p className="text-sm text-white/70 italic">"{transcript.trim()}"</p>
      )}
    </div>
  );
}

export default { useVoiceInput, VoiceInputButton, VoiceInputStatus };
