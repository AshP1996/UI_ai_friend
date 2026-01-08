import { useState, useEffect } from "react";
import { getAnalyticsOverview, getEmotionTrends, getTopicAnalysis } from "../api/analytics";
import Analytics from "../components/Analytics/Analytics";
import "./AnalyticsPage.css";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewData, trendsData, topicsData] = await Promise.all([
        getAnalyticsOverview().catch(() => null),
        getEmotionTrends(selectedPeriod).catch(() => null),
        getTopicAnalysis().catch(() => null)
      ]);

      setOverview(overviewData);
      setTrends(trendsData);
      setTopics(topicsData);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📈 Analytics Dashboard</h1>
        <div className="period-selector">
          <label>Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="period-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {overview && (
        <div className="analytics-overview">
          <Analytics />
        </div>
      )}

      <div className="analytics-grid">
        {trends && trends.trends && (
          <div className="analytics-card trends-card">
            <h2>📊 Emotion Trends</h2>
            <div className="trends-chart">
              {trends.trends.map((trend, index) => (
                <div key={index} className="trend-item">
                  <div className="trend-date">{new Date(trend.date).toLocaleDateString()}</div>
                  <div className="trend-bars">
                    {trend.happiness !== undefined && (
                      <div className="trend-bar-container">
                        <span className="trend-label">😊</span>
                        <div className="trend-bar">
                          <div 
                            className="trend-bar-fill happy"
                            style={{ width: `${trend.happiness * 100}%` }}
                          ></div>
                        </div>
                        <span className="trend-value">{(trend.happiness * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {trend.sadness !== undefined && (
                      <div className="trend-bar-container">
                        <span className="trend-label">😢</span>
                        <div className="trend-bar">
                          <div 
                            className="trend-bar-fill sad"
                            style={{ width: `${trend.sadness * 100}%` }}
                          ></div>
                        </div>
                        <span className="trend-value">{(trend.sadness * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topics && topics.topics && (
          <div className="analytics-card topics-card">
            <h2>🔥 Topic Analysis</h2>
            <div className="topics-analysis">
              {topics.topics.map((topic, index) => (
                <div key={index} className="topic-analysis-item">
                  <div className="topic-header">
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-frequency">{topic.frequency} mentions</span>
                  </div>
                  <div className="topic-sentiment">
                    <span>Sentiment:</span>
                    <div className="sentiment-bar">
                      <div 
                        className="sentiment-fill"
                        style={{ 
                          width: `${topic.sentiment * 100}%`,
                          backgroundColor: topic.sentiment > 0.5 ? "#3cff8f" : "#6b9eff"
                        }}
                      ></div>
                    </div>
                    <span className="sentiment-value">{(topic.sentiment * 100).toFixed(0)}%</span>
                  </div>
                  {topic.keywords && (
                    <div className="topic-keywords">
                      {topic.keywords.slice(0, 5).map((keyword, i) => (
                        <span key={i} className="keyword-tag">{keyword}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
