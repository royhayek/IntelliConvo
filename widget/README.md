# IntelliConvo Widget

Embeddable chat widget for the IntelliConvo platform. A self-contained JavaScript file that adds AI-powered chat and voice capabilities to any website.

## Features

- **Single-script embed** - One JavaScript file for easy integration
- **Dual modes** - Chat mode and Speak mode with voice I/O
- **Real-time streaming** - WebSocket-powered message streaming via Socket.io
- **Voice support** - Speech-to-text input and text-to-speech output
- **70+ customization options** - Colors, fonts, behavior, accessibility
- **Responsive design** - Mobile, tablet, and desktop support
- **Dark mode** - Light, dark, and auto theme detection
- **Accessibility** - Keyboard navigation, ARIA labels, reduced motion support
- **Auto-reconnect** - Intelligent connection recovery
- **Rate limiting** - Built-in protection against spam
- **Conversation persistence** - LocalStorage for message history

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

```bash
# Build in watch mode
npm run dev

# Or start dev server with HMR
npm run serve
```

### 3. Production Build

```bash
npm run build
```

Output: `dist/widget.js`

### 4. Basic Integration

```html
<script>
  window.intelliconvo = window.intelliconvo || function(){
    (window.intelliconvo.q=window.intelliconvo.q||[]).push(arguments)
  };
  window.intelliconvo('init', {
    siteId: 'your-site-id',
    apiUrl: 'https://api.yourdomain.com'
  });
</script>
<script src="https://cdn.yourdomain.com/widget.js" async></script>
```

## Configuration Options

```typescript
interface WidgetConfig {
  // Required
  siteId: string;                    // Site identifier from IntelliConvo

  // Optional
  apiUrl?: string;                   // API endpoint URL
  mode?: 'button' | 'inline';        // Display mode
  position?: 'bottom-right' |        // Button position
             'bottom-left' |
             'top-right' |
             'top-left';
  theme?: 'light' | 'dark' | 'auto'; // Theme preference
  language?: string;                 // Language code (default: 'en')
  loadSettingsFromServer?: boolean;  // Load customization from database

  // Event callbacks
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}
```

## Usage Examples

### Floating Button Mode (Default)

```javascript
intelliconvo('init', {
  siteId: 'site_123',
  mode: 'button',
  position: 'bottom-right',
  apiUrl: 'https://api.intelliconvo.com'
});
```

### Inline Embedded Mode

```html
<div id="intelliconvo-container"></div>

<script>
intelliconvo('init', {
  siteId: 'site_123',
  mode: 'inline',
  apiUrl: 'https://api.intelliconvo.com'
});
</script>
```

### With Event Callbacks

```javascript
intelliconvo('init', {
  siteId: 'site_123',
  apiUrl: 'https://api.intelliconvo.com',
  onMessage: (message) => {
    console.log('New message:', message);
    // Analytics tracking
    gtag('event', 'chat_message', {
      'message_type': message.role
    });
  },
  onError: (error) => {
    console.error('Chat error:', error);
  },
  onConnect: () => {
    console.log('Chat connected');
  },
  onDisconnect: () => {
    console.log('Chat disconnected');
  }
});
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile Safari iOS 12+
- Chrome Mobile 60+

## Project Structure

```
widget/
├── src/
│   ├── index.ts              # Main IntelliConvoWidget class
│   ├── styles.css            # Widget CSS
│   ├── constants/            # Default settings, error codes, breakpoints
│   ├── core/                 # Core utilities
│   │   ├── StateManager.ts   # Centralized state management
│   │   └── WidgetError.ts    # Error handling
│   ├── managers/             # Feature managers
│   │   ├── StorageManager.ts # LocalStorage persistence
│   │   ├── SettingsManager.ts# Server settings loader
│   │   ├── SocketManager.ts  # Socket.io connection
│   │   ├── NotificationManager.ts # Desktop/sound notifications
│   │   └── AnalyticsManager.ts    # Event tracking
│   ├── handlers/             # Event handlers
│   │   ├── MessageHandler.ts # Send/receive messages
│   │   ├── FileHandler.ts    # File attachments
│   │   ├── VoiceHandler.ts   # Speech-to-text
│   │   ├── TextToSpeechHandler.ts # Text-to-speech
│   │   └── KeyboardHandler.ts     # Keyboard navigation
│   ├── renderers/            # UI rendering
│   │   ├── LauncherRenderer.ts    # Chat button
│   │   ├── ChatWindowRenderer.ts  # Chat window
│   │   └── ComponentRenderer.ts   # Shared components
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utilities (sanitize, markdown, validation)
├── public/
│   └── demo.html             # Development demo page
├── dist/                     # Built output
└── webpack.config.js         # Build configuration
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Build in watch mode |
| `npm run build` | Production build (minified) |
| `npm run serve` | Webpack dev server with HMR |
| `npm run preview` | Build and serve locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run type-check` | TypeScript type checking |
| `npm run validate` | Run lint + type-check |

## Environment Configuration

### `.env.development`
```bash
WIDGET_API_URL=http://localhost:5001
```

### `.env.production`
```bash
WIDGET_API_URL=https://api.yourdomain.com
```

The API URL is embedded at build time. Users can override via `apiUrl` config.

## Accessibility Features

- **Keyboard Navigation** - Full keyboard support with focus management
- **Screen Readers** - ARIA labels and semantic HTML
- **High Contrast** - Automatic detection and enhanced contrast
- **Reduced Motion** - Respects `prefers-reduced-motion`
- **Focus Trap** - Proper focus management in modal mode

## Security Features

- **XSS Protection** - HTML sanitization for user input
- **CSP Compliant** - Works with Content Security Policy
- **Rate Limiting** - Built-in message and file rate limits
- **Input Validation** - Client and server-side validation

## Performance

- **Single bundle** - One JavaScript file
- **Lazy initialization** - Optional preload mode
- **Auto-reconnect** - Exponential backoff for connection recovery
- **LocalStorage** - Conversation persistence without server round-trips
- **Debounced events** - Optimized event handling

## API Integration

### REST Endpoints
```
GET /api/v1/widget/{siteId}/config   - Widget configuration
GET /api/v1/widget/{siteId}/starters - Conversation starters
```

### Socket.io Events
```
# Client → Server
join-site      - Join site room
send-message   - Send chat message

# Server → Client
message        - Streamed message chunks
message-complete - Message finished
typing         - Typing indicator
error          - Error notification
```

## Troubleshooting

### Widget not appearing
- Check browser console for errors
- Verify `siteId` is correct
- Ensure API endpoint is accessible (CORS)

### Connection failures
- Check network connectivity
- Verify WebSocket support isn't blocked
- Check `WIDGET_CDN_URL` in backend CORS config

### Voice not working
- Ensure HTTPS (required for Web Speech API)
- Check browser microphone permissions
- Verify browser supports Web Speech API

### Debug Mode

```javascript
window.INTELLICONVO_DEBUG = true;
intelliconvo('init', { siteId: '...' });
```