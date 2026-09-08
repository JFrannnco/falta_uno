import { Platform, Alert } from 'react-native'
import type { useRouter } from 'expo-router'

export const showMessage = (
  title: string,
  message: string,
  onDismiss?: () => void
) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n${message}`)
    onDismiss?.()
  } else {
    Alert.alert(
      title,
      message,
      onDismiss
        ? [{ text: 'OK', onPress: onDismiss }]
        : undefined
    )
  }
}

export const safeBack = (
  router: ReturnType<typeof useRouter>,
  fallback: string = '/(tabs)/matches'
) => {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace(fallback as any)
  }
}

export const fetchPlaceLatLng = async (
  placeId: string | undefined
): Promise<{ latitude: number; longitude: number } | null> => {
  if (!placeId) return null

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY}&fields=location`
    )

    const json = await res.json()

    if (!json.location) return null

    return {
      latitude: json.location.latitude,
      longitude: json.location.longitude,
    }
  } catch {
    return null
  }
}