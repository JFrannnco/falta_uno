import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native'

import { fetchPlaceLatLng } from '../lib/utils'

type Prediction = {
  placeId: string
  description: string
}

type Props = {
  initialValue?: string
  placeholder?: string
  autoFocus?: boolean
  onSelect: (
    description: string,
    latitude: number | null,
    longitude: number | null
  ) => void
  inputStyle?: any
}

export default function LocationAutocomplete({
  initialValue = '',
  placeholder = 'Buscar dirección...',
  autoFocus = false,
  onSelect,
  inputStyle,
}: Props) {
  const [text, setText] = useState(initialValue)
  const [predictions, setPredictions] =
    useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const skipNextSearch = useRef(false)

  const searchPlaces = useCallback(async (input: string) => {
    setLoading(true)

    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete?key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input,
            languageCode: 'es',
            includedRegionCodes: ['py'],
          }),
        }
      )

      const json = await res.json()

      const results: Prediction[] = (
        json.suggestions || []
      )
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          description:
            s.placePrediction.text?.text || '',
        }))

      setPredictions(results)
    } catch {
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }

    if (text.trim().length < 2) {
      /*
        No es el patrón "cargar datos al montar" que ataca esta regla — es
        sincronizar la lista de sugerencias con el texto, que es exactamente
        para lo que están los efectos. Sin resultados que mostrar para un
        texto corto, se limpia; no hay forma de expresar esto sin un
        `setState` en el cuerpo del efecto.
      */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPredictions([])
      return
    }

    const timeout = setTimeout(() => {
      searchPlaces(text)
    }, 400)

    return () => clearTimeout(timeout)
  }, [text, searchPlaces])

  const handleSelect = async (
    prediction: Prediction
  ) => {
    skipNextSearch.current = true
    setText(prediction.description)
    setPredictions([])
    Keyboard.dismiss()

    const coords = await fetchPlaceLatLng(
      prediction.placeId
    )

    onSelect(
      prediction.description,
      coords?.latitude ?? null,
      coords?.longitude ?? null
    )
  }

  return (
    <View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoFocus={autoFocus}
        style={[styles.input, inputStyle]}
      />

      {loading && (
        <ActivityIndicator
          style={styles.loader}
          size="small"
        />
      )}

      {predictions.length > 0 && (
        <View style={styles.list}>
          {predictions.map((p) => (
            <TouchableOpacity
              key={p.placeId}
              style={styles.row}
              onPress={() => handleSelect(p)}
            >
              <Text style={styles.rowText}>
                {p.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    color: '#111',
  },

  loader: {
    position: 'absolute',
    right: 14,
    top: 14,
  },

  list: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },

  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  rowText: {
    fontSize: 14,
    color: '#111',
  },
})
