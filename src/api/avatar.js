import api from "./client";

// Set avatar emotion/expression - maps to backend response
export const setExpression = async (emotion, intensity = 0.5) => {
  const response = await api.post("/avatar/expression", {
    emotion,
    intensity,
    duration: 2,
  });
  return {
    success: true,
    emotion: emotion,
    intensity: intensity,
    animationDuration: 2
  };
};

// Play avatar animation - maps to backend animation endpoint
export const playAnimation = async (animation_type) => {
  const response = await api.post("/avatar/animation", {
    animation_type,
    duration: 1.5,
  });
  return {
    success: true,
    animationType: animation_type,
    duration: 1.5
  };
};

// Sync speech for lip-sync and phoneme timing
export const syncSpeech = async (text) => {
  const response = await api.get(`/avatar/sync-speech?text=${encodeURIComponent(text)}`);
  return {
    text: text,
    phonemes: response.data.phonemes || [],
    timing: response.data.timing || [],
    duration: response.data.duration || 0
  };
};

// Get persona settings for avatar personality
export const getPersona = async () => {
  const response = await api.get("/persona/get");
  return {
    name: response.data.name || "Friend",
    personalityTraits: response.data.personality_traits || {
      empathy: 0.7,
      expressiveness: 0.8,
    }
  };
};

// Update persona settings
export const updatePersona = async (personaData) => {
  const response = await api.post("/persona/update", personaData);
  return response.data;
};