/**
 * Maps emotion to avatar expression, intensity, and gesture
 * Includes reactive gestures based on emotion type and intensity
 */
export default function mapEmotion(emotion, confidence = 0.5, intensity = "medium") {
  // Normalize intensity string to number
  const intensityMap = {
    "low": 0.3,
    "medium": 0.6,
    "high": 0.9,
    "very_high": 1.0
  };
  const intensityValue = typeof intensity === "string" ? intensityMap[intensity] || 0.6 : intensity;
  
  // Combine confidence and intensity for gesture selection
  const combinedIntensity = Math.max(confidence, intensityValue);
  
  const map = {
    // Positive emotions
    happy: { 
      emotion: "happy", 
      intensity: combinedIntensity, 
      gesture: combinedIntensity > 0.7 ? "jump" : "wave",
      secondaryGesture: "nod"
    },
    excited: { 
      emotion: "excited", 
      intensity: Math.min(combinedIntensity + 0.1, 1.0), 
      gesture: "spin",
      secondaryGesture: "clap"
    },
    joyful: { 
      emotion: "happy", 
      intensity: 0.95, 
      gesture: "jump",
      secondaryGesture: "dance"
    },
    love: { 
      emotion: "love", 
      intensity: 0.85, 
      gesture: "heart",
      secondaryGesture: "wave"
    },
    grateful: { 
      emotion: "happy", 
      intensity: 0.8, 
      gesture: "bow",
      secondaryGesture: "nod"
    },
    proud: { 
      emotion: "happy", 
      intensity: 0.85, 
      gesture: "chest",
      secondaryGesture: "nod"
    },
    
    // Negative emotions
    sad: { 
      emotion: "sad", 
      intensity: combinedIntensity, 
      gesture: combinedIntensity > 0.7 ? "slouch" : "sigh",
      secondaryGesture: "head-down"
    },
    angry: { 
      emotion: "angry", 
      intensity: Math.min(combinedIntensity + 0.1, 1.0), 
      gesture: "shake",
      secondaryGesture: "fist"
    },
    frustrated: { 
      emotion: "angry", 
      intensity: 0.7, 
      gesture: "shake",
      secondaryGesture: "sigh"
    },
    disappointed: { 
      emotion: "sad", 
      intensity: 0.6, 
      gesture: "slouch",
      secondaryGesture: "head-down"
    },
    
    // Neutral/Thinking emotions
    neutral: { 
      emotion: "neutral", 
      intensity: 0.3, 
      gesture: "idle",
      secondaryGesture: "breathe"
    },
    thinking: { 
      emotion: "thinking", 
      intensity: 0.4, 
      gesture: "tilt",
      secondaryGesture: "chin-rub"
    },
    confused: { 
      emotion: "confused", 
      intensity: 0.6, 
      gesture: "tilt",
      secondaryGesture: "head-scratch"
    },
    curious: { 
      emotion: "thinking", 
      intensity: 0.5, 
      gesture: "lean-forward",
      secondaryGesture: "tilt"
    },
    
    // Surprise/Reactive emotions
    surprised: { 
      emotion: "surprised", 
      intensity: 0.8, 
      gesture: "bounce",
      secondaryGesture: "jump"
    },
    shocked: { 
      emotion: "surprised", 
      intensity: 0.95, 
      gesture: "jump",
      secondaryGesture: "bounce"
    },
    amazed: { 
      emotion: "surprised", 
      intensity: 0.85, 
      gesture: "bounce",
      secondaryGesture: "clap"
    },
    
    // Communication states
    talking: { 
      emotion: "talking", 
      intensity: 0.6, 
      gesture: "talk",
      secondaryGesture: "hand-gesture"
    },
    listening: { 
      emotion: "listening", 
      intensity: 0.5, 
      gesture: "pulse",
      secondaryGesture: "nod"
    },
    
    // Additional emotions
    worried: { 
      emotion: "sad", 
      intensity: 0.6, 
      gesture: "fidget",
      secondaryGesture: "sigh"
    },
    calm: { 
      emotion: "neutral", 
      intensity: 0.4, 
      gesture: "breathe",
      secondaryGesture: "idle"
    },
    playful: { 
      emotion: "happy", 
      intensity: 0.8, 
      gesture: "dance",
      secondaryGesture: "wave"
    },
    empathetic: { 
      emotion: "sad", 
      intensity: 0.5, 
      gesture: "nod",
      secondaryGesture: "hand-on-heart"
    },
    encouraging: { 
      emotion: "happy", 
      intensity: 0.7, 
      gesture: "thumbs-up",
      secondaryGesture: "nod"
    },
    apologetic: { 
      emotion: "sad", 
      intensity: 0.5, 
      gesture: "bow",
      secondaryGesture: "head-down"
    }
  };
  
  return map[emotion] || map.neutral;
}