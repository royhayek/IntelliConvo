import {
  Globe,
  Bot,
  Shield,
  Clock,
  Mail,
  CreditCard,
  HardDrive,
  Key,
  Zap,
  Brain,
} from "lucide-react";

export const SETTING_CONFIG: Record<string, {
  inputType: 'text' | 'number' | 'select' | 'switch';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}> = {
  'ai.defaultModel': {
    inputType: 'select',
    options: [
      { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  'ai.embeddingModel': {
    inputType: 'select',
    options: [
      { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
      { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
      { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
    ],
  },
  'ai.temperature': {
    inputType: 'number',
    min: 0,
    max: 2,
    step: 0.1,
  },
  'general.maintenanceMode': { inputType: 'switch' },
  'security.requireEmailVerification': { inputType: 'switch' },
};

export const CATEGORY_ICONS = {
  GENERAL: Globe,
  AUTHENTICATION: Key,
  SECURITY: Shield,
  AI_MODELS: Brain,
  AI_OPTIMIZATION: Zap,
  RATE_LIMIT: Clock,
  EMAIL: Mail,
  BILLING: CreditCard,
  STORAGE: HardDrive,
} as const;

export const CATEGORY_NAMES: Record<string, string> = {
  GENERAL: 'General',
  AUTHENTICATION: 'Authentication',
  SECURITY: 'Security',
  AI_MODELS: 'AI Models',
  AI_OPTIMIZATION: 'AI Optimization',
  RATE_LIMIT: 'Rate Limiting',
  EMAIL: 'Email',
  BILLING: 'Billing',
  STORAGE: 'Storage',
};
