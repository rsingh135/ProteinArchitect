import { Conversation } from '@elevenlabs/client';

/**
 * ElevenLabs Voice Assistant Service
 * Manages real-time conversational AI with WebRTC/WebSocket streaming
 */

class ElevenLabsService {
  constructor() {
    this.conversation = null;
    this.isConnected = false;
    this.apiKey = null;
    this.systemPrompt = '';
    this.onStatusChange = null;
    this.onError = null;
    this.onTranscription = null;
  }

  /**
   * Initialize the service with API key and system prompt
   */
  async initialize(apiKey, systemPrompt = '', callbacks = {}) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
    this.onStatusChange = callbacks.onStatusChange;
    this.onError = callbacks.onError;
    this.onTranscription = callbacks.onTranscription;

    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }

    console.log('🎤 ElevenLabs service initialized');
  }

  /**
   * Start a new conversation with real-time audio streaming
   */
  async startConversation(agentId = null) {
    try {
      if (this.conversation) {
        await this.endConversation();
      }

      this.updateStatus('connecting');

      // Get signed URL from backend for private agents
      // Use relative URL in production, localhost in development
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3002/api/elevenlabs/signed-url'
        : '/api/elevenlabs-signed-url';

      const signedUrlResponse = await fetch(apiUrl);
      if (!signedUrlResponse.ok) {
        throw new Error('Failed to get signed URL from server');
      }
      const { signedUrl } = await signedUrlResponse.json();

      // startSession with signed URL for authentication
      this.conversation = await Conversation.startSession({
        signedUrl,

        // Callbacks for conversation events
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs');
          this.isConnected = true;
          this.updateStatus('connected');

          // Send protein context as contextual update after connection
          if (this.systemPrompt) {
            this.sendContextUpdate(this.systemPrompt);
          }
        },

        onDisconnect: () => {
          console.log('❌ Disconnected from ElevenLabs');
          this.isConnected = false;
          this.updateStatus('disconnected');
        },

        onMessage: (message) => {
          console.log('📨 Message:', message);
          // Handle different message types
          if (message.type === 'audio') {
            // Audio chunk received - browser will automatically play
            this.updateStatus('speaking');
          } else if (message.type === 'transcription') {
            // User speech transcription
            if (this.onTranscription) {
              this.onTranscription(message.text, 'user');
            }
          } else if (message.type === 'agent_response') {
            // Agent's text response
            if (this.onTranscription) {
              this.onTranscription(message.text, 'agent');
            }
          }
        },

        onError: (error) => {
          console.error('❌ ElevenLabs error:', error);
          this.isConnected = false;
          this.updateStatus('error');
          if (this.onError) {
            this.onError(error);
          }
        },

        onModeChange: (mode) => {
          console.log('🔄 Mode changed:', mode);
          // mode can be: 'listening', 'thinking', 'speaking', 'idle'
          this.updateStatus(mode);
        },
      });

      console.log('🎙️ Conversation session started');

      return true;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      this.updateStatus('error');
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  /**
   * Update system prompt during conversation
   */
  async updateContext(newSystemPrompt) {
    this.systemPrompt = newSystemPrompt;

    // Send as contextual update if connected
    if (this.conversation && this.isConnected) {
      this.sendContextUpdate(newSystemPrompt);
    }
  }

  /**
   * Send contextual update to the agent
   */
  sendContextUpdate(context) {
    if (!this.conversation || !this.isConnected) {
      return;
    }

    try {
      this.conversation.sendContextualUpdate(context);
      console.log('📝 Sent protein context to agent');
    } catch (error) {
      console.error('Failed to send contextual update:', error);
    }
  }

  /**
   * Send text message (if SDK supports text input)
   */
  async sendText(text) {
    if (!this.conversation || !this.isConnected) {
      throw new Error('Not connected to ElevenLabs');
    }

    try {
      await this.conversation.sendUserMessage(text);
      return true;
    } catch (error) {
      console.error('Failed to send text:', error);
      return false;
    }
  }

  /**
   * End the current conversation
   */
  async endConversation() {
    if (this.conversation) {
      try {
        await this.conversation.endSession();
        this.conversation = null;
        this.isConnected = false;
        this.updateStatus('disconnected');
        console.log('👋 Conversation ended');
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    }
  }

  /**
   * Check if service is currently connected
   */
  isActive() {
    return this.isConnected && this.conversation !== null;
  }

  /**
   * Update status and notify listeners
   */
  updateStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  /**
   * Get current connection status
   */
  getStatus() {
    if (!this.conversation) return 'idle';
    if (!this.isConnected) return 'disconnected';
    return 'connected';
  }
}

// Export singleton instance
export const elevenlabsService = new ElevenLabsService();

// Export class for testing
export default ElevenLabsService;
