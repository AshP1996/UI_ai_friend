import { useEffect, useState } from "react";
import { getOverview } from "../../api/analytics";
import "./analytics.css";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getOverview().then((res) => setData(res.data));
  }, []);

  if (!data) return null;

  return (
    <div className="analytics">
      <div className="stat">💬 {data.total_interactions} chats</div>
      <div className="stat">⏱ {data.avg_session_length} min</div>
      <div className="stat">😊 Happy {data.emotion_distribution.happy}%</div>
    </div>
  );
}
