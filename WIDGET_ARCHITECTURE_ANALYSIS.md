# Widget Architecture Analysis

## Overview
The IntelliConvo widget follows a clean, modular architecture with clear separation of concerns using managers, handlers, and renderers.

## Architecture Patterns Identified

### 1. **Manager Pattern**
Managers handle specific domains with full lifecycle management:
- `StorageManager` - Local storage and session handling
- `NotificationManager` - Sound and desktop notifications
- `AnalyticsManager` - Event tracking
- `SettingsManager` - Widget configuration from server
- `SocketManager` - WebSocket connection and event handling

### 2. **Handler Pattern**
Handlers process user interactions and business logic:
- `MessageHandler` - Message sending/receiving/display logic
- `FileHandler` - File upload and attachment handling
- `VoiceHandler` - Speech recognition for voice input
- `KeyboardHandler` - Keyboard shortcuts and accessibility
- `TextToSpeechHandler` - Voice output

### 3. **Renderer Pattern**
Renderers are responsible for generating HTML:
- `LauncherRenderer` - Chat launcher button
- `ChatWindowRenderer` - Main chat window HTML structure
- `ComponentRenderer` - Smaller components (starters, quick replies, emoji picker)

### 4. **State Management**
- Centralized `StateManager` class managing widget state
- Subscribe/notify pattern for state changes
- State synced to a compatible state object for managers

### 5. **Type System**
Strong TypeScript typing with dedicated type files:
- `types/config.ts` - Widget configuration
- `types/settings.ts` - Server-provided settings
- `types/message.ts` - Message structure
- `types/state.ts` - Widget state
- `types/handlers.ts` - Handler dependencies

## Key Patterns for Human Handoff Implementation

### Message Display Pattern
```typescript
// MessageHandler.displayMessage()
// Creates message div with:
// - Role-based CSS class: `intelliconvo-transcript-${role}`
// - Optional avatar for assistant
// - Sanitized content
// - Optional timestamp
```

### Socket Event Pattern
```typescript
// SocketManager listens for events and calls callbacks:
this.socket.on('stream', (data) => {
  if (this.eventHandlers.onStream) {
    this.eventHandlers.onStream(data.chunk);
  }
});
```

### Settings Integration Pattern
```typescript
// Settings loaded from server and accessed via:
this.settings?.propertyName || defaultValue

// Settings updated via:
this.settingsManager.loadSettings() // async
this.settings = await this.settingsManager.getSettings()
```

### Component Rendering Pattern
```typescript
// ComponentRenderer methods create HTML strings
// Parent adds event listeners after rendering
container.innerHTML = `<div>...</div>`;
container.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', handler);
});
```

## Implementation Strategy for Human Handoff

### 1. **Add Handoff Fields to Types**
**File:** `widget/src/types/settings.ts`
- Add handoff configuration fields matching backend WidgetSettings

### 2. **Extend Message Type**
**File:** `widget/src/types/message.ts`
- Add 'agent' to role union type
- Add optional agentId field

### 3. **Add Socket Events**
**File:** `widget/src/managers/SocketManager.ts`
- Add event listeners: `conversation-status-changed`, `agent-joined`, `agent-typing`, `agent-message`, `agent-left`
- Add event handlers to SocketEventHandlers interface
- Add emit method for `request-agent` event

### 4. **Update MessageHandler**
**File:** `widget/src/handlers/MessageHandler.ts`
- Update `displayMessage()` to handle 'agent' role
- Add agent avatar/styling differentiation
- Add method for system messages

### 5. **Add Handoff UI Components**
**File:** `widget/src/renderers/ComponentRenderer.ts` or `ChatWindowRenderer.ts`
- Add "Talk to Human" button rendering method
- Add agent typing indicator rendering
- Add system message rendering

### 6. **Wire Up in Main Widget**
**File:** `widget/src/index.ts`
- Add socket event handlers in constructor
- Add method to emit `request-agent`
- Add method to display system messages
- Add button click handler

## Code Conventions to Follow

1. **Error Handling**: Use `WidgetError` class with error codes from `WIDGET_ERRORS`
2. **HTML Sanitization**: Always use `sanitizeHtml()` or `sanitizeHtmlWithConfig()`
3. **Type Safety**: Maintain strict TypeScript typing, no `any` types
4. **Event Listeners**: Clean up listeners in cleanup methods
5. **State Updates**: Use StateManager methods, not direct mutation
6. **Null Checks**: Always check for element existence before DOM manipulation
7. **Settings Access**: Use optional chaining with defaults: `this.settings?.prop || default`
8. **Logging**: Use `console.log/warn/error` with `[Component]` prefix for debugging

## Files to Modify (in order)

1. ✅ **types/settings.ts** - Add handoff settings
2. ✅ **types/message.ts** - Add agent role
3. ✅ **managers/SocketManager.ts** - Add socket events
4. ✅ **handlers/MessageHandler.ts** - Handle agent messages
5. ✅ **renderers/ComponentRenderer.ts** - Add handoff button
6. ✅ **index.ts** - Wire everything together

## Testing Checklist

- [ ] Button appears with configured text
- [ ] Button triggers escalation correctly
- [ ] Agent messages display with correct styling
- [ ] Agent typing indicator shows/hides correctly
- [ ] System messages display for handoff events
- [ ] Settings from backend apply correctly
- [ ] All socket events handled properly
- [ ] No console errors
- [ ] Responsive on mobile
