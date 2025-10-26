/**
 * Appwrite Function: Meal Reminders
 * 
 * Schedule: Run at 11 PM and 3 PM daily
 * - 11 PM (23:00): Send brunch reminders for tomorrow
 * - 3 PM (15:00): Send dinner reminders for today
 * 
 * Fetches all active boarders and their meal status, then sends push notifications
 * via Expo Push API
 */

const { Client, Databases, Query } = require('node-appwrite');

/**
 * Main function handler
 */
module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.DATABASE_ID;
  const boardersTableId = process.env.BOARDERS_TABLE_ID;
  const mealsTableId = process.env.MEALS_TABLE_ID;
  const pushTokensTableId = process.env.PUSH_TOKENS_TABLE_ID;

  try {
    log('Starting meal reminder job...');

    // Determine if we're sending brunch or dinner reminders based on time
    const now = new Date();
    const currentHour = now.getHours();
    
    let mealType, cutoffTime, targetDate;
    
    if (currentHour === 23 || currentHour === 22) {
      // 11 PM - Send brunch reminders for tomorrow
      mealType = 'brunch';
      cutoffTime = '5 AM';
      
      // Target date is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = formatDate(tomorrow);
      
      log(`Sending brunch reminders for ${targetDate}`);
    } else if (currentHour === 15 || currentHour === 14) {
      // 3 PM - Send dinner reminders for today
      mealType = 'dinner';
      cutoffTime = '5 PM';
      targetDate = formatDate(now);
      
      log(`Sending dinner reminders for ${targetDate}`);
    } else {
      log(`Current hour is ${currentHour}. This function should run at 11 PM or 3 PM only.`);
      return res.json({
        success: false,
        message: 'Not the scheduled time for meal reminders',
      });
    }

    // Fetch all active boarders
    const boardersResponse = await databases.listDocuments(
      databaseId,
      boardersTableId,
      [Query.equal('isActive', true), Query.limit(500)]
    );

    const boarders = boardersResponse.documents;
    log(`Found ${boarders.length} active boarders`);

    if (boarders.length === 0) {
      return res.json({
        success: true,
        message: 'No active boarders found',
      });
    }

    // Fetch meal records for the target date
    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const mealsResponse = await databases.listDocuments(
      databaseId,
      mealsTableId,
      [
        Query.between('date', startOfDay, endOfDay),
        Query.equal('mealType', mealType),
        Query.limit(500)
      ]
    );

    const mealRecords = mealsResponse.documents;
    log(`Found ${mealRecords.length} meal records for ${mealType}`);

    // Create a map of boarderId -> meal status
    const mealStatusMap = new Map();
    mealRecords.forEach(record => {
      mealStatusMap.set(record.boarderId, record.status);
    });

    // Fetch all active push tokens
    const pushTokensResponse = await databases.listDocuments(
      databaseId,
      pushTokensTableId,
      [Query.equal('isActive', true), Query.limit(500)]
    );

    const pushTokens = pushTokensResponse.documents;
    log(`Found ${pushTokens.length} active push tokens`);

    // Create a map of userId -> push tokens
    const userTokensMap = new Map();
    pushTokens.forEach(token => {
      if (!userTokensMap.has(token.userId)) {
        userTokensMap.set(token.userId, []);
      }
      userTokensMap.get(token.userId).push(token.pushToken);
    });

    // Build notifications for each boarder
    const notifications = [];
    boarders.forEach(boarder => {
      const userId = boarder.userId;
      const tokens = userTokensMap.get(userId);

      if (!tokens || tokens.length === 0) {
        log(`No push tokens for boarder ${boarder.name} (${userId})`);
        return;
      }

      // Get meal status (default to ON if no record exists)
      const mealStatus = mealStatusMap.get(userId) || 'ON';

      // Build notification message
      let title, body;
      if (mealType === 'brunch') {
        title = '🍳 Brunch Reminder';
        if (mealStatus === 'ON') {
          body = `Your brunch tomorrow is ON. You have until ${cutoffTime} to turn it off.`;
        } else {
          body = `Your brunch tomorrow is OFF. You have until ${cutoffTime} to turn it on.`;
        }
      } else {
        title = '🍽️ Dinner Reminder';
        if (mealStatus === 'ON') {
          body = `Your dinner today is ON. You have until ${cutoffTime} to turn it off.`;
        } else {
          body = `Your dinner today is OFF. You have until ${cutoffTime} to turn it on.`;
        }
      }

      // Add notification for each token
      tokens.forEach(token => {
        notifications.push({
          to: token,
          sound: 'default',
          title,
          body,
          data: {
            type: 'meal_reminder',
            mealType,
            mealStatus,
            targetDate,
            cutoffTime,
          },
        });
      });
    });

    log(`Prepared ${notifications.length} notifications`);

    if (notifications.length === 0) {
      return res.json({
        success: true,
        message: 'No notifications to send',
      });
    }

    // Send notifications in batches of 100 (Expo's limit)
    let sentCount = 0;
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        if (response.ok) {
          sentCount += batch.length;
          log(`Sent batch of ${batch.length} notifications (total: ${sentCount})`);
        } else {
          const errorText = await response.text();
          error(`Failed to send batch: ${errorText}`);
        }
      } catch (err) {
        error(`Error sending batch: ${err.message}`);
      }
    }

    log(`Meal reminder job completed. Sent ${sentCount}/${notifications.length} notifications`);

    return res.json({
      success: true,
      mealType,
      targetDate,
      boardersCount: boarders.length,
      notificationsSent: sentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    error(`Error in meal reminder function: ${err.message}`);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};

/**
 * Helper function to format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

