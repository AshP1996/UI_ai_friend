class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Send raw Float32 PCM frames to main thread
      this.port.postMessage(input[0]);
    }
    return true; // keep processor alive
  }
}

// REQUIRED global registration
registerProcessor("pcm-processor", PCMProcessor);
