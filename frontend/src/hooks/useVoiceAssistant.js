import { useState, useEffect, useCallback, useRef } from 'react';
import { elevenlabsService } from '../services/elevenlabsService';
import { audioManager } from '../utils/audioManager';
import { buildProteinContext } from '../utils/proteinContextBuilder';

/**
 * Custom hook for voice assistant functionality
 * Manages connection state, audio, and protein context
 */
export const useVoiceAssistant = (protein, selectedResidue = null, viewerState = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, listening, speaking, error
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const animationFrameRef = useRef(null);
  const isInitializedRef = useRef(false);

  /**
   * Initialize ElevenLabs service with API key
   */
  useEffect(() => {
    const initializeService = async () => {
      if (isInitializedRef.current) return;

      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY ||
                     import.meta.env.ELEVENLABS_API_KEY;

      if (!apiKey) {
        console.warn('⚠️ ElevenLabs API key not found in environment variables');
        setError('API key not configured');
        return;
      }

      try {
        const systemPrompt = buildProteinContext(protein, selectedResidue, viewerState);

        await elevenlabsService.initialize(apiKey, systemPrompt, {
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
          },
          onError: (err) => {
            console.error('ElevenLabs error:', err);
            setError(err.message || 'An error occurred');
            setStatus('error');
          },
          onTranscription: (text, speaker) => {
            setTranscript(prev => [...prev, { text, speaker, timestamp: Date.now() }]);
          },
        });

        isInitializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialize ElevenLabs:', err);
        setError('Failed to initialize voice assistant');
      }
    };

    initializeService();
  }, []);

  /**
   * Update context when protein or selection changes
   */
  useEffect(() => {
    if (!isInitializedRef.current || !protein) return;

    const newContext = buildProteinContext(protein, selectedResidue, viewerState);
    elevenlabsService.updateContext(newContext);
  }, [protein, selectedResidue, viewerState]);

  /**
   * Monitor audio level for visualization
   */
  useEffect(() => {
    if (!isActive || status !== 'listening') {
      setAudioLevel(0);
      return;
    }

    const updateAudioLevel = () => {
      const level = audioManager.getAudioLevel();
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, status]);

  /**
   * Start voice conversation
   */
  const startConversation = useCallback(async () => {
    try {
      setError(null);
      setStatus('connecting');

      // Request microphone permission
      const micResult = await audioManager.requestMicrophonePermission();
      if (!micResult.success) {
        setError(micResult.error);
        setStatus('error');
        return;
      }

      // Start ElevenLabs conversation with agent ID from env
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      const success = await elevenlabsService.startConversation(agentId);
      if (success) {
        setIsActive(true);
        setStatus('connected');
      } else {
        setError('Failed to start conversation');
        setStatus('error');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start conversation');
      setStatus('error');
    }
  }, []);

  /**
   * End voice conversation
   */
  const endConversation = useCallback(async () => {
    try {
      await elevenlabsService.endConversation();
      audioManager.stopMicrophone();
      setIsActive(false);
      setStatus('idle');
      setAudioLevel(0);
    } catch (err) {
      console.error('Failed to end conversation:', err);
    }
  }, []);

  /**
   * Toggle conversation on/off
   */
  const toggleConversation = useCallback(async () => {
    if (isActive) {
      await endConversation();
    } else {
      await startConversation();
    }
  }, [isActive, startConversation, endConversation]);

  /**
   * Clear transcript history
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isActive) {
        elevenlabsService.endConversation();
        audioManager.stopMicrophone();
      }
    };
  }, [isActive]);

  return {
    isActive,
    status,
    error,
    transcript,
    audioLevel,
    startConversation,
    endConversation,
    toggleConversation,
    clearTranscript,
  };
};

export default useVoiceAssistant;
