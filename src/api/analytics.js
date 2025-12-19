import api from "./client";

export const getAnalyticsOverview = async () => {
  const response = await api.get("/analytics/overview");
  return {
    totalInteractions: response.data.total_interactions || 0,
    emotionDistribution: response.data.emotion_distribution || {},
    topics: response.data.topics || [],
    memoryStats: response.data.memory_stats || {}
  };
};

export const getEmotionTrends = async (days = 7) => {
  const response = await api.get(`/analytics/emotion-trends?days=${days}`);
  return response.data;
};

export const getTopicAnalysis = async () => {
  const response = await api.get("/analytics/topics");
  return response.data;
};