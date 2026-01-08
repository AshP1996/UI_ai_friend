# 🎤 Voice Troubleshooting Guide

## Issue: WebSocket Closes Immediately (Error 1005)

### Symptoms
- WebSocket connection opens
- Immediately closes with error 1005
- No audio data sent or received
- Backend logs show: `connection closed`

### Root Causes

1. **No Audio Data Sent**
   - Audio processing too strict (volume threshold too high)
   - Speaker recognition filtering out all audio
   - AudioWorklet not processing correctly

2. **Backend Timeout**
   - Backend expects continuous audio stream
   - Connection times out if no data received quickly

3. **Protocol Mismatch**
   - Audio format incorrect
   - WebSocket message format wrong

### Fixes Applied

#### 1. Lowered Volume Threshold
```javascript
// Changed from 0.015 to 0.01
const VOLUME_THRESHOLD = 0.01;
```

#### 2. More Lenient Audio Sending
- Send all audio above threshold before speaker is locked
- After speaker lock, still send high-volume audio even if pitch doesn't match
- Removed overly strict filtering

#### 3. Better Logging
- Added console logs for debugging
- Track audio chunks being sent
- Log WebSocket events

#### 4. Improved Error Handling
- Better error messages
- Log connection close codes
- Handle audio playback errors

### Testing Steps

1. **Open Browser Console**
   - Look for `🎤` prefixed logs
   - Check for audio chunk logs
   - Verify WebSocket connection

2. **Check Microphone**
   - Ensure microphone permission granted
   - Test microphone in other apps
   - Check browser audio settings

3. **Monitor Network**
   - Open DevTools → Network → WS
   - Check WebSocket messages
   - Verify binary data being sent

4. **Backend Logs**
   - Check if connection stays open
   - Look for audio processing logs
   - Check for errors

### Expected Console Output

When working correctly, you should see:
```
🎤 Voice WebSocket connected
🎤 AudioContext created
🎤 AudioWorklet loaded
🎤 Microphone access granted
🎤 Voice stream started, listening for audio...
🎤 Audio chunk 1, RMS: 0.0234
🎤 Sending audio chunk 1, RMS: 0.0234
🎤 Audio chunk 2, RMS: 0.0456
🎤 Sending audio chunk 2, RMS: 0.0456
🔒 Speaker locked {volume: 0.0456, pitch: 180, locked: true}
🎤 Received message: {text: "hello"}
🎤 Transcription (no type): hello
```

### Common Issues

#### Issue: No Audio Chunks Logged
**Solution**: Check AudioWorklet is loading correctly
- Verify `/audio_worklet/voice_processor.js` is accessible
- Check browser console for AudioWorklet errors
- Ensure browser supports AudioWorklet API

#### Issue: Audio Chunks Logged But Not Sent
**Solution**: Check volume threshold
- RMS values might be below threshold
- Try speaking louder
- Lower VOLUME_THRESHOLD further if needed

#### Issue: Connection Closes After Opening
**Solution**: Backend might be timing out
- Ensure audio starts sending immediately
- Check backend timeout settings
- Verify backend is processing audio correctly

#### Issue: No Transcription Received
**Solution**: Check backend STT service
- Verify backend STT model is loaded
- Check backend logs for STT errors
- Ensure audio format matches backend expectations

### Debugging Commands

Add to browser console:
```javascript
// Check WebSocket state
console.log("Socket state:", socket?.readyState);

// Check audio context
console.log("AudioContext state:", audioContext?.state);

// Check microphone stream
console.log("Mic stream active:", micStream?.active);

// Force send test audio
const testAudio = new Float32Array(1600).fill(0.1);
socket.send(floatToPCM16(testAudio));
```

### Backend Compatibility

The implementation now handles:
- ✅ Binary PCM16 audio (16kHz, mono)
- ✅ JSON messages: `{"text": "..."}`
- ✅ JSON messages: `{"type": "partial/final", "text": "..."}`
- ✅ Binary audio responses (TTS)
- ✅ Connection keep-alive

### Next Steps if Still Not Working

1. **Check Backend Implementation**
   - Verify backend expects PCM16 format
   - Check sample rate matches (16000 Hz)
   - Ensure backend doesn't require initial handshake

2. **Test with Simple Audio**
   - Send continuous test tone
   - Verify backend receives it
   - Check if backend processes it

3. **Check Network**
   - Firewall blocking WebSocket?
   - Proxy interfering?
   - CORS issues?

4. **Backend Logs**
   - Check what backend expects
   - Verify audio format
   - Check for backend errors

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
