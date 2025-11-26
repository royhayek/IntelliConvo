export interface MessageMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface ConversationStarters {
  startersHeadline: string;
  starters: { starterText: string }[];
}
