import { useState, useEffect, useRef } from "react";
import { setExpression, playAnimation, getPersona } from "../../api/avatar";
import { connectVoiceStream, stopVoiceStream, textToSpeech } from "../../api/voice";
import mapEmotion from "../../hooks/useEmotionMapper";
import "./avatar.css";

const Avatar = ({ emotion: externalEmotion, onEmotionChange }) => {
  const [emotion, setEmotion] = useState("idle");
  const [intensity, setIntensity] = useState(0.6);
  const [listening, setListening] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [personalityTraits, setPersonalityTraits] = useState({
    empathy: 0.7,
    expressiveness: 0.8
  });

  const wsRef = useRef(null);
  const containerRef = useRef(null);

  /* =========================
     LOAD PERSONA
  ========================== */
  useEffect(() => {
    (async () => {
      try {
        const persona = await getPersona();
        setPersonalityTraits(persona.personalityTraits);
      } catch (err) {
        console.error("Failed to load persona:", err);
      }
    })();
  }, []);

  /* =========================
     SYNC EXTERNAL EMOTION
  ========================== */
  useEffect(() => {
    if (externalEmotion && !listening) {
      setEmotion(externalEmotion);
      triggerEmotionEffect(externalEmotion);
    }
  }, [externalEmotion, listening]);

  /* =========================
     EMOTION EFFECT
  ========================== */
  const triggerEmotionEffect = (em) => {
    const emojiMap = {
      happy: "😄",
      sad: "😢",
      angry: "😠",
      surprised: "😲",
      neutral: "😐",
      excited: "🤩",
      thinking: "🤔",
      listening: "🎤",
      talking: "🗣️"
    };

    const emoji = emojiMap[em] || "💭";
    const newEmoji = {
      id: Math.random(),
      emoji,
      left: Math.random() * 100
    };

    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1600);
  };

  /* =========================
     STOP LISTENING
  ========================== */
  const stopListening = () => {
    stopVoiceStream();
    wsRef.current = null;

    setListening(false);
    setPartialText("");
    setEmotion("idle");
    onEmotionChange?.("idle");
  };

  /* =========================
     START LISTENING (GEMINI STYLE)
  ========================== */
  const startListening = async () => {
    if (listening) return;

    try {
      setListening(true);
      setEmotion("listening");
      onEmotionChange?.("listening");
      triggerEmotionEffect("listening");

      wsRef.current = await connectVoiceStream({
        onPartial: (text) => {
          setPartialText(text);
          setEmotion("listening");
        },

        onFinal: async (finalText) => {
          console.log("🎤 User said:", finalText);

          setPartialText("");
          setEmotion("thinking");
          triggerEmotionEffect("thinking");

          // 🔹 TEMP AI RESPONSE (replace with LLM later)
          const aiReply = "I heard you clearly.";

          setEmotion("talking");
          triggerEmotionEffect("talking");

          await textToSpeech(aiReply, "happy");

          setEmotion("idle");
          onEmotionChange?.("idle");
        },

        onStatus: (state) => {
          if (state === "listening") {
            setEmotion("listening");
          }
        },

        onError: (err) => {
          console.error("Voice error:", err);
          stopListening();
        }
      });

    } catch (err) {
      console.error("Failed to start listening:", err);
      stopListening();
    }
  };

  /* =========================
     MANUAL EXPRESSION
  ========================== */
  const changeExpression = async (newEmotion) => {
    try {
      const emotionData = mapEmotion(newEmotion);

      setEmotion(emotionData.emotion);
      setIntensity(0.8);

      await setExpression(emotionData.emotion, 0.8);
      await playAnimation(emotionData.gesture);

      onEmotionChange?.(emotionData.emotion);
      triggerEmotionEffect(emotionData.emotion);
    } catch (err) {
      console.error("Failed to change expression:", err);
    }
  };

  /* =========================
     HELPERS
  ========================== */
  const emotionPresets = [
    { name: "happy", emoji: "😄", color: "#3cff8f" },
    { name: "sad", emoji: "😢", color: "#6b9eff" },
    { name: "angry", emoji: "😠", color: "#ff4d4d" },
    { name: "surprised", emoji: "😲", color: "#ffcc66" },
    { name: "neutral", emoji: "😐", color: "#4de8ff" },
    { name: "excited", emoji: "🤩", color: "#ff6bff" }
  ];

  const getGesture = () => {
    const gestureMap = {
      happy: "jump",
      excited: "spin",
      angry: "shake",
      sad: "slouch",
      surprised: "bounce",
      thinking: "tilt",
      listening: "pulse",
      talking: "talk"
    };
    return gestureMap[emotion] || "float";
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="avatar-container" ref={containerRef}>
      <div className="floating-emojis">
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="floating-emoji"
            style={{ left: `${item.left}%`, top: "50%" }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <div className="avatar-main">
        <div className="avatar-glow" />
        <div className={`avatar ${emotion} ${getGesture()} ${listening ? "listening" : ""}`}>
          <div className="emotion-badge">
            {emotion.toUpperCase()} {intensity > 0.7 ? "🔥" : ""}
          </div>

          <div className="head">
            <span className="eyebrow left" />
            <span className="eyebrow right" />
            <span className="eye left" />
            <span className="eye right" />
            <div className="mouth" />
          </div>

          <div className="audio-line">
            <span /><span /><span /><span /><span />
          </div>

          <div className="body">
            <div className="core" />
            <div className="hand left-hand" />
            <div className="hand right-hand" />
          </div>
        </div>
      </div>

      {partialText && (
        <div className="live-caption">
          {partialText}
        </div>
      )}

      <div className="avatar-controls">
        <button
          className="control-btn talk-btn"
          onClick={() => (listening ? stopListening() : startListening())}
        >
          {listening ? "⛔ Stop" : "🎤 Listen"}
        </button>

        <button className="control-btn anim-btn" onClick={() => changeExpression("happy")}>
          👋 Wave
        </button>
        <button className="control-btn anim-btn" onClick={() => changeExpression("neutral")}>
          🙂 Calm
        </button>
      </div>

      <div className="emotion-presets">
        {emotionPresets.map(preset => (
          <button
            key={preset.name}
            className="emotion-btn"
            onClick={() => changeExpression(preset.name)}
            style={{ borderColor: preset.color }}
          >
            <span className="emoji">{preset.emoji}</span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="personality-display">
        <div className="personality-trait">
          <span>Empathy</span>
          <div className="trait-bar">
            <div
              className="trait-fill"
              style={{ width: `${personalityTraits.empathy * 100}%` }}
            />
          </div>
        </div>
        <div className="personality-trait">
          <span>Expressiveness</span>
          <div className="trait-bar">
            <div
              className="trait-fill"
              style={{ width: `${personalityTraits.expressiveness * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Avatar;
