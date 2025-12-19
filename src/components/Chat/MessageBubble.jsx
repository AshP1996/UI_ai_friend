export default function MessageBubble({ role, text }) {
return <div className={`bubble ${role}`}>{text}</div>;
}