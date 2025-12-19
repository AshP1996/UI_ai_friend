export default function mapEmotion(emotion) {
  const map = {
    happy: { emotion: "happy", intensity: 0.9, gesture: "jump" },
    sad: { emotion: "sad", intensity: 0.5, gesture: "slouch" },
    angry: { emotion: "angry", intensity: 1.0, gesture: "shake" },
    surprised: { emotion: "surprised", intensity: 0.8, gesture: "bounce" },
    neutral: { emotion: "neutral", intensity: 0.3, gesture: "idle" },
    excited: { emotion: "excited", intensity: 0.95, gesture: "spin" },
    thinking: { emotion: "thinking", intensity: 0.4, gesture: "tilt" },
    confused: { emotion: "confused", intensity: 0.6, gesture: "tilt" },
    love: { emotion: "love", intensity: 0.85, gesture: "jump" }
  };
  return map[emotion] || map.neutral;
}