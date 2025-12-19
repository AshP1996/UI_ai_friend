
// import { useState } from "react";
// import Avatar from "./components/Avatar/Avatar";
// import Chat from "./components/Chat/Chat";
// import Login from "./components/Auth/Login";
// import Register from "./components/Auth/Register";
// import Logout from "./components/Auth/Logout";

// export default function App() {
//   const [emotion, setEmotion] = useState("idle");
//   const [authMode, setAuthMode] = useState("login");
//   const [isAuth, setIsAuth] = useState(
//     !!localStorage.getItem("access_token")
//   );

//   if (!isAuth) {
//     return authMode === "login" ? (
//       <Login
//         onSuccess={() => setIsAuth(true)}
//         switchToRegister={() => setAuthMode("register")}
//       />
//     ) : (
//       <Register
//         onSuccess={() => setIsAuth(true)}
//         switchToLogin={() => setAuthMode("login")}
//       />
//     );
//   }

//   return (
//     <div className="screen">
//       <Logout onLogout={() => setIsAuth(false)} />

//       <div className="main-card">
//         <div className="avatar-card">
//           <Avatar emotion={emotion} />
//         </div>

//         <div className="chat-card">
//           <Chat setEmotion={setEmotion} />
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import Avatar from "./components/Avatar/Avatar";
import Chat from "./components/Chat/Chat";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Logout from "./components/Auth/Logout";

// Auth bypass toggle from environment variable
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

export default function App() {
  const [emotion, setEmotion] = useState("idle");
  const [authMode, setAuthMode] = useState("login");
  const [isAuth, setIsAuth] = useState(
    BYPASS_AUTH || !!localStorage.getItem("access_token")
  );

  // TEMP: skip login/register if auth is bypassed
  if (!isAuth && !BYPASS_AUTH) {
    return authMode === "login" ? (
      <Login
        onSuccess={() => setIsAuth(true)}
        switchToRegister={() => setAuthMode("register")}
      />
    ) : (
      <Register
        onSuccess={() => setIsAuth(true)}
        switchToLogin={() => setAuthMode("login")}
      />
    );
  }

  return (
    <div className="screen">
      {/* Show Logout only if auth is enabled */}
      {!BYPASS_AUTH && <Logout onLogout={() => setIsAuth(false)} />}

      <div className="main-card">
        <div className="avatar-card">
          <Avatar emotion={emotion} />
        </div>

        <div className="chat-card">
          <Chat setEmotion={setEmotion} />
        </div>
      </div>
    </div>
  );
}
