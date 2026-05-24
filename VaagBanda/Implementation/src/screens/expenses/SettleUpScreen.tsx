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

// Debt simplification algorithm
function simplifyDebts(balances: Record<string, { name: string; amount: number }>) {
  const creditors: { id: string; name: string; amount: number }[] = []
  const debtors: { id: string; name: string; amount: number }[] = []

  Object.entries(balances).forEach(([id, { name, amount }]) => {
    if (amount > 0) creditors.push({ id, name, amount })
    else if (amount < 0) debtors.push({ id, name, amount: Math.abs(amount) })
  })

  const transactions: { from: string; to: string; amount: number }[] = []

  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    transactions.push({ from: debtor.name, to: creditor.name, amount })

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount === 0) i++
    if (creditor.amount === 0) j++
  }

  return transactions
}

export default function SettleUpScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName } = route.params
  const { session } = useAuth()

  const [splits, setSplits] = useState<any[]>([])
  const [simplified, setSimplified] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)
  const [showSimplified, setShowSimplified] = useState(false)

  useEffect(() => {
    if (session) fetchUnsettledSplits()
    else setLoading(false)
  }, [session])

  const fetchUnsettledSplits = async () => {
    const userId = session?.user?.id
    if (!userId) { setLoading(false); return }

    try {
      const { data: groupExpenses } = await supabase
        .from('expenses')
        .select('id, title, amount, paid_by, profiles(id, full_name)')
        .eq('group_id', groupId)

      if (!groupExpenses || groupExpenses.length === 0) {
        setLoading(false)
        return
      }

      const expenseIds = groupExpenses.map((e: any) => e.id)

      // Get all unsettled splits for this group
      const { data: allSplits } = await supabase
        .from('expense_splits')
        .select('id, amount_owed, user_id, expense_id, is_settled, profiles(id, full_name)')
        .eq('is_settled', false)
        .in('expense_id', expenseIds)

      // Get MY splits
      const mySplits = allSplits?.filter((s: any) => s.user_id === userId) || []
      const combined = mySplits.map((split: any) => ({
        ...split,
        expense: groupExpenses.find((e: any) => e.id === split.expense_id)
      }))
      setSplits(combined)

      // Calculate balances for ALL members for simplification
      const balances: Record<string, { name: string; amount: number }> = {}

      groupExpenses.forEach((expense: any) => {
        const paidById = expense.paid_by
        const paidByName = expense.profiles?.full_name || 'Unknown'
        if (!balances[paidById]) balances[paidById] = { name: paidByName, amount: 0 }
        balances[paidById].amount += expense.amount
      })

      allSplits?.forEach((split: any) => {
        const uid = split.user_id
        const name = split.profiles?.full_name || 'Unknown'
        if (!balances[uid]) balances[uid] = { name, amount: 0 }
        balances[uid].amount -= split.amount_owed
      })

      const simplified = simplifyDebts(balances)
      setSimplified(simplified)
    } catch (error) {
      console.log('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async (splitId: string) => {
    Alert.alert('Settle Up', 'Mark this as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Paid ✓',
        onPress: async () => {
          setSettling(splitId)
          const { error } = await supabase
            .from('expense_splits')
            .update({ is_settled: true, settled_at: new Date().toISOString() })
            .eq('id', splitId)
          if (error) Alert.alert('Error', error.message)
          else setSplits(splits.filter((s) => s.id !== splitId))
          setSettling(null)
        }
      }
    ])
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  const totalPending = splits.reduce((sum, s) => sum + s.amount_owed, 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settle Up</Text>
          <Text style={styles.headerSub}>{groupName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {splits.length > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL YOU OWE</Text>
          <Text style={styles.totalAmount}>₩{totalPending.toLocaleString()}</Text>
          <Text style={styles.totalSub}>{splits.length} pending payment{splits.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>

        {/* Simplified Debts Toggle */}
        {simplified.length > 0 && (
          <TouchableOpacity
            style={styles.simplifyBtn}
            onPress={() => setShowSimplified(!showSimplified)}
          >
            <Text style={styles.simplifyBtnText}>
              ✨ {showSimplified ? 'Hide' : 'Show'} Simplified Debts ({simplified.length} payment{simplified.length !== 1 ? 's' : ''})
            </Text>
          </TouchableOpacity>
        )}

        {/* Simplified Debts Section */}
        {showSimplified && simplified.length > 0 && (
          <View style={styles.simplifiedSection}>
            <Text style={styles.simplifiedTitle}>Minimum Payments Needed</Text>
            <Text style={styles.simplifiedSub}>Settle all debts with fewest transactions</Text>
            {simplified.map((t, index) => (
              <View key={index} style={styles.simplifiedCard}>
                <View style={styles.simplifiedIconBox}>
                  <Text style={styles.simplifiedIcon}>💸</Text>
                </View>
                <View style={styles.simplifiedLeft}>
                  <Text style={styles.simplifiedFrom}>{t.from}</Text>
                  <Text style={styles.simplifiedArrow}>pays → {t.to}</Text>
                </View>
                <Text style={styles.simplifiedAmount}>₩{Math.round(t.amount).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* My Splits */}
        {splits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>All settled!</Text>
            <Text style={styles.emptySubText}>No pending payments in this group</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Pending Payments</Text>
            {splits.map((split) => (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitIconBox}>
                  <Text style={styles.splitIcon}>💳</Text>
                </View>
                <View style={styles.splitLeft}>
                  <Text style={styles.splitTitle}>{split.expense?.title || 'Unknown'}</Text>
                  <Text style={styles.splitPaidBy}>Paid by {split.expense?.profiles?.full_name || 'Unknown'}</Text>
                </View>
                <View style={styles.splitRight}>
                  <Text style={styles.splitAmount}>₩{split.amount_owed.toLocaleString()}</Text>
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
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.navy, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.white}15`, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 20, color: colors.white },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white },
  headerSub: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2 },
  totalCard: { backgroundColor: colors.navy, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  totalLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.error, marginBottom: 4 },
  totalSub: { fontSize: typography.sizes.xs, color: colors.textMuted },
  content: { padding: 20, paddingBottom: 40 },
  simplifyBtn: { backgroundColor: `${colors.blue}15`, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: `${colors.blue}30` },
  simplifyBtnText: { color: colors.blue, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  simplifiedSection: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  simplifiedTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 4 },
  simplifiedSub: { fontSize: typography.sizes.xs, color: colors.textMuted, marginBottom: 12 },
  simplifiedCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  simplifiedIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  simplifiedIcon: { fontSize: 16 },
  simplifiedLeft: { flex: 1 },
  simplifiedFrom: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text },
  simplifiedArrow: { fontSize: typography.sizes.xs, color: colors.textMuted },
  simplifiedAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textMuted, marginBottom: 12, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: typography.sizes.xl, color: colors.text, fontWeight: typography.weights.bold, marginBottom: 8 },
  emptySubText: { fontSize: typography.sizes.sm, color: colors.textMuted, textAlign: 'center' },
  splitCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  splitIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.error}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  splitIcon: { fontSize: 20 },
  splitLeft: { flex: 1 },
  splitTitle: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium, marginBottom: 3 },
  splitPaidBy: { fontSize: typography.sizes.xs, color: colors.textMuted },
  splitRight: { alignItems: 'flex-end', gap: 8 },
  splitAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.error },
  payBtn: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  payBtnText: { color: colors.white, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
})