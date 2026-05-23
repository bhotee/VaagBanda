import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import SplashScreen from '../screens/auth/SplashScreen'

export default function RootNavigator() {
  const { session, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash || loading) return <SplashScreen />

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
