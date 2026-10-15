// Local German ringback: 425 Hz, one second on / four seconds off.
// Audio is unlocked by the Call click, before microphone/network awaits.
export class RingbackTone {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private remoteTimer: ReturnType<typeof setInterval> | null = null;
  private remoteNodes: AudioNode[] = [];

  // SDP/183 alone does not mean the caller can hear provider audio.
  // Keep local ringback until actual remote samples contain an audible signal.
  watchRemoteStream(stream: MediaStream, onAudible: () => void): void {
    this.stopRemoteWatch();
    const context = this.context;
    if (!context || context.state === 'closed') return;
    try {
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      const silent = context.createGain();
      silent.gain.value = 0;
      analyser.fftSize = 512;
      source.connect(analyser);
      analyser.connect(silent);
      silent.connect(context.destination);
      this.remoteNodes = [source, analyser, silent];
      const samples = new Float32Array(analyser.fftSize);
      let audibleFrames = 0;
      this.remoteTimer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        audibleFrames = rms > 0.01 ? audibleFrames + 1 : 0;
        if (audibleFrames >= 3) {
          this.stop();
          onAudible();
        }
      }, 100);
    } catch { this.stopRemoteWatch(); }
  }

  private stopRemoteWatch(): void {
    if (this.remoteTimer !== null) clearInterval(this.remoteTimer);
    this.remoteTimer = null;
    this.remoteNodes.forEach((node) => node.disconnect());
    this.remoteNodes = [];
  }

  prepare(): void {
    try {
      if (!this.context || this.context.state === 'closed') this.context = new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Calling still works if the browser cannot play a local tone. */ }
  }

  start(): void {
    if (this.oscillator) return;
    this.prepare();
    const context = this.context;
    if (!context || context.state === 'closed') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 425;
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.oscillator = oscillator;
    this.gain = gain;
    const pulse = () => {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.setValueAtTime(0.08, now + 0.99);
      gain.gain.linearRampToValueAtTime(0, now + 1);
    };
    oscillator.start();
    pulse();
    this.timer = setInterval(pulse, 5000);
  }

  stop(): void {
    this.stopRemoteWatch();
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    if (this.gain && this.context) {
      this.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.gain.gain.value = 0;
    }
    try { this.oscillator?.stop(); } catch { /* Already stopped. */ }
    this.oscillator?.disconnect();
    this.gain?.disconnect();
    this.oscillator = null;
    this.gain = null;
  }

  dispose(): void {
    this.stop();
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
