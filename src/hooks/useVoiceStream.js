import { useRef, useState } from "react";
import { connectVoiceStream } from "../api/voice";

export default function useVoiceStream(onText, onError) {
  const wsRef = useRef(null);
  const [listening, setListening] = useState(false);

  const start = () => {
    wsRef.current = connectVoiceStream(
      (data) => {
        onText?.(data);
      },
      (err) => {
        setListening(false);
        onError?.(err);
      }
    );
    setListening(true);
  };

  const stop = () => {
    wsRef.current?.close();
    setListening(false);
  };

  return { start, stop, listening };
}