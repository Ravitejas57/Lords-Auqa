# Cleanup Service Documentation

## Overview

The cleanup service automatically deletes old records from the database to maintain optimal performance and storage efficiency.

## Auto-Deletion Rules

### 1. Notifications (10 days)
- **Threshold**: 10 days
- **Target**: Regular notifications (non-story)
- **Criteria**: Deletes notifications where `createdAt < 10 days ago` AND `isStory = false`

### 2. Stories (24 hours)
- **Threshold**: 24 hours
- **Target**: Story notifications (with media)
- **Criteria**: Deletes notifications where `isStory = true` AND `expiresAt < current time`
- **Note**: Stories automatically get `expiresAt` set to 24 hours from creation when media is attached

### 3. Help Messages (10 days)
- **Threshold**: 10 days
- **Target**: All help messages
- **Criteria**: Deletes help messages where `timestamp < 10 days ago`

### 4. Conversations (10 days)
- **Threshold**: 10 days
- **Target**: All user-admin conversations
- **Criteria**: Deletes conversations where `updatedAt < 10 days ago`

## Schedule

### Daily Cleanup (2:00 AM)
Runs comprehensive cleanup for all categories:
- Old notifications (>10 days)
- Old help messages (>10 days)
- Old conversations (>10 days)
- Expired stories (>24 hours)

**Cron Expression**: `0 2 * * *`

### Story Cleanup (Every 6 hours)
Runs cleanup specifically for expired stories:
- Expired stories (>24 hours)

**Cron Expression**: `0 */6 * * *`

## Usage

### Automatic Cleanup (Production)
The cleanup service starts automatically when the server starts:

```javascript
// In server.js
mongoose.connect(process.env.DBurl, { dbName: 'hatchseed' })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const cleanupService = require('./services/cleanupService');
    cleanupService.startScheduledCleanup();
  });
```

### Manual Cleanup (Testing/Admin)

#### Option 1: Via API Endpoint
```bash
POST /api/adminActions/cleanup
```

#### Option 2: Via NPM Script
```bash
npm run cleanup
```

#### Option 3: Programmatically
```javascript
const cleanupService = require('./services/cleanupService');

// Run cleanup immediately
const result = await cleanupService.runImmediately();
console.log(result);
// {
//   notificationCount: 15,
//   storyCount: 3,
//   helpMessageCount: 8,
//   conversationCount: 2,
//   totalDeleted: 28,
//   duration: 250
// }
```

## Testing

### Run Test Script
```bash
npm run cleanup
```

This will:
1. Connect to the database
2. Count current records
3. Run cleanup
4. Show deletion results
5. Verify cleanup worked correctly

### Sample Output
```
📡 Connecting to database...
✅ Connected to MongoDB

📊 Checking current record counts...
Before cleanup:
  Total notifications: 45
  Total stories: 5
  Expired stories (>24h): 2
  Old notifications (>10 days): 12
  Total help messages: 20
  Old help messages (>10 days): 8
  Total conversations: 15
  Old conversations (>10 days): 3

🧹 Running cleanup service...

📊 Cleanup results:
  Notifications deleted: 12
  Expired stories deleted: 2
  Help messages deleted: 8
  Conversations deleted: 3
  Total deleted: 25
  Duration: 350ms
```

## Logs

The cleanup service logs all operations:

### Successful Cleanup
```
✅ Cleanup service started:
   - Daily cleanup at 2:00 AM (notifications, help messages, conversations older than 10 days)
   - Story cleanup every 6 hours (stories older than 24 hours)

⏰ Scheduled cleanup triggered at 2:00 AM
🧹 Starting scheduled cleanup...
🗑️  Cleanup: Deleted 12 old notifications (>10 days)
🗑️  Cleanup: Deleted 2 expired stories (>24 hours)
🗑️  Cleanup: Deleted 8 old help messages (>10 days)
🗑️  Cleanup: Deleted 3 old conversations (>10 days)
✅ Cleanup completed in 350ms. Total records deleted: 25
```

### Skip Concurrent Runs
```
⏳ Cleanup already running, skipping...
```

### Error Handling
```
❌ Error cleaning up old notifications: <error message>
❌ Error during cleanup: <error message>
```

## Implementation Details

### Files
- **Service**: `Backend/services/cleanupService.js`
- **Test Script**: `Backend/scripts/testCleanup.js`
- **API Route**: `Backend/routes/Admin.route.js` (POST /cleanup)
- **Integration**: `Backend/server.js`

### Dependencies
- `node-cron`: For scheduling cleanup tasks
- `mongoose`: For database operations

### Models Affected
- `Notification.model.js`
- `HelpMessage.model.js`
- `UserHelp.model.js` (Conversation)

## Performance

- All cleanup operations run in parallel for optimal performance
- Uses MongoDB's `deleteMany()` for bulk deletions
- Typical cleanup duration: 200-500ms
- Minimal impact on server performance (runs during low-traffic hours)

## Safety Features

1. **Skip Concurrent Runs**: Prevents multiple cleanup operations from running simultaneously
2. **Error Handling**: Errors in one cleanup task don't affect others
3. **Logging**: All operations are logged for audit trail
4. **Query Validation**: Uses strict date comparisons to prevent accidental deletions

## Monitoring

To monitor cleanup effectiveness:

1. Check server logs for cleanup execution
2. Use the test script to see before/after counts
3. Call the manual cleanup endpoint and review results
4. Monitor database size trends over time

## Troubleshooting

### Cleanup Not Running
- Check server logs for startup message
- Verify MongoDB connection is successful
- Ensure `node-cron` is installed

### Unexpected Deletions
- Review date calculations in `cleanupService.js`
- Check model schemas for date fields
- Verify test data is not being counted

### Performance Issues
- Adjust cleanup schedule to less frequent times
- Consider indexing date fields in models
- Monitor database query performance
