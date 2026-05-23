import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export default function InviteMemberScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName } = route.params

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email')
      return
    }

    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_id_by_email', { email_input: email.trim().toLowerCase() })

      if (userError || !userData) {
        Alert.alert('Error', 'No user found with that email. Make sure they have an account.')
        setLoading(false)
        return
      }

      const userId = userData

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        Alert.alert('Already a member', 'This user is already in the group.')
        setLoading(false)
        return
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId })

      if (memberError) throw memberError

      Alert.alert('Success! 🎉', 'Member added to group!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

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
        <Text style={styles.headerTitle}>Invite Member</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {/* Group info */}
        <View style={styles.groupBadge}>
          <Text style={styles.groupBadgeText}>👥 {groupName}</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            The person must already have a VaagBanda account. Enter their registered email address.
          </Text>
        </View>

        {/* Email input */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="friend@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.inviteBtnText}>Add to Group →</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  content: {
    padding: 20,
  },
  groupBadge: {
    backgroundColor: `${colors.navy}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 16,
  },
  groupBadgeText: {
    fontSize: typography.sizes.sm,
    color: colors.navy,
    fontWeight: typography.weights.medium,
  },
  infoCard: {
    backgroundColor: `${colors.blue}10`,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.blue}20`,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.blue,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    fontSize: typography.sizes.md,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  inviteBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
})