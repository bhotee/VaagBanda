import React, { useState } from 'react'
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

  useFocusEffect(React.useCallback(() => { if (session) fetchGroups(); else setLoading(false) }, [session]))

  const fetchGroups = async () => {
    const userId = session?.user?.id
    if (!userId) return
    try {
      // Load from cache first
      const cached = await getLocally('groups_' + userId)
      if (cached && cached.length > 0) {
        setGroups(cached)
        setLoading(false)
      }
      
      // Try to fetch from network
      const { data } = await supabase.from('group_members').select('groups(id, name, description, created_at)').eq('user_id', userId)
      const groupList = data?.map((item: any) => item.groups) || []
      
      if (groupList.length > 0) {
        setGroups(groupList)
        await saveLocally('groups_' + userId, groupList)
      }
    } catch (error) {
      console.log('Offline - using cache')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
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
              onLongPress={() => Alert.alert('Delete Group', `Delete "${group.name}"?`, [
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
