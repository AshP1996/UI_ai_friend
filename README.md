# 🤖 AI Friend - Interactive AI Companion Frontend

A modern, production-ready React application for interacting with an AI companion featuring real-time chat, voice interaction, emotion-aware responses, and comprehensive analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Docker Setup](#docker-setup)
- [API Integration](#api-integration)
- [Component Documentation](#component-documentation)
- [Development](#development)
- [Production Build](#production-build)

## 🎯 Overview

AI Friend is a sophisticated frontend application that provides an immersive interface for interacting with an AI companion. The application features:

- **Real-time Chat Interface** with streaming responses
- **3D Avatar** with emotion synchronization
- **Voice Interaction** with speech-to-text and text-to-speech
- **Emotion Analysis** and sentiment tracking
- **Memory System** for context-aware conversations
- **Analytics Dashboard** for insights and trends
- **Persona Customization** for personalized AI behavior

## ✨ Features

### Core Features

#### 1. **Authentication System** 🔐
- **JWT-based authentication** with secure token management
- **Login/Register pages** with animated UI
- **Protected routes** for authenticated content
- **Session persistence** with localStorage
- **Auth bypass mode** for development/testing

**Why Used:**
- JWT provides stateless authentication, perfect for microservices
- Secure token storage and automatic token refresh
- Clean separation between public and protected routes

#### 2. **Real-time Chat Interface** 💬
- **Streaming responses** for real-time message display
- **WebSocket support** for bidirectional communication
- **Message history** with persistent storage
- **Emotion tagging** on AI responses
- **Typing indicators** and loading states
- **Message statistics** (processing time, memory usage)

**Why Used:**
- Server-Sent Events (SSE) for efficient streaming
- WebSocket for real-time bidirectional chat
- Optimistic UI updates for better UX

#### 3. **Avatar System** 🎭
- **Emotion-based animations** (happy, sad, angry, surprised, etc.)
- **Real-time emotion sync** with chat responses
- **Voice interaction** with visual feedback
- **Personality traits display** (empathy, expressiveness)
- **Gesture animations** (jump, spin, shake, bounce)
- **Floating emoji effects** for emotional feedback

**Why Used:**
- Visual feedback enhances user engagement
- Emotion synchronization creates immersive experience
- CSS animations provide smooth, performant visuals

#### 4. **Voice Interaction** 🎤
- **Speech-to-Text** with real-time transcription
- **Text-to-Speech** for AI responses
- **Voice streaming** via WebSocket
- **Speaker recognition** with pitch and volume matching
- **Audio worklet processing** for low-latency audio
- **Noise filtering** and silence detection

**Why Used:**
- AudioWorklet API for efficient audio processing
- WebSocket binary streaming for real-time audio
- Speaker recognition prevents interference from background noise

#### 5. **Memory System** 🧠
- **Semantic memory storage** with importance scoring
- **Memory search** with category filtering
- **Memory statistics** and analytics
- **Context-aware responses** using stored memories
- **Memory deletion** and management

**Why Used:**
- Enables personalized, context-aware conversations
- Importance scoring prioritizes relevant memories
- Semantic search finds related memories efficiently

#### 6. **Analytics Dashboard** 📊
- **Interaction statistics** (total messages, session length)
- **Emotion distribution** charts
- **Topic analysis** with sentiment scoring
- **Emotion trends** over time (7/30/90 days)
- **Memory statistics** and insights
- **Real-time data updates**

**Why Used:**
- Provides insights into user interaction patterns
- Helps understand AI performance and user satisfaction
- Trend analysis identifies patterns over time

#### 7. **Persona System** 🎨
- **Customizable AI personality** traits
- **Tone and style** configuration
- **Background and context** settings
- **Real-time persona updates**
- **Persona reset** functionality

**Why Used:**
- Allows personalization of AI behavior
- Creates unique user experiences
- Enables A/B testing of different personalities

### Micro-Features

#### UI/UX Enhancements
- **Smooth animations** and transitions throughout
- **Loading states** with spinners and skeletons
- **Error handling** with user-friendly messages
- **Responsive design** for mobile and desktop
- **Dark theme** with neon accents
- **Hover effects** and interactive elements
- **Toast notifications** for user feedback

#### Performance Optimizations
- **Lazy loading** for routes and components
- **Code splitting** for smaller bundle sizes
- **Memoization** for expensive computations
- **Debounced inputs** for search and filters
- **Optimistic updates** for instant feedback
- **Efficient re-renders** with React hooks

#### Developer Experience
- **TypeScript-ready** structure
- **ESLint** configuration
- **Hot module replacement** for fast development
- **Environment variables** for configuration
- **Modular architecture** for easy maintenance

## 🏗️ Architecture

### Application Flow

```
User → Authentication → Protected Routes → Main Application
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Dashboard Page                    Chat Page
                    ↓                               ↓
        Analytics Component              Avatar + Chat Sync
                    ↓                               ↓
            API Calls (REST/WS)          Voice Stream (WebSocket)
                    ↓                               ↓
                Backend API                    Audio Processing
```

### State Management

- **Context API** for global state (Auth, Theme)
- **Local State** with React hooks for component-specific state
- **Custom Hooks** for reusable logic (useAuth, useChat, useVoiceStream)

### Data Flow

1. **User Action** → Component Event Handler
2. **API Call** → HTTP Client (Axios) or WebSocket
3. **Response Processing** → State Update
4. **UI Re-render** → User Feedback

## 🛠️ Technology Stack

### Core Technologies

| Technology | Version | Why Used |
|------------|---------|----------|
| **React** | 19.2.0 | Modern UI library with hooks, fast rendering |
| **React Router DOM** | Latest | Client-side routing, protected routes |
| **Vite** | 7.2.4 | Fast build tool, HMR, optimized production builds |
| **Axios** | 1.13.2 | HTTP client with interceptors, request/response handling |
| **JWT Decode** | 4.0.0 | Token parsing and validation |

### Why These Technologies?

#### React 19
- **Latest features**: Concurrent rendering, automatic batching
- **Performance**: Fast virtual DOM, efficient updates
- **Ecosystem**: Large community, extensive libraries

#### Vite
- **Speed**: Lightning-fast HMR, instant server start
- **Optimization**: Tree-shaking, code splitting
- **Modern**: ES modules, native ESM support

#### React Router
- **SPA Routing**: Client-side navigation without page reloads
- **Protected Routes**: Easy authentication integration
- **Nested Routes**: Organized route structure

#### Axios
- **Interceptors**: Automatic token injection
- **Error Handling**: Centralized error management
- **Request/Response Transform**: Data normalization

## 📁 Project Structure

```
ai-friend-ui/
├── public/
│   ├── audio_worklet/
│   │   └── voice_processor.js    # Audio processing worklet
│   └── vite.svg
├── src/
│   ├── api/                       # API integration layer
│   │   ├── analytics.js          # Analytics endpoints
│   │   ├── auth.js                # Authentication helpers
│   │   ├── avatar.js              # Avatar control API
│   │   ├── chat.js                # Chat endpoints (REST + WS)
│   │   ├── client.js              # Axios instance with interceptors
│   │   ├── memory.js              # Memory management API
│   │   ├── persona.js             # Persona configuration API
│   │   ├── profile.js             # User profile API
│   │   └── voice.js               # Voice streaming API
│   ├── components/
│   │   ├── Analytics/             # Analytics display component
│   │   ├── Auth/                  # Login/Register components
│   │   ├── Avatar/                # 3D Avatar with animations
│   │   ├── Chat/                  # Chat interface
│   │   ├── Layout/                # Layout components
│   │   ├── Navigation/            # Top navigation bar
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   ├── context/
│   │   ├── AuthContext.jsx        # Global auth state
│   │   └── FriendContext.jsx      # AI friend state
│   ├── hooks/
│   │   ├── useChat.jsx            # Chat logic hook
│   │   ├── useEmotionMapper.js    # Emotion mapping utility
│   │   ├── useMicrophone.js       # Microphone handling
│   │   ├── useProfileSync.js      # Profile synchronization
│   │   ├── useVoiceStream.js      # Voice streaming hook
│   │   └── useWebSocketChat.js    # WebSocket chat hook
│   ├── pages/
│   │   ├── AnalyticsPage.jsx      # Analytics dashboard
│   │   ├── ChatPage.jsx           # Main chat interface
│   │   └── Dashboard.jsx           # Home dashboard
│   ├── services/
│   │   ├── chatService.js          # Chat service layer
│   │   └── http.js                 # HTTP service
│   ├── styles/
│   │   └── global.css              # Global styles
│   ├── config/
│   │   └── api.js                  # API configuration
│   ├── App.jsx                     # Main app component with routing
│   └── main.jsx                    # Application entry point
├── Documentation_api               # Backend API documentation
├── Dockerfile                      # Docker container definition
├── docker-compose.yml              # Docker Compose configuration
├── .dockerignore                   # Docker ignore patterns
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Backend API** running on `http://127.0.0.1:8000`
- **Modern browser** with WebSocket and AudioWorklet support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-friend-ui
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file:
```env
VITE_API_BASE=http://127.0.0.1:8000/api
VITE_BYPASS_AUTH=false
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://127.0.0.1:8000/api` | Backend API base URL |
| `VITE_BYPASS_AUTH` | `false` | Skip authentication (dev mode) |

## 🐳 Docker Setup

### Quick Start with Docker

1. **Build the Docker image**
```bash
docker build -t ai-friend-ui .
```

2. **Run the container**
```bash
docker run -p 3000:80 -e VITE_API_BASE=http://your-backend-url/api ai-friend-ui
```

3. **Or use Docker Compose**
```bash
docker-compose up -d
```

### Docker Configuration

The Docker setup includes:
- **Multi-stage build** for optimized image size
- **Nginx** for serving production build
- **Environment variable** support
- **Health checks** for container monitoring

See [Docker Setup](#docker-setup) section for detailed instructions.

## 🔌 API Integration

### Base Configuration

All API endpoints are configured in `src/config/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
```

### API Modules

#### Authentication (`/api/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

#### Chat (`/api/chat`)
- `POST /chat/send` - Send message
- `GET /chat/stream?message=...` - Stream response (SSE)
- `GET /chat/history?limit=50` - Get chat history
- `DELETE /chat/clear` - Clear conversation
- `WS /chat/ws/{user_id}` - WebSocket chat

#### Voice (`/api/voice`)
- `WS /voice/stream/{user_id}` - Voice streaming WebSocket
- `POST /voice/stt` - Speech-to-text
- `POST /voice/tts?text=...` - Text-to-speech

#### Memory (`/api/memory`)
- `POST /memory/save` - Save memory
- `POST /memory/search` - Search memories
- `DELETE /memory/{id}` - Delete memory
- `GET /memory/stats` - Memory statistics

#### Analytics (`/api/analytics`)
- `GET /analytics/overview` - Overview statistics
- `GET /analytics/emotion-trends?days=7` - Emotion trends
- `GET /analytics/topics` - Topic analysis

#### Persona (`/api/persona`)
- `GET /persona/get` - Get persona config
- `POST /persona/update` - Update persona
- `POST /persona/reset` - Reset persona

#### Avatar (`/api/avatar`)
- `POST /avatar/expression` - Set emotion expression
- `POST /avatar/animation` - Play animation
- `GET /avatar/sync-speech?text=...` - Speech sync data

### Request/Response Format

All requests use JSON format. Responses follow this structure:

```javascript
{
  "data": { ... },
  "status": 200,
  "message": "Success"
}
```

### Error Handling

API errors are handled centrally through Axios interceptors:

```javascript
// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 📦 Component Documentation

### Core Components

#### `<App />`
Main application component with routing configuration.

**Routes:**
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
- `/chat` - Chat interface (protected)
- `/analytics` - Analytics page (protected)

#### `<Navigation />`
Top navigation bar with:
- Route links (Dashboard, Chat, Analytics)
- User information display
- Logout button
- Active route highlighting

#### `<ProtectedRoute />`
Wrapper component for protected routes:
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading state during auth check

#### `<Dashboard />`
Main dashboard page displaying:
- Statistics cards
- Emotion distribution
- Top topics
- Persona information
- Quick actions

#### `<ChatPage />`
Main chat interface with:
- Avatar component (left side)
- Chat component (right side)
- Emotion synchronization
- Real-time updates

#### `<Avatar />`
3D avatar component with:
- Emotion-based animations
- Voice interaction controls
- Personality traits display
- Gesture animations

#### `<Chat />`
Chat interface with:
- Message history
- Streaming responses
- Input field with send button
- Emotion tags on messages
- Statistics display

### Custom Hooks

#### `useAuth()`
Provides authentication state and methods:
```javascript
const { user, loading, login, logout } = useAuth();
```

#### `useVoiceStream()`
Handles voice streaming:
```javascript
await useVoiceStream({
  userId: "user123",
  onPartial: (text) => { ... },
  onFinal: (text) => { ... },
  onAudio: () => { ... },
  onError: (err) => { ... }
});
```

#### `useChat()`
Chat functionality hook:
```javascript
const { messages, send, loading } = useChat();
```

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Development Workflow

1. **Start backend API** on `http://127.0.0.1:8000`
2. **Start frontend** with `npm run dev`
3. **Open browser** to `http://localhost:5173`
4. **Make changes** - HMR will update automatically

### Code Style

- **ESLint** for code quality
- **Prettier** (recommended) for formatting
- **Functional components** with hooks
- **Named exports** for components
- **CamelCase** for variables and functions

## 🏭 Production Build

### Build Process

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory:
- **Minified** JavaScript and CSS
- **Tree-shaken** unused code
- **Code splitting** for optimal loading
- **Asset optimization** (images, fonts)

### Deployment

#### Static Hosting (Vercel, Netlify, etc.)

1. Build the project: `npm run build`
2. Deploy the `dist/` directory
3. Configure environment variables in hosting platform

#### Docker Deployment

See [Docker Setup](#docker-setup) section.

#### Nginx Configuration

Example Nginx config for production:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Security Considerations

- **JWT tokens** stored in localStorage (consider httpOnly cookies for production)
- **HTTPS** required for production
- **CORS** configured on backend
- **Input validation** on both frontend and backend
- **XSS protection** through React's built-in escaping
- **CSRF protection** via token validation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend has CORS enabled
   - Check API base URL configuration

2. **WebSocket Connection Failed**
   - Verify backend WebSocket server is running
   - Check firewall/network settings

3. **Audio Not Working**
   - Ensure browser supports AudioWorklet
   - Check microphone permissions

4. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version (18+)

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📧 Contact

[Contact Information]

---

**Built with ❤️ using React, Vite, and modern web technologies**
