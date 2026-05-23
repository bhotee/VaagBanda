import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export default function GroupDetailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName } = route.params
  const { session } = useAuth()

  const [expenses, setExpenses] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    React.useCallback(() => {
      fetchGroupData()
    }, [])
  )

  const fetchGroupData = async () => {
    try {
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('id, title, amount, paid_by, split_type, created_at, profiles(full_name)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      const { data: memberData } = await supabase
        .from('group_members')
        .select('profiles(id, full_name)')
        .eq('group_id', groupId)

      setExpenses(expenseData || [])
      const memberList = memberData?.map((m: any) => m.profiles) || []
      setMembers(memberList)
    } catch (error) {
      console.log('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const MEMBER_COLORS = ['#DC143C', '#2E5A88', '#27AE60', '#F39C12', '#8E44AD']

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSub}>{expenses.length} expenses</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('BillScanner', { groupId, groupName })}
          >
            <Text style={styles.scanBtnText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense', { groupId, groupName })}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total spent</Text>
            <Text style={styles.statValue}>₩{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Members</Text>
            <Text style={styles.statValue}>{members.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InviteMember', { groupId, groupName })}
            >
              <Text style={styles.sectionAction}>+ Invite</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {members.map((member: any, index: number) => (
              <View key={member.id} style={styles.memberChip}>
                <View style={[
                  styles.memberAvatar,
                  { backgroundColor: MEMBER_COLORS[index % MEMBER_COLORS.length] }
                ]}>
                  <Text style={styles.memberAvatarText}>
                    {member.full_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.memberName}>
                  {member.full_name?.split(' ')[0] || 'Unknown'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={() => navigation.navigate('SettleUp', { groupId, groupName })}
          >
            <Text style={styles.settleBtnText}>💰 Settle Up</Text>
          </TouchableOpacity>
        </View>

        {/* Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubText}>Tap + to add the first expense</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseCard}
                onLongPress={() => {
                  if (expense.paid_by === session?.user?.id) {
                    Alert.alert(
                      'Delete Expense',
                      `Delete "${expense.title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await supabase
                              .from('expenses')
                              .delete()
                              .eq('id', expense.id)
                            fetchGroupData()
                          }
                        }
                      ]
                    )
                  } else {
                    Alert.alert('Cannot delete', 'You can only delete expenses you created.')
                  }
                }}
              >
                <View style={styles.expenseIconBox}>
                  <Text style={styles.expenseIconText}>💳</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseMeta}>
                    Paid by {expense.profiles?.full_name || 'Unknown'} · {
                      new Date(expense.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      })
                    }
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  ₩{expense.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

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
  backButton: {
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
    marginHorizontal: 12,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scanBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${colors.white}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: {
    fontSize: 16,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 22,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    marginTop: -10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  memberChip: {
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberAvatarText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  memberName: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  actionRow: {
    marginBottom: 20,
  },
  settleBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  settleBtnText: {
    color: colors.success,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: 3,
  },
  expenseMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  expenseAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
})