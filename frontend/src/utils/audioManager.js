/**
 * Audio Manager
 * Handles microphone access, audio permissions, and playback
 */

class AudioManager {
  constructor() {
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.hasPermission = false;
  }

  /**
   * Request microphone permission and initialize audio context
   */
  async requestMicrophonePermission() {
    try {
      // Check if we already have permission
      if (this.hasPermission && this.mediaStream) {
        return { success: true, stream: this.mediaStream };
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.hasPermission = true;

      console.log('✅ Microphone permission granted');

      // Initialize audio context for visualization
      this.initializeAudioContext(stream);

      return { success: true, stream };
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);

      let errorMessage = 'Microphone access denied';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Please allow microphone access in your browser settings';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found on your device';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Initialize Web Audio API context for audio analysis
   */
  initializeAudioContext(stream) {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create analyser node for visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      // Connect microphone stream to analyser
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      console.log('✅ Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Get current audio level (0-100) for visualization
   */
  getAudioLevel() {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    // Normalize to 0-100
    return Math.min(100, (average / 255) * 100);
  }

  /**
   * Get frequency data for waveform visualization
   */
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Check if microphone permission has been granted
   */
  async checkPermissionStatus() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      // Permissions API not supported in all browsers
      return 'prompt';
    }
  }

  /**
   * Stop microphone stream and release resources
   */
  stopMicrophone() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    this.hasPermission = false;
    console.log('🛑 Microphone stopped');
  }

  /**
   * Check if browser supports required audio APIs
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (window.AudioContext || window.webkitAudioContext)
    );
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Export class for testing
export default AudioManager;
