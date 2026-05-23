import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export default function SettleUpScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName } = route.params
  const { session } = useAuth()

  const [splits, setSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)

  useEffect(() => {
    if (session) fetchUnsettledSplits()
    else setLoading(false)
  }, [session])

  const fetchUnsettledSplits = async () => {
    const userId = session?.user?.id
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data: groupExpenses } = await supabase
        .from('expenses')
        .select('id, title, amount, paid_by, profiles(full_name)')
        .eq('group_id', groupId)

      if (!groupExpenses || groupExpenses.length === 0) {
        setLoading(false)
        return
      }

      const expenseIds = groupExpenses.map((e: any) => e.id)

      const { data: splitData } = await supabase
        .from('expense_splits')
        .select('id, amount_owed, user_id, expense_id, is_settled')
        .eq('user_id', userId)
        .eq('is_settled', false)
        .in('expense_id', expenseIds)

      const combined = splitData?.map((split: any) => ({
        ...split,
        expense: groupExpenses.find((e: any) => e.id === split.expense_id)
      })) || []

      setSplits(combined)
    } catch (error) {
      console.log('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async (splitId: string) => {
    Alert.alert(
      'Settle Up',
      'Mark this as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Paid ✓',
          onPress: async () => {
            setSettling(splitId)
            const { error } = await supabase
              .from('expense_splits')
              .update({
                is_settled: true,
                settled_at: new Date().toISOString(),
              })
              .eq('id', splitId)

            if (error) {
              Alert.alert('Error', error.message)
            } else {
              setSplits(splits.filter((s) => s.id !== splitId))
            }
            setSettling(null)
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const totalPending = splits.reduce((sum, s) => sum + s.amount_owed, 0)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settle Up</Text>
          <Text style={styles.headerSub}>{groupName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Total pending */}
      {splits.length > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL YOU OWE</Text>
          <Text style={styles.totalAmount}>
            ₩{totalPending.toLocaleString()}
          </Text>
          <Text style={styles.totalSub}>{splits.length} pending payment{splits.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {splits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>All settled!</Text>
            <Text style={styles.emptySubText}>
              No pending payments in this group
            </Text>
          </View>
        ) : (
          splits.map((split) => (
            <View key={split.id} style={styles.splitCard}>
              <View style={styles.splitIconBox}>
                <Text style={styles.splitIcon}>💳</Text>
              </View>
              <View style={styles.splitLeft}>
                <Text style={styles.splitTitle}>
                  {split.expense?.title || 'Unknown'}
                </Text>
                <Text style={styles.splitPaidBy}>
                  Paid by {split.expense?.profiles?.full_name || 'Unknown'}
                </Text>
              </View>
              <View style={styles.splitRight}>
                <Text style={styles.splitAmount}>
                  ₩{split.amount_owed.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => handleSettle(split.id)}
                  disabled={settling === split.id}
                >
                  {settling === split.id
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.payBtnText}>Pay</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))
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
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${colors.white}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalCard: {
    backgroundColor: colors.navy,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.error,
    marginBottom: 4,
  },
  totalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
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
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: typography.sizes.xl,
    color: colors.text,
    fontWeight: typography.weights.bold,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  splitCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
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
  splitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  splitIcon: {
    fontSize: 20,
  },
  splitLeft: {
    flex: 1,
  },
  splitTitle: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
    marginBottom: 3,
  },
  splitPaidBy: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  splitRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  splitAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.error,
  },
  payBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  payBtnText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
})