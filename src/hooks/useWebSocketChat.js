import { useEffect, useRef, useState } from "react";
import { connectChatWS } from "../api/chat";

export default function useWebSocketChat(onMessage, onError, onConnected) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    wsRef.current = connectChatWS(
      (data) => {
        onMessage?.(data);
      },
      (err) => {
        setConnected(false);
        onError?.(err);
      }
    );

    wsRef.current.onopen = () => {
      setConnected(true);
      onConnected?.();
    };

    return () => wsRef.current?.close();
  }, []);

  const send = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { send, connected, ws: wsRef.current };
}