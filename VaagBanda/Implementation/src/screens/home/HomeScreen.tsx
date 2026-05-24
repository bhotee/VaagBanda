import React, { useState } from 'react'
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
    // Load cache first
    const cached = await getLocally('home_' + userId)
    if (cached) {
      setName(cached.name || session?.user?.email?.split('@')[0] || 'there')
      setAvatarUrl(cached.avatarUrl)
      setTotalOwed(cached.totalOwed)
      setTotalOwe(cached.totalOwe)
      setRecentExpenses(cached.recentExpenses)
      setLoading(false)
    }

    // Try network
    const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single()
    if (profile) { setName(profile.full_name); setAvatarUrl(profile.avatar_url || null) }

    const { data: myOwed } = await supabase.from('expense_splits').select('amount_owed, expenses(paid_by)').eq('user_id', userId).eq('is_settled', false)
    const { data: othersOwe } = await supabase.from('expense_splits').select('amount_owed, expenses(paid_by)').eq('is_settled', false).neq('user_id', userId)

    const iOwe = myOwed?.filter((s: any) => s.expenses?.paid_by !== userId).reduce((sum: number, s: any) => sum + s.amount_owed, 0) || 0
    const owedToMe = othersOwe?.filter((s: any) => s.expenses?.paid_by === userId).reduce((sum: number, s: any) => sum + s.amount_owed, 0) || 0

    setTotalOwe(iOwe); setTotalOwed(owedToMe)

    const { data: expenses } = await supabase.from('expenses').select('id, title, amount, created_at, groups(name)').order('created_at', { ascending: false }).limit(5)
    setRecentExpenses(expenses || [])

    await saveLocally('home_' + userId, {
      name: profile?.full_name || '',
      avatarUrl: profile?.avatar_url || null,
      totalOwed: owedToMe,
      totalOwe: iOwe,
      recentExpenses: expenses || [],
    })
  } catch (error) {
    console.log('Offline - using cache')
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
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
                <Text style={styles.expenseIcon}>{CATEGORY_ICONS[expense.category] ?? CATEGORY_ICONS['other']}</Text>
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
