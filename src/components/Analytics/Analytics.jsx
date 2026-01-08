import { useEffect, useState } from "react";
import { getAnalyticsOverview } from "../../api/analytics";
import "./Analytics.css";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner-small"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-empty">
        <p>No analytics data available</p>
      </div>
    );
  }

  const totalInteractions = data.totalInteractions || data.total_interactions || 0;
  const avgSessionLength = data.avgSessionLength || data.avg_session_length || 0;
  const emotionDist = data.emotionDistribution || data.emotion_distribution || {};
  const happyPercent = emotionDist.happy || 0;

  return (
    <div className="analytics-overview">
      <div className="stat-card">
        <div className="stat-icon">💬</div>
        <div className="stat-content">
          <div className="stat-value">{totalInteractions}</div>
          <div className="stat-label">Total Interactions</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">⏱</div>
        <div className="stat-content">
          <div className="stat-value">{avgSessionLength.toFixed(1)}</div>
          <div className="stat-label">Avg Session (min)</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">😊</div>
        <div className="stat-content">
          <div className="stat-value">{happyPercent}%</div>
          <div className="stat-label">Happy Emotions</div>
        </div>
      </div>
    </div>
  );
}
