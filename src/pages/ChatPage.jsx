import { useState, useRef } from "react";
import Avatar from "../components/Avatar/Avatar";
import Chat from "../components/Chat/Chat";
import "./ChatPage.css";

export default function ChatPage() {
  const [emotion, setEmotion] = useState("idle");
  const voiceMessageHandler = useRef(null);

  return (
    <div className="chat-page">
      <div className="main-card">
        <div className="avatar-card">
          <Avatar 
            emotion={emotion} 
            onEmotionChange={setEmotion}
            onVoiceMessage={voiceMessageHandler}
          />
        </div>

        <div className="chat-card">
          <Chat 
            setEmotion={setEmotion}
            onVoiceMessage={voiceMessageHandler}
          />
        </div>
      </div>
    </div>
  );
}