import api from "./client";

export const saveMemory = async (content, category = "general", importance = 0.5, tags = null) => {
  const response = await api.post("/memory/save", {
    content,
    category,
    importance,
    tags // Pass as string or null, not array
  });
  return {
    memoryId: response.data.memory_id,
    content: response.data.content,
    savedAt: response.data.timestamp
  };
};

export const searchMemories = async (query, limit = 10, category = null) => {
  const response = await api.post("/memory/search", {
    query,
    limit,
    category
  });
  return {
    memories: response.data.memories || [],
    count: response.data.count || 0
  };
};

export const deleteMemory = async (memoryId) => {
  const response = await api.delete(`/memory/${memoryId}`);
  return response.data;
};

export const getMemoryStats = async () => {
  const response = await api.get("/memory/stats");
  return {
    totalMemories: response.data.total_memories || 0,
    byCategory: response.data.by_category || {},
    avgImportance: response.data.avg_importance || 0
  };
};
