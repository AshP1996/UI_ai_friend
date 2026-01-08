import { useState, useEffect, useRef, useCallback } from "react";
import { sendMessage, streamMessage, getChatHistory, clearChat } from "../../api/chat";
import { setExpression, playAnimation } from "../../api/avatar";
import { textToSpeech, getVoiceSocket } from "../../api/voice";
import mapEmotion from "../../hooks/useEmotionMapper";
import "./chat.css";

const Chat = ({ setEmotion, onVoiceMessage }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState({ messageCount: 0, avgProcessingTime: 0 });
  const [processingTime, setProcessingTime] = useState(0);
  const [streamMode, setStreamMode] = useState(true);
  const chatEndRef = useRef(null);
  const isSendingRef = useRef(false);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(50);
      setMessages(
        history.messages?.map(m => ({
          role: m.role || "ai",
          text: m.content || m.text || "",
          time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          emotion: m.emotion
        })) || []
      );
      setStats(history.stats);
    } catch (err) {
      console.error("Failed to load history:", err);
      // Show welcome message if no history
      setMessages([{
        role: "ai",
        text: "Hey! I'm your AI Friend. What's on your mind? 🤖",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        emotion: "happy"
      }]);
    }
  };

  const handleSendStreaming = async () => {
    if (!input.trim() || isSendingRef.current) return;

    const userText = input.trim();
    setInput("");
    isSendingRef.current = true;

    // Add user message
    setMessages(prev => [...prev, {
      role: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);

    setEmotion("thinking");
    setAiTyping(true);
    const startTime = Date.now();

    try {
      let fullResponse = "";
      
      // Add placeholder AI message
      setMessages(prev => [...prev, {
        role: "ai",
        text: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);

      // Stream response
      fullResponse = await streamMessage(userText, (chunk) => {
        setMessages(prev => {
          if (!prev.length) return prev;

          const updated = [...prev];
          const lastIndex = updated.length - 1;

          // SAFETY GUARD
          if (!updated[lastIndex] || updated[lastIndex].role !== "ai") {
            return prev;
          }

          updated[lastIndex] = {
            ...updated[lastIndex],
            text: chunk
          };

          return updated;
        });
      });

      setProcessingTime(((Date.now() - startTime) / 1000).toFixed(2));
      setAiTyping(false);
      setEmotion("idle");
    } catch (err) {
      console.error("Streaming error:", err);
      // Fallback to regular send
      handleSendRegular(userText);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSendRegular = async (text = input.trim()) => {
    if (!text || isSendingRef.current) return;

    if (text === input.trim()) {
      setInput("");
    }

    setMessages(prev => [...prev, {
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);

    isSendingRef.current = true;
    setEmotion("thinking");
    setAiTyping(true);
    const startTime = Date.now();

    try {
      // Send message to API
      const response = await sendMessage(text);

      // Update emotion in avatar with reactive gestures
      if (response.emotion.primaryEmotion) {
        const emotionData = mapEmotion(
          response.emotion.primaryEmotion, 
          response.emotion.confidence || 0.5,
          response.emotion.intensity || "medium"
        );
        setEmotion(emotionData.emotion);
        
        // Set avatar expression with intensity
        await setExpression(emotionData.emotion, emotionData.intensity);
        
        // Play primary gesture animation
        await playAnimation(emotionData.gesture);
        
        // Play secondary gesture after a short delay for more expressiveness
        if (emotionData.secondaryGesture) {
          setTimeout(async () => {
            await playAnimation(emotionData.secondaryGesture);
          }, 800);
        }
      }

      // Add AI response immediately (don't wait for TTS)
      setMessages(prev => [...prev, {
        role: "ai",
        text: response.response,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        emotion: response.emotion.primaryEmotion,
        processingTime: response.processingTime,
        memoriesUsed: response.memoriesUsed
      }]);

      setProcessingTime(response.processingTime);

      // Update stats
      setStats(prev => ({
        messageCount: prev.messageCount + 1,
        avgProcessingTime: response.processingTime
      }));

      // Always play TTS audio for voice-initiated messages
      // Start TTS immediately in parallel (don't await) to reduce latency
      if (isVoiceMessageRef.current && response.response) {
        console.log("🎤 Voice message response, requesting TTS immediately:", response.response);
        
        // Set emotion to talking immediately
        setEmotion("talking");
        
        // Pass emotion from response to TTS for better voice expression
        const emotionForTTS = response.emotion?.primaryEmotion || "happy";
        
        // Start TTS in parallel (fire and forget) to reduce latency
        // Don't await - let it play while UI updates
        textToSpeech(
          response.response,
          (status) => {
            if (status === "speaking") {
              setEmotion("talking");
            } else if (status === "idle") {
              // Keep talking state a bit longer, then return to idle
              setTimeout(() => setEmotion("idle"), 300);
            }
          },
          () => {
            // Audio started playing - sync with text display
            console.log("🎤 TTS audio started playing - synced with text");
          },
          emotionForTTS // Pass emotion to TTS
        ).catch(err => {
          console.error("🎤 TTS error:", err);
          setEmotion("idle");
        });
      } else {
        // For non-voice messages, still set emotion but no TTS
        setTimeout(() => setEmotion("idle"), 2500);
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "⚠️ Sorry, I had trouble processing that. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        emotion: "sad"
      }]);
      setEmotion("sad");
    } finally {
      setAiTyping(false);
      isSendingRef.current = false;
    }
  };

  // Track if this is a voice-initiated message (to trigger TTS)
  const isVoiceMessageRef = useRef(false);

  // Expose handleVoiceMessage to parent via ref
  useEffect(() => {
    if (onVoiceMessage) {
      onVoiceMessage.current = async (voiceText) => {
        if (!voiceText || !voiceText.trim() || isSendingRef.current) return;
        isVoiceMessageRef.current = true; // Mark as voice message
        await handleSendRegular(voiceText.trim());
        isVoiceMessageRef.current = false; // Reset after processing
      };
    }
  }, [onVoiceMessage]);

  const handleSend = () => {
    if (streamMode) {
      handleSendStreaming();
    } else {
      handleSendRegular();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    try {
      await clearChat();
      setMessages([]);
      setStats({ messageCount: 0, avgProcessingTime: 0 });
      setEmotion("idle");
    } catch (err) {
      console.error("Clear error:", err);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="header-top">
          <div className="header-title">💬 AI Friend Chat</div>
          <div className="header-actions">
            <button className="header-btn" onClick={handleClear}>🗑️ Clear</button>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Messages:</span>
            <span className="stat-value">{stats.messageCount}</span>
          </div>
          {processingTime > 0 && (
            <div className="stat-item">
              <span className="stat-label">Last Response:</span>
              <span className="stat-value">{processingTime}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`msg-row ${m.role}`}>
              <div className={`bubble ${m.role}`}>
                {m.role === "ai" && m.emotion && (
                  <div className="ai-meta">
                    <span className="emotion-tag">{m.emotion}</span>
                  </div>
                )}
                <div className="bubble-text">{m.text}</div>
                {m.role === "ai" && (
                  <div className="bubble-actions">
                    <button onClick={() => copyText(m.text)} title="Copy">📋</button>
                  </div>
                )}
              </div>
            </div>
            <div className={`msg-row ${m.role}`}>
              <div className="bubble-meta">
                {m.emotion && m.role === "ai" && <span className="emotion-badge">{m.emotion}</span>}
                <span>{m.time}</span>
                {m.memoriesUsed > 0 && <span>🧠 {m.memoriesUsed}</span>}
              </div>
            </div>
          </div>
        ))}

        {aiTyping && (
          <div className="msg-row ai">
            <div className="bubble ai">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-toolbar">
          <button 
            className={`tool-btn ${streamMode ? "active" : ""}`}
            onClick={() => setStreamMode(!streamMode)}
          >
            ⚡ {streamMode ? "Streaming" : "Standard"}
          </button>
        </div>

        <div className="chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={aiTyping}
          />
          <button 
            className="send-btn"
            onClick={handleSend}
            disabled={aiTyping || !input.trim()}
          >
            Send 📤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;