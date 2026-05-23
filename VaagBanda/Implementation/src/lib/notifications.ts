export async function registerForPushNotifications(userId: string) {
  console.log('Push notifications coming soon')
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string
) {
  console.log('Send notification:', title, body)
}