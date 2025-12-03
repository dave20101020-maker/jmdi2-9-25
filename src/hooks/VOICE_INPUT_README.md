# Voice Input Hook Documentation

## Overview
The `useVoiceInput` hook provides Web Speech API integration for voice-to-text transcription across the application. It handles browser compatibility, error states, and provides a simple interface for capturing voice input.

## Browser Support
- ✅ Chrome/Chromium (v25+)
- ✅ Safari (v14.1+)
- ✅ Edge (v79+)
- ✅ Opera
- ❌ Firefox (requires extension)

## Usage

### Basic Hook Integration
```jsx
import { useVoiceInput } from '@/hooks/useVoiceInput';

function MyComponent() {
  const { 
    isListening, 
    isSupported, 
    transcript, 
    startListening, 
    stopListening, 
    clearTranscript 
  } = useVoiceInput();

  return (
    <div>
      {!isSupported && <p>Voice input not supported</p>}
      
      <button onClick={startListening}>Record</button>
      <button onClick={stopListening}>Stop</button>
      <button onClick={clearTranscript}>Clear</button>
      
      {isListening && <p>Recording...</p>}
      {transcript && <p>You said: {transcript}</p>}
    </div>
  );
}
```

### Advanced: Custom Language Selection
```jsx
// TODO: Add language parameter
const { isListening, transcript } = useVoiceInput({ language: 'es-ES' });
```

### Integrated Example (GuidedJournal)
The voice input hook is fully integrated into the journaling component:

1. User clicks "Voice Input" button
2. Microphone starts recording
3. Browser listens for speech and converts to text
4. Transcript automatically appends to journal textarea
5. User clicks "Stop Recording" to end

## Hook API

### Returned Values
```typescript
{
  isListening: boolean;      // Currently recording
  isSupported: boolean;      // Browser has Web Speech API
  transcript: string;        // Current transcribed text
  error: string | null;      // Last error message
  startListening: () => void; // Begin recording
  stopListening: () => void;  // End recording
  clearTranscript: () => void; // Reset transcript
}
```

### Error Handling
The hook provides user-friendly error messages:
- `'no-speech'` → "No speech detected. Please try again."
- `'audio-capture'` → "No microphone found. Please check permissions."
- `'network'` → "Network error. Please try again."
- `'permission-denied'` → "Microphone permission denied."

Errors are displayed via toast notifications.

## Features

✅ **Browser Compatibility Detection**
- Automatically detects support and disables UI if unavailable
- Graceful fallback for unsupported browsers

✅ **Accessibility**
- ARIA labels for screen readers
- Keyboard-accessible controls
- Status announcements for recording state

✅ **Error Recovery**
- User-friendly error messages
- Automatic retry capability
- Network error handling

✅ **Interim Results**
- Shows live transcription as user speaks
- Final transcript on speech end
- Character count for journal entries

## Future Improvements

### TODO: Professional Service Integration
```javascript
// Currently uses browser Web Speech API
// Consider replacing with:
// - Google Cloud Speech-to-Text API
// - Azure Speech Services
// - AWS Transcribe
// - Deepgram
// - AssemblyAI

// Benefits:
// - Better accuracy
// - Multiple language support
// - Speaker identification
// - Punctuation & capitalization
// - Confidence scores
```

### TODO: Language Support
```javascript
// Add language selection:
// - English (en-US, en-GB, etc.)
// - Spanish (es-ES, es-MX, etc.)
// - Mandarin (zh-CN, zh-TW, etc.)
// - French, German, Japanese, etc.

// Implementation:
const { transcript } = useVoiceInput({ language: 'es-ES' });
```

### TODO: Advanced Features
- [ ] Confidence levels for transcripts
- [ ] Alternative transcription suggestions
- [ ] Punctuation auto-correction
- [ ] Speaker diarization
- [ ] Sentiment analysis integration
- [ ] Transcript editing UI
- [ ] Audio file upload fallback
- [ ] Voice command recognition

## Testing

### Unit Tests
```javascript
// test/useVoiceInput.test.js
test('initializes with isSupported=true when browser supports Web Speech', () => {
  // ...
});

test('calls startListening when user clicks Record', () => {
  // ...
});
```

### Browser Testing
```bash
# Test in different browsers:
npm run test:e2e

# Specific voice test:
npm run test:e2e -- --grep "voice input"
```

## Privacy & Security

⚠️ **Important Considerations**

1. **Microphone Permissions**: Users must grant microphone access
   - Browser handles permission prompts
   - Can be revoked in settings

2. **Data Handling**: 
   - Web Speech API may send audio to Google servers (Chrome)
   - For sensitive content, consider self-hosted solution
   - Offline option: download Dictation.js or similar

3. **HIPAA/GDPR Compliance**:
   - For healthcare apps: Use enterprise services with compliance
   - Consider local-only voice processing
   - Encrypt recordings in transit & at rest

## Troubleshooting

### Microphone not working?
1. Check browser permissions (Settings → Microphone)
2. Verify no other app is using microphone
3. Test with https:// (required for audio capture)
4. Try a different browser

### Poor transcription accuracy?
1. Speak clearly and slowly
2. Reduce background noise
3. Consider professional service (Google Cloud, Azure)
4. Use punctuation prompts in UI

### User can't see recording indicator?
1. Check browser compatibility (Chrome recommended)
2. Ensure CSS for `.animate-pulse` is loaded
3. Test with browser dev tools (F12)

## Examples in Codebase

### Current Usage
- `src/ai/GuidedJournal.jsx` - Journaling with voice
- More components coming in future iterations

### Ready for Integration
- `src/components/shared/ThoughtRecorder.jsx` - CBT exercise
- `src/components/shared/MoodLogger.jsx` - Daily mood check-in
- `src/pages/Track.jsx` - General pillar check-ins
- `src/components/shared/SleepJournalEntry.jsx` - Sleep notes

## Related Components
- `src/components/LanguageSwitcher.jsx` - Pair with for multilingual support
- `src/lib/analytics.js` - Track voice usage events
- `src/hooks/useTranslation.js` - i18n integration

## License
MIT - Same as parent project
