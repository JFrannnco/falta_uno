import { Platform, Alert } from 'react-native'

export const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n${message}`)
  } else {
    Alert.alert(title, message)
  }
}