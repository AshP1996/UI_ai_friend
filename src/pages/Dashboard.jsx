import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAnalyticsOverview } from "../api/analytics";
import { getMemoryStats } from "../api/memory";
import { getPersonaProfile } from "../api/persona";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsData, memoryData, personaData] = await Promise.all([
        getAnalyticsOverview().catch(() => null),
        getMemoryStats().catch(() => null),
        getPersonaProfile().catch(() => null)
      ]);

      setAnalytics(analyticsData);
      setMemoryStats(memoryData);
      setPersona(personaData);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>
            Welcome back, <span className="highlight">{user?.username || "Guest"}</span>! 👋
          </h1>
          <p>Here's what's happening with your AI Friend</p>
        </div>
        <Link to="/chat" className="quick-action-btn">
          <span>💬</span>
          <span>Start Chatting</span>
        </Link>
      </div>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="dashboard-card stats-card">
          <div className="card-header">
            <h2>📊 Statistics</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">{analytics?.totalInteractions || 0}</div>
                <div className="stat-label">Total Interactions</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🧠</div>
              <div className="stat-content">
                <div className="stat-value">{memoryStats?.totalMemories || 0}</div>
                <div className="stat-label">Memories Stored</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{memoryStats?.avgImportance?.toFixed(1) || 0}</div>
                <div className="stat-label">Avg Importance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emotion Distribution */}
        <div className="dashboard-card emotion-card">
          <div className="card-header">
            <h2>😊 Emotion Distribution</h2>
          </div>
          <div className="emotion-list">
            {analytics?.emotionDistribution ? (
              Object.entries(analytics.emotionDistribution).map(([emotion, count]) => (
                <div key={emotion} className="emotion-item">
                  <div className="emotion-label">{emotion}</div>
                  <div className="emotion-bar-container">
                    <div 
                      className="emotion-bar"
                      style={{ 
                        width: `${(count / (analytics.totalInteractions || 1)) * 100}%`,
                        backgroundColor: getEmotionColor(emotion)
                      }}
                    ></div>
                  </div>
                  <div className="emotion-value">{count}</div>
                </div>
              ))
            ) : (
              <p className="no-data">No emotion data available</p>
            )}
          </div>
        </div>

        {/* Top Topics */}
        <div className="dashboard-card topics-card">
          <div className="card-header">
            <h2>🔥 Top Topics</h2>
          </div>
          <div className="topics-list">
            {analytics?.topics && analytics.topics.length > 0 ? (
              analytics.topics.slice(0, 5).map((topic, index) => (
                <div key={index} className="topic-item">
                  <div className="topic-rank">#{index + 1}</div>
                  <div className="topic-content">
                    <div className="topic-name">{topic.name || topic.topic}</div>
                    <div className="topic-meta">
                      <span>📌 {topic.count || topic.frequency} mentions</span>
                      {topic.sentiment && (
                        <span>😊 {topic.sentiment > 0.5 ? "Positive" : "Neutral"}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No topics available</p>
            )}
          </div>
        </div>

        {/* Persona Info */}
        <div className="dashboard-card persona-card">
          <div className="card-header">
            <h2>🎭 AI Persona</h2>
          </div>
          <div className="persona-info">
            {persona ? (
              <>
                <div className="persona-name">
                  <span className="persona-label">Name:</span>
                  <span className="persona-value">{persona.name || "Friend"}</span>
                </div>
                <div className="persona-traits">
                  <span className="persona-label">Traits:</span>
                  <div className="traits-list">
                    {persona.personality_traits && typeof persona.personality_traits === 'object' ? (
                      Object.entries(persona.personality_traits).map(([trait, value]) => (
                        <div key={trait} className="trait-item">
                          <span className="trait-name">{trait}</span>
                          <div className="trait-bar">
                            <div 
                              className="trait-fill"
                              style={{ width: `${(value || 0) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="persona-value">Default personality</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="no-data">Persona not configured</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <div className="card-header">
            <h2>⚡ Quick Actions</h2>
          </div>
          <div className="actions-grid">
            <Link to="/chat" className="action-btn">
              <span className="action-icon">💬</span>
              <span className="action-text">Chat</span>
            </Link>
            <Link to="/analytics" className="action-btn">
              <span className="action-icon">📈</span>
              <span className="action-text">Analytics</span>
            </Link>
            <button className="action-btn" onClick={loadDashboardData}>
              <span className="action-icon">🔄</span>
              <span className="action-text">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEmotionColor(emotion) {
  const colors = {
    happy: "#3cff8f",
    sad: "#6b9eff",
    angry: "#ff4d4d",
    excited: "#ff6bff",
    neutral: "#4de8ff",
    surprised: "#ffcc66"
  };
  return colors[emotion.toLowerCase()] || "#4de8ff";
}
