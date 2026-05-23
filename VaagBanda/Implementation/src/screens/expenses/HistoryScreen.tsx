import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export default function HistoryScreen() {
  const { session } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    React.useCallback(() => {
      if (session) fetchHistory()
      else setLoading(false)
    }, [session])
  )

  const fetchHistory = async () => {
    const userId = session?.user?.id
    if (!userId) return

    try {
      const { data } = await supabase
        .from('expense_splits')
        .select(`
          id,
          amount_owed,
          is_settled,
          expenses(
            id,
            title,
            amount,
            created_at,
            paid_by,
            profiles(full_name),
            groups(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false, referencedTable: 'expenses' })

      setExpenses(data || [])
    } catch (error) {
      console.log('Error fetching history:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchHistory()
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const totalPending = expenses
    .filter(s => !s.is_settled)
    .reduce((sum, s) => sum + s.amount_owed, 0)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{expenses.length} transactions</Text>
      </View>

      {/* Summary */}
      {expenses.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: colors.warning }]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              ₩{totalPending.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: colors.success }]}>
            <Text style={styles.summaryLabel}>Settled</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {expenses.filter(s => s.is_settled).length} items
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubText}>
              Your expense history will appear here
            </Text>
          </View>
        ) : (
          expenses.map((split) => {
            const expense = split.expenses
            const isSettled = split.is_settled
            const isPaidByMe = expense?.paid_by === session?.user?.id

            return (
              <View key={split.id} style={styles.expenseCard}>
                <View style={[
                  styles.expenseIconBox,
                  { backgroundColor: isPaidByMe ? `${colors.success}15` : `${colors.error}15` }
                ]}>
                  <Text style={styles.expenseIconText}>
                    {isPaidByMe ? '💸' : '💳'}
                  </Text>
                </View>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseTitle}>
                    {expense?.title || 'Unknown'}
                  </Text>
                  <Text style={styles.expenseGroup}>
                    {expense?.groups?.name || 'Unknown group'}
                  </Text>
                  <Text style={styles.expensePaidBy}>
                    {isPaidByMe ? 'You paid' : `Paid by ${expense?.profiles?.full_name}`}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[
                    styles.expenseAmount,
                    { color: isPaidByMe ? colors.success : colors.error }
                  ]}>
                    {isPaidByMe ? '+' : '-'}₩{split.amount_owed.toLocaleString()}
                  </Text>
                  <View style={[
                    styles.badge,
                    { backgroundColor: isSettled ? `${colors.success}15` : `${colors.warning}15` }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: isSettled ? colors.success : colors.warning }
                    ]}>
                      {isSettled ? '✓ Settled' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -10,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    fontWeight: typography.weights.medium,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 20,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  expenseGroup: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  expensePaidBy: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  expenseAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
})