import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Image, Linking } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

const MENU_ITEMS = [
  { icon: '👤', label: 'Edit Profile', action: 'edit' },
  { icon: '🔔', label: 'Notification Preferences', action: 'notifications' },
  { icon: '💱', label: 'Default Currency', action: 'currency' },
  { icon: '🌙', label: 'Appearance', action: 'appearance' },
  { icon: '🔒', label: 'Security & Privacy', action: 'security' },
  { icon: '📊', label: 'Analytics', action: 'analytics' },
  { icon: '📤', label: 'Export Data', action: 'export' },
  { icon: '❓', label: 'Help & Support', action: 'help' },
  { icon: '📋', label: 'Terms & Conditions', action: 'terms' },
  { icon: '✉️', label: 'Contact Us', action: 'contact' },
  { icon: 'ℹ️', label: 'About VaagBanda', action: 'about' },
]

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useFocusEffect(React.useCallback(() => { fetchProfile() }, [session]))

  const fetchProfile = async () => {
    const userId = session?.user?.id
    if (!userId) return
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single()
    if (data) { setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || null) }
    setLoading(false)
  }

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.5 })
    if (!result.canceled && result.assets[0]) await uploadAvatar(result.assets[0].uri)
  }

  const uploadAvatar = async (uri: string) => {
    const userId = session?.user?.id
    if (!userId) return
    setUploadingAvatar(true)
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = userId + '.' + fileExt
      const formData = new FormData()
      formData.append('file', { uri, name: fileName, type: 'image/' + fileExt } as any)
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, formData, { contentType: 'image/' + fileExt, upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', userId)
      setAvatarUrl(urlData.publicUrl)
      Alert.alert('Success', 'Avatar updated!')
    } catch (error: any) { Alert.alert('Error', error.message) }
    finally { setUploadingAvatar(false) }
  }

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', session?.user?.id)
    setSaving(false)
    if (error) Alert.alert('Error', error.message)
    else { setEditing(false); Alert.alert('Success', 'Profile updated!') }
  }

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'edit': setEditing(true); break
      case 'terms': Alert.alert('Terms & Conditions', 'VaagBanda Terms & Conditions\n\nBy using VaagBanda, you agree to split expenses fairly.\n\nAll data is stored securely on Supabase servers.\n\n© 2025 CyberSquadNp'); break
      case 'contact': Linking.openURL('mailto:cybersquadnp@gmail.com'); break
      case 'about': Alert.alert('About VaagBanda', 'VaagBanda v1.0\n\nScan · Split · Settle\n\nBuilt by Team CyberSquadNp\nDongshin University\n\n• Lama Rojan\n• Lama Nischal\n• Dankoti Jabin\n• Shrestha Asim'); break
      case 'help': Alert.alert('Help & Support', 'For help, contact us at:\ncybersquadnp@gmail.com'); break
      default: Alert.alert('Coming Soon', 'This feature will be available in the next update.')
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl + '?t=' + Date.now() }} style={styles.avatarImage} />
            : <View style={styles.avatar}><Text style={styles.avatarText}>{fullName?.charAt(0).toUpperCase() || '?'}</Text></View>
          }
          {uploadingAvatar && <View style={styles.avatarOverlay}><ActivityIndicator color={colors.white} size="small" /></View>}
        </TouchableOpacity>
        {editing
          ? <View style={styles.editNameRow}>
              <TextInput style={styles.nameInput} value={fullName} onChangeText={setFullName} autoFocus placeholderTextColor="#ffffff60" />
              <TouchableOpacity style={styles.saveNameBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.saveNameText}>Save</Text>}
              </TouchableOpacity>
            </View>
          : <TouchableOpacity onPress={() => setEditing(true)}><Text style={styles.name}>{fullName || 'No name'} ✏️</Text></TouchableOpacity>
        }
        <Text style={styles.email}>{session?.user?.email}</Text>
        <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickAvatar}>
          <Text style={styles.changePhotoText}>📷 Change Photo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity key={item.action} style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]} onPress={() => handleMenuAction(item.action)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>{'VaagBanda v1.0 · CyberSquadNp\nDongshin University'}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: colors.navy, paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#ffffff30', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#ffffff30', marginBottom: 12 },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 12, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: typography.weights.bold, color: colors.white },
  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameInput: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: 4, minWidth: 150, textAlign: 'center' },
  saveNameBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveNameText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  name: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white, marginBottom: 4 },
  email: { fontSize: typography.sizes.sm, color: colors.textMuted, marginBottom: 12 },
  changePhotoBtn: { backgroundColor: '#ffffff15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  changePhotoText: { color: colors.white, fontSize: typography.sizes.sm },
  menuCard: { backgroundColor: colors.white, marginHorizontal: 20, marginTop: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  menuArrow: { fontSize: 20, color: colors.textMuted },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, padding: 16, borderRadius: 14, backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  signOutIcon: { fontSize: 18, marginRight: 14 },
  signOutText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  version: { textAlign: 'center', fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 20, lineHeight: 18 },
})
