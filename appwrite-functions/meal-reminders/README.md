# Meal Reminders Appwrite Function

This Appwrite Function sends scheduled push notifications to boarders about their meal status.

## Schedule

- **11 PM (23:00)**: Send brunch reminders for tomorrow
  - "Your brunch tomorrow is ON/OFF. You have until 5 AM to change it."
  
- **3 PM (15:00)**: Send dinner reminders for today
  - "Your dinner today is ON/OFF. You have until 5 PM to change it."

## Setup Instructions

### 1. Create Function in Appwrite Console

1. Go to your Appwrite Console → Functions
2. Click "Create Function"
3. Name it: `meal-reminders`
4. Runtime: Node.js 18 or later
5. Choose deployment method:

#### Option A: Git Integration (Recommended)
1. Click "Connect Git Repository"
2. Connect your GitHub account and select this repository
3. Set the **Root Directory** to: `appwrite-functions/meal-reminders`
4. Set **Entry Point** to: `src/main.js`
5. Appwrite will auto-deploy on every push to the main branch

#### Option B: CLI Deployment
1. Install Appwrite CLI: `npm install -g appwrite-cli`
2. Login: `appwrite login`
3. Navigate to the function directory: `cd appwrite-functions/meal-reminders`
4. Deploy: `appwrite functions createDeployment --functionId=[YOUR_FUNCTION_ID]`

#### Option C: Manual Upload (if available)
1. Compress `src/main.js` and `package.json` into a `.tar.gz` file
2. Use "Manual Deployment" → "Create Deployment" → Upload the compressed file
3. Set **Entry Point** to: `src/main.js`

> **Note**: Modern Appwrite Console prefers Git integration. If you only see "Connect GitHub", use Option A above.

### 2. Set Environment Variables

Add these environment variables in the Function settings:

```
DATABASE_ID=68cd9eac0039ed81523e
BOARDERS_TABLE_ID=boarders
MEALS_TABLE_ID=meals
PUSH_TOKENS_TABLE_ID=push_tokens
```

### 3. Create Schedule Triggers

Add two schedule triggers:

**Trigger 1: Brunch Reminders**
- Schedule: `0 23 * * *` (11 PM daily)
- Timezone: Asia/Kolkata (or your timezone)

**Trigger 2: Dinner Reminders**
- Schedule: `0 15 * * *` (3 PM daily)
- Timezone: Asia/Kolkata (or your timezone)

### 4. Set Permissions

Make sure the Function has:
- Read access to `boarders` table
- Read access to `meals` table  
- Read access to `push_tokens` table

### 5. Deploy

Deploy the function and test it:
- Use the "Execute Now" button in Appwrite Console
- Check the logs to verify it's working
- Send a test notification to verify delivery

## Testing

To test without waiting for the scheduled time:

1. Temporarily modify the time check in `main.js`:
```javascript
if (currentHour === 23 || currentHour === 22 || currentHour === YOUR_CURRENT_HOUR) {
```

2. Execute manually from Appwrite Console
3. Check the logs for success/errors
4. Verify notifications on your device

## Monitoring

Check function logs in Appwrite Console to see:
- Number of boarders processed
- Number of notifications sent
- Any errors during execution

## Cost

Appwrite Cloud Functions Free Tier: 750,000 executions/month
This function runs 2 times/day = ~60 executions/month (0.008% of limit)

