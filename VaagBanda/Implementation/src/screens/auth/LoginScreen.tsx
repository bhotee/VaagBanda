import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthNavigator'
import { useAuth } from '../../hooks/useAuth'
import LogoMark from '../../components/LogoMark'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      Alert.alert('Login Failed', error.message)
    } else {
      try { await AsyncStorage.setItem('lastEmail', email) } catch {}
    }
  }

  const handleBiometric = async () => {
    Alert.alert('Coming Soon', 'Biometric login will be available in the next update.')
  }

  return (
    <View style={styles.container}>
      <View style={styles.topAccent} />
      <View style={styles.bottomAccent} />
      <View style={styles.logoArea}>
        <View style={styles.logoBox}><LogoMark size={50} /></View>
        <Text style={styles.brand}>
          <Text style={styles.brandRed}>Vaag</Text>
          <Text style={styles.brandBlue}>Banda</Text>
        </Text>
        <Text style={styles.tagline}>SCAN · SPLIT · SETTLE</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <Text style={styles.cardSub}>Sign in to your account</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgot}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.passwordWrapper}>
            <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign In →</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
          <Text style={styles.biometricText}>👆 Use Fingerprint / Face ID</Text>
        </TouchableOpacity>
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, justifyContent: 'center', padding: 24 },
  topAccent: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#DC143C20' },
  bottomAccent: { position: 'absolute', bottom: -120, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: '#2E5A8830' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 70, height: 70, borderRadius: 22, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  brand: { fontSize: 28, fontWeight: typography.weights.bold, marginBottom: 4 },
  brandRed: { color: colors.primary },
  brandBlue: { color: colors.white },
  tagline: { fontSize: 10, color: colors.textMuted, letterSpacing: 3 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10 },
  cardTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: typography.sizes.sm, color: colors.textMuted, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, color: colors.text, borderWidth: 1, borderColor: colors.border },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  passwordInput: { flex: 1, padding: 14, fontSize: typography.sizes.md, color: colors.text },
  eyeButton: { padding: 14 },
  eyeText: { fontSize: 16 },
  forgot: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.bold },
  button: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  buttonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 0.5 },
  biometricBtn: { backgroundColor: '#2E5A8810', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#2E5A8820' },
  biometricText: { color: colors.blue, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: colors.textMuted, fontSize: typography.sizes.sm },
  signupLink: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
})
