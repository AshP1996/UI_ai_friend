import api from "./client";

export const getPersonaProfile = async () => {
  const response = await api.get("/persona/get");
  return {
    name: response.data.name,
    personality_traits: response.data.personality_traits,
    tone: response.data.tone,
    background: response.data.background
  };
};

export const updatePersonaProfile = async (updates) => {
  const response = await api.post("/persona/update", updates);
  return response.data;
};

export const resetPersona = async () => {
  const response = await api.post("/persona/reset");
  return response.data;
};