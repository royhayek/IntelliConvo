# IntelliConvo v1.0.1 Update Guide

## What's New in v1.0.1

This update adds powerful human handoff capabilities to IntelliConvo, allowing your agents to seamlessly take over conversations from the AI assistant.

### New Features

1. **Intelligent Human Handoff**
   - AI can intelligently suggest connecting users to human agents when needed
   - Only suggests handoff for complex issues that truly require human assistance
   - Configurable "Talk to a Human" button in widget

2. **Agent Conversation Management**
   - Agents can take over conversations from the dashboard
   - Real-time message routing to active agents
   - Agent typing indicators in widget
   - Agents can resolve conversations when complete

3. **Customer Feedback System**
   - 5-star rating system after conversation resolution
   - Optional feedback comments
   - Feedback stored for analytics and improvement

4. **Real-time Updates**
   - Instant notifications when agents join conversations
   - Live message delivery between users and agents
   - Conversation status updates

---

## For Customers: How to Update to v1.0.1

### Important: Production Update Strategy

If you already have v1.0.0 running in production with live customers, follow this recommended approach:

1. **Test in Development First** - Never update production directly
2. **Schedule Maintenance Window** - Plan for minimal downtime (5-10 minutes)
3. **Notify Users** - Inform customers of scheduled maintenance
4. **Use Blue-Green Deployment** (if possible) - Deploy to new server, switch when ready

### Prerequisites

- SSH/Terminal access to your server
- Node.js and npm installed
- PostgreSQL database access
- Backup of your current installation (highly recommended)
- A development/staging environment for testing (strongly recommended)

### Step 1: Backup Your Current Installation

**IMPORTANT**: Always backup before updating!

```bash
# Backup database
pg_dump -U your_username -d your_database_name > intelliconvo_backup_$(date +%Y%m%d).sql

# Backup .env files
cp backend/.env backend/.env.backup
cp frontend/.env.local frontend/.env.local.backup

# Backup the entire installation (optional but recommended)
tar -czf intelliconvo_v1.0.0_backup.tar.gz /path/to/intelliconvo
```

### Step 2: Download and Extract v1.0.1

1. Download the v1.0.1 package from CodeCanyon
2. Extract the package to a temporary location
3. Review the changelog to understand all changes

### Step 3: Stop Running Services

```bash
# Stop backend server (if using PM2)
pm2 stop intelliconvo-backend

# Stop frontend server (if using PM2)
pm2 stop intelliconvo-frontend

# Or if running with npm/node directly, stop the processes
```

### Step 4: Update Backend Files

```bash
cd /path/to/intelliconvo/backend

# Remove old node_modules (optional but recommended)
rm -rf node_modules

# Copy new files from v1.0.1 package
# Be careful not to overwrite your .env file!
cp -r /path/to/v1.0.1/backend/* .

# Restore your .env file if accidentally overwritten
cp .env.backup .env

# Install dependencies
npm install

# Generate Prisma client with new changes
npx prisma generate
```

### Step 5: Run Database Migrations

**CRITICAL STEP**: This adds the new feedback columns to your database.

```bash
cd /path/to/intelliconvo/backend

# Run migrations
npx prisma migrate deploy
```

**Expected Output**:
```
✔ Migrations applied successfully:
  - 20251201172155_add_human_handoff_support
  - 20251201233825_add_conversation_feedback
```

If you see errors, check the Troubleshooting section below.

### Step 6: Update Frontend Files

```bash
cd /path/to/intelliconvo/frontend

# Remove old node_modules (optional)
rm -rf node_modules
rm -rf .next

# Copy new files from v1.0.1 package
cp -r /path/to/v1.0.1/frontend/* .

# Restore your .env.local file if needed
cp .env.local.backup .env.local

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 7: Update Widget Files

```bash
cd /path/to/intelliconvo/widget

# Remove old node_modules
rm -rf node_modules
rm -rf dist

# Copy new files from v1.0.1 package
cp -r /path/to/v1.0.1/widget/* .

# Install dependencies
npm install

# Build widget
npm run build
```

### Step 8: Restart Services

```bash
# Restart backend (if using PM2)
pm2 restart intelliconvo-backend

# Restart frontend (if using PM2)
pm2 restart intelliconvo-frontend

# Or start services with npm
cd /path/to/intelliconvo/backend
npm run start &

cd /path/to/intelliconvo/frontend
npm run start &
```

### Step 9: Verify the Update

1. **Check Backend Health**
   ```bash
   curl http://localhost:5001/health
   # Should return: {"status":"ok"}
   ```

2. **Check Database Schema**
   ```bash
   cd /path/to/intelliconvo/backend
   npx prisma studio
   ```
   - Open the `Conversation` model
   - Verify `feedbackRating` and `feedbackComment` columns exist

3. **Test Frontend Dashboard**
   - Login to your admin dashboard
   - Navigate to a site's Conversations tab
   - Verify you can see and take conversations

4. **Test Widget**
   - Open a website with the widget installed
   - Start a conversation
   - Test the following scenarios:
     - AI should NOT show "Talk to a Human" for simple greetings
     - AI SHOULD show button for billing/complex issues
     - Click the button and verify agent escalation works
     - Have an agent take the conversation from the dashboard
     - Send messages between user and agent
     - Resolve the conversation as the agent
     - Verify feedback UI appears in widget
     - Submit feedback and verify it saves

### Step 10: Monitor for Issues

```bash
# Watch backend logs
pm2 logs intelliconvo-backend

# Watch frontend logs
pm2 logs intelliconvo-frontend
```

---

## Production Deployment Workflow

If you already have v1.0.0 running in production, follow this zero-downtime deployment approach:

### Option A: Safe Production Update (Recommended)

This approach minimizes downtime to 5-10 minutes.

#### Phase 1: Test in Development/Staging

1. **Set up staging environment** (if you don't have one):
   ```bash
   # Clone your production database to staging
   pg_dump -U prod_user -h prod.server.com -d prod_db > prod_backup.sql
   psql -U staging_user -h staging.server.com -d staging_db < prod_backup.sql
   ```

2. **Deploy v1.0.1 to staging**:
   - Follow Steps 1-9 above on staging server
   - Test all functionality thoroughly
   - Verify migrations work correctly
   - Test with real-world scenarios

3. **Perform load testing** (if high traffic):
   ```bash
   # Use tools like Apache Bench or k6
   ab -n 1000 -c 10 http://staging.yoursite.com/
   ```

#### Phase 2: Schedule Production Deployment

1. **Choose low-traffic time** (e.g., 2 AM in your timezone)

2. **Notify users 24-48 hours in advance**:
   ```
   Subject: Scheduled Maintenance - IntelliConvo Upgrade

   We will be upgrading IntelliConvo to v1.0.1 on [DATE] at [TIME].

   Expected downtime: 5-10 minutes

   New features:
   - Human agent handoff
   - Customer feedback system
   - Improved real-time messaging

   Thank you for your patience!
   ```

3. **Prepare deployment script**:
   ```bash
   # Create a deployment script: deploy_v1.0.1.sh

   #!/bin/bash
   set -e  # Exit on any error

   echo "Starting IntelliConvo v1.0.1 deployment..."

   # Backup database
   echo "Backing up database..."
   pg_dump -U your_user -d your_db > backup_pre_v1.0.1_$(date +%Y%m%d_%H%M%S).sql

   # Stop services
   echo "Stopping services..."
   pm2 stop intelliconvo-backend intelliconvo-frontend

   # Update backend
   echo "Updating backend..."
   cd /path/to/intelliconvo/backend
   cp -r /path/to/v1.0.1/backend/* .
   npm install
   npx prisma generate

   # Run migrations
   echo "Running database migrations..."
   npx prisma migrate deploy

   # Update frontend
   echo "Updating frontend..."
   cd /path/to/intelliconvo/frontend
   cp -r /path/to/v1.0.1/frontend/* .
   npm install
   npm run build

   # Update widget
   echo "Updating widget..."
   cd /path/to/intelliconvo/widget
   cp -r /path/to/v1.0.1/widget/* .
   npm install
   npm run build

   # Restart services
   echo "Restarting services..."
   pm2 restart intelliconvo-backend intelliconvo-frontend

   # Wait for services to start
   sleep 10

   # Health check
   echo "Running health check..."
   curl -f http://localhost:5001/health || exit 1

   echo "Deployment complete!"
   ```

4. **Execute deployment**:
   ```bash
   # Make script executable
   chmod +x deploy_v1.0.1.sh

   # Run deployment
   ./deploy_v1.0.1.sh
   ```

#### Phase 3: Post-Deployment Verification

1. **Immediate checks** (within 5 minutes):
   ```bash
   # Check services are running
   pm2 list

   # Check logs for errors
   pm2 logs intelliconvo-backend --lines 100 | grep -i error

   # Test health endpoint
   curl http://localhost:5001/health

   # Test widget loads
   curl http://localhost:3000
   ```

2. **Functional testing** (within 15 minutes):
   - Open your production website
   - Test widget loads correctly
   - Start a test conversation
   - Verify AI responds
   - Test handoff button appears for complex issues
   - Test agent can take conversation
   - Test feedback system

3. **Monitor for 1-2 hours**:
   ```bash
   # Watch logs continuously
   pm2 logs --timestamp

   # Monitor server resources
   htop

   # Check database connections
   psql -U your_user -d your_db -c "SELECT count(*) FROM pg_stat_activity;"
   ```

### Option B: Zero-Downtime Blue-Green Deployment (Advanced)

For high-traffic production systems, use a blue-green deployment:

#### Setup

1. **Current setup** (Blue):
   - Production server: `prod-server-blue`
   - Database: `prod-db`
   - Load balancer pointing to: `prod-server-blue`

2. **Deploy v1.0.1** (Green):
   ```bash
   # Set up new server with v1.0.1
   ssh prod-server-green

   # Deploy v1.0.1 (follows Steps 1-9)
   # Connect to SAME database as blue server
   ```

3. **Run migrations on live database**:
   ```bash
   # On green server, run migrations
   npx prisma migrate deploy

   # Migrations are backward compatible:
   # - Only adds nullable columns
   # - Blue server (v1.0.0) will ignore new columns
   # - Green server (v1.0.1) will use new columns
   ```

4. **Test green server**:
   ```bash
   # Test green server directly
   curl http://prod-server-green:5001/health

   # Test complete flow on green server
   ```

5. **Switch load balancer**:
   ```bash
   # Update load balancer to point to green server
   # This happens instantly with zero downtime
   ```

6. **Monitor green server**:
   ```bash
   # Watch logs on green server
   ssh prod-server-green
   pm2 logs

   # If issues occur, switch load balancer back to blue server
   ```

7. **Decommission blue server** (after 24-48 hours of stable operation):
   ```bash
   # Stop blue server
   ssh prod-server-blue
   pm2 stop all
   ```

### Migration Safety Notes

The v1.0.1 migrations are **backward compatible**:

- **Adds nullable columns only**: `feedbackRating` and `feedbackComment` are optional
- **No breaking changes**: Existing v1.0.0 code will ignore these columns
- **Safe to run on live database**: Can run migrations while v1.0.0 is still serving traffic
- **No data loss**: All existing data remains intact

This means you can:
1. Run migrations first
2. Keep v1.0.0 running
3. Deploy v1.0.1 when ready
4. Switch traffic gradually

### Common Production Deployment Scenarios

#### Scenario 1: Single Server

```bash
# Maintenance window approach
1. Schedule 10-minute maintenance window
2. Notify users via email/banner
3. Run deployment script
4. Verify and monitor
```

#### Scenario 2: Load Balanced Multiple Servers

```bash
# Rolling update approach
1. Update server 1, remove from load balancer
2. Verify server 1 works correctly
3. Add server 1 back to load balancer
4. Repeat for server 2, 3, etc.
```

#### Scenario 3: Docker/Kubernetes

```bash
# Container update approach
1. Build new Docker image with v1.0.1
2. Run migrations as init container
3. Update deployment with new image
4. Kubernetes handles rolling update automatically
```

### Post-Production Deployment Checklist

- [ ] All services running and healthy
- [ ] No errors in logs
- [ ] Database migrations applied successfully
- [ ] Widget loads on customer websites
- [ ] Can start new conversations
- [ ] Handoff feature works correctly
- [ ] Agent dashboard functional
- [ ] Feedback system working
- [ ] No increase in error rates
- [ ] Response times normal
- [ ] Customer notifications sent about new features
- [ ] Documentation updated
- [ ] Rollback plan ready if needed

---

## Rollback Procedure (If Needed)

If you encounter critical issues after updating, you can rollback:

```bash
# Stop services
pm2 stop intelliconvo-backend intelliconvo-frontend

# Restore database backup
psql -U your_username -d your_database_name < intelliconvo_backup_YYYYMMDD.sql

# Restore old files
cd /path/to/
rm -rf intelliconvo
tar -xzf intelliconvo_v1.0.0_backup.tar.gz

# Restore .env files
cp backend/.env.backup backend/.env
cp frontend/.env.local.backup frontend/.env.local

# Restart services with v1.0.0
pm2 restart intelliconvo-backend intelliconvo-frontend
```

---

## Troubleshooting

### Migration Error: "relation does not exist"

**Error**:
```
ERROR: relation "Conversation" does not exist
```

**Solution**:
```bash
# Check if database connection is correct
npx prisma db pull

# If schema is out of sync, push the current schema
npx prisma db push
```

### Migration Error: "column already exists"

**Error**:
```
ERROR: column "feedbackRating" already exists
```

**Solution**: The migration was already applied. Mark it as applied:
```bash
npx prisma migrate resolve --applied 20251201233825_add_conversation_feedback
```

### Socket.IO Connection Failed in Frontend

**Error**: CORS errors or "Socket disconnected" in browser console

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to correct backend URL
2. Ensure backend is running on the correct port
3. Check backend CORS configuration in `backend/src/index.ts`

### Widget Not Showing Handoff Button

**Issue**: Button never appears even for complex issues

**Solution**:
1. Check widget is using the latest `dist/widget.js` file
2. Clear browser cache
3. Verify `enableHumanHandoff` is enabled in widget settings (database)
4. Check backend logs for AI responses

### Feedback Not Saving

**Error**: "Failed to submit feedback" in widget console

**Solution**:
1. Verify migrations ran successfully
2. Restart backend server after running migrations
3. Check database has `feedbackRating` and `feedbackComment` columns
4. Check backend logs for errors

---

## Environment Variables

### No New Required Variables

v1.0.1 does not require any new environment variables. All existing `.env` configurations will continue to work.

### Optional: Widget Settings

You can configure handoff messages via the database `WidgetSettings` table:
- `waitingForAgentMessage` - Shown when user requests agent
- `agentJoinedMessage` - Shown when agent joins conversation
- `agentLeftMessage` - Shown when agent leaves

These can be customized per site through the admin dashboard or directly in the database.

---

## Testing Checklist

After updating, verify these features work:

- [ ] Backend server starts without errors
- [ ] Frontend dashboard loads correctly
- [ ] Database migrations applied successfully
- [ ] Widget loads on test website
- [ ] Can start new conversation in widget
- [ ] AI responds to simple questions WITHOUT showing handoff button
- [ ] AI shows handoff button for billing/complex issues
- [ ] Clicking handoff button escalates conversation
- [ ] Agent can take conversation from dashboard
- [ ] Messages route correctly between user and agent
- [ ] Agent typing indicator appears in widget
- [ ] Agent can resolve conversation
- [ ] Feedback UI appears after resolution
- [ ] Feedback saves to database
- [ ] All existing v1.0.0 features still work

---

## Performance Notes

- Database migrations are non-blocking and add nullable columns
- No performance degradation expected
- Existing conversations are unaffected
- New conversations automatically support all v1.0.1 features

---

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/your-repo/issues) (if available)
2. Review backend logs: `pm2 logs intelliconvo-backend`
3. Check browser console for widget errors
4. Contact support through CodeCanyon with:
   - Error logs
   - Steps to reproduce
   - Server environment details (Node.js version, PostgreSQL version)

---

## What's Coming Next

Future updates will include:
- Analytics dashboard for conversation feedback
- Agent performance metrics
- Business hours configuration
- Automated handoff based on sentiment analysis
- Multi-language support

---

**Update Date**: December 1, 2025
**Version**: 1.0.1
**Previous Version**: 1.0.0
**Estimated Update Time**: 15-30 minutes (excluding testing)
