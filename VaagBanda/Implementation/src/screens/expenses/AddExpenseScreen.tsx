import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useFadeIn } from '../../hooks/useAnimation'
import { sendLocalNotification } from '../../lib/notifications'

const CATEGORIES = [
  { key: 'food', emoji: '🍽️', label: 'Food' },
  { key: 'transport', emoji: '🚌', label: 'Transport' },
  { key: 'accommodation', emoji: '🏨', label: 'Hotel' },
  { key: 'entertainment', emoji: '🎭', label: 'Fun' },
  { key: 'utilities', emoji: '💡', label: 'Bills' },
  { key: 'other', emoji: '📦', label: 'Other' },
]

export default function AddExpenseScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName, prefillTitle, prefillAmount } = route.params
  const { session } = useAuth()

  const [title, setTitle] = useState(prefillTitle || '')
  const [amount, setAmount] = useState(prefillAmount || '')
  const [splitType, setSplitType] = useState<'equal' | 'percent' | 'custom'>('equal')
  const [category, setCategory] = useState('other')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const formAnim = useFadeIn(0, !fetching)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from('group_members').select('profiles(id, full_name)').eq('group_id', groupId)
    const memberList = data?.map((m: any) => ({ ...m.profiles, customAmount: '', percent: '' })) || []
    setMembers(memberList)
    setFetching(false)
  }

  const totalPercent = members.reduce((sum, m) => sum + (parseFloat(m.percent) || 0), 0)
  const totalCustom = members.reduce((sum, m) => sum + (parseFloat(m.customAmount) || 0), 0)

  const handlePercentChange = (memberId: string, val: string) => {
    const updated = members.map(m => m.id === memberId ? { ...m, percent: val } : m)
    if (members.length === 2) {
      const remaining = 100 - (parseFloat(val) || 0)
      setMembers(updated.map(m => m.id !== memberId ? { ...m, percent: remaining >= 0 ? String(remaining) : '0' } : m))
    } else {
      setMembers(updated)
    }
  }

  const handleAddExpense = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return }
    if (splitType === 'percent' && totalPercent !== 100) { Alert.alert('Error', `Percentages must add up to 100%. Currently: ${totalPercent}%`); return }
    if (splitType === 'custom' && Math.abs(totalCustom - Number(amount)) > 1) { Alert.alert('Error', `Amounts must add up to ₩${Number(amount).toLocaleString()}`); return }

    const userId = session?.user?.id
    if (!userId) return
    const totalAmount = Number(amount)
    setLoading(true)

    try {
      const { data: expense, error: expenseError } = await supabase.from('expenses').insert({
        group_id: groupId, title: title.trim(), amount: totalAmount, paid_by: userId, split_type: splitType,
      }).select().single()
      if (expenseError) throw expenseError

      const splits = members.map((member) => {
        let amountOwed = 0
        if (splitType === 'equal') amountOwed = totalAmount / members.length
        else if (splitType === 'percent') amountOwed = (totalAmount * (Number(member.percent) || 0)) / 100
        else amountOwed = Number(member.customAmount) || 0
        return { expense_id: expense.id, user_id: member.id, amount_owed: amountOwed, is_settled: member.id === userId }
      })

      const { error: splitError } = await supabase.from('expense_splits').insert(splits)
      if (splitError) throw splitError
      sendLocalNotification('Expense Added! 🎉', title + ' - ₩' + Number(amount).toLocaleString())
Alert.alert('Success! 🎉', 'Expense added!', [
  { text: 'OK', onPress: () => navigation.goBack() }
])
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally { setLoading(false) }
  }

  if (fetching) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  const equalShare = members.length > 0 ? (Number(amount) / members.length).toFixed(0) : '0'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Expense</Text>
          <Text style={styles.headerSub}>{groupName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
      <Animated.ScrollView style={{ opacity: formAnim.opacity }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₩</Text>
            <TextInput style={styles.amountInput} placeholder="0" placeholderTextColor="#ffffff50" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>What was this for?</Text>
          <TextInput style={styles.input} placeholder="e.g. Dinner, Hotel, Taxi" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.key} style={[styles.categoryItem, category === cat.key && styles.categoryItemActive]} onPress={() => setCategory(cat.key)}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, category === cat.key && styles.categoryLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Split Method</Text>
          <View style={styles.splitRow}>
            {(['equal', 'percent', 'custom'] as const).map((type) => (
              <TouchableOpacity key={type} style={[styles.splitOption, splitType === type && styles.splitOptionActive]} onPress={() => setSplitType(type)}>
                <Text style={[styles.splitOptionText, splitType === type && styles.splitOptionTextActive]}>
                  {type === 'equal' ? 'Equal' : type === 'percent' ? '%' : 'Custom'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.memberHeader}>
            <Text style={styles.cardLabel}>SPLIT BETWEEN</Text>
            {splitType === 'percent' && (
              <Text style={[styles.percentTotal, { color: totalPercent === 100 ? colors.success : colors.error }]}>{totalPercent}% / 100%</Text>
            )}
            {splitType === 'custom' && (
              <Text style={[styles.percentTotal, { color: Math.abs(totalCustom - Number(amount)) < 1 ? colors.success : colors.error }]}>₩{totalCustom.toLocaleString()} / ₩{Number(amount).toLocaleString()}</Text>
            )}
          </View>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{member.full_name?.charAt(0).toUpperCase() || '?'}</Text></View>
              <Text style={styles.memberName}>{member.full_name}</Text>
              {splitType === 'equal' && <Text style={styles.memberAmount}>₩{Number(equalShare).toLocaleString()}</Text>}
              {splitType === 'percent' && (
                <View style={styles.percentRow}>
                  <TextInput style={styles.smallInput} placeholder="0" placeholderTextColor={colors.textMuted} value={member.percent} onChangeText={(val) => handlePercentChange(member.id, val)} keyboardType="numeric" />
                  <Text style={styles.percentSign}>%</Text>
                  {amount && member.percent ? <Text style={styles.percentAmount}>₩{((Number(amount) * (parseFloat(member.percent) || 0)) / 100).toFixed(0)}</Text> : null}
                </View>
              )}
              {splitType === 'custom' && (
                <TextInput style={styles.smallInput} placeholder="₩0" placeholderTextColor={colors.textMuted} value={member.customAmount} onChangeText={(val) => setMembers(members.map(m => m.id === member.id ? { ...m, customAmount: val } : m))} keyboardType="numeric" />
              )}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Expense</Text>}
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.navy, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ffffff15', justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 20, color: colors.white },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white },
  headerSub: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2 },
  content: { padding: 20, paddingBottom: 40 },
  amountCard: { backgroundColor: colors.navy, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, marginTop: -10 },
  amountLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  currency: { fontSize: 24, color: '#ffffff70', fontWeight: typography.weights.bold },
  amountInput: { fontSize: 48, fontWeight: typography.weights.bold, color: colors.white, minWidth: 120, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  cardLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  input: { fontSize: typography.sizes.md, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, width: '30%', backgroundColor: colors.background },
  categoryItemActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryLabel: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weights.medium },
  categoryLabelActive: { color: colors.primary },
  splitRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 10, padding: 4, gap: 4 },
  splitOption: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  splitOptionActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  splitOptionText: { fontSize: typography.sizes.sm, color: colors.textMuted, fontWeight: typography.weights.medium },
  splitOptionTextActive: { color: colors.primary, fontWeight: typography.weights.bold },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  percentTotal: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  memberAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  memberAvatarText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  memberName: { flex: 1, color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  memberAmount: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  percentSign: { color: colors.textMuted, fontSize: typography.sizes.sm },
  percentAmount: { color: colors.textMuted, fontSize: typography.sizes.xs },
  smallInput: { backgroundColor: colors.background, borderRadius: 8, padding: 8, color: colors.text, fontSize: typography.sizes.sm, width: 60, textAlign: 'center', borderWidth: 1, borderColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 0.5 },
})
