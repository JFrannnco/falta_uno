import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { showMessage } from '../../lib/utils'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import LocationAutocomplete from '../../components/location-autocomplete'

export default function CreateMatch() {
  const router = useRouter()

  const [club, setClub] = useState('')
  const [court, setCourt] = useState('')
  const [location, setLocation] = useState('')

  const [latitude, setLatitude] =
    useState<number | null>(null)

  const [longitude, setLongitude] =
    useState<number | null>(null)

  const [players, setPlayers] =
    useState('4')

  const [categories, setCategories] =
    useState<any[]>([])

  const [categoryId, setCategoryId] =
    useState('')

  const [modalities, setModalities] =
    useState<any[]>([])

  const [modalityId, setModalityId] =
    useState('')

  const [date, setDate] =
    useState(new Date())

  const [showDate, setShowDate] =
    useState(false)

  const [startTime, setStartTime] =
    useState('18:00')

  const [duration, setDuration] =
    useState('90')

  const hours = [
    '08:00','08:30','09:00','09:30',
    '10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30',
    '14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30',
    '18:00','18:30','19:00','19:30',
    '20:00','20:30','21:00','21:30',
    '22:00','22:30',
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: cats } =
      await supabase
        .from('categories')
        .select('*')

    const { data: mods } =
      await supabase
        .from('modalities')
        .select('*')

    setCategories(cats || [])
    setModalities(mods || [])

    if (cats?.length)
      setCategoryId(cats[0].id)

    if (mods?.length)
      setModalityId(mods[0].id)
  }

  const getEndTime = () => {
    const [h, m] =
      startTime.split(':')

    const start =
      new Date()

    start.setHours(
      Number(h),
      Number(m),
      0,
      0
    )

    start.setMinutes(
      start.getMinutes() +
        Number(duration)
    )

    return start.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  const resetForm = () => {
    setClub('')
    setCourt('')
    setLocation('')
    setLatitude(null)
    setLongitude(null)
    setPlayers('4')
    setDate(new Date())
    setStartTime('18:00')
    setDuration('90')

    if (categories.length)
      setCategoryId(categories[0].id)

    if (modalities.length)
      setModalityId(modalities[0].id)
  }

  const createMatch = async () => {
    const { data: userData } =
      await supabase.auth.getUser()

    const user =
      userData.user

    if (!user) {
      showMessage(
        'Error',
        'No hay usuario'
      )
      return
    }

    if (
      !club.trim() ||
      !location.trim()
    ) {
      showMessage(
        'Error',
        'Completá complejo y ubicación'
      )
      return
    }

    const [sh, sm] =
      startTime.split(':')

    const startDate =
      new Date(date)

    startDate.setHours(
      Number(sh),
      Number(sm),
      0,
      0
    )

    const endDate =
      new Date(startDate)

    endDate.setMinutes(
      endDate.getMinutes() +
        Number(duration)
    )

    const { data, error } =
      await supabase
        .from('matches')
        .insert([
          {
            club_name:
              club.trim(),
            court:
              court.trim(),
            location,
            address:
              location,
            latitude,
            longitude,
            players_needed:
              Number(players),
            created_by:
              user.id,
            owner_id:
              user.id,
            start_time:
              startDate.toISOString(),
            end_time:
              endDate.toISOString(),
            category_id:
              categoryId,
            modality_id:
              modalityId,
          },
        ])
        .select()
        .single()

    if (error || !data) {
      showMessage(
        'Error',
        error?.message ||
          'No se pudo crear'
      )
      return
    }

    await supabase
      .from('match_players')
      .insert([
        {
          match_id:
            data.id,
          user_id:
            user.id,
          status:
            'confirmed',
        },
      ])

    showMessage(
      'Éxito',
      'Partido creado 🎉',
      () => {
        resetForm()

        router.replace(
          `/match/${data.id}`
        )
      }
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 50,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Crear Partido 🏓
          </Text>

          <Text style={styles.heroSubtitle}>
            Organizá tu próximo encuentro
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>

            {/* COMPLEJO + CANCHA */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  Complejo
                </Text>

                <TextInput
                  value={club}
                  onChangeText={setClub}
                  placeholder="El Spot"
                  style={styles.input}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.label}>
                  Cancha
                </Text>

                <TextInput
                  value={court}
                  onChangeText={setCourt}
                  placeholder="3"
                  style={styles.input}
                />
              </View>
            </View>

            {/* UBICACION */}
            <Text style={styles.label}>
              Ubicación
            </Text>

            {Platform.OS ===
            'web' ? (
              <TextInput
                value={location}
                onChangeText={
                  setLocation
                }
                placeholder="Dirección del complejo"
                style={styles.input}
              />
            ) : (
              <LocationAutocomplete
                placeholder="Buscar dirección..."
                initialValue={location}
                onSelect={(
                  description,
                  lat,
                  lng
                ) => {
                  setLocation(
                    description
                  )
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              />
            )}

            {/* FECHA */}
            <Text style={styles.label}>
              Fecha
            </Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setShowDate(true)
              }
            >
              <Text>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(
                  e,
                  d
                ) => {
                  setShowDate(false)
                  if (d)
                    setDate(d)
                }}
              />
            )}

            {/* HORA + DURACION */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  Hora
                </Text>

                <View style={styles.input}>
                  <Picker
                    selectedValue={
                      startTime
                    }
                    onValueChange={
                      setStartTime
                    }
                  >
                    {hours.map(
                      (h) => (
                        <Picker.Item
                          key={h}
                          label={h}
                          value={h}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>

              <View style={styles.half}>
                <Text style={styles.label}>
                  Duración
                </Text>

                <View style={styles.input}>
                  <Picker
                    selectedValue={
                      duration
                    }
                    onValueChange={
                      setDuration
                    }
                  >
                    <Picker.Item
                      label="30m"
                      value="30"
                    />
                    <Picker.Item
                      label="1h"
                      value="60"
                    />
                    <Picker.Item
                      label="1h30"
                      value="90"
                    />
                    <Picker.Item
                      label="2h"
                      value="120"
                    />
                  </Picker>
                </View>
              </View>
            </View>

            <Text style={styles.endText}>
              Finaliza a las{' '}
              {getEndTime()}
            </Text>

            {/* JUGADORES */}
            <Text style={styles.label}>
              Jugadores
            </Text>

            <View style={styles.input}>
              <Picker
                selectedValue={
                  players
                }
                onValueChange={
                  setPlayers
                }
              >
                <Picker.Item label="4" value="4" />
                <Picker.Item label="5" value="5" />
                <Picker.Item label="6" value="6" />
                <Picker.Item label="7" value="7" />
                <Picker.Item label="8" value="8" />
              </Picker>
            </View>

            {/* CATEGORIA + MODALIDAD */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  Categoría
                </Text>

                <View style={styles.input}>
                  <Picker
                    selectedValue={
                      categoryId
                    }
                    onValueChange={
                      setCategoryId
                    }
                  >
                    {categories.map(
                      (c) => (
                        <Picker.Item
                          key={c.id}
                          label={c.name}
                          value={c.id}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>

              <View style={styles.half}>
                <Text style={styles.label}>
                  Modalidad
                </Text>

                <View style={styles.input}>
                  <Picker
                    selectedValue={
                      modalityId
                    }
                    onValueChange={
                      setModalityId
                    }
                  >
                    {modalities.map(
                      (m) => (
                        <Picker.Item
                          key={m.id}
                          label={m.name}
                          value={m.id}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={createMatch}
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                Crear Partido
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#f4f4f4',
    },

    hero: {
      backgroundColor:
        '#0a0a23',
      paddingTop: 24,
      paddingBottom: 28,
      paddingHorizontal: 18,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
    },

    heroTitle: {
      color: 'white',
      fontSize: 32,
      fontWeight: '800',
      paddingTop: 30,
    },

    heroSubtitle: {
      color:
        '#d9d9d9',
      marginTop: 6,
      fontSize: 15,
    },

    content: {
      padding: 18,
      marginTop: -14,
    },

    card: {
      backgroundColor:
        'white',
      borderRadius: 20,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
    },

    row: {
      flexDirection: 'row',
      gap: 10,
    },

    half: {
      flex: 1,
    },

    label: {
      fontWeight:
        '700',
      marginTop: 12,
      marginBottom: 6,
      color:
        '#0a0a23',
    },

    input: {
      backgroundColor:
        '#f8f8f8',
      borderRadius: 12,
      minHeight: 52,
      justifyContent:
        'center',
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor:
        '#e6e6e6',
    },

    endText: {
      marginTop: 10,
      color: '#777',
      fontWeight:
        '600',
    },

    button: {
      backgroundColor:
        '#0a0a23',
      padding: 16,
      borderRadius: 14,
      alignItems:
        'center',
      marginTop: 24,
    },

    buttonText: {
      color: 'white',
      fontWeight:
        'bold',
      fontSize: 16,
    },
  })