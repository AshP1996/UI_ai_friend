# 🏗️ Architecture Documentation

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application (SPA)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   Auth   │  │  Router  │  │  Context │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │           Component Layer                    │   │  │
│  │  │  Dashboard │ Chat │ Avatar │ Analytics      │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │            API Layer                         │   │  │
│  │  │  REST Client │ WebSocket │ Audio Worklet    │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │   Chat    │  │  Voice   │  │ Analytics│ │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Memory   │  │ Persona  │  │  Avatar  │                │
│  │  Module  │  │  Module  │  │  Module  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── BrowserRouter
│       ├── Routes (Public)
│       │   ├── /login → Login
│       │   └── /register → Register
│       │
│       └── Routes (Protected)
│           └── ProtectedRoute
│               ├── Navigation
│               └── Routes
│                   ├── /dashboard → Dashboard
│                   ├── /chat → ChatPage
│                   │   ├── Avatar
│                   │   └── Chat
│                   └── /analytics → AnalyticsPage
│                       └── Analytics
```

### Data Flow

#### Authentication Flow

```
1. User enters credentials
   ↓
2. Login component calls API
   ↓
3. Backend validates and returns JWT
   ↓
4. Token stored in localStorage
   ↓
5. AuthContext updates user state
   ↓
6. Router redirects to /dashboard
```

#### Chat Flow

```
1. User types message
   ↓
2. Chat component sends to API
   ↓
3. Backend processes with AI
   ↓
4. Response streamed back (SSE)
   ↓
5. Chat component updates UI
   ↓
6. Emotion extracted from response
   ↓
7. Avatar component updates emotion
   ↓
8. Animation triggered
```

#### Voice Flow

```
1. User clicks "Listen" button
   ↓
2. Browser requests microphone access
   ↓
3. AudioWorklet processes audio
   ↓
4. Audio sent via WebSocket (binary)
   ↓
5. Backend processes speech
   ↓
6. Text response received
   ↓
7. Audio response received (TTS)
   ↓
8. Audio played through speakers
```

## State Management

### Global State (Context API)

#### AuthContext
```javascript
{
  user: { id, username, email, ... },
  loading: boolean,
  login: (userData, token) => void,
  logout: () => void,
  BYPASS_AUTH: boolean
}
```

#### FriendContext (Future)
```javascript
{
  state: {
    mode: 'idle' | 'listening' | 'thinking' | 'responding',
    emotion: string,
    intensity: number,
    isSpeaking: boolean
  },
  setState: (state) => void
}
```

### Local State (React Hooks)

Each component manages its own local state:
- Form inputs
- UI state (loading, errors)
- Component-specific data
- Temporary calculations

## API Integration Patterns

### REST API Pattern

```javascript
// Request
const response = await api.post('/chat/send', {
  message: "Hello",
  save_to_memory: true
});

// Response
{
  response: "Hi there!",
  emotion: { primary_emotion: "happy", confidence: 0.9 },
  processing_time: 0.35,
  memories_used: 3
}
```

### WebSocket Pattern

```javascript
// Connection
const ws = new WebSocket('ws://127.0.0.1:8000/api/chat/ws/user123');

// Send message
ws.send(JSON.stringify({ message: "Hello" }));

// Receive message
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle response
};
```

### Server-Sent Events (SSE) Pattern

```javascript
// Connect
const eventSource = new EventSource('/api/chat/stream?message=Hello');

// Receive chunks
eventSource.onmessage = (event) => {
  const chunk = event.data;
  // Update UI with chunk
};
```

## Performance Optimizations

### Code Splitting

- Route-based splitting (React.lazy)
- Component-based splitting for heavy components
- Dynamic imports for utilities

### Caching Strategy

- **Static Assets**: 1 year cache
- **API Responses**: No cache (real-time data)
- **User Data**: localStorage for persistence

### Rendering Optimizations

- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Virtual scrolling for long lists (future)

## Security Architecture

### Authentication

1. **JWT Tokens**
   - Stored in localStorage
   - Sent in Authorization header
   - Validated on each request

2. **Protected Routes**
   - Route-level protection
   - Automatic redirect to login
   - Loading states during auth check

### Data Protection

- **Input Sanitization**: React's built-in XSS protection
- **HTTPS**: Required for production
- **CORS**: Configured on backend
- **Token Expiration**: Handled by backend

## Error Handling

### Error Boundaries

```javascript
// Component-level error boundaries
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### API Error Handling

```javascript
// Centralized error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle error
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

### User-Friendly Errors

- Display clear error messages
- Provide retry options
- Log errors for debugging
- Graceful degradation

## Scalability Considerations

### Frontend Scalability

- **Component Modularity**: Easy to add new features
- **State Management**: Can migrate to Redux if needed
- **Code Organization**: Clear separation of concerns
- **Performance**: Optimized for large datasets

### Backend Integration

- **API Versioning**: Ready for v2, v3, etc.
- **Microservices**: Can connect to multiple services
- **Load Balancing**: Stateless frontend
- **CDN**: Static assets can be served from CDN

## Future Enhancements

### Planned Features

1. **Offline Support**
   - Service Workers
   - IndexedDB for caching
   - Sync when online

2. **Real-time Collaboration**
   - Multiple users
   - Shared sessions
   - Live updates

3. **Advanced Analytics**
   - Custom dashboards
   - Export reports
   - Data visualization

4. **Mobile App**
   - React Native version
   - Native features
   - Push notifications

## Technology Decisions

### Why React?
- Large ecosystem
- Component reusability
- Strong community
- Performance optimizations

### Why Vite?
- Fast development
- Optimized builds
- Modern tooling
- Great DX

### Why Context API?
- Simple state management
- No external dependencies
- Built into React
- Sufficient for current needs

### Why Axios?
- Interceptors
- Request/response transformation
- Better error handling
- Promise-based

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
