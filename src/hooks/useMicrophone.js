export const startMicStream = async (ws) => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (e) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const input = e.inputBuffer.getChannelData(0);
    const pcm16 = new Int16Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      pcm16[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
    }

    ws.send(pcm16.buffer);
  };

  return () => {
    processor.disconnect();
    source.disconnect();
    audioContext.close();
    stream.getTracks().forEach((t) => t.stop());
  };
};