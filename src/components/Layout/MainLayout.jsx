import Avatar from "../Avatar/Avatar";


export default function MainLayout({ children, thinking }) {
return (
<div className="layout">
  <div className="left">Avatar</div>
  <div className="right">
    <div className="panel controls">...</div>
    <div className="panel chat-window">...</div>
    <div className="panel chat-input">...</div>
  </div>
</div>

);
}