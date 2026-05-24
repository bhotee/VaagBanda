import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import SplashScreen from '../screens/auth/SplashScreen'
import { registerForPushNotifications } from '../lib/notifications'

export default function RootNavigator() {
  const { session, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      registerForPushNotifications(session.user.id)
    }
  }, [session])

  if (showSplash || loading) return <SplashScreen />

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
