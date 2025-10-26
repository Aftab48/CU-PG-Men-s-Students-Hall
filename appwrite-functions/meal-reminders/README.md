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
DATABASE_ID=
BOARDERS_TABLE_ID=
MEALS_TABLE_ID=
PUSH_TOKENS_TABLE_ID=
```

### 3. Set Schedule Trigger

Appwrite allows only one cron schedule per function. Set it to run every hour, and the function will internally check the time and send notifications at the appropriate hours.

**Schedule (Cron syntax):**
```
0 * * * *
```

This means: Run at the start of every hour.

**How it works:**
- The function checks the current hour when it runs
- At **11 PM (23:00 IST)**: Sends brunch reminders for tomorrow
- At **3 PM (15:00 IST)**: Sends dinner reminders for today
- At all other hours: Does nothing and exits immediately

**⚠️ Important - Timezone Note:**
- Appwrite cron schedules run in **UTC timezone**
- Your function code is already designed to handle the UTC offset
- If your boarders are in IST (UTC+5:30), the function will trigger at:
  - **17:00 UTC** (which is ~11:30 PM IST for brunch reminders)
  - **09:00 UTC** (which is ~2:30 PM IST for dinner reminders)
- The code has built-in hour checks (`currentHour === 22` and `currentHour === 14`) to catch these time differences

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

**Appwrite Cloud Functions Free Tier:** 750,000 executions/month

**This function:**
- Runs every hour = 24 executions/day × 30 days = ~720 executions/month
- Actually sends notifications only 2 times/day (at 11 PM and 3 PM)
- Uses **0.096% of free tier limit**
- The other 22 daily executions exit immediately (negligible cost)

