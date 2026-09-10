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

/** Distancia entre dos coordenadas en km (fórmula de Haversine). */
export const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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