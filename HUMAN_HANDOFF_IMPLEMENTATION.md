# Human Handoff Implementation Guide

## Overview
This document tracks the implementation of the AI-to-Human handoff feature, allowing customer service agents to take over conversations when AI assistance is insufficient.

## Research Summary: AI Chatbot Human Handoff Best Practices (2025)

### Key Findings from Industry

#### 1. Common Escalation Triggers
- **Direct User Request**: "I want to talk to a human", "Connect me to support"
- **AI Confidence Threshold**: When AI is uncertain (confidence < 50% on 2+ consecutive responses)
- **Repeated Failures**: After 2-3 unhelpful responses
- **Sentiment Detection**: Negative emotion signals (ALL CAPS, frustrated language, negative keywords)
- **Specific Topics**: Billing, refunds, cancellations, account changes
- **Complex Issues**: Questions requiring human judgment or authorization

#### 2. How Handoff Works
1. **Conversation Context Preservation**: Full chat history is transferred to the human agent
2. **Queue Management**: Conversations waiting for agent pickup go into a queue
3. **Real-time Dashboard**: Agents see live conversations requiring intervention
4. **Agent Join/Leave**: Smooth transition with acknowledgment messages
5. **Status Indicators**: Shows "AI", "Waiting for Agent", "Agent Active", "Resolved"
6. **Agent Notifications**: Real-time alerts when escalation occurs

#### 3. Technical Implementation Pattern
Most systems use:
- **Socket.IO rooms** for real-time communication
- **Conversation status field** to track handoff state
- **Agent dashboard** showing pending conversations
- **Message sender tracking** (AI vs Human agent)
- **Agent assignment** to specific conversations

## Implementation Plan

### Phase 1: Database Schema Changes ✅ / ❌
**Goal**: Add conversation status tracking, escalation metadata, and agent assignment

#### Changes to Prisma Schema:
1. Add `ConversationStatus` enum
2. Add status tracking fields to `Conversation` model
3. Update `ConversationRole` to include `AGENT` role
4. Add agent reference to `Message` model
5. Add widget settings for human handoff customization

#### Migration Name:
`add_human_handoff_support`

### Phase 2: Widget Settings Enhancement ✅ / ❌
**Goal**: Make human handoff text configurable

#### New Widget Settings:
- `enableHumanHandoff` - Boolean to enable/disable feature
- `humanHandoffButtonText` - Default: "Talk to a Human"
- `humanHandoffButtonPosition` - Where to show the button
- `agentTypingText` - Default: "Agent is typing..."
- `agentJoinedMessage` - Default: "An agent has joined the conversation"
- `waitingForAgentMessage` - Default: "Please wait while we connect you to an agent..."
- `noAgentsAvailableMessage` - Default: "All agents are currently busy. We'll respond as soon as possible."

### Phase 3: Backend API Routes ✅ / ❌
**Goal**: Add endpoints for escalation and agent interaction

#### New Routes:
- `POST /api/v1/conversations/:conversationId/escalate` - Request human agent
- `POST /api/v1/conversations/:conversationId/take` - Agent takes conversation
- `POST /api/v1/conversations/:conversationId/resolve` - Mark as resolved
- `POST /api/v1/conversations/:conversationId/agent-message` - Agent sends message
- `GET /api/v1/conversations/queue` - Get escalated conversations waiting for agents
- `PATCH /api/v1/conversations/:conversationId/notes` - Update agent notes

### Phase 4: Socket.IO Event Handlers ✅ / ❌
**Goal**: Enable real-time communication for handoff

#### New Socket Events:
- `request-agent` - User requests human help
- `conversation-escalated` - Notify all agents of new escalation
- `agent-joined` - Agent takes conversation
- `agent-message` - Agent sends message (with streaming support)
- `agent-typing` - Agent is typing indicator
- `agent-left` - Agent resolves/closes conversation
- `conversation-updated` - General status update broadcast

### Phase 5: Frontend - Conversations Tab Real-time Updates ✅ / ❌
**Goal**: Make conversations list and messages update in real-time

#### Implementation:
- Connect to Socket.IO when viewing conversations
- Subscribe to conversation updates for the site
- Auto-update conversation list when new messages arrive
- Auto-update selected conversation messages in real-time
- Show real-time typing indicators
- Display conversation status badges

### Phase 6: Frontend - Agent Interface ✅ / ❌
**Goal**: Allow agents to interact with escalated conversations

#### Features:
- Status badges (AI Active / Waiting for Agent / Agent Active / Resolved)
- Filter conversations by status
- "Take Conversation" button for escalated conversations
- Reply textarea for agent responses (with real-time streaming)
- Agent typing indicator
- "Mark as Resolved" button
- Private agent notes section
- Visual distinction between AI and Agent messages
- Real-time notifications for new escalations
- Sound/desktop notifications (optional)

### Phase 7: Widget Updates ✅ / ❌
**Goal**: Enable users to request human assistance

#### Features:
- Configurable "Talk to Human" button
- Status indicator showing agent availability
- "Agent is typing..." indicator (configurable text)
- Visual distinction between AI and human messages
- System messages for handoff events (agent joined, etc.)

### Phase 8: Service Layer ✅ / ❌
**Goal**: Business logic for handoff operations

#### New Services:
- `ConversationHandoffService` - Handle escalation logic
- Update `ConversationService` - Add handoff-related queries
- Update `AI Service` - Check for escalation triggers
- `NotificationService` - Alert agents of escalations

### Phase 9: Testing & Polish ✅ / ❌
**Goal**: Ensure reliable operation

#### Testing:
- Test escalation flow end-to-end
- Test real-time updates in conversations tab
- Test multiple agents handling different conversations
- Test edge cases (agent disconnects, etc.)
- Test widget customization options
- Test notification system

## Technical Architecture

### Database Schema

```prisma
enum ConversationStatus {
  ACTIVE          // Normal AI chat
  NEEDS_AGENT     // Escalated, waiting for agent
  AGENT_ACTIVE    // Agent is handling
  RESOLVED        // Closed by agent
}

enum ConversationRole {
  USER
  ASSISTANT
  AGENT          // Human agent message
}

model Conversation {
  // Existing fields...
  status              ConversationStatus  @default(ACTIVE)
  escalatedAt         DateTime?
  escalationReason    String?
  assignedAgentId     String?
  assignedAgent       User?              @relation(fields: [assignedAgentId], references: [id])
  agentJoinedAt       DateTime?
  resolvedAt          DateTime?
  agentNotes          String?            @db.Text
}

model Message {
  // Existing fields...
  agentId             String?
  agent               User?              @relation(fields: [agentId], references: [id])
}

model WidgetSettings {
  // Existing fields...

  // Human Handoff Settings
  enableHumanHandoff          Boolean     @default(true)
  humanHandoffButtonText      String      @default("Talk to a Human")
  humanHandoffButtonShow      Boolean     @default(true)
  agentTypingText             String      @default("Agent is typing...")
  agentJoinedMessage          String      @default("An agent has joined the conversation")
  waitingForAgentMessage      String      @default("Please wait while we connect you to an agent...")
  noAgentsAvailableMessage    String      @default("All agents are currently busy. We'll respond as soon as possible.")
  agentLeftMessage            String      @default("The agent has left the conversation.")
}
```

### Socket.IO Events

#### Client → Server:
- `request-agent` - User clicks "Talk to Human"
- `agent-take-conversation` - Agent takes an escalated conversation
- `agent-send-message` - Agent sends a message
- `agent-start-typing` - Agent starts typing
- `agent-stop-typing` - Agent stops typing
- `agent-resolve-conversation` - Agent marks conversation as resolved
- `join-conversation` - Join specific conversation room for updates

#### Server → Client:
- `conversation-status-changed` - Status updated (to all in conversation)
- `conversation-escalated` - New escalation (to all agents)
- `agent-joined` - Agent took conversation (to user)
- `agent-typing` - Agent typing indicator (to user)
- `message` - New message in conversation (to all in conversation)
- `agent-left` - Agent resolved conversation (to user)
- `escalation-count-updated` - Update queue count (to all agents)

### API Endpoints

```
POST   /api/v1/conversations/:conversationId/escalate
POST   /api/v1/conversations/:conversationId/take
POST   /api/v1/conversations/:conversationId/resolve
POST   /api/v1/conversations/:conversationId/agent-message
GET    /api/v1/conversations/queue
PATCH  /api/v1/conversations/:conversationId/notes
```

## Implementation Progress

### ✅ Completed Tasks (Phases 1-7)

#### Phase 1: Database Schema Changes ✅
- ✅ Added `ConversationStatus` enum (ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED)
- ✅ Added `AGENT` role to `ConversationRole` enum
- ✅ Added handoff fields to `Conversation` model (status, escalatedAt, assignedAgentId, etc.)
- ✅ Added `agentId` field to `Message` model
- ✅ Added human handoff settings to `WidgetSettings` model (configurable messages, buttons, colors)
- ✅ Created and applied migration: `20251201172155_add_human_handoff_support/migration.sql`
- ✅ Database schema pushed and synced

#### Phase 2: Widget Settings Enhancement ✅
- ✅ Added configurable "Talk to Human" button text
- ✅ Added configurable agent typing indicator text
- ✅ Added configurable system messages (agent joined, waiting, no agents, agent left)
- ✅ Added agent avatar and bubble color settings
- ✅ All text is fully customizable through widget settings

#### Phase 3: Backend API Routes ✅
- ✅ `POST /api/v1/conversations/:conversationId/escalate` - Escalate to human
- ✅ `POST /api/v1/conversations/:conversationId/take` - Agent takes conversation
- ✅ `POST /api/v1/conversations/:conversationId/agent-message` - Agent sends message
- ✅ `POST /api/v1/conversations/:conversationId/resolve` - Mark as resolved
- ✅ `PATCH /api/v1/conversations/:conversationId/notes` - Update agent notes
- ✅ `GET /api/v1/conversations/queue` - Get escalation queue
- ✅ `GET /api/v1/conversations/queue/count` - Get queue count
- ✅ All routes include Swagger documentation

#### Phase 4: Socket.IO Event Handlers ✅
- ✅ `request-agent` - User requests human help (from widget)
- ✅ `agent-take-conversation` - Agent takes conversation
- ✅ `agent-send-message` - Agent sends message
- ✅ `agent-typing` - Agent typing indicator
- ✅ `agent-resolve-conversation` - Agent closes conversation
- ✅ `join-conversation` / `leave-conversation` - Room management
- ✅ Broadcast functions: `broadcastConversationEscalated`, `broadcastConversationStatusChange`, `broadcastConversationMessage`
- ✅ Widget-configurable system messages integrated

#### Phase 5: Frontend - Real-time Conversations Tab ✅
- ✅ Created Socket.IO client (`frontend/lib/socket.ts`)
- ✅ Created custom hook `useConversationSocket` with event handlers
- ✅ Real-time conversation list updates
- ✅ Real-time message updates
- ✅ Status change notifications

#### Phase 6: Frontend - Agent Interface ✅
- ✅ Enhanced conversations tab component (`conversations-tab-enhanced.tsx`)
- ✅ Status badges (AI Active, Needs Agent, Agent Active, Resolved)
- ✅ "Take Conversation" button for NEEDS_AGENT status
- ✅ Agent reply interface with textarea and send button
- ✅ Agent typing indicator (outgoing)
- ✅ "Resolve" button to close conversations
- ✅ Visual distinction between USER (gray), AI (indigo), AGENT (green) messages
- ✅ Mobile-responsive design
- ✅ Auto-scroll to latest messages

#### Phase 7: Backend DTOs Updated ✅
- ✅ Updated `ConversationDTO` with status and handoff fields
- ✅ Updated `MessageDTO` to include AGENT role and agentId
- ✅ Updated `ConversationDetailsDTO` to include assignedAgent info
- ✅ Updated `ConversationService` to return handoff fields

#### Phase 8: Swagger Response Schemas ✅
- ✅ Added complete response schemas to `GET /conversations/:conversationId` (backend/src/routes/conversations.ts:228-352)
- ✅ Added complete response schemas to `GET /conversations` with pagination (backend/src/routes/conversations.ts:22-145)
- ✅ Added response schema to `GET /conversations/queue` (backend/src/routes/conversations.ts:253-332)
- ✅ Added response schema to `POST /conversations/:conversationId/escalate` (backend/src/routes/conversations.ts:524-570)
- ✅ Added response schema to `POST /conversations/:conversationId/take` (backend/src/routes/conversations.ts:585-624)
- ✅ Added response schema to `POST /conversations/:conversationId/agent-message` (backend/src/routes/conversations.ts:638-699)
- ✅ Added response schema to `POST /conversations/:conversationId/resolve` (backend/src/routes/conversations.ts:715-763)
- ✅ Added response schema to `PATCH /conversations/:conversationId/notes` (backend/src/routes/conversations.ts:779-823)
- ✅ All response schemas include handoff fields (status, escalatedAt, assignedAgentId, agentJoinedAt, resolvedAt, agentNotes, assignedAgent)
- ✅ All message schemas include AGENT role and agentId field
- ✅ Ready for Orval regeneration

#### Phase 9: Frontend Type Cleanup ✅
- ✅ Removed dependency on separate type extensions file
- ✅ Updated `conversations-tab-enhanced.tsx` to use generated types directly
- ✅ Added temporary type bridges in component (lines 37-67) with clear comments
- ✅ TypeScript compilation passes with no errors
- ✅ Component is fully functional and type-safe
- ⏳ **Pending**: Backend restart → Orval regeneration → Remove temporary type bridges (lines 37-67)

### 📋 Next Steps

**IMMEDIATE - Final Cleanup**: Once backend is restarted:
1. Restart backend server (Docker or locally) to serve updated Swagger JSON
2. Run `npm run generate:api` in frontend directory
3. Remove lines 37-67 from `conversations-tab-enhanced.tsx` (temporary type bridges)
4. Update type casts to use generated types directly (no assertions needed)

- [ ] Phase 9: Widget Updates
  - Add "Talk to Human" button to widget
  - Add agent typing indicator (incoming)
  - Add system messages for handoff events
  - Visual distinction for agent messages

- [ ] Phase 10: Widget Settings UI
  - Admin interface for customizing handoff text
  - Color picker for agent bubble colors
  - Button position selector
  - Preview functionality

- [ ] Phase 11: Testing & Polish
  - End-to-end testing of handoff flow
  - Test real-time updates across multiple clients
  - Test edge cases (disconnections, etc.)
  - Performance optimization

## Configuration Options

Site owners can customize:
- Enable/disable human handoff feature
- "Talk to Human" button text
- "Agent is typing..." text
- System messages (agent joined, waiting, no agents available, agent left)
- Button visibility and position

## Future Enhancements (Optional)

- Agent availability status (online/offline)
- Agent profiles and specializations
- Automatic escalation based on sentiment analysis
- Canned responses for agents
- Agent performance metrics
- Multi-agent transfer
- Chat transcripts export
- Customer satisfaction ratings post-conversation
