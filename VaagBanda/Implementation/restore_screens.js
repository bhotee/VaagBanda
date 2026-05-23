const fs = require('fs')
const path = require('path')
const BASE = path.join(__dirname, 'src')

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  console.log(`✅ ${path.relative(BASE, filePath)}`)
}

// ─── LoginScreen.tsx ───
write(path.join(BASE, 'screens/auth/LoginScreen.tsx'), `import React, { useState } from 'react'
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
`)

// ─── HomeScreen.tsx ───
write(path.join(BASE, 'screens/home/HomeScreen.tsx'), `import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Animated, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useFadeIn, useScaleIn } from '../../hooks/useAnimation'
import { saveLocally, getLocally } from '../../lib/offlineStorage'

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️', transport: '🚌', accommodation: '🏨', entertainment: '🎭', utilities: '💡', other: '📦',
}

export default function HomeScreen() {
  const { session } = useAuth()
  const [totalOwed, setTotalOwed] = useState(0)
  const [totalOwe, setTotalOwe] = useState(0)
  const [recentExpenses, setRecentExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const headerAnim = useFadeIn(0, !loading)
  const balanceAnim = useScaleIn(200, !loading)
  const statsAnim = useFadeIn(300, !loading)
  const listAnim = useFadeIn(400, !loading)

  useFocusEffect(
    React.useCallback(() => {
      if (session) fetchData()
      else setLoading(false)
    }, [session])
  )

  const fetchData = async () => {
    const userId = session?.user?.id
    if (!userId) { setLoading(false); return }
    try {
      const cached = await getLocally('home_' + userId)
      if (cached) {
        setName(cached.name); setAvatarUrl(cached.avatarUrl)
        setTotalOwed(cached.totalOwed); setTotalOwe(cached.totalOwe)
        setRecentExpenses(cached.recentExpenses); setLoading(false)
      }
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single()
      if (profile) { setName(profile.full_name); setAvatarUrl(profile.avatar_url || null) }
      const { data: myOwed } = await supabase.from('expense_splits').select('amount_owed, expenses(paid_by)').eq('user_id', userId).eq('is_settled', false)
      const { data: othersOwe } = await supabase.from('expense_splits').select('amount_owed, expenses(paid_by)').eq('is_settled', false).neq('user_id', userId)
      const iOwe = myOwed?.filter((s: any) => s.expenses?.paid_by !== userId).reduce((sum: number, s: any) => sum + s.amount_owed, 0) || 0
      const owedToMe = othersOwe?.filter((s: any) => s.expenses?.paid_by === userId).reduce((sum: number, s: any) => sum + s.amount_owed, 0) || 0
      setTotalOwe(iOwe); setTotalOwed(owedToMe)
      const { data: expenses } = await supabase.from('expenses').select('id, title, amount, created_at, groups(name)').order('created_at', { ascending: false }).limit(5)
      setRecentExpenses(expenses || [])
      await saveLocally('home_' + userId, { name: profile?.full_name || '', avatarUrl: profile?.avatar_url || null, totalOwed: owedToMe, totalOwe: iOwe, recentExpenses: expenses || [] })
    } catch (error) { console.log('Error:', error) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const onRefresh = () => { setRefreshing(true); fetchData() }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  const netBalance = totalOwed - totalOwe
  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <Animated.View style={[styles.headerBg, { opacity: headerAnim.opacity, transform: [{ translateY: headerAnim.translateY }] }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{name || 'there'} 👋</Text>
          </View>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl + '?t=' + Date.now() }} style={styles.avatarImage} onError={() => setAvatarUrl(null)} />
            : <View style={styles.avatarCircle}><Text style={styles.avatarLetter}>{name?.charAt(0).toUpperCase() || '?'}</Text></View>
          }
        </View>
        <Animated.View style={[styles.balanceCard, { opacity: balanceAnim.opacity, transform: [{ translateY: balanceAnim.translateY }] }]}>
          <Text style={styles.balanceLabel}>NET BALANCE</Text>
          <Text style={[styles.balanceAmount, { color: netBalance >= 0 ? colors.success : colors.error }]}>{netBalance >= 0 ? '+' : ''}₩{Math.abs(netBalance).toLocaleString()}</Text>
          <View style={[styles.balanceBadge, { backgroundColor: netBalance >= 0 ? colors.success + '20' : colors.error + '20' }]}>
            <Text style={[styles.balanceBadgeText, { color: netBalance >= 0 ? colors.success : colors.error }]}>{netBalance >= 0 ? '↑ You are owed money' : '↓ You owe money'}</Text>
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.statsRow, { opacity: statsAnim.opacity, transform: [{ translateY: statsAnim.translateY }] }]}>
        <View style={[styles.statCard, { borderTopColor: colors.success }]}>
          <Text style={styles.statLabel}>You are owed</Text>
          <Text style={[styles.statAmount, { color: colors.success }]}>₩{totalOwed.toLocaleString()}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: colors.error }]}>
          <Text style={styles.statLabel}>You owe</Text>
          <Text style={[styles.statAmount, { color: colors.error }]}>₩{totalOwe.toLocaleString()}</Text>
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: listAnim.opacity, transform: [{ translateY: listAnim.translateY }] }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <Text style={styles.sectionSub}>Pull to refresh</Text>
        </View>
        {recentExpenses.length === 0
          ? <View style={styles.empty}><Text style={styles.emptyIcon}>💸</Text><Text style={styles.emptyText}>No expenses yet</Text><Text style={styles.emptySubText}>Create a group and add your first expense</Text></View>
          : recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={[styles.expenseIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.expenseIcon}>{CATEGORY_ICONS['other']}</Text>
              </View>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseGroup}>{expense.groups?.name || 'Unknown group'}</Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>₩{expense.amount.toLocaleString()}</Text>
                <Text style={styles.expenseDate}>{new Date(expense.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
            </View>
          ))
        }
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  headerBg: { backgroundColor: colors.navy, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: typography.sizes.sm, color: colors.textMuted },
  name: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.white },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff30' },
  avatarLetter: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.white },
  avatarImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#ffffff30' },
  balanceCard: { backgroundColor: '#ffffff10', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  balanceLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  balanceAmount: { fontSize: 42, fontWeight: typography.weights.bold, marginBottom: 12 },
  balanceBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  balanceBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: -20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, marginBottom: 6 },
  statAmount: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  sectionSub: { fontSize: typography.sizes.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium, marginBottom: 8 },
  emptySubText: { fontSize: typography.sizes.sm, color: colors.textMuted, textAlign: 'center' },
  expenseCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  expenseIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseIcon: { fontSize: 20 },
  expenseLeft: { flex: 1 },
  expenseTitle: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium, marginBottom: 3 },
  expenseGroup: { fontSize: typography.sizes.xs, color: colors.textMuted },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 3 },
  expenseDate: { fontSize: typography.sizes.xs, color: colors.textMuted },
})
`)

// ─── GroupsScreen.tsx ───
write(path.join(BASE, 'screens/groups/GroupsScreen.tsx'), `import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, Alert } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useFadeIn } from '../../hooks/useAnimation'
import { saveLocally, getLocally } from '../../lib/offlineStorage'

const GROUP_COLORS = ['#DC143C', '#2E5A88', '#27AE60', '#F39C12', '#8E44AD', '#E67E22']

export default function GroupsScreen() {
  const navigation = useNavigation<any>()
  const { session } = useAuth()
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const headerAnim = useFadeIn(0, !loading)
  const listAnim = useFadeIn(200, !loading)

  useEffect(() => { if (session) fetchGroups(); else setLoading(false) }, [session])
  useFocusEffect(React.useCallback(() => { if (session) fetchGroups() }, [session]))

  const fetchGroups = async () => {
    const userId = session?.user?.id
    if (!userId) return
    try {
      const cached = await getLocally('groups_' + userId)
      if (cached) { setGroups(cached); setLoading(false) }
      const { data } = await supabase.from('group_members').select('groups(id, name, description, created_at)').eq('user_id', userId)
      const groupList = data?.map((item: any) => item.groups) || []
      setGroups(groupList)
      await saveLocally('groups_' + userId, groupList)
    } catch (error) { console.log('Error:', error) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const onRefresh = () => { setRefreshing(true); fetchGroups() }
  const getGroupColor = (i: number) => GROUP_COLORS[i % GROUP_COLORS.length]
  const getGroupEmoji = (name: string) => {
    const l = name.toLowerCase()
    if (l.includes('trip') || l.includes('travel')) return '✈️'
    if (l.includes('food') || l.includes('dinner')) return '🍽️'
    if (l.includes('house') || l.includes('room')) return '🏠'
    if (l.includes('party') || l.includes('event')) return '🎉'
    return '👥'
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim.opacity, transform: [{ translateY: headerAnim.translateY }] }]}>
        <View>
          <Text style={styles.title}>My Groups</Text>
          <Text style={styles.subtitle}>{groups.length} group{groups.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.ScrollView contentContainerStyle={styles.content} style={{ opacity: listAnim.opacity }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {groups.length === 0
          ? <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubText}>Create a group to start splitting expenses</Text>
              <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateGroup')}>
                <Text style={styles.createButtonText}>Create your first group</Text>
              </TouchableOpacity>
            </View>
          : groups.map((group, index) => (
            <TouchableOpacity key={group.id} style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id, groupName: group.name })}
              onLongPress={() => Alert.alert('Delete Group', \`Delete "\${group.name}"?\`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('groups').delete().eq('id', group.id); fetchGroups() } }
              ])}
            >
              <View style={[styles.groupIcon, { backgroundColor: getGroupColor(index) }]}>
                <Text style={styles.groupEmoji}>{getGroupEmoji(group.name)}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDesc}>{group.description || 'Tap to view expenses'}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        }
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.navy },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.white },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textMuted, marginTop: 2 },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  content: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: typography.sizes.lg, color: colors.text, fontWeight: typography.weights.medium, marginBottom: 8 },
  emptySubText: { fontSize: typography.sizes.sm, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  createButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  createButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  groupCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  groupIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  groupEmoji: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.bold, marginBottom: 4 },
  groupDesc: { fontSize: typography.sizes.xs, color: colors.textMuted },
  arrow: { fontSize: 24, color: colors.textMuted },
})
`)

console.log('\n🎉 All screens restored!')