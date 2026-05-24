import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useFadeIn } from '../../hooks/useAnimation'
import { Animated } from 'react-native'

const { width } = Dimensions.get('window')

const CATEGORY_COLORS: Record<string, string> = {
  food: '#E74C3C',
  transport: '#3498DB',
  accommodation: '#9B59B6',
  entertainment: '#F39C12',
  utilities: '#1ABC9C',
  other: '#95A5A6',
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚌',
  accommodation: '🏨',
  entertainment: '🎭',
  utilities: '💡',
  other: '📦',
}

export default function AnalyticsScreen() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [thisMonth, setThisMonth] = useState(0)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [groupData, setGroupData] = useState<any[]>([])
  const [expenseCount, setExpenseCount] = useState(0)

  const fadeAnim = useFadeIn(0, !loading)

  useEffect(() => {
    if (session) fetchAnalytics()
    else setLoading(false)
  }, [session])

  const fetchAnalytics = async () => {
    const userId = session?.user?.id
    if (!userId) return

    try {
      // Get all expenses from user's groups
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)

      const groupIds = memberGroups?.map((g: any) => g.group_id) || []

      if (groupIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, title, amount, category, created_at, group_id, groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })

      if (!expenses) { setLoading(false); return }

      console.log('Expenses:', JSON.stringify(expenses?.slice(0, 3)))

      setExpenseCount(expenses.length)

      // Total spent
      const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
      setTotalSpent(total)

      // This month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthExpenses = expenses.filter((e: any) => new Date(e.created_at) >= monthStart)
      const monthTotal = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)
      setThisMonth(monthTotal)

      // Category breakdown
      const catMap: Record<string, number> = {}
      expenses.forEach((e: any) => {
        const cat = e.category || 'other'
        catMap[cat] = (catMap[cat] || 0) + e.amount
      })
      const catArray = Object.entries(catMap)
        .map(([key, amount]) => ({ key, amount, percent: Math.round((amount / total) * 100) }))
        .sort((a, b) => b.amount - a.amount)
      setCategoryData(catArray)

      // Group breakdown
      const groupMap: Record<string, { name: string; amount: number }> = {}
      expenses.forEach((e: any) => {
        const gid = e.group_id
        const gname = e.groups?.name || 'Unknown'
        if (!groupMap[gid]) groupMap[gid] = { name: gname, amount: 0 }
        groupMap[gid].amount += e.amount
      })
      const groupArray = Object.values(groupMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
      setGroupData(groupArray)

    } catch (error) {
      console.log('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim.opacity }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSub}>Your spending insights</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            ₩{totalSpent.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: colors.success }]}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            ₩{thisMonth.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: colors.blue }]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryAmount, { color: colors.blue }]}>
            {expenseCount}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: colors.warning || '#F39C12' }]}>
          <Text style={styles.summaryLabel}>Avg per Expense</Text>
          <Text style={[styles.summaryAmount, { color: '#F39C12' }]}>
            ₩{expenseCount > 0 ? Math.round(totalSpent / expenseCount).toLocaleString() : 0}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {categoryData.map((cat) => (
            <View key={cat.key} style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat.key] || '📦'}</Text>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryNameRow}>
                  <Text style={styles.categoryName}>{cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}</Text>
                  <Text style={styles.categoryPercent}>{cat.percent}%</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[
                    styles.barFill,
                    {
                      width: `${cat.percent}%`,
                      backgroundColor: CATEGORY_COLORS[cat.key] || colors.primary
                    }
                  ]} />
                </View>
                <Text style={styles.categoryAmount}>₩{cat.amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Group Breakdown */}
      {groupData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Groups by Spending</Text>
          {groupData.map((group, index) => (
            <View key={index} style={styles.groupRow}>
              <View style={[styles.groupRank, { backgroundColor: index === 0 ? colors.primary : colors.background }]}>
                <Text style={[styles.groupRankText, { color: index === 0 ? colors.white : colors.textMuted }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupAmount}>₩{group.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {categoryData.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No data yet</Text>
          <Text style={styles.emptySubText}>Add some expenses to see analytics</Text>
        </View>
      )}

    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: colors.navy, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.white },
  headerSub: { fontSize: typography.sizes.sm, color: colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 },
  summaryCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, marginBottom: 6 },
  summaryAmount: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, margin: 20, marginBottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 16 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  categoryIcon: { fontSize: 24, marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  categoryPercent: { fontSize: typography.sizes.xs, color: colors.textMuted, fontWeight: typography.weights.bold },
  barBg: { height: 6, backgroundColor: colors.background, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: typography.sizes.xs, color: colors.textMuted },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  groupRank: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupRankText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  groupName: { flex: 1, fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  groupAmount: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: typography.sizes.lg, color: colors.text, fontWeight: typography.weights.medium, marginBottom: 8 },
  emptySubText: { fontSize: typography.sizes.sm, color: colors.textMuted, textAlign: 'center' },
})