import { useState } from 'react'
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native'

import {
  Stack,
  useRouter,
  useLocalSearchParams,
} from 'expo-router'

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'

import {
  setSelectedLocation,
} from '../../lib/locationStore'

export default function SearchLocation() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const current = (params.current as string) || ''

  const [manualLocation, setManualLocation] =
    useState(current)

  const saveManual = () => {
    if (!manualLocation.trim()) return

    setSelectedLocation(manualLocation)

    router.back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Buscar ubicación
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* 🔥 WEB FALLBACK */}
        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <Text style={styles.label}>
              Ubicación
            </Text>

            <TextInput
              value={manualLocation}
              onChangeText={setManualLocation}
              placeholder="Escribí una dirección"
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={saveManual}
            >
              <Text style={styles.buttonText}>
                Guardar ubicación
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GooglePlacesAutocomplete
            placeholder="Buscar dirección..."
            fetchDetails
            minLength={2}
            debounce={300}
            enablePoweredByContainer={false}
            listViewDisplayed="auto"
            nearbyPlacesAPI="GooglePlacesSearch"
            predefinedPlaces={[]}
            query={{
              key: 'AIzaSyAhCjsVFGny1IAb7ZwTNNWHt3n9xLdd16k',
              language: 'es',
              components: 'country:py',
            }}
            onPress={(data) => {
              setSelectedLocation(
                data.description
              )

              router.back()
            }}
            textInputProps={{
              defaultValue: current,
              autoFocus: true,
            }}
            styles={{
              textInput: styles.input,
              listView: styles.list,
            }}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },

  header: {
    backgroundColor: '#0a0a23',
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  webContainer: {
    padding: 20,
  },

  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
    marginHorizontal: 14,
    marginTop: 14,
  },

  list: {
    backgroundColor: 'white',
    marginHorizontal: 14,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },

  button: {
    backgroundColor: '#0a0a23',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
})