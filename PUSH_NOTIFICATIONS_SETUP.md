# Push Notifications Setup - Complete ✅

## What Was Implemented

### 1. ✅ Expo Notifications Integration
- Installed `expo-notifications` package
- Configured `app.json` with notification plugin and permissions
- Added push tokens table ID to environment variables

### 2. ✅ Notification Utilities (`lib/notifications.ts`)
- Request notification permissions from users
- Get and register Expo push tokens
- Handle notification events (received, tapped)
- Device ID generation for token management

### 3. ✅ Push Token Management (`lib/actions/notifications.actions.ts`)
- Store push tokens in Appwrite `push_tokens` table
- Update tokens when users login/logout
- Deactivate tokens on logout
- Send individual and bulk push notifications via Expo API

### 4. ✅ Auto-Registration on Login
- Modified `lib/actions/auth.actions.ts`
- Automatically registers push token after boarder login
- Deactivates token on logout
- Non-blocking - doesn't slow down login process

### 5. ✅ Payment Approval Notifications
- Modified `lib/actions/payments.actions.ts`
- Sends instant notification when manager approves payment
- Shows: "Payment of ₹X approved. New balance: ₹Y"

### 6. ✅ Scheduled Meal Reminders
- Created Appwrite Function at `appwrite-functions/meal-reminders/`
- Two daily schedules:
  - **11 PM**: Brunch reminders for tomorrow (cutoff: 5 AM)
  - **3 PM**: Dinner reminders for today (cutoff: 5 PM)
- Fetches all active boarders and their meal status
- Sends batch notifications via Expo API

### 7. ✅ UI Integration
- Added notification permission request to boarder meals screen
- Automatically prompts for permissions on first use
- Silent failure - doesn't disrupt user experience

---

## What You Need to Do Next

### Step 1: Rebuild Your App
Since you added a new native plugin (`expo-notifications`), you need to rebuild:

```bash
# For Android
npx expo run:android

# Or build with EAS
eas build --platform android
```

### Step 2: Set Up Appwrite Function

1. **Go to Appwrite Console** → Functions → Create Function

2. **Function Details:**
   - Name: `meal-reminders`
   - Runtime: Node.js 18 or later
   - Entrypoint: `src/main.js`

3. **Upload Files:**
   - Upload everything from `appwrite-functions/meal-reminders/` folder
   - Or connect to your Git repository

4. **Set Environment Variables:**
   ```
   DATABASE_ID=68cd9eac0039ed81523e
   BOARDERS_TABLE_ID=boarders
   MEALS_TABLE_ID=meals
   PUSH_TOKENS_TABLE_ID=push_tokens
   ```

5. **Create Schedule Triggers:**
   
   **Trigger 1: Brunch Reminders**
   - Schedule: `0 23 * * *` (11 PM daily)
   - Timezone: Your timezone (e.g., Asia/Kolkata)
   
   **Trigger 2: Dinner Reminders**
   - Schedule: `0 15 * * *` (3 PM daily)  
   - Timezone: Your timezone (e.g., Asia/Kolkata)

6. **Set Permissions:**
   - Function needs read access to:
     - `boarders` table
     - `meals` table
     - `push_tokens` table

7. **Deploy and Test:**
   - Click "Deploy" in Appwrite Console
   - Use "Execute Now" to test manually
   - Check logs for any errors

### Step 3: Testing

1. **Test on Physical Device** (notifications don't work on emulator)

2. **Login as Boarder:**
   - Should auto-register push token
   - Check Appwrite Console → Database → `push_tokens` table

3. **Test Payment Approval:**
   - As manager, approve a pending payment
   - Boarder should receive notification

4. **Test Meal Reminders:**
   - Wait for scheduled time (11 PM or 3 PM)
   - OR temporarily modify the function to run at current hour for testing
   - Check Appwrite Function logs

### Step 4: Monitoring

**Check Function Logs:**
- Appwrite Console → Functions → meal-reminders → Logs
- Look for:
  - Number of boarders processed
  - Number of notifications sent
  - Any errors

**Check Push Token Table:**
- Appwrite Console → Database → push_tokens
- Verify tokens are being registered
- Check `isActive` status

---

## Notification Types

### 1. Payment Approved (Instant)
- **Trigger:** Manager approves payment
- **Message:** "Your payment of ₹500 has been approved. New balance: ₹1500"
- **Data:** `{ type: "payment_approved", paymentId, amount, newAdvance }`

### 2. Brunch Reminder (11 PM)
- **Trigger:** Scheduled daily at 11 PM
- **Message:** "Your brunch tomorrow is ON/OFF. You have until 5 AM to turn it off/on."
- **Data:** `{ type: "meal_reminder", mealType: "brunch", mealStatus, targetDate, cutoffTime }`

### 3. Dinner Reminder (3 PM)
- **Trigger:** Scheduled daily at 3 PM
- **Message:** "Your dinner today is ON/OFF. You have until 5 PM to turn it off/on."
- **Data:** `{ type: "meal_reminder", mealType: "dinner", mealStatus, targetDate, cutoffTime }`

---

## Cost Breakdown

### Expo Push Notifications
- **FREE** - Unlimited notifications

### Appwrite Cloud Functions
- **Free Tier:** 750,000 executions/month
- **Your Usage:** ~60 executions/month (2 per day)
- **Percentage:** 0.008% of limit
- **Conclusion:** Completely safe! ✅

---

## Troubleshooting

### Notifications Not Receiving?
1. Check if push token is registered in database
2. Verify device has granted notification permissions
3. Test on physical device (not emulator)
4. Check Appwrite Function logs for errors
5. Verify Expo project ID matches in `lib/notifications.ts` and `app.json`

### Function Not Running?
1. Check schedule triggers are set correctly
2. Verify timezone settings
3. Check function logs for errors
4. Verify environment variables are set
5. Test manually with "Execute Now"

### Push Tokens Not Saving?
1. Check table permissions in Appwrite
2. Verify `EXPO_PUBLIC_APPWRITE_PUSH_TOKENS_TABLE_ID` in `app.json`
3. Check network connectivity
4. Look for errors in app logs

---

## Files Modified/Created

### Modified:
- `app.json` - Added expo-notifications plugin and table ID
- `lib/appwrite.ts` - Added push tokens table config
- `lib/actions/index.ts` - Export notification actions
- `lib/actions/auth.actions.ts` - Auto-register tokens on login/logout
- `lib/actions/payments.actions.ts` - Send approval notifications
- `app/(boarder)/(tabs)/meals.tsx` - Request notification permissions

### Created:
- `lib/notifications.ts` - Notification utilities
- `lib/actions/notifications.actions.ts` - Push notification actions
- `appwrite-functions/meal-reminders/src/main.js` - Scheduled function
- `appwrite-functions/meal-reminders/package.json` - Dependencies
- `appwrite-functions/meal-reminders/README.md` - Setup guide

---

## Next Steps

1. ✅ Rebuild your app
2. ✅ Create Appwrite Function
3. ✅ Test on physical device
4. ✅ Monitor function logs
5. ✅ Enjoy automated push notifications!

---

**Need Help?** Check the README in `appwrite-functions/meal-reminders/` for detailed setup instructions.

**Questions?** The implementation is complete and ready to use! Just follow the steps above to deploy the Appwrite Function.

