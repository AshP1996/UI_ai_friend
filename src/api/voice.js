import { getCurrentUser } from "./auth";

const WS_VOICE_URL = "ws://127.0.0.1:8000/api/voice/stream";
const SAMPLE_RATE = 16000;

// Advanced Voice Processing Configuration
const INITIAL_VOLUME_THRESHOLD = 0.005; // Starting threshold (will adapt)
const SILENCE_TIMEOUT = 900;
const SPEECH_RESUME_THRESHOLD = 0.008;
const CONTINUOUS_SPEECH_THRESHOLD = 0.003;

const PITCH_TOLERANCE = 50;
const VOLUME_TOLERANCE = 0.6;
const RECENT_SPEECH_WINDOW = 2000;

// Advanced Features
const NOISE_FLOOR_SAMPLES = 50; // Samples to estimate noise floor
const ADAPTIVE_LEARNING_RATE = 0.1; // How fast to adapt thresholds
const MIN_THRESHOLD = 0.002; // Minimum threshold (very sensitive)
const MAX_THRESHOLD = 0.02; // Maximum threshold (less sensitive)
const VOICE_QUALITY_WINDOW = 100; // Chunks to analyze for quality metrics
const CHUNK_BUFFER_SIZE = 3; // Buffer chunks for better streaming
const NETWORK_RETRY_DELAY = 1000; // Retry delay for network issues

let socket = null;
let audioContext = null; // For microphone input
let ttsAudioContext = null; // Separate context for TTS playback
let micStream = null;
let sourceNode = null;
let workletNode = null;

let assistantState = "idle";
let lastVoiceTime = 0;
let lastPartialText = "";
let partialTextTimeout = null;
let onFinalCallback = null; // Store callback for silence detection
let finalMessageSent = false; // Prevent duplicate final messages
let lastAudioSentTime = 0; // Track when we last sent audio for smart sending
let consecutiveSilentChunks = 0; // Track consecutive silent chunks
let speechActive = false; // Track if we're currently in active speech

// Advanced Voice Processing State
let adaptiveThreshold = INITIAL_VOLUME_THRESHOLD; // Dynamic threshold
let noiseFloor = 0.001; // Estimated background noise level
let noiseFloorSamples = []; // Samples for noise estimation
let voiceQualityMetrics = {
  snr: 0, // Signal-to-Noise Ratio
  clarity: 0, // Voice clarity score
  stability: 0, // Volume stability
  chunksSent: 0,
  chunksProcessed: 0
};
let audioChunkBuffer = []; // Buffer for optimized streaming
let networkHealth = {
  lastPing: 0,
  latency: 0,
  packetLoss: 0,
  retryCount: 0
};
let voiceActivityStats = {
  totalSpeakingTime: 0,
  averageSpeechLength: 0,
  pauseCount: 0,
  speechSegments: []
};

// 🔐 Speaker profile
let speakerProfile = {
  volume: null,
  pitch: null,
  locked: false
};

/* ===============================
   START SMART VOICE ASSISTANT
================================ */
export async function useVoiceStream({
  userId: explicitUserId,
  onPartial,
  onFinal,
  onStatus,
  onAudio,
  onError
}) {
  const user = await getCurrentUser?.();
  const userId = explicitUserId || user?.id || "guest";
  
  // Store callback for silence detection
  onFinalCallback = onFinal;
  
  // Reset state
  lastPartialText = "";
  finalMessageSent = false; // Reset flag
  lastAudioSentTime = 0; // Reset audio tracking
  consecutiveSilentChunks = 0; // Reset silence counter
  speechActive = false; // Reset speech state
  if (partialTextTimeout) {
    clearTimeout(partialTextTimeout);
    partialTextTimeout = null;
  }

  socket = new WebSocket(`${WS_VOICE_URL}/${userId}`);
  socket.binaryType = "arraybuffer";

  socket.onopen = async () => {
    console.log("🎤 Voice WebSocket connected");
    networkHealth.lastPing = Date.now();
    networkHealth.retryCount = 0;
    try {
      // Note: Some backends might expect an initial message, but let's not send JSON
      // as it might confuse the binary audio stream. We'll start sending audio immediately.

      audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      console.log("🎤 AudioContext created");

      // ✅ Load AudioWorklet
      await audioContext.audioWorklet.addModule(
        "/audio_worklet/voice_processor.js"
      );
      console.log("🎤 AudioWorklet loaded");

      micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log("🎤 Microphone access granted");

      sourceNode = audioContext.createMediaStreamSource(micStream);

      workletNode = new AudioWorkletNode(audioContext, "voice-processor");

      let audioChunkCount = 0;
      workletNode.port.onmessage = (event) => {
        if (
          assistantState !== "listening" ||
          socket.readyState !== WebSocket.OPEN
        ) return;

        let input = event.data;
        audioChunkCount++;
        const now = Date.now();
        const timeSinceLastAudio = now - lastAudioSentTime;
        const inRecentSpeechWindow = timeSinceLastAudio < RECENT_SPEECH_WINDOW;
        
        // Advanced Audio Processing Pipeline
        // Step 1: High-pass filter to remove low-frequency noise
        input = highPassFilter(input, 80);
        
        // Step 2: Calculate RMS after filtering
        const rms = calculateRMS(input);
        
        // Step 3: Update noise floor estimation
        const isSilent = rms < adaptiveThreshold;
        updateNoiseFloor(rms, isSilent);
        
        // Step 4: Adapt threshold based on environment
        adaptThreshold(rms, !isSilent);
        
        // Step 5: Apply noise gate
        input = noiseGate(input, adaptiveThreshold);
        
        // Step 6: Detect pitch for speaker recognition
        const pitch = detectPitch(input, SAMPLE_RATE);
        
        // Step 7: Smart speech detection with adaptive threshold
        const isSpeech = rms > adaptiveThreshold;
        const isStrongSpeech = rms > (adaptiveThreshold * 1.6);
        const isContinuousSpeech = rms > (adaptiveThreshold * 0.8);
        
        // Log first few chunks with advanced metrics
        if (audioChunkCount <= 5) {
          const snr = calculateSNR(rms);
          console.log(`🎤 Chunk ${audioChunkCount} | RMS: ${rms.toFixed(4)} | Threshold: ${adaptiveThreshold.toFixed(4)} | Noise: ${noiseFloor.toFixed(4)} | SNR: ${snr.toFixed(1)}dB`);
        }
        
        // Update voice activity statistics
        updateVoiceActivityStats(isSpeech, rms);
        
        // Update voice quality metrics
        updateVoiceQualityMetrics(rms, pitch, isSpeech);
        
        if (isSpeech) {
          consecutiveSilentChunks = 0;
          speechActive = true;
        } else {
          consecutiveSilentChunks++;
          // Consider speech inactive after 5 consecutive silent chunks
          if (consecutiveSilentChunks > 5) {
            speechActive = false;
          }
        }
        
        // 🔒 Lock first speaker when they start speaking (with sufficient volume)
        if (!speakerProfile.locked && isStrongSpeech) {
          if (pitch) {
            speakerProfile = {
              volume: rms,
              pitch,
              locked: true
            };
            console.log("🔒 Speaker locked", speakerProfile, `SNR: ${calculateSNR(rms).toFixed(1)}dB`);
          }
        }

        // Advanced Smart Audio Sending Logic
        let shouldSend = false;
        const snr = calculateSNR(rms);
        
        // Strategy 1: Always send strong speech immediately (high SNR)
        if (isStrongSpeech && snr > 10) {
          shouldSend = true;
        }
        // Strategy 2: Send continuous speech if we're in active speech mode
        else if (speechActive && isContinuousSpeech && inRecentSpeechWindow) {
          shouldSend = true;
        }
        // Strategy 3: Send any speech if we recently sent audio (within 2 seconds)
        // This handles pauses and resumption quickly
        else if (isSpeech && inRecentSpeechWindow) {
          shouldSend = true;
        }
        // Strategy 4: Send if above adaptive threshold and speaker not locked yet
        else if (isSpeech && !speakerProfile.locked) {
          shouldSend = true;
        }
        // Strategy 5: After speaker locked, use advanced matching
        else if (speakerProfile.locked && isSpeech) {
          // More lenient matching with quality check
          if (pitch && (matchesSpeaker(rms, pitch) || rms > adaptiveThreshold * 1.5)) {
            // Also check SNR for quality
            if (snr > 5) { // Minimum 5dB SNR
              shouldSend = true;
            }
          }
        }
        
        if (shouldSend) {
          lastVoiceTime = now;
          
          // Use optimized buffering for better streaming
          bufferAndSendChunk(input, socket);
          
          // Log advanced metrics (first 10 chunks)
          if (audioChunkCount <= 10) {
            console.log(`🎤 ✓ Sending chunk ${audioChunkCount} | RMS: ${rms.toFixed(4)} | SNR: ${snr.toFixed(1)}dB | Clarity: ${(calculateClarity(rms, pitch) * 100).toFixed(1)}%`);
          }
        }
        
        // Periodic quality report (every 100 chunks)
        if (audioChunkCount % 100 === 0) {
          console.log("📊 Voice Quality:", {
            SNR: `${voiceQualityMetrics.snr.toFixed(1)}dB`,
            Clarity: `${(voiceQualityMetrics.clarity * 100).toFixed(1)}%`,
            Threshold: adaptiveThreshold.toFixed(4),
            NoiseFloor: noiseFloor.toFixed(4),
            ChunksSent: voiceQualityMetrics.chunksSent,
            ChunksProcessed: voiceQualityMetrics.chunksProcessed
          });
        }
        
        // Note: Silence detection for partial->final conversion is handled in onmessage
        // when we receive partial transcriptions. This ensures we convert to final
        // when user stops speaking (no new partials received).
      };

      sourceNode.connect(workletNode);
      workletNode.connect(audioContext.destination);

      assistantState = "listening";
      onStatus?.("listening");
      console.log("🎤 Voice stream started, listening for audio...");

    } catch (err) {
      console.error("🎤 Voice setup error:", err);
      onError?.(err);
      cleanup();
    }
  };

  socket.onmessage = async (event) => {
    // Handle binary audio data (TTS response)
    if (event.data instanceof ArrayBuffer) {
      console.log("🎤 Received audio data:", event.data.byteLength, "bytes");
      assistantState = "speaking";
      onStatus?.("speaking");
      
      // Check if we have TTS callbacks stored (from textToSpeech function)
      const ttsCallbacks = window._ttsCallbacks;
      if (ttsCallbacks) {
        // Clear timeout since we got audio
        if (ttsCallbacks.timeout) {
          clearTimeout(ttsCallbacks.timeout);
        }
        ttsCallbacks.onStatus?.("speaking");
      } else {
        onStatus?.("speaking");
      }
      
      try {
        // Call onAudio when playback starts (for sync)
        const audioStartCallback = ttsCallbacks?.onAudio || onAudio;
        await playAudio(event.data, audioStartCallback);
        
        // Update status after playback
        if (ttsCallbacks) {
          ttsCallbacks.onStatus?.("idle");
          delete window._ttsCallbacks; // Clear after use
        } else {
          onStatus?.("idle");
        }
      } catch (err) {
        console.error("🎤 Audio playback error:", err);
        if (ttsCallbacks) {
          ttsCallbacks.onStatus?.("idle");
          delete window._ttsCallbacks;
        }
      }
      
      assistantState = "listening";
      onStatus?.("listening");
      return;
    }

    // Handle JSON messages (transcription and responses)
    try {
      const text = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
      const msg = JSON.parse(text);
      
      console.log("🎤 Received message:", msg);
      
      // Check if this is a TTS-related message
      if (msg.type === "tts_response" || msg.type === "tts_audio" || msg.type === "audio") {
        console.log("🎤 TTS response received via WebSocket:", msg);
        // Handle TTS response - might contain audio_url or audio data
        if (msg.audio_url) {
          // Will be handled below
        } else if (msg.audio_data || msg.audio_bytes) {
          // Base64 encoded audio data
          console.log("🎤 TTS audio data received (base64)");
          try {
            const audioData = msg.audio_data || msg.audio_bytes;
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBuffer = bytes.buffer;
            
            const ttsCallbacks = window._ttsCallbacks;
            if (ttsCallbacks) {
              if (ttsCallbacks.timeout) {
                clearTimeout(ttsCallbacks.timeout);
              }
              ttsCallbacks.onStatus?.("speaking");
            }
            
            const audioStartCallback = ttsCallbacks?.onAudio || onAudio;
            await playAudio(audioBuffer, audioStartCallback);
            
            if (ttsCallbacks) {
              ttsCallbacks.onStatus?.("idle");
              delete window._ttsCallbacks;
            }
            return;
          } catch (err) {
            console.error("🎤 Failed to decode base64 audio:", err);
          }
        }
      }
      
      // Check for TTS status messages
      if (msg.type === "tts_processing" || msg.status === "tts_processing") {
        console.log("🎤 TTS is processing, waiting for audio...");
        const ttsCallbacks = window._ttsCallbacks;
        if (ttsCallbacks) {
          ttsCallbacks.onStatus?.("speaking");
        }
        return;
      }
      
      // Check for TTS error messages
      if (msg.type === "tts_error" || msg.error) {
        console.warn("🎤 TTS error from backend:", msg.error || msg.message);
        const ttsCallbacks = window._ttsCallbacks;
        if (ttsCallbacks) {
          // Trigger fallback to API
          const callbacks = ttsCallbacks;
          delete window._ttsCallbacks;
          if (callbacks.timeout) {
            clearTimeout(callbacks.timeout);
          }
          // Don't trigger API fallback here - let timeout handle it
        }
        return;
      }
      
      // Backend may send: {"text": "..."} or {"type": "partial/final", "text": "..."}
      if (msg.text) {
        if (msg.type === "partial") {
          // Partial transcription (real-time)
          console.log("🎤 Partial transcription:", msg.text);
          lastPartialText = msg.text; // Store latest partial
          onPartial?.(msg.text);
          
          // Clear existing timeout
          if (partialTextTimeout) {
            clearTimeout(partialTextTimeout);
          }
          
          // If backend doesn't send final, treat latest partial as final after silence
          // Wait 2.5 seconds of silence (no new partials) before treating as final
          partialTextTimeout = setTimeout(() => {
            if (lastPartialText && lastPartialText.trim() && onFinalCallback && !finalMessageSent) {
              finalMessageSent = true; // Mark as sent to prevent duplicates
              const textToSend = lastPartialText;
              lastPartialText = ""; // Clear before calling
              console.log("🎤 No final received, using latest partial as final:", textToSend);
              onFinalCallback(textToSend);
            }
            partialTextTimeout = null; // Clear timeout reference
          }, 2500); // 2.5 seconds of silence
          
        } else if (msg.type === "final") {
          // Final transcription
          console.log("🎤 Final transcription:", msg.text);
          if (partialTextTimeout) {
            clearTimeout(partialTextTimeout);
            partialTextTimeout = null;
          }
          lastPartialText = ""; // Clear stored partial
          finalMessageSent = true; // Mark as sent
          onFinal?.(msg.text);
        } else {
          // Backend sends just {"text": "..."} - treat as final
          console.log("🎤 Transcription (no type):", msg.text);
          if (partialTextTimeout) {
            clearTimeout(partialTextTimeout);
            partialTextTimeout = null;
          }
          lastPartialText = ""; // Clear stored partial
          finalMessageSent = true; // Mark as sent
          onFinal?.(msg.text);
        }
      }
      
      // Handle response text (AI response)
      if (msg.response) {
        console.log("🎤 AI Response received via voice WebSocket:", msg.response);
        // This is the AI response text - we should trigger TTS for it
        // But we'll let Chat component handle TTS to avoid duplicate calls
        // Just log it for now
      }
      
      // Check if backend sends TTS audio automatically
      if (msg.audio_url) {
        console.log("🎤 TTS audio URL received:", msg.audio_url);
        // Fetch and play audio from URL (handle relative URLs)
        try {
          const audioUrl = msg.audio_url.startsWith('http') 
            ? msg.audio_url 
            : `http://127.0.0.1:8000${msg.audio_url}`;
          
          console.log("🎤 Fetching TTS audio from:", audioUrl);
          const audioResponse = await fetch(audioUrl);
          
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
          }
          
          const audioBlob = await audioResponse.blob();
          const audioBuffer = await audioBlob.arrayBuffer();
          
          if (!audioContext || audioContext.state === 'closed') {
            audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
          }
          
          const ttsCallbacks = window._ttsCallbacks;
          if (ttsCallbacks) {
            ttsCallbacks.onStatus?.("speaking");
          }
          
          // Validate audio buffer
          if (!audioBuffer || audioBuffer.byteLength === 0) {
            throw new Error("Received empty audio buffer from WebSocket URL");
          }
          
          // Call onAudio when playback starts (for sync)
          const audioStartCallback = ttsCallbacks?.onAudio;
          try {
            await playAudio(audioBuffer, audioStartCallback);
          } catch (playError) {
            console.error("🎤 Failed to play audio from WebSocket URL:", playError.message);
            throw playError;
          }
          
          // Update status after playback
          if (ttsCallbacks) {
            ttsCallbacks.onStatus?.("idle");
            delete window._ttsCallbacks;
          }
        } catch (err) {
          console.error("🎤 Failed to play audio from URL:", err);
        }
      }
    } catch (err) {
      console.error("🎤 Failed to parse voice message:", err, "Data:", event.data);
    }
  };

  socket.onerror = (e) => {
    console.error("🎤 WebSocket error:", e);
    onError?.(e);
  };
  
  socket.onclose = (event) => {
    console.log("🎤 WebSocket closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Update network health
    if (event.code !== 1000) { // Not a normal closure
      networkHealth.packetLoss++;
    }
    
    // Log final voice quality report
    if (voiceQualityMetrics.chunksProcessed > 0) {
      console.log("📊 Final Voice Quality Report:", getVoiceQualityReport());
    }
    
    cleanup();
  };
}

/* ===============================
   SPEAKER MATCHING
================================ */
function matchesSpeaker(volume, pitch) {
  return (
    Math.abs(volume - speakerProfile.volume) <=
      speakerProfile.volume * VOLUME_TOLERANCE &&
    Math.abs(pitch - speakerProfile.pitch) <= PITCH_TOLERANCE
  );
}

/* ===============================
   ADVANCED AUDIO PROCESSING
================================ */

/**
 * Calculate RMS (Root Mean Square) for volume detection
 */
function calculateRMS(input) {
  let sum = 0;
  for (let i = 0; i < input.length; i++) sum += input[i] ** 2;
  return Math.sqrt(sum / input.length);
}

/**
 * Estimate noise floor from silent samples
 */
function updateNoiseFloor(rms, isSilent) {
  if (isSilent) {
    noiseFloorSamples.push(rms);
    if (noiseFloorSamples.length > NOISE_FLOOR_SAMPLES) {
      noiseFloorSamples.shift();
    }
    
    // Calculate median noise floor (more robust than mean)
    if (noiseFloorSamples.length >= 10) {
      const sorted = [...noiseFloorSamples].sort((a, b) => a - b);
      noiseFloor = sorted[Math.floor(sorted.length / 2)];
    }
  }
}

/**
 * Adaptive threshold adjustment based on noise floor and speech patterns
 */
function adaptThreshold(rms, isSpeech) {
  if (noiseFloor > 0) {
    // Set threshold to 2-3x noise floor for better detection
    const targetThreshold = noiseFloor * 2.5;
    
    // Smooth adaptation
    adaptiveThreshold = adaptiveThreshold * (1 - ADAPTIVE_LEARNING_RATE) + 
                       targetThreshold * ADAPTIVE_LEARNING_RATE;
    
    // Clamp to min/max bounds
    adaptiveThreshold = Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, adaptiveThreshold));
  }
  
  // Adjust based on speech activity
  if (isSpeech && rms > adaptiveThreshold * 2) {
    // If speech is consistently loud, slightly increase threshold to filter noise
    adaptiveThreshold = Math.min(adaptiveThreshold * 1.05, MAX_THRESHOLD);
  } else if (!isSpeech && rms < adaptiveThreshold) {
    // If consistently quiet, lower threshold slightly
    adaptiveThreshold = Math.max(adaptiveThreshold * 0.98, MIN_THRESHOLD);
  }
}

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 */
function calculateSNR(signalRMS) {
  if (noiseFloor <= 0) return 0;
  const snr = 20 * Math.log10(signalRMS / noiseFloor);
  return Math.max(0, snr); // Ensure non-negative
}

/**
 * Calculate voice clarity score (0-1)
 */
function calculateClarity(rms, pitch) {
  const snr = calculateSNR(rms);
  const snrScore = Math.min(snr / 30, 1); // Normalize to 0-1 (30dB is excellent)
  
  const pitchScore = pitch ? Math.min(pitch / 500, 1) : 0.5; // Normalize pitch
  
  return (snrScore * 0.7 + pitchScore * 0.3); // Weighted combination
}

/**
 * High-pass filter to remove low-frequency noise
 */
function highPassFilter(input, cutoffFreq = 80) {
  // Simple first-order high-pass filter
  const rc = 1 / (2 * Math.PI * cutoffFreq);
  const dt = 1 / SAMPLE_RATE;
  const alpha = rc / (rc + dt);
  
  let filtered = new Float32Array(input.length);
  let prevInput = 0;
  let prevOutput = 0;
  
  for (let i = 0; i < input.length; i++) {
    filtered[i] = alpha * (prevOutput + input[i] - prevInput);
    prevInput = input[i];
    prevOutput = filtered[i];
  }
  
  return filtered;
}

/**
 * Noise gate - only pass audio above threshold
 */
function noiseGate(input, threshold) {
  const rms = calculateRMS(input);
  if (rms < threshold) {
    // Apply fade-out to prevent clicks
    return input.map(sample => sample * 0.1);
  }
  return input;
}

/**
 * Update voice quality metrics
 */
function updateVoiceQualityMetrics(rms, pitch, isSpeech) {
  voiceQualityMetrics.chunksProcessed++;
  
  if (isSpeech) {
    voiceQualityMetrics.chunksSent++;
    const snr = calculateSNR(rms);
    const clarity = calculateClarity(rms, pitch);
    
    // Exponential moving average for smooth metrics
    voiceQualityMetrics.snr = voiceQualityMetrics.snr * 0.9 + snr * 0.1;
    voiceQualityMetrics.clarity = voiceQualityMetrics.clarity * 0.9 + clarity * 0.1;
  }
  
  // Calculate stability (variance in RMS)
  if (voiceQualityMetrics.chunksProcessed % 20 === 0) {
    // Update stability every 20 chunks
    voiceQualityMetrics.stability = 1 - Math.min(voiceQualityMetrics.snr / 20, 1);
  }
}

/**
 * Optimized chunk buffering for better streaming
 */
function bufferAndSendChunk(audioData, socket) {
  audioChunkBuffer.push(audioData);
  
  // Send immediately if buffer is full or if it's been a while
  if (audioChunkBuffer.length >= CHUNK_BUFFER_SIZE || 
      Date.now() - lastAudioSentTime > 100) {
    // Send all buffered chunks
    audioChunkBuffer.forEach(chunk => {
      try {
        socket.send(floatToPCM16(chunk));
      } catch (e) {
        console.error("🎤 Error sending buffered chunk:", e);
        networkHealth.retryCount++;
      }
    });
    audioChunkBuffer = [];
    lastAudioSentTime = Date.now();
  }
}

/**
 * Track voice activity statistics
 */
function updateVoiceActivityStats(isSpeech, rms) {
  const now = Date.now();
  
  if (isSpeech) {
    if (!voiceActivityStats.speechSegments.length || 
        now - voiceActivityStats.speechSegments[voiceActivityStats.speechSegments.length - 1].end > 500) {
      // New speech segment
      voiceActivityStats.speechSegments.push({
        start: now,
        end: now,
        maxRMS: rms
      });
    } else {
      // Continue current segment
      const current = voiceActivityStats.speechSegments[voiceActivityStats.speechSegments.length - 1];
      current.end = now;
      current.maxRMS = Math.max(current.maxRMS, rms);
    }
  } else {
    // Update pause count
    if (voiceActivityStats.speechSegments.length > 0) {
      const lastSegment = voiceActivityStats.speechSegments[voiceActivityStats.speechSegments.length - 1];
      if (now - lastSegment.end > 500) {
        voiceActivityStats.pauseCount++;
      }
    }
  }
  
  // Calculate average speech length
  if (voiceActivityStats.speechSegments.length > 0) {
    const totalLength = voiceActivityStats.speechSegments.reduce((sum, seg) => 
      sum + (seg.end - seg.start), 0);
    voiceActivityStats.averageSpeechLength = totalLength / voiceActivityStats.speechSegments.length;
  }
}

/**
 * Get current voice quality report
 */
export function getVoiceQualityReport() {
  return {
    ...voiceQualityMetrics,
    adaptiveThreshold: adaptiveThreshold.toFixed(4),
    noiseFloor: noiseFloor.toFixed(4),
    snr: voiceQualityMetrics.snr.toFixed(2) + " dB",
    clarity: (voiceQualityMetrics.clarity * 100).toFixed(1) + "%",
    networkHealth,
    voiceActivity: voiceActivityStats
  };
}

/* ===============================
   BASIC AUDIO UTILS
================================ */

function detectPitch(buffer, sampleRate) {
  let SIZE = buffer.length;
  let autocorr = new Array(SIZE).fill(0);

  for (let lag = 0; lag < SIZE; lag++) {
    for (let i = 0; i < SIZE - lag; i++) {
      autocorr[lag] += buffer[i] * buffer[i + lag];
    }
  }

  let peak = autocorr.indexOf(Math.max(...autocorr.slice(20)));
  return peak ? sampleRate / peak : null;
}

function floatToPCM16(float32) {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Validate audio buffer format
 */
function validateAudioBuffer(buffer) {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("Empty audio buffer");
  }
  
  // Very small buffers are likely invalid
  if (buffer.byteLength < 10) {
    throw new Error(`Audio buffer too small: ${buffer.byteLength} bytes (likely invalid)`);
  }
  
  // Check for WAV header (RIFF...WAVE) if buffer is large enough
  if (buffer.byteLength >= 12) {
    try {
      const view = new DataView(buffer);
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      
      if (riff === "RIFF" && wave === "WAVE") {
        return "wav";
      }
      
      // Check for MP3 (ID3 tag or frame sync)
      if (riff === "ID3" || (view.getUint8(0) === 0xFF && (view.getUint8(1) & 0xE0) === 0xE0)) {
        return "mp3";
      }
      
      // Check for OGG (OggS)
      if (riff === "OggS") {
        return "ogg";
      }
    } catch (e) {
      // If we can't read the header, assume it's valid and let decodeAudioData handle it
      console.warn("🎤 Could not read audio header:", e);
    }
  }
  
  // Unknown format - let decodeAudioData try to decode it
  return "unknown";
}

/**
 * Convert PCM audio to AudioBuffer (if needed)
 */
function convertPCMToAudioBuffer(pcmData, sampleRate = 16000, channels = 1) {
  // Use existing TTS audio context if available, otherwise create new one
  const audioCtx = ttsAudioContext && ttsAudioContext.state !== 'closed' 
    ? ttsAudioContext 
    : new AudioContext({ sampleRate });
  
  const length = pcmData.byteLength / 2; // PCM16 is 2 bytes per sample
  if (length === 0) {
    throw new Error("PCM data is empty");
  }
  
  const audioBuffer = audioCtx.createBuffer(channels, length, sampleRate);
  
  const view = new DataView(pcmData);
  for (let channel = 0; channel < channels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const sample = view.getInt16(i * 2, true) / 32768.0; // Convert to float32 (-1 to 1)
      channelData[i] = sample;
    }
  }
  
  return audioBuffer;
}

async function playAudio(buffer, onAudioStart) {
  try {
    // Use separate audio context for TTS playback to avoid conflicts with microphone
    if (!ttsAudioContext || ttsAudioContext.state === 'closed') {
      console.log("🎤 Creating TTS audio context");
      ttsAudioContext = new AudioContext({ sampleRate: 44100 }); // Use standard sample rate for playback
    }
    
    // Resume audio context if suspended (required after user interaction)
    if (ttsAudioContext.state === 'suspended') {
      console.log("🎤 Resuming suspended TTS audio context...");
      await ttsAudioContext.resume();
    }
    
    console.log("🎤 Decoding audio data, buffer size:", buffer.byteLength, "bytes");
    
    // Validate audio buffer (non-blocking - just for logging)
    let audioFormat = "unknown";
    try {
      audioFormat = validateAudioBuffer(buffer);
      console.log("🎤 Detected audio format:", audioFormat, "| Size:", buffer.byteLength, "bytes");
    } catch (validationError) {
      console.warn("🎤 Audio validation warning:", validationError.message);
      // Continue anyway - decodeAudioData might still work
    }
    
    // Try to decode audio data with multiple retry strategies
    let decoded;
    let decodeAttempts = 0;
    const maxAttempts = 3;
    
    while (decodeAttempts < maxAttempts) {
      try {
        if (decodeAttempts === 0) {
          // First attempt: standard decodeAudioData with original buffer
          decoded = await ttsAudioContext.decodeAudioData(buffer.slice(0));
          console.log("🎤 Audio decoded successfully:", decoded.duration, "seconds,", decoded.sampleRate, "Hz");
          break; // Success!
        } else if (decodeAttempts === 1) {
          // Second attempt: Try with a fresh copy
          console.log("🎤 Retry attempt 1: Trying with buffer copy...");
          const bufferCopy = new ArrayBuffer(buffer.byteLength);
          new Uint8Array(bufferCopy).set(new Uint8Array(buffer));
          decoded = await ttsAudioContext.decodeAudioData(bufferCopy);
          console.log("🎤 Audio decoded on retry:", decoded.duration, "seconds");
          break; // Success!
        } else if (decodeAttempts === 2) {
          // Third attempt: Try PCM conversion if format is unknown and buffer is reasonable size
          if (buffer.byteLength > 100 && audioFormat === "unknown") {
            console.log("🎤 Retry attempt 2: Attempting PCM conversion...");
            decoded = convertPCMToAudioBuffer(buffer, 16000, 1);
            console.log("🎤 PCM converted successfully:", decoded.duration, "seconds");
            break; // Success!
          } else {
            throw new Error("PCM conversion not applicable");
          }
        }
      } catch (decodeError) {
        decodeAttempts++;
        if (decodeAttempts >= maxAttempts) {
          // All attempts failed
          console.error("🎤 All decode attempts failed. Last error:", decodeError.name, decodeError.message);
          throw new Error(`Unable to decode audio after ${maxAttempts} attempts: ${decodeError.message}. Buffer: ${buffer.byteLength} bytes, Format: ${audioFormat}`);
        }
        console.warn(`🎤 Decode attempt ${decodeAttempts} failed:`, decodeError.name, decodeError.message);
        // Continue to next attempt
      }
    }
    
    const source = ttsAudioContext.createBufferSource();
    source.buffer = decoded;
    
    // Create gain node for volume control and smooth transitions
    const gainNode = ttsAudioContext.createGain();
    gainNode.gain.value = 1.0;
    
    source.connect(gainNode);
    gainNode.connect(ttsAudioContext.destination);
    
    // Minimal pause for lower latency (reduced from 200ms to 30ms)
    await new Promise(resolve => setTimeout(resolve, 30));
    
    console.log("🎤 Starting audio playback...");
    source.start(0);
    
    // Call onAudio callback immediately when playback starts (for sync with text/avatar)
    onAudioStart?.();
    
    // Add a small pause after speaking (natural human pause)
    return new Promise(res => {
      source.onended = () => {
        console.log("🎤 Audio playback finished");
        setTimeout(() => {
          res();
        }, 100); // Reduced pause after speech for better responsiveness
      };
      
      // Fallback timeout in case onended doesn't fire
      setTimeout(() => {
        if (source.playbackState !== source.FINISHED_STATE) {
          console.warn("🎤 Audio playback timeout, forcing end");
          res();
        }
      }, (decoded.duration * 1000) + 500); // Audio duration + 500ms buffer (reduced from 1s)
    });
  } catch (err) {
    console.error("🎤 Audio playback error:", err);
    throw err;
  }
}

function cleanup() {
  // Clear any pending timeouts
  if (partialTextTimeout) {
    clearTimeout(partialTextTimeout);
    partialTextTimeout = null;
  }
  
  // If we have a stored partial text, send it as final before cleaning up
  if (lastPartialText && lastPartialText.trim()) {
    console.log("🎤 Connection closing, sending final partial:", lastPartialText);
    // Note: We can't call onFinal here as callbacks might not be available
    // The timeout handler will handle it if connection is still open
  }
  
  workletNode?.disconnect();
  sourceNode?.disconnect();
  micStream?.getTracks()?.forEach(t => t.stop());
  audioContext?.close();

  speakerProfile = { volume: null, pitch: null, locked: false };
  assistantState = "idle";
  lastPartialText = "";
  finalMessageSent = false; // Reset flag
  lastAudioSentTime = 0; // Reset audio tracking
  consecutiveSilentChunks = 0; // Reset silence counter
  speechActive = false; // Reset speech state
  
  // Reset advanced features
  adaptiveThreshold = INITIAL_VOLUME_THRESHOLD;
  noiseFloor = 0.001;
  noiseFloorSamples = [];
  audioChunkBuffer = [];
  voiceQualityMetrics = {
    snr: 0,
    clarity: 0,
    stability: 0,
    chunksSent: 0,
    chunksProcessed: 0
  };
  voiceActivityStats = {
    totalSpeakingTime: 0,
    averageSpeechLength: 0,
    pauseCount: 0,
    speechSegments: []
  };
}

export function stopVoiceStream() {
  if (socket) {
    socket.close();
    socket = null;
  }
  cleanup();
}

/* ===============================
   TEXT-TO-SPEECH (TTS)
================================ */
/**
 * Request TTS audio for text and play it
 * @param {string} text - Text to convert to speech
 * @param {Function} onStatus - Optional callback for status updates
 * @param {Function} onAudio - Optional callback when audio starts playing
 * @param {string} emotion - Optional emotion for TTS (default: "happy")
 */
export async function textToSpeech(text, onStatus, onAudio, emotion = "happy") {
  if (!text || !text.trim()) {
    console.warn("🎤 TTS: Empty text provided");
    return;
  }

  try {
    // Check if voice WebSocket is open - if so, send text through it for TTS
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("🎤 Sending text to voice WebSocket for TTS:", text);
      onStatus?.("speaking");
      
      // Store callbacks BEFORE sending request
      if (!window._ttsCallbacks) {
        window._ttsCallbacks = { onStatus, onAudio };
      } else {
        window._ttsCallbacks.onStatus = onStatus;
        window._ttsCallbacks.onAudio = onAudio;
      }
      
      // Try different message formats the backend might expect
      // Format 1: tts_request with emotion (most common)
      const ttsRequest1 = {
        type: "tts_request", 
        text: text.trim(),
        emotion: emotion || "neutral"
      };
      console.log("🎤 Sending TTS request (format 1):", ttsRequest1);
      socket.send(JSON.stringify(ttsRequest1));
      
      // Format 2: Alternative format (some backends use different structure)
      setTimeout(() => {
        if (window._ttsCallbacks) {
          console.log("🎤 Trying alternative TTS format via WebSocket");
          const ttsRequest2 = {
            action: "tts",
            message: text.trim(),
            emotion: emotion || "neutral"
          };
          socket.send(JSON.stringify(ttsRequest2));
        }
      }, 500); // Try after 500ms
      
      // Format 3: Simple text message (some backends auto-detect TTS requests)
      setTimeout(() => {
        if (window._ttsCallbacks) {
          console.log("🎤 Trying simple text format via WebSocket");
          const ttsRequest3 = {
            type: "tts",
            text: text.trim()
          };
          socket.send(JSON.stringify(ttsRequest3));
        }
      }, 1000);
      
      console.log("🎤 Sent TTS request via WebSocket, waiting for audio...");
      
      // Set a timeout in case backend doesn't respond
      const ttsTimeout = setTimeout(() => {
        if (window._ttsCallbacks) {
          console.warn("🎤 TTS: No audio received from WebSocket after 3s, trying API fallback");
          console.warn("🎤 WebSocket TTS failed - backend may not support WebSocket TTS or expects different format");
          const callbacks = window._ttsCallbacks;
          delete window._ttsCallbacks;
          // Fallback to API (will try multiple strategies)
          textToSpeechAPI(text, callbacks.onStatus, callbacks.onAudio, emotion).catch(err => {
            console.error("🎤 TTS API fallback also failed:", err);
            // Still call onStatus to reset state
            callbacks.onStatus?.("idle");
          });
        }
      }, 3000); // 3 seconds to allow for multiple format attempts
      
      // Store timeout to clear if audio arrives
      if (window._ttsCallbacks) {
        window._ttsCallbacks.timeout = ttsTimeout;
      }
      
      return;
    }

    // Fallback: Use TTS API endpoint
    console.log("🎤 Voice WebSocket not available, using TTS API endpoint");
    await textToSpeechAPI(text, onStatus, onAudio, emotion);
  } catch (err) {
    console.error("🎤 TTS error:", err);
    onStatus?.("idle");
  }
}

/**
 * Fallback TTS using API endpoint
 * @param {string} text - Text to convert to speech
 * @param {Function} onStatus - Status callback
 * @param {Function} onAudio - Audio callback
 * @param {string} emotion - Emotion for TTS (default: "happy")
 */
async function textToSpeechAPI(text, onStatus, onAudio, emotion = "happy") {
  try {
    const API_BASE = "http://127.0.0.1:8000/api";
    
    // Get auth token if available
    const token = localStorage.getItem("access_token");
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use POST with JSON body (backend now supports POST with TTSRequest model)
    // Try with emotion first, fallback to without emotion if it fails
    const emotionValue = emotion || "happy";
    
    let response;
    let errorText = "";
    
    // Strategy 1: Try with emotion
    try {
      console.log("🎤 Requesting TTS with emotion:", emotionValue);
      response = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          text: text.trim(),
          emotion: emotionValue,
          voice_id: "default"
        })
      });
      
      if (!response.ok) {
        errorText = await response.text();
        console.warn("🎤 TTS with emotion failed:", response.status, errorText);
        
        // If it's a 500 error related to emotion, try without emotion
        if (response.status === 500 && (errorText.includes('emotion') || errorText.includes('EmotionVoiceSynthesizer') || errorText.includes('_apply_prosody'))) {
          console.log("🎤 Retrying TTS without emotion (backend emotion issue detected)");
          
          // Strategy 2: Try without emotion
          response = await fetch(`${API_BASE}/voice/tts`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              text: text.trim(),
              voice_id: "default"
              // No emotion field
            })
          });
          
          if (!response.ok) {
            errorText = await response.text();
            console.warn("🎤 TTS without emotion also failed:", response.status, errorText);
            
            // Strategy 3: Try with GET (old API format) as last resort
            console.log("🎤 Retrying TTS with GET method (fallback)");
            const getUrl = `${API_BASE}/voice/tts?text=${encodeURIComponent(text.trim())}&voice_id=default`;
            response = await fetch(getUrl, {
              method: 'GET',
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              errorText = await response.text();
              throw new Error(`TTS API error after all attempts: ${response.status} - ${errorText}`);
            }
          }
        } else {
          // Non-emotion related error, throw immediately
          throw new Error(`TTS API error: ${response.status} - ${errorText}`);
        }
      }
    } catch (fetchError) {
      // If fetch itself fails (network error), try GET as fallback
      if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
        console.log("🎤 Network error, trying GET method fallback");
        try {
          const getUrl = `${API_BASE}/voice/tts?text=${encodeURIComponent(text.trim())}&voice_id=default`;
          response = await fetch(getUrl, {
            method: 'GET',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (!response.ok) {
            errorText = await response.text();
            throw new Error(`TTS API error (GET fallback): ${response.status} - ${errorText}`);
          }
        } catch (getError) {
          console.error("🎤 All TTS attempts failed:", getError);
          throw getError;
        }
      } else {
        throw fetchError;
      }
    }

    // Backend returns WAV audio directly (binary), not JSON with audio_url
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('audio')) {
      // Direct audio response (WAV file)
      console.log("🎤 Received WAV audio directly from TTS API");
      const audioBlob = await response.blob();
      const audioBuffer = await audioBlob.arrayBuffer();
      
      // Use separate TTS audio context (don't use microphone audio context)
      // This is handled in playAudio function
      
      const ttsCallbacks = window._ttsCallbacks;
      if (ttsCallbacks) {
        ttsCallbacks.onStatus?.("speaking");
      } else {
        onStatus?.("speaking");
      }
      
      console.log("🎤 Playing TTS audio, buffer size:", audioBuffer.byteLength, "bytes");
      
      // Validate audio buffer before playing
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error("Received empty audio buffer from TTS API");
      }
      
      // Store onAudio callback for playAudio to call when playback starts
      const audioStartCallback = ttsCallbacks?.onAudio || onAudio;
      
      // Play audio and call callback when it starts (for sync)
      try {
        await playAudio(audioBuffer, audioStartCallback);
      } catch (playError) {
        console.error("🎤 Failed to play TTS audio:", playError.message);
        // Don't fail completely - text response is already shown
        throw playError;
      }
      
      if (ttsCallbacks) {
        ttsCallbacks.onAudio?.();
        ttsCallbacks.onStatus?.("idle");
        delete window._ttsCallbacks;
      } else {
        onAudio?.();
        onStatus?.("idle");
      }
    } else {
      // Fallback: Try to parse as JSON (in case backend returns JSON with audio_url)
      try {
        const data = await response.json();
        if (data.audio_url) {
          // Fetch and play audio from URL (handle relative URLs)
          const audioUrl = data.audio_url.startsWith('http') 
            ? data.audio_url 
            : `http://127.0.0.1:8000${data.audio_url}`;
          
          console.log("🎤 Fetching TTS audio from URL:", audioUrl);
          const audioResponse = await fetch(audioUrl);
          
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
          }
          
          const audioBlob = await audioResponse.blob();
          const audioBuffer = await audioBlob.arrayBuffer();
          
          // TTS audio context is handled in playAudio function
          const ttsCallbacks = window._ttsCallbacks;
          if (ttsCallbacks) {
            ttsCallbacks.onStatus?.("speaking");
          } else {
            onStatus?.("speaking");
          }
          
          console.log("🎤 Playing TTS audio from URL, buffer size:", audioBuffer.byteLength, "bytes");
          
          // Validate audio buffer
          if (!audioBuffer || audioBuffer.byteLength === 0) {
            throw new Error("Received empty audio buffer from URL");
          }
          
          // Call onAudio when playback starts (for sync)
          const audioStartCallback = ttsCallbacks?.onAudio || onAudio;
          try {
            await playAudio(audioBuffer, audioStartCallback);
          } catch (playError) {
            console.error("🎤 Failed to play audio from URL:", playError.message);
            throw playError;
          }
          
          // Update status after playback
          if (ttsCallbacks) {
            ttsCallbacks.onStatus?.("idle");
            delete window._ttsCallbacks;
          } else {
            onStatus?.("idle");
          }
        } else {
          console.error("🎤 TTS: No audio_url in response", data);
          onStatus?.("idle");
        }
      } catch (jsonErr) {
        console.error("🎤 TTS: Failed to parse response as JSON or audio", jsonErr);
        onStatus?.("idle");
      }
    }
  } catch (err) {
    console.error("🎤 TTS API error:", err);
    onStatus?.("idle");
    
    // Don't throw - let the text response still be shown
    // The user can still read the response even if audio fails
    console.warn("🎤 TTS failed, but text response is still available");
  }
}

/**
 * Get the current voice WebSocket instance (for sending TTS requests)
 */
export function getVoiceSocket() {
  return socket && socket.readyState === WebSocket.OPEN ? socket : null;
}
