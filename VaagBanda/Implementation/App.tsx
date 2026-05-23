import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, Text, StyleSheet } from 'react-native'
import RootNavigator from './src/navigation/RootNavigator'
import { useNetworkStatus } from './src/hooks/useNetworkStatus'
import { colors } from './src/theme/colors'

function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  if (isOnline) return null
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>📡 No internet — showing cached data</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
})

export default function App() {
  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <RootNavigator />
    </SafeAreaProvider>
  )
}