import api from "./client";

export const getProfileByUserId = async (userId) => {
  const response = await api.get(`/profile/${userId}`);
  return {
    userId: response.data.user_id,
    profile: response.data.profile || {}
  };
};

export const updateProfile = async (userId, profileData) => {
  const response = await api.put(`/profile/${userId}`, profileData);
  return {
    message: response.data.message,
    userId: response.data.user_id
  };
};
