import AsyncStorage from '@react-native-async-storage/async-storage'

export async function saveLocally(key: string, data: any) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export async function getLocally(key: string) {
  try {
    const data = await AsyncStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

export async function addPendingSync(action: string, data: any) {
  try {
    const pending = await getLocally('pending_sync') || []
    pending.push({ action, data, timestamp: Date.now() })
    await saveLocally('pending_sync', pending)
  } catch {}
}

export async function getPendingSync() {
  return await getLocally('pending_sync') || []
}

export async function clearPendingSync() {
  await AsyncStorage.removeItem('pending_sync')
}
