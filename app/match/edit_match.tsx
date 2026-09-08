import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native'

import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from 'expo-router'

import { Picker } from '@react-native-picker/picker'

import { supabase } from '../../lib/supabase'
import { showMessage, safeBack } from '../../lib/utils'

import {
  getSelectedLocation,
  getSelectedCoords,
  clearSelectedLocation,
} from '../../lib/locationStore'

export default function EditMatch() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const id = params.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [club, setClub] = useState('')
  const [court, setCourt] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [playersNeeded, setPlayersNeeded] = useState('4')

  const [categories, setCategories] = useState<any[]>([])
  const [categoryId, setCategoryId] = useState('')

  const [modalities, setModalities] = useState<any[]>([])
  const [modalityId, setModalityId] = useState('')

  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    if (!id) return

    loadData()
  }, [id])

  // 🔥 FIX ubicación
  useFocusEffect(() => {
    const loc = getSelectedLocation()

    if (loc) {
      const coords = getSelectedCoords()

      setLocation(loc)
      setLatitude(coords.latitude)
      setLongitude(coords.longitude)
      clearSelectedLocation()
    }
  })

  const loadData = async () => {
    try {
      if (!id) return

      setLoading(true)

      const { data: match, error: matchError } =
        await supabase
          .from('matches')
          .select('*')
          .eq('id', id)
          .single()

      console.log('MATCH:', match)
      console.log('MATCH ERROR:', matchError)

      const { data: cats } = await supabase
        .from('categories')
        .select('*')

      const { data: mods } = await supabase
        .from('modalities')
        .select('*')

      const { data: joined } = await supabase
        .from('match_players')
        .select(`
          id,
          profiles (
            name,
            categories(name)
          )
        `)
        .eq('match_id', id)
        .eq('status', 'confirmed')

      if (match) {
        setClub(match.club_name || '')
        setCourt(match.court || '')
        setLocation(match.location || '')
        setLatitude(match.latitude ?? null)
        setLongitude(match.longitude ?? null)
        setPlayersNeeded(
          String(match.players_needed || 4)
        )

        setCategoryId(
          String(match.category_id || '')
        )

        setModalityId(
          String(match.modality_id || '')
        )
      }

      setCategories(cats || [])
      setModalities(mods || [])
      setPlayers(joined || [])
    } catch (err) {
      console.log(err)

      showMessage(
        'Error',
        'No se pudo cargar el partido'
      )
    } finally {
      setLoading(false)
    }
  }

  const saveMatch = async () => {
    try {
      if (!id) {
        showMessage(
          'Error',
          'No se encontró el partido'
        )
        return
      }

      const newLimit = Number(playersNeeded)

      if (newLimit < players.length) {
        showMessage(
          'Error',
          `No podés reducir jugadores porque ya hay ${players.length}`
        )
        return
      }

      setSaving(true)

      console.log('EDITANDO MATCH:', {
        id,
        club,
        court,
        location,
        playersNeeded,
        categoryId,
        modalityId,
      })

      const payload = {
        club_name: club.trim(),
        court: court.trim(),
        location: location.trim(),
        latitude,
        longitude,
        players_needed: newLimit,
        category_id: categoryId,
        modality_id: modalityId,
      }

      console.log('PAYLOAD:', payload)

      const { data, error } = await supabase
        .from('matches')
        .update(payload)
        .eq('id', id)
        .select()

      console.log('DATA:', data)
      console.log('ERROR:', error)

      if (error) {
        showMessage(
          'Error',
          error.message
        )
        return
      }

      if (!data || data.length === 0) {
        showMessage(
          'Error',
          'No se pudo actualizar el partido'
        )

        return
      }

      showMessage(
        'Éxito',
        'Partido actualizado',
        () =>
          safeBack(router, '/match/my_matches')
      )
    } catch (err) {
      console.log(err)

      showMessage(
        'Error',
        'Ocurrió un error inesperado'
      )
    } finally {
      setSaving(false)
    }
  }

  const removePlayer = (
    rowId: number,
    name: string
  ) => {
    Alert.alert(
      'Expulsar',
      `¿Expulsar a ${name}?`,
      [
        {
          text: 'No',
        },
        {
          text: 'Sí',
          onPress: async () => {
            await supabase
              .from('match_players')
              .delete()
              .eq('id', rowId)

            loadData()
          },
        },
      ]
    )
  }

  if (!id) {
    return (
      <View style={styles.loader}>
        <Text>Error: ID inválido</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#0a0a23"
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            safeBack(router, '/match/my_matches')
          }
        >
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Editar Partido
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>
            Complejo
          </Text>

          <TextInput
            value={club}
            onChangeText={setClub}
            style={styles.input}
          />

          <Text style={styles.label}>
            Cancha
          </Text>

          <TextInput
            value={court}
            onChangeText={setCourt}
            style={styles.input}
          />

          <Text style={styles.label}>
            Ubicación
          </Text>

          <TouchableOpacity
            style={styles.input}
            onPress={() =>
              router.push({
                pathname:
                  '/match/search_location',
                params: {
                  current: location,
                  id,
                },
              })
            }
          >
            <Text
              style={{
                color: location
                  ? '#111'
                  : '#888',
              }}
            >
              {location ||
                'Seleccionar ubicación'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>
            Jugadores
          </Text>

          <View style={styles.input}>
            <Picker
              selectedValue={playersNeeded}
              onValueChange={setPlayersNeeded}
            >
              {[
                '4',
                '5',
                '6',
                '7',
                '8',
              ].map((n) => (
                <Picker.Item
                  key={n}
                  label={n}
                  value={n}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>
            Categoría
          </Text>

          <View style={styles.input}>
            <Picker
              selectedValue={categoryId}
              onValueChange={setCategoryId}
            >
              {categories.map((c) => (
                <Picker.Item
                  key={c.id}
                  label={c.name}
                  value={String(c.id)}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>
            Modalidad
          </Text>

          <View style={styles.input}>
            <Picker
              selectedValue={modalityId}
              onValueChange={setModalityId}
            >
              {modalities.map((m) => (
                <Picker.Item
                  key={m.id}
                  label={m.name}
                  value={String(m.id)}
                />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Jugadores
        </Text>

        {players.map((item) => {
          const p = item.profiles

          return (
            <View
              key={item.id}
              style={styles.playerCard}
            >
              <View>
                <Text
                  style={styles.playerName}
                >
                  {p?.name}
                </Text>

                <Text
                  style={styles.playerCat}
                >
                  {p?.categories?.name}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.kickBtn}
                onPress={() =>
                  removePlayer(
                    item.id,
                    p?.name
                  )
                }
              >
                <Text
                  style={styles.kickText}
                >
                  Expulsar
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveMatch}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              Guardar cambios
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  label: {
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#333',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    height: 52,
    justifyContent: 'center',
  },

  saveBtn: {
    backgroundColor: '#0a0a23',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },

  saveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  playerName: {
    fontWeight: '700',
    fontSize: 15,
  },

  playerCat: {
    color: '#666',
    marginTop: 2,
  },

  kickBtn: {
    backgroundColor: '#d33',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },

  kickText: {
    color: 'white',
    fontWeight: '700',
  },
})