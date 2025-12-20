-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'NEEDS_AGENT', 'AGENT_ACTIVE', 'RESOLVED');

-- AlterEnum
ALTER TYPE "ConversationRole" ADD VALUE 'AGENT';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "escalationReason" TEXT,
ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "agentJoinedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "agentNotes" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "agentId" TEXT;

-- AlterTable
ALTER TABLE "WidgetSettings" ADD COLUMN     "enableHumanHandoff" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "humanHandoffButtonText" TEXT NOT NULL DEFAULT 'Talk to a Human',
ADD COLUMN     "humanHandoffButtonShow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "humanHandoffButtonPosition" TEXT NOT NULL DEFAULT 'in-chat',
ADD COLUMN     "agentTypingText" TEXT NOT NULL DEFAULT 'Agent is typing...',
ADD COLUMN     "agentJoinedMessage" TEXT NOT NULL DEFAULT 'An agent has joined the conversation',
ADD COLUMN     "waitingForAgentMessage" TEXT NOT NULL DEFAULT 'Please wait while we connect you to an agent...',
ADD COLUMN     "noAgentsAvailableMessage" TEXT NOT NULL DEFAULT 'All agents are currently busy. We''ll respond as soon as possible.',
ADD COLUMN     "agentLeftMessage" TEXT NOT NULL DEFAULT 'The agent has left the conversation.',
ADD COLUMN     "showAgentAvatar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "agentAvatarUrl" TEXT,
ADD COLUMN     "agentAvatarFallback" TEXT NOT NULL DEFAULT 'AG',
ADD COLUMN     "agentBubbleBackgroundColor" TEXT NOT NULL DEFAULT '#10b981',
ADD COLUMN     "agentBubbleTextColor" TEXT NOT NULL DEFAULT '#ffffff';

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_siteId_status_idx" ON "Conversation"("siteId", "status");

-- CreateIndex
CREATE INDEX "Conversation_assignedAgentId_idx" ON "Conversation"("assignedAgentId");

-- CreateIndex
CREATE INDEX "Message_agentId_idx" ON "Message"("agentId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
