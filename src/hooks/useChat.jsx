import { useState } from "react";
import { sendMessage } from "../services/chatService";


export function useChat() {
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);


const send = async (text) => {
setMessages((m) => [...m, { role: "user", text }]);
setLoading(true);


const res = await sendMessage(text);


setMessages((m) => [...m, { role: "ai", text: res.reply }]);
setLoading(false);
};


return { messages, send, loading };
}