import { API_ENDPOINTS } from "../config/api";


export async function sendMessage(message) {
const res = await fetch(API_ENDPOINTS.CHAT, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ message }),
});


if (!res.ok) throw new Error("AI server error");
return res.json();
}