import { createContext, useState } from "react";

export const FriendContext = createContext();

export const FriendProvider = ({ children }) => {
  const [state, setState] = useState({
    mode: "idle", // idle | listening | thinking | responding
    emotion: "neutral",
    intensity: 0.5,
    isSpeaking: false,
  });

  return (
    <FriendContext.Provider value={{ state, setState }}>
      {children}
    </FriendContext.Provider>
  );
};
