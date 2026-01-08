let ws;
let audioContext;
let processor;
let input;

export async function useVoiceStream({
  userId = "guest",
  onPartial,
  onFinal,
  onAudio,
  onError
}) {
  const WS_URL = `ws://127.0.0.1:8000/api/voice/stream/${userId}`;

  ws = new WebSocket(WS_URL);
  ws.binaryType = "arraybuffer";

  ws.onopen = async () => {
    console.log("🎤 Voice WS connected");

    audioContext = new AudioContext({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    input = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const data = e.inputBuffer.getChannelData(0);
      const pcm = floatTo16BitPCM(data);
      ws.send(pcm);
    };

    input.connect(processor);
    processor.connect(audioContext.destination);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "partial") onPartial?.(msg.text);
    if (msg.type === "final") onFinal?.(msg.text);

    if (msg.audio_bytes) {
      playAudio(msg.audio_bytes);
      onAudio?.();
    }
  };

  ws.onerror = (e) => {
    console.error("WS error", e);
    onError?.(e);
  };

  ws.onclose = () => {
    console.log("🔌 Voice WS closed");
  };

  return ws;
}

export function stopVoiceStream() {
  if (ws) ws.close();
  ws = null;

  if (processor) processor.disconnect();
  if (input) input.disconnect();
  if (audioContext) audioContext.close();
}

/* ================= helpers ================= */

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;

  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function playAudio(bytes) {
  const ctx = new AudioContext();
  const buffer = new Uint8Array(bytes).buffer;

  ctx.decodeAudioData(buffer).then(decoded => {
    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    src.start();
  });
}
