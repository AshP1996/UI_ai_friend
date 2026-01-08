# 🎤 Voice Integration Guide

Complete guide to voice interaction with the AI Friend backend.

## How Voice Works

### Flow Diagram

```
User speaks → Microphone → AudioWorklet → PCM16 Audio → WebSocket
                                                              ↓
                                                      Backend API
                                                              ↓
                    ← JSON: {"text": "recognized"} ← STT Processing
                    ← ArrayBuffer: Audio Data ← TTS Processing
                                                              ↓
                    Chat API ← Final Text → Send to Chat
                                                              ↓
                    Response Text → Request TTS → Play Audio
```

### Step-by-Step Process

1. **User clicks "Listen" button**
   - Avatar component calls `useVoiceStream()`
   - Requests microphone permission
   - Opens WebSocket to `/api/voice/stream/{user_id}`

2. **Audio Capture**
   - AudioWorklet processes microphone input
   - Converts Float32 to PCM16 format
   - Sends binary audio data via WebSocket

3. **Speech-to-Text (STT)**
   - Backend processes audio
   - Sends partial transcriptions: `{"text": "partial text"}`
   - Sends final transcription: `{"text": "final text"}` or `{"type": "final", "text": "..."}`

4. **Chat Integration**
   - When final text received, Avatar calls Chat's `handleVoiceMessage()`
   - Chat sends text to `/api/chat/send`
   - Gets AI response with emotion data

5. **Text-to-Speech (TTS)**
   - Backend generates audio from response
   - Sends binary audio data via WebSocket
   - Frontend plays audio through speakers

6. **Visual Feedback**
   - Avatar shows "listening" state while capturing
   - Shows "thinking" state while processing
   - Shows "talking" state while playing audio

## Backend API Format

### WebSocket Endpoint
```
ws://127.0.0.1:8000/api/voice/stream/{user_id}
```

### Messages Sent (Client → Server)
- **Binary**: PCM16 audio data (ArrayBuffer)
- Format: 16-bit signed integers, little-endian
- Sample Rate: 16000 Hz
- Channels: Mono

### Messages Received (Server → Client)

#### 1. Partial Transcription
```json
{"text": "Hello"}
```
or
```json
{"type": "partial", "text": "Hello"}
```

#### 2. Final Transcription
```json
{"text": "Hello, how are you?"}
```
or
```json
{"type": "final", "text": "Hello, how are you?"}
```

#### 3. Audio Response (TTS)
- **Binary**: ArrayBuffer containing audio data
- Format: Usually WAV or MP3
- Played automatically when received

## Code Structure

### Files Involved

1. **`src/api/voice.js`**
   - Main voice streaming implementation
   - Handles WebSocket connection
   - Audio processing (PCM16 conversion)
   - Speaker recognition
   - Audio playback

2. **`src/components/Avatar/Avatar.jsx`**
   - Voice UI controls
   - Emotion synchronization
   - Calls Chat when voice text received

3. **`src/components/Chat/Chat.jsx`**
   - Receives voice messages
   - Sends to chat API
   - Displays conversation

4. **`src/pages/ChatPage.jsx`**
   - Connects Avatar and Chat
   - Passes voice message handler

5. **`public/audio_worklet/voice_processor.js`**
   - AudioWorklet processor
   - Low-latency audio processing

## Key Features

### ✅ Speaker Recognition
- Locks first speaker's voice profile
- Rejects other voices based on pitch/volume
- Prevents background noise interference

### ✅ Real-time Transcription
- Shows partial text as user speaks
- Updates in real-time
- Displays in Avatar component

### ✅ Automatic Chat Integration
- Voice text automatically sent to chat
- AI response appears in chat
- Full conversation history maintained

### ✅ Audio Playback
- TTS audio played automatically
- Synchronized with avatar animations
- Visual feedback during playback

## Configuration

### Audio Settings
```javascript
const SAMPLE_RATE = 16000;        // 16kHz sample rate
const VOLUME_THRESHOLD = 0.015;   // Minimum volume to process
const PITCH_TOLERANCE = 40;       // Pitch matching tolerance
const VOLUME_TOLERANCE = 0.5;     // Volume matching tolerance
```

### WebSocket URL
```javascript
const WS_VOICE_URL = "ws://127.0.0.1:8000/api/voice/stream";
```

## Usage

### Starting Voice
```javascript
await useVoiceStream({
  userId: "user123",
  onPartial: (text) => {
    // Real-time transcription
    console.log("Partial:", text);
  },
  onFinal: (text) => {
    // Final transcription
    console.log("Final:", text);
  },
  onStatus: (status) => {
    // Status: "listening", "speaking", "idle"
    console.log("Status:", status);
  },
  onAudio: () => {
    // Called when audio playback starts
    console.log("Playing audio");
  },
  onError: (err) => {
    // Error handling
    console.error("Voice error:", err);
  }
});
```

### Stopping Voice
```javascript
stopVoiceStream();
```

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Check microphone is connected

### No Audio Playback
- Check browser audio settings
- Verify backend sends audio data
- Check AudioContext is not suspended

### Transcription Not Working
- Verify WebSocket connection
- Check backend STT service
- Ensure audio format is correct (PCM16, 16kHz)

### Chat Not Receiving Voice Messages
- Check `onVoiceMessage` ref is set
- Verify Avatar calls Chat handler
- Check console for errors

## Testing

### Manual Test
1. Click "🎤 Listen" button
2. Speak into microphone
3. Watch for partial transcription
4. Wait for final transcription
5. Verify message appears in chat
6. Wait for AI response
7. Verify audio plays

### Expected Behavior
- ✅ Microphone permission requested
- ✅ Real-time transcription appears
- ✅ Final text sent to chat
- ✅ AI response appears
- ✅ Audio plays automatically
- ✅ Avatar animations sync with states

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
