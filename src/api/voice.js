// src/api/voice.js
// Gemini-style Live Voice Client (CLEAN & FIXED)

import { getCurrentUser } from "./auth";

/* ===============================
   ENV & CONFIG
================================ */
const WS_VOICE_URL = import.meta.env.VITE_WS_VOICE_URL;
const API_BASE = "http://127.0.0.1:8000/api/voice";
const SAMPLE_RATE = 16000;

/* ===============================
   GLOBAL AUDIO STATE
================================ */
let socket = null;
let audioContext = null;
let processor = null;
let micStream = null;
let sourceNode = null;

/* ===============================
   LIVE VOICE STREAM (STT)
================================ */
export async function connectVoiceStream({
  onPartial,
  onFinal,
  onStatus,
  onError
}) {
  if (!WS_VOICE_URL) {
    throw new Error("VITE_WS_VOICE_URL is not defined in .env");
  }

  // Get user (optional)
  const user = await getCurrentUser?.();
  const userId = user?.id || "guest";

  socket = new WebSocket(`${WS_VOICE_URL}/${userId}`);
  socket.binaryType = "arraybuffer";

  socket.onopen = async () => {
    try {
      onStatus?.("listening");

      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE
      });

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNode = audioContext.createMediaStreamSource(micStream);

      // ScriptProcessor (deprecated but stable)
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const input = e.inputBuffer.getChannelData(0);
        socket.send(floatToPCM16(input));
      };

      sourceNode.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      onError?.(err);
      cleanup();
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.partial) onPartial?.(data.partial);
      if (data.final) onFinal?.(data.final);
      if (data.status) onStatus?.(data.status);
    } catch (e) {
      console.warn("Voice message parse failed:", e);
    }
  };

  socket.onerror = (err) => {
    onError?.(err);
  };

  socket.onclose = () => {
    cleanup();
    onStatus?.("disconnected");
  };

  return socket;
}

/* ===============================
   STOP VOICE STREAM
================================ */
export function stopVoiceStream() {
  socket?.close();
  cleanup();
}

/* ===============================
   CLEANUP
================================ */
function cleanup() {
  processor?.disconnect();
  sourceNode?.disconnect();

  micStream?.getTracks().forEach(t => t.stop());
  audioContext?.close();

  processor = null;
  sourceNode = null;
  micStream = null;
  audioContext = null;
  socket = null;
}

/* ===============================
   TEXT → SPEECH (TTS)
================================ */
export async function textToSpeech(text, emotion = "neutral") {
  if (!text) return;

  const res = await fetch(
    `${API_BASE}/tts?text=${encodeURIComponent(text)}&emotion=${emotion}`
  );

  if (!res.ok) throw new Error("TTS failed");

  const audioBlob = await res.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));

  await audio.play();
  return audio;
}

/* ===============================
   FILE UPLOAD STT (Fallback)
================================ */
export async function uploadAudioSTT(audioFile) {
  const formData = new FormData();
  formData.append("audio", audioFile);

  const res = await fetch(`${API_BASE}/stt`, {
    method: "POST",
    body: formData
  });

  return await res.json();
}

/* ===============================
   UTILS
================================ */
function floatToPCM16(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
