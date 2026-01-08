/* public/audio-worklet/voice-processor.js */

class VoiceProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    // Send raw float32 PCM to main thread
    this.port.postMessage(input[0]);
    return true;
  }
}

registerProcessor("voice-processor", VoiceProcessor);
