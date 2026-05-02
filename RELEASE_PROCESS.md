# IntelliConvo v1.0.1 Release Process (For Seller)

This document outlines the steps YOU need to take to release v1.0.1 on CodeCanyon.

---

## Pre-Release Checklist

### 1. Code Quality Checks

- [ ] All TypeScript type-checks pass
  ```bash
  cd backend && npm run type-check
  cd frontend && npm run type-check
  cd widget && npm run type-check
  ```

- [ ] All tests pass (if you have tests)
  ```bash
  cd backend && npm test
  ```

- [ ] No console errors or warnings in production build
  ```bash
  cd backend && npm run build
  cd frontend && npm run build
  cd widget && npm run build
  ```

- [ ] Prisma migrations are clean and applied
  ```bash
  cd backend
  npx prisma migrate status
  # Should show all migrations applied
  ```

### 2. Feature Testing

- [ ] Test human handoff flow end-to-end
- [ ] Test feedback system
- [ ] Test agent message routing
- [ ] Test all existing v1.0.0 features still work
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test widget on external website
- [ ] Test mobile responsiveness

### 3. Documentation Updates

- [ ] Update CHANGELOG.md with v1.0.1 changes
- [ ] Update README.md if needed
- [ ] Create/update UPDATE_GUIDE_v1.0.1.md (✅ Already done)
- [ ] Update API documentation if endpoints changed
- [ ] Update widget integration documentation if needed

---

## Version Update Process

### Step 1: Update Version Numbers

Update version in all `package.json` files:

**backend/package.json**:
```json
{
  "name": "intelliconvo-backend",
  "version": "1.0.1",
  ...
}
```

**frontend/package.json**:
```json
{
  "name": "intelliconvo-frontend",
  "version": "1.0.1",
  ...
}
```

**widget/package.json**:
```json
{
  "name": "intelliconvo-widget",
  "version": "1.0.1",
  ...
}
```

### Step 2: Create CHANGELOG.md

Create or update `CHANGELOG.md` in the root directory:

```markdown
# Changelog

All notable changes to IntelliConvo will be documented in this file.

## [1.0.1] - 2025-12-01

### Added
- **Human Handoff Feature**: AI can intelligently suggest connecting users to human agents
  - Configurable handoff button in widget
  - Agent dashboard integration for taking conversations
  - Real-time message routing to agents
  - Agent typing indicators
  - Conversation resolution by agents
- **Customer Feedback System**: 5-star rating system after conversation resolution
  - Optional feedback comments
  - Feedback stored in database for analytics
- **Real-time Updates**: Instant notifications for agent actions
  - Agent joined notifications
  - Agent left notifications
  - Conversation status change events

### Changed
- Improved AI prompt to be more conservative about suggesting handoff
- Enhanced widget UI for agent messages (green bubbles with "A" avatar)
- Updated Socket.IO event handlers for better real-time communication

### Fixed
- Fixed message routing when agent is active (messages no longer go to AI)
- Fixed typing indicator stuck issue when messaging agents
- Fixed agent message styling in widget

### Database
- Added `feedbackRating` column to Conversation table (nullable integer)
- Added `feedbackComment` column to Conversation table (nullable text)
- Migration file: `20251201233825_add_conversation_feedback`

### Migration Notes
- All migrations are backward compatible
- Safe to run on live production databases
- No breaking changes to existing functionality

## [1.0.0] - 2025-11-29

### Initial Release
- AI-powered conversational widget
- Multi-site management
- Website crawling and embedding
- Vector search with Pinecone
- Stripe subscription billing
- Admin dashboard
- Real-time chat with Socket.IO
```

---

## Packaging for CodeCanyon

### Step 3: Clean Up Files

Remove development files that customers don't need:

```bash
# Navigate to project root
cd /path/to/IntelliConvo

# Remove node_modules from all directories
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove build artifacts
rm -rf backend/dist
rm -rf frontend/.next
rm -rf widget/dist

# Remove development files
rm -rf .git
rm -f .DS_Store
rm -f **/.DS_Store

# Remove personal/sensitive files
rm -f backend/.env
rm -f frontend/.env.local

# Keep .env.example files for customers
```

### Step 4: Create .env.example Files

Ensure you have up-to-date `.env.example` files:

**backend/.env.example**:
```env
# Server
NODE_ENV=production
PORT=5001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/intelliconvo

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=intelliconvo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_ANNUAL=price_your_annual_price_id

# AWS S3 (optional - for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Resend (optional - for transactional emails)
RESEND_API_KEY=
```

**frontend/.env.local.example**:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=IntelliConvo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Update Documentation

Create a comprehensive README.md for customers:

**README.md** (Root directory):
```markdown
# IntelliConvo v1.0.1

AI-Powered Conversational Widget with Human Handoff

## What's New in v1.0.1

- **Human Handoff**: AI intelligently suggests connecting users to agents
- **Feedback System**: 5-star ratings after conversation resolution
- **Enhanced Agent Dashboard**: Real-time conversation management

For detailed update instructions, see [UPDATE_GUIDE_v1.0.1.md](UPDATE_GUIDE_v1.0.1.md)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- OpenAI API key
- Pinecone API key

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   npm run start
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   npm run build
   npm run start
   ```

3. **Widget Setup**
   ```bash
   cd widget
   npm install
   npm run build
   # Deploy dist/widget.js to your CDN
   ```

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md)

## Updating from v1.0.0

If you're updating from v1.0.0, please read [UPDATE_GUIDE_v1.0.1.md](UPDATE_GUIDE_v1.0.1.md) for step-by-step instructions.

## Support

- Documentation: See `/docs` folder
- Issues: Contact via CodeCanyon support
- Email: your-support-email@example.com

## License

Regular License / Extended License (as per CodeCanyon purchase)
```

### Step 6: Create Package Structure

Organize files for CodeCanyon submission:

```
IntelliConvo-v1.0.1/
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── .env.local.example
├── widget/
│   ├── src/
│   ├── webpack.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── docs/
│   ├── INSTALLATION.md
│   ├── API_DOCUMENTATION.md
│   └── TROUBLESHOOTING.md
├── README.md
├── CHANGELOG.md
├── UPDATE_GUIDE_v1.0.1.md
└── LICENSE.txt
```

### Step 7: Create Archive

```bash
# Navigate to parent directory
cd /path/to

# Create zip archive
zip -r IntelliConvo-v1.0.1.zip IntelliConvo/ \
  -x "*/node_modules/*" \
  -x "*/.git/*" \
  -x "*/.next/*" \
  -x "*/dist/*" \
  -x "*/.DS_Store" \
  -x "*.env"

# Verify archive
unzip -l IntelliConvo-v1.0.1.zip | head -50
```

---

## CodeCanyon Submission Process

### Step 8: Prepare Item Description Update

Update your CodeCanyon item description to include v1.0.1 features:

```
## Recent Update (v1.0.1) - December 1, 2025

New Features:
✅ Human Handoff - AI intelligently connects users to live agents
✅ Feedback System - 5-star ratings and comments
✅ Enhanced Agent Dashboard - Real-time conversation management
✅ Improved Message Routing - Seamless agent takeover

[Full Changelog]
```

### Step 9: Update Screenshots (Optional)

If you have new UI features, update screenshots:
- Agent handoff button in widget
- Feedback UI
- Agent dashboard with conversations
- Agent message styling

### Step 10: Upload to CodeCanyon

1. Log in to your CodeCanyon account
2. Go to "Downloads" → "Your Items"
3. Find "IntelliConvo"
4. Click "Upload New Version"
5. Upload `IntelliConvo-v1.0.1.zip`
6. Update version number: `1.0.1`
7. Update release notes:

```
Version 1.0.1 - December 1, 2025

NEW FEATURES:
- Human Handoff: AI can intelligently suggest connecting users to agents when needed
- Customer Feedback: 5-star rating system with optional comments after conversation resolution
- Real-time Agent Communication: Instant message routing and notifications
- Enhanced Agent Dashboard: Take over conversations, send messages, and resolve cases

IMPROVEMENTS:
- More conservative AI handoff suggestions
- Better agent message styling in widget
- Improved typing indicators

BUG FIXES:
- Fixed message routing when agent is active
- Fixed typing indicator persistence issue

DATABASE CHANGES:
- Added feedback columns to Conversation table
- Backward compatible migrations included

IMPORTANT: If updating from v1.0.0 in production, please read UPDATE_GUIDE_v1.0.1.md before deploying.

Estimated update time: 15-30 minutes
```

8. Click "Submit Update"

### Step 11: Customer Communication

After CodeCanyon approves the update, notify your customers:

**Email Template**:
```
Subject: IntelliConvo v1.0.1 Released - Human Handoff Feature

Hi [Customer Name],

We're excited to announce IntelliConvo v1.0.1 is now available!

NEW FEATURES:
🤖→👤 Human Handoff - AI intelligently suggests connecting users to live agents
⭐ Customer Feedback - 5-star ratings after conversations
💬 Real-time Agent Chat - Seamless agent takeover and messaging

IMPORTANT FOR PRODUCTION USERS:
If you're running v1.0.0 in production, please read the UPDATE_GUIDE_v1.0.1.md file included in the download. It contains:
- Step-by-step update instructions
- Production deployment workflow
- Migration safety notes
- Rollback procedures

The update takes approximately 15-30 minutes and requires:
- Database migrations (backward compatible)
- Service restart
- Optional: 5-10 minute maintenance window

Download v1.0.1 from your CodeCanyon downloads page.

Questions? Reply to this email or contact support.

Thank you for using IntelliConvo!

Best regards,
[Your Name]
```

---

## Post-Release Checklist

- [ ] Version uploaded to CodeCanyon
- [ ] CodeCanyon item description updated
- [ ] Release notes published
- [ ] Customer notification email sent
- [ ] Support documentation updated
- [ ] Monitor customer feedback/issues for first 48 hours
- [ ] Prepare hotfix process if critical issues arise

---

## Hotfix Process (If Needed)

If critical bugs are found after release:

1. **Create hotfix branch**:
   ```bash
   git checkout -b hotfix/v1.0.2
   ```

2. **Fix the issue**:
   - Make minimal changes
   - Test thoroughly
   - Update version to 1.0.2

3. **Fast-track release**:
   - Follow abbreviated release process
   - Mark as "Critical Update" on CodeCanyon
   - Notify affected customers immediately

---

## Support Preparation

### Common Customer Questions

**Q: How long does the update take?**
A: 15-30 minutes for the update, plus testing time. Production updates should be done during low-traffic periods.

**Q: Will this break my existing installation?**
A: No, v1.0.1 is fully backward compatible. Migrations only add nullable columns.

**Q: Do I need downtime?**
A: Option A requires 5-10 minutes downtime. Option B (blue-green) requires zero downtime but more setup.

**Q: Can I skip migrations?**
A: No, migrations are required for the feedback feature to work correctly.

**Q: What if the update fails?**
A: Follow the rollback procedure in UPDATE_GUIDE_v1.0.1.md to restore v1.0.0 from backup.

**Q: Are there new environment variables?**
A: No, all existing environment variables continue to work.

### Support Resources

Create these files for customer support:

1. **TROUBLESHOOTING.md** - Common issues and solutions
2. **FAQ.md** - Frequently asked questions
3. **VIDEO_TUTORIAL.md** - Links to update tutorial videos (if you create them)

---

## Success Metrics

Monitor these after release:

- Number of successful updates
- Support ticket volume
- Customer ratings/reviews
- Feature adoption rate
- Error reports

---

**Release Date**: December 1, 2025
**Version**: 1.0.1
**Status**: Ready for submission
**Estimated Review Time**: 3-5 business days (CodeCanyon)
