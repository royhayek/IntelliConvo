/**
 * Database Seed Script
 * Creates initial admin user and default data
 *
 * Run with: npm run prisma:seed
 */

import { PrismaClient, AuthProvider, SettingCategory, SettingType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Default system settings configuration
const defaultSettings: Array<{
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  label: string;
  description: string;
  isSecret?: boolean;
}> = [
  // General Settings
  {
    key: 'general.platformName',
    value: 'IntelligentConvo',
    type: 'STRING',
    category: 'GENERAL',
    label: 'Platform Name',
    description: 'The name displayed throughout the platform',
  },
  {
    key: 'general.supportEmail',
    value: 'support@intelligentconvo.com',
    type: 'STRING',
    category: 'GENERAL',
    label: 'Support Email',
    description: 'Email address for support inquiries',
  },
  {
    key: 'general.maintenanceMode',
    value: 'false',
    type: 'BOOLEAN',
    category: 'GENERAL',
    label: 'Maintenance Mode',
    description: 'When enabled, only admins can access the platform',
  },

  // Authentication Providers
  {
    key: 'auth.emailEnabled',
    value: 'true',
    type: 'BOOLEAN',
    category: 'AUTHENTICATION',
    label: 'Email/Password Login',
    description: 'Allow users to sign in with email and password',
  },
  {
    key: 'auth.googleEnabled',
    value: 'true',
    type: 'BOOLEAN',
    category: 'AUTHENTICATION',
    label: 'Google Login',
    description: 'Allow users to sign in with Google OAuth',
  },
  {
    key: 'auth.githubEnabled',
    value: 'true',
    type: 'BOOLEAN',
    category: 'AUTHENTICATION',
    label: 'GitHub Login',
    description: 'Allow users to sign in with GitHub OAuth',
  },
  {
    key: 'auth.microsoftEnabled',
    value: 'false',
    type: 'BOOLEAN',
    category: 'AUTHENTICATION',
    label: 'Microsoft Login',
    description: 'Allow users to sign in with Microsoft OAuth',
  },

  // AI Model Selection
  {
    key: 'ai.defaultModel',
    value: 'gpt-4o-mini',
    type: 'STRING',
    category: 'AI_MODELS',
    label: 'Chat Completion Model',
    description: 'The OpenAI model used for generating chat responses',
  },
  {
    key: 'ai.embeddingModel',
    value: 'text-embedding-3-small',
    type: 'STRING',
    category: 'AI_MODELS',
    label: 'Embedding Model',
    description: 'The OpenAI model used for generating embeddings',
  },
  {
    key: 'ai.temperature',
    value: '0.7',
    type: 'NUMBER',
    category: 'AI_MODELS',
    label: 'Temperature',
    description: 'Controls randomness in AI responses (0.0-2.0)',
  },

  // AI Optimization & Token Budgets
  {
    key: 'ai.maxTokens',
    value: '4096',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Max Context Tokens',
    description: 'Maximum tokens allowed in the full context window',
  },
  {
    key: 'ai.maxResponseTokens',
    value: '500',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Max Response Length',
    description: 'Maximum tokens in AI response (caps output length)',
  },
  {
    key: 'ai.maxHistoryTokens',
    value: '1000',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Conversation History Budget',
    description: 'Token budget for conversation history context',
  },
  {
    key: 'ai.maxContentChunkTokens',
    value: '400',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Content Chunk Size',
    description: 'Maximum tokens per retrieved content chunk',
  },
  {
    key: 'ai.maxTotalInputTokens',
    value: '3000',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Total Input Budget',
    description: 'Maximum total tokens for system + history + content',
  },
  {
    key: 'ai.vectorSearchTopK',
    value: '3',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Vector Search Results',
    description: 'Number of content chunks to retrieve from vector search',
  },
  {
    key: 'ai.embeddingChunkSize',
    value: '500',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Embedding Chunk Size',
    description: 'Token size for content chunks during embedding generation',
  },
  {
    key: 'ai.systemPromptDescriptionLimit',
    value: '200',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Site Description Limit',
    description: 'Maximum tokens for site description in system prompt',
  },
  {
    key: 'ai.systemPromptInstructionsLimit',
    value: '150',
    type: 'NUMBER',
    category: 'AI_OPTIMIZATION',
    label: 'Special Instructions Limit',
    description: 'Maximum tokens for special instructions in system prompt',
  },

  // Security Settings
  {
    key: 'security.sessionTimeoutDays',
    value: '7',
    type: 'NUMBER',
    category: 'SECURITY',
    label: 'Session Timeout (Days)',
    description: 'Number of days before a user session expires',
  },
  {
    key: 'security.refreshTokenDays',
    value: '30',
    type: 'NUMBER',
    category: 'SECURITY',
    label: 'Refresh Token Expiry (Days)',
    description: 'Number of days before a refresh token expires',
  },
  {
    key: 'security.maxLoginAttempts',
    value: '5',
    type: 'NUMBER',
    category: 'SECURITY',
    label: 'Max Login Attempts',
    description: 'Maximum failed login attempts before lockout',
  },

  // Rate Limit Settings
  {
    key: 'rateLimit.windowMs',
    value: '60000',
    type: 'NUMBER',
    category: 'RATE_LIMIT',
    label: 'Rate Limit Window (ms)',
    description: 'Time window for rate limiting in milliseconds',
  },
  {
    key: 'rateLimit.maxRequests',
    value: '100',
    type: 'NUMBER',
    category: 'RATE_LIMIT',
    label: 'Max Requests',
    description: 'Maximum requests allowed per window',
  },
  {
    key: 'rateLimit.authWindowMs',
    value: '900000',
    type: 'NUMBER',
    category: 'RATE_LIMIT',
    label: 'Auth Rate Limit Window (ms)',
    description: 'Time window for auth rate limiting (15 minutes)',
  },
  {
    key: 'rateLimit.authMaxRequests',
    value: '5',
    type: 'NUMBER',
    category: 'RATE_LIMIT',
    label: 'Auth Max Requests',
    description: 'Maximum auth requests per window',
  },

  // Email Settings
  {
    key: 'email.fromAddress',
    value: 'onboarding@resend.dev',
    type: 'STRING',
    category: 'EMAIL',
    label: 'From Email Address',
    description: 'Email address used as the sender',
  },
  {
    key: 'email.fromName',
    value: 'IntelligentConvo',
    type: 'STRING',
    category: 'EMAIL',
    label: 'From Name',
    description: 'Name displayed as the email sender',
  },
  {
    key: 'email.provider',
    value: 'auto',
    type: 'STRING',
    category: 'EMAIL',
    label: 'Email Provider',
    description: 'Email provider to use (auto, resend, nodemailer, console)',
  },
  {
    key: 'email.verificationEnabled',
    value: 'true',
    type: 'BOOLEAN',
    category: 'EMAIL',
    label: 'Email Verification Required',
    description: 'Require email verification for new users',
  },

  // Billing Settings
  {
    key: 'billing.trialDays',
    value: '2',
    type: 'NUMBER',
    category: 'BILLING',
    label: 'Trial Period (Days)',
    description: 'Number of days for the free trial period. Set to 0 to disable trials.',
  },
  {
    key: 'billing.maxUrlsPerSite',
    value: '500',
    type: 'NUMBER',
    category: 'BILLING',
    label: 'Max URLs Per Site',
    description: 'Maximum URLs that can be crawled per site',
  },
  {
    key: 'billing.currency',
    value: 'USD',
    type: 'STRING',
    category: 'BILLING',
    label: 'Default Currency',
    description: 'Default currency for billing',
  },

  // Storage Settings
  {
    key: 'storage.maxFileSizeMb',
    value: '10',
    type: 'NUMBER',
    category: 'STORAGE',
    label: 'Max File Size (MB)',
    description: 'Maximum file upload size in megabytes',
  },
  {
    key: 'storage.uploadDir',
    value: 'uploads',
    type: 'STRING',
    category: 'STORAGE',
    label: 'Upload Directory',
    description: 'Directory for storing uploaded files',
  },
];

async function seedSystemSettings() {
  console.log('Seeding system settings...');

  for (const setting of defaultSettings) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    });

    if (existing) {
      console.log(`  Setting already exists: ${setting.key}`);
    } else {
      await prisma.systemSetting.create({
        data: {
          key: setting.key,
          value: setting.value,
          type: setting.type,
          category: setting.category,
          label: setting.label,
          description: setting.description,
          isSecret: setting.isSecret || false,
        },
      });
      console.log(`  Created setting: ${setting.key}`);
    }
  }

  console.log('System settings seeding completed!');
}

async function main() {
  console.log('Starting database seed...');

  // Create initial admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@intelligentconvo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);

    // Ensure the user has admin privileges
    if (!existingAdmin.isAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isAdmin: true },
      });
      console.log(`Upgraded existing user to admin: ${adminEmail}`);
    }
  } else {
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'System Administrator',
        authProvider: AuthProvider.EMAIL,
        passwordHash,
        isAdmin: true,
      },
    });

    console.log(`Created admin user: ${admin.email}`);
    console.log('');
    console.log('='.repeat(50));
    console.log('ADMIN CREDENTIALS (save these securely):');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('IMPORTANT: Change the admin password after first login!');
  }

  // Seed system settings
  await seedSystemSettings();

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
