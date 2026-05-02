# Changelog

All notable changes to IntelliConvo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2025-12-01

### Added

#### Human Handoff Feature
- **Intelligent AI Handoff Suggestions**: AI now intelligently detects when a conversation requires human assistance and suggests connecting to an agent
  - Triggers for: billing/payment issues, account access problems, complex technical issues, urgent complaints, explicit requests for human help
  - Does NOT trigger for: greetings, simple questions, general inquiries, or issues AI can handle
  - Configurable "Talk to a Human" button appears in widget only when AI suggests it
  - Button uses customizable text from `WidgetSettings.waitingForAgentMessage`

- **Agent Dashboard Integration**:
  - Agents can view escalated conversations in real-time
  - "Take Conversation" button to assign conversation to agent
  - Real-time conversation updates via Socket.IO
  - Agent can resolve conversations when complete

- **Real-time Message Routing**:
  - User messages automatically route to assigned agent when conversation is in `AGENT_ACTIVE` status
  - AI stops responding once agent takes over
  - No more conflicting responses between AI and agent
  - `message-routed-to-agent` Socket.IO event stops typing indicators in widget

- **Agent Typing Indicators**:
  - Widget shows typing indicator when agent is composing message
  - Uses same UI as AI typing indicator for consistency
  - Broadcast via `agent-typing` Socket.IO event

- **Agent Message Styling**:
  - Agent messages appear in green bubbles (configurable via CSS variables)
  - Shows "A" avatar badge instead of "Agent" text
  - Distinct from AI messages (assistant bubbles) and user messages
  - Fully responsive design

- **Conversation Status Management**:
  - New Socket.IO events: `conversation-status-changed`, `agent-joined`, `agent-left`
  - Real-time status updates in both widget and dashboard
  - Status transitions: `ACTIVE` → `NEEDS_AGENT` → `AGENT_ACTIVE` → `RESOLVED`

- **Conversation Resolution**:
  - Agent can mark conversation as resolved from dashboard
  - Widget receives `conversation-resolved` event with resolution message
  - Customizable resolution message via `WidgetSettings.agentLeftMessage`
  - Handoff button automatically hides after resolution

#### Customer Feedback System
- **5-Star Rating Interface**:
  - Clean, modern star rating UI appears after conversation resolution
  - Hover effects on stars with color transitions
  - Click to select rating (1-5 stars)
  - Optional text comment field for detailed feedback
  - Submit button with loading state

- **Feedback Storage**:
  - New database columns: `Conversation.feedbackRating` (integer), `Conversation.feedbackComment` (text)
  - Validation: Rating must be between 1-5 stars
  - Socket.IO event: `submit-feedback` with rating and optional comment
  - Feedback confirmation: `feedback-submitted` event on success

- **UI/UX Enhancements**:
  - Feedback UI only appears once per conversation
  - Thank you message after submission
  - Graceful error handling with user-friendly messages
  - Fully styled with CSS variables for customization

### Changed

#### AI Prompt Improvements
- Updated AI system prompt to be more conservative about suggesting handoff (`backend/src/services/ai.ts:78-83`)
- Only suggests handoff for legitimate complex issues
- Reduced false positive handoff suggestions
- Improved context awareness for when human help is truly needed

#### Widget Architecture
- Widget now stores `conversationId` from first AI response for all subsequent operations
- Automatically joins conversation Socket.IO room on first message
- Better separation of concerns between SocketManager and MessageHandler

#### Socket.IO Event Handling
- Enhanced `complete` event to include `suggestsHandoff` boolean flag
- Added `ConversationResolvedEventData` interface with `requestFeedback` field
- Added `MessageRoutedToAgentEventData` interface for agent routing acknowledgment
- Improved error handling and logging throughout socket handlers

### Fixed

- **Message Routing Bug**: User messages no longer go to AI when agent is active
  - Added conversation status check before AI processing (`backend/src/services/socket.ts:284-299`)
  - Messages now correctly broadcast to agent dashboard
  - Widget receives acknowledgment to stop typing indicator

- **Stuck Typing Indicator**: Loading dots no longer persist when messaging active agent
  - Backend emits `message-routed-to-agent` event
  - Widget handler immediately stops typing indicator (`widget/src/index.ts:295-298`)

- **Agent Message Styling**: Agent messages now display correctly
  - Fixed CSS with proper fallback values for background and text color
  - Changed avatar text from "Agent" to "A" to fit in circular badge
  - Added explicit padding, max-width, and box-shadow (`widget/src/styles.css:1930-1942`)

- **Handoff Button Timing**: Button no longer appears immediately on widget open
  - Removed premature `renderHandoffButton()` call from `openChat()` method
  - Button only appears when `suggestsHandoff === true` in AI response
  - Prevents "Conversation not found" errors

- **ConversationId vs SessionId**: Widget now uses correct database `conversationId`
  - Previously sent `sessionId` which doesn't exist until first message
  - Now stores and uses `conversationId` from `complete` event
  - Fixes 404 errors when requesting agent handoff

### Database

#### Migrations
- **Migration**: `20251201233825_add_conversation_feedback`
  ```sql
  ALTER TABLE "Conversation"
    ADD COLUMN "feedbackRating" INTEGER,
    ADD COLUMN "feedbackComment" TEXT;
  ```

#### Schema Changes
- `Conversation.feedbackRating` (Int?, nullable): 1-5 star rating
- `Conversation.feedbackComment` (String?, nullable): Optional text feedback

#### Backward Compatibility
- All migrations are backward compatible
- Only adds nullable columns (no breaking changes)
- Existing v1.0.0 installations can safely run migrations
- Safe to run on live production databases

### Technical Details

#### Modified Files
**Backend**:
- `src/services/socket.ts`: Message routing, handoff events, feedback handling
- `src/services/ai.ts`: Updated AI prompt for handoff suggestions
- `prisma/schema.prisma`: Added feedback columns
- `prisma/migrations/20251201233825_add_conversation_feedback/migration.sql`: New migration

**Frontend**:
- `lib/socket.ts`: Fixed backend URL derivation
- `app/sites/[siteId]/page.tsx`: Pass userId to ConversationsTabEnhanced

**Widget**:
- `src/index.ts`: ConversationId storage, event handlers, feedback UI
- `src/managers/SocketManager.ts`: New event interfaces, joinConversation, submitFeedback methods
- `src/handlers/MessageHandler.ts`: Agent avatar display
- `src/styles.css`: Agent message styling, feedback UI styling

#### New Socket.IO Events
- `message-routed-to-agent`: Acknowledges message sent to agent (not AI)
- `conversation-resolved`: Notifies widget of resolution with feedback request
- `submit-feedback`: Client sends feedback rating and comment
- `feedback-submitted`: Server confirms feedback saved
- `join-conversation`: Client joins conversation room for real-time updates

### Security

- No security vulnerabilities introduced
- Feedback validation: Rating must be 1-5 stars
- Conversation access control maintained via sessionId

### Performance

- No performance impact expected
- Nullable columns add minimal database overhead
- Socket.IO rooms efficiently manage real-time subscriptions

---

## [1.0.0] - 2025-11-29

### Initial Release

#### Core Features
- **AI-Powered Conversational Widget**: Embeddable chat widget powered by OpenAI GPT-4
- **Multi-Site Management**: Manage multiple websites from single dashboard
- **Website Crawling**: Automatic website content crawling and indexing
- **Vector Search**: Semantic search using OpenAI embeddings and Pinecone
- **Real-time Chat**: Socket.IO powered real-time messaging
- **Subscription Billing**: Stripe integration for monthly/annual subscriptions
- **Admin Dashboard**: Next.js dashboard for managing sites and conversations

#### Technology Stack
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Widget**: Vanilla TypeScript, Webpack, Socket.IO client
- **AI**: OpenAI GPT-4, text-embedding-3-small
- **Vector DB**: Pinecone
- **Caching**: Redis, BullMQ
- **Payments**: Stripe

#### Authentication
- JWT-based authentication
- Secure token management
- Role-based access control

#### Widget Features
- Customizable appearance (colors, position, size)
- Typing indicators
- Message timestamps
- Session persistence
- Mobile responsive

#### Admin Features
- Dashboard with analytics
- Site management
- Conversation history
- Usage tracking
- Subscription management

#### Deployment
- Docker support
- PM2 process management
- Environment-based configuration
- Health check endpoints

---

## Version History

- **1.0.1** (2025-12-01): Human handoff and feedback system
- **1.0.0** (2025-11-29): Initial release

---

## Upgrade Guides

- **v1.0.0 → v1.0.1**: See [UPDATE_GUIDE_v1.0.1.md](UPDATE_GUIDE_v1.0.1.md)

---

## Links

- **Documentation**: `/docs` folder
- **Support**: Contact via CodeCanyon
- **License**: See LICENSE.txt
