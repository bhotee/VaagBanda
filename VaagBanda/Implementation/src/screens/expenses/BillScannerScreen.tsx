import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export default function BillScannerScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { groupId, groupName } = route.params

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedText, setScannedText] = useState('')
  const [extractedAmount, setExtractedAmount] = useState('')
  const [extractedTitle, setExtractedTitle] = useState('')

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      await scanBill(result.assets[0].uri)
    }
  }

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      await scanBill(result.assets[0].uri)
    }
  }

  const scanBill = async (uri: string) => {
    setScanning(true)
    setScannedText('')
    setExtractedAmount('')
    setExtractedTitle('')

    try {
      let text = ''

      try {
        const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN)
        text = result.text
        console.log('ML Kit success:', text)
      } catch (mlError) {
        console.log('ML Kit failed, falling back to OCR.space:', mlError)
        const formData = new FormData()
        formData.append('file', { uri, name: 'bill.jpg', type: 'image/jpeg' } as any)
        formData.append('apikey', process.env.EXPO_PUBLIC_OCR_API_KEY || '')
        formData.append('language', 'eng')
        formData.append('isOverlayRequired', 'false')
        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        text = data.ParsedResults?.[0]?.ParsedText || ''
        console.log('OCR.space result:', text)
      }

      setScannedText(text)

      // Extract amount
      const lines = text.split('\n')
      let foundAmount = ''

      const totalKeywords = ['total', 'amount', 'sum', 'grand', 'bill', 'pay', 'due', 'balance', 'subtotal', '합계', '총액', '합산']
      for (const line of lines) {
        const lower = line.toLowerCase()
        if (totalKeywords.some(k => lower.includes(k))) {
          const match = line.match(/[\d,]+/)
          if (match) {
            foundAmount = match[0].replace(/,/g, '')
            break
          }
        }
      }

      if (!foundAmount) {
        const allNumbers = text.match(/\d[\d,]*/g) || []
        if (allNumbers.length > 0) {
          const numbers = allNumbers.map((a: string) => parseInt(a.replace(/,/g, ''), 10))
          const reasonable = numbers.filter(n => n > 100 && n < 10000000)
          if (reasonable.length > 0) {
            foundAmount = Math.max(...reasonable).toString()
          } else {
            foundAmount = Math.max(...numbers).toString()
          }
        }
      }

      if (foundAmount) setExtractedAmount(foundAmount)

      // Extract title from first non-empty line
      const titleLines = text.split('\n').filter((l: string) => l.trim().length > 2)
      if (titleLines.length > 0) {
        setExtractedTitle(titleLines[0].trim().substring(0, 30))
      }

    } catch (error: any) {
      console.log('ML Kit error:', error)
      Alert.alert('Error', 'Failed to scan bill. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const handleUseData = () => {
    if (!extractedAmount && !extractedTitle) {
      Alert.alert('Error', 'No data extracted. Please enter manually.')
      return
    }
    navigation.navigate('AddExpense', {
      groupId,
      groupName,
      prefillTitle: extractedTitle,
      prefillAmount: extractedAmount,
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.groupLabel}>Group: {groupName}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraButton} onPress={pickFromGallery}>
          <Text style={styles.cameraIcon}>🖼️</Text>
          <Text style={styles.cameraButtonText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      {scanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.scanningText}>Reading bill...</Text>
        </View>
      )}

      {!scanning && scannedText !== '' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Extracted Data</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={extractedTitle}
            onChangeText={setExtractedTitle}
            placeholder="Expense title"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={extractedAmount}
            onChangeText={setExtractedAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.useButton} onPress={handleUseData}>
            <Text style={styles.useButtonText}>Use This Data →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!scanning && scannedText !== '' && (
        <View style={styles.rawContainer}>
          <Text style={styles.rawTitle}>Raw text from bill</Text>
          <Text style={styles.rawText}>{scannedText}</Text>
        </View>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  back: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  groupLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraButtonText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 24,
  },
  scanningText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 12,
  },
  resultContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: typography.sizes.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  useButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  rawContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  rawTitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: 8,
  },
  rawText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
})