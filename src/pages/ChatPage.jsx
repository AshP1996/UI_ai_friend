import MainLayout from "../components/Layout/MainLayout";
import ChatWindow from "../components/Chat/Chat";
import { useChat } from "../hooks/useChat";


export default function ChatPage() {
const { messages, send, loading } = useChat();


return (
<MainLayout thinking={loading}>
<ChatWindow messages={messages} />
<input
placeholder="Talk to your AI friend..."
onKeyDown={(e) => e.key === "Enter" && send(e.target.value)}
/>
</MainLayout>
);
}