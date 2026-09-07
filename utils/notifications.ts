/*
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupDailyReminder() {
  if (Platform.OS === 'web') return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return;
  }

  // Check if we already have it scheduled to avoid duplicates
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const hasReminder = scheduledNotifications.some(
    (n) => n.content.data?.type === 'daily_expense_reminder'
  );

  if (!hasReminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Log today's expenses 💰",
        body: "Don't forget to track your spending today! It only takes a second.",
        data: { type: 'daily_expense_reminder' },
      },
      trigger: {
        hour: 20, // 8 PM
        minute: 0,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });
  }
}
*/
