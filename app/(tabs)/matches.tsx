import { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import {
  Stack,
  useFocusEffect,
  useRouter,
} from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '../../lib/supabase'
import { distanceKm } from '../../lib/utils'

export default function Matches() {
  const router = useRouter()

  const [matches, setMatches] =
    useState<any[]>([])

  const [myCoords, setMyCoords] =
    useState<{
      latitude: number | null
      longitude: number | null
    }>({ latitude: null, longitude: null })

  const [categories, setCategories] =
    useState<any[]>([])

  const [modalities, setModalities] =
    useState<any[]>([])

  const [categoryFilter, setCategoryFilter] =
    useState('')

  const [modalityFilter, setModalityFilter] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const loadMatches = useCallback(async () => {
    const { data: userData } =
      await supabase.auth.getUser()

    const user = userData.user

    if (user) {
      const { data: profile } =
        await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .maybeSingle()

      setMyCoords({
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
      })
    }

    if (!categories.length || !modalities.length) {
      const [{ data: cats }, { data: mods }] =
        await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('modalities').select('*'),
        ])

      setCategories(cats || [])
      setModalities(mods || [])
    }

    const { data, error } =
      await supabase
        .from('matches')
        .select(`
          *,
          categories(name),
          modalities(name),
          match_players(count)
        `)
        // Un partido cancelado no se puede jugar: no tiene sentido que
        // alguien lo encuentre acá para unirse. Se ve en la pantalla de
        // cancelados de "Mis partidos".
        .neq('status', 'cancelled')
        .order('start_time', {
          ascending: true,
        })

    if (!error) {
      setMatches(data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }, [categories.length, modalities.length])

  useFocusEffect(
    useCallback(() => {
      loadMatches()
    }, [loadMatches])
  )

  /*
    ORDEN: primero por cercanía a la ubicación guardada del perfil (la misma que
    `_layout.tsx` refresca al abrir la app), y a igual distancia, por horario. Un
    partido sin coordenadas —o mientras el perfil todavía no tiene la propia—
    queda al final del todo en vez de arriba, que sería mentir sobre qué tan
    cerca está.
  */
  const visibleMatches = useMemo(() => {
    const filtered = matches.filter((m) => {
      if (
        categoryFilter &&
        String(m.category_id) !== categoryFilter
      )
        return false

      if (
        modalityFilter &&
        String(m.modality_id) !== modalityFilter
      )
        return false

      return true
    })

    const withDistance = filtered.map((m) => {
      const hasCoords =
        myCoords.latitude != null &&
        myCoords.longitude != null &&
        m.latitude != null &&
        m.longitude != null

      const distance = hasCoords
        ? distanceKm(
            myCoords.latitude as number,
            myCoords.longitude as number,
            m.latitude,
            m.longitude
          )
        : null

      return { ...m, _distance: distance }
    })

    return withDistance.sort((a, b) => {
      if (a._distance == null && b._distance == null) {
        return (
          new Date(a.start_time).getTime() -
          new Date(b.start_time).getTime()
        )
      }

      if (a._distance == null) return 1
      if (b._distance == null) return -1

      if (a._distance !== b._distance) {
        return a._distance - b._distance
      }

      return (
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
      )
    })
  }, [matches, myCoords, categoryFilter, modalityFilter])

  const onRefresh = () => {
    setRefreshing(true)
    loadMatches()
  }

  const formatDate = (
    date: string
  ) => {
    const d =
      new Date(date)

    return d.toLocaleDateString(
      'es-PY',
      {
        day: '2-digit',
        month: '2-digit',
      }
    )
  }

  const formatHour = (
    date: string
  ) => {
    const d =
      new Date(date)

    return d.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  if (loading) {
    return (
      <View
        style={
          styles.loader
        }
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Partidos',
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push('/match/my_matches')
              }
            >
              <Text
                style={
                  styles.headerBtn
                }
              >
                Mis partidos
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.filters}>
        <View style={styles.filterHalf}>
          <Picker
            selectedValue={categoryFilter}
            onValueChange={(v) =>
              setCategoryFilter(v)
            }
            style={{ color: '#111' }}
          >
            <Picker.Item
              label="Todas las categorías"
              value=""
            />
            {categories.map((c) => (
              <Picker.Item
                key={c.id}
                label={c.name}
                value={String(c.id)}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.filterHalf}>
          <Picker
            selectedValue={modalityFilter}
            onValueChange={(v) =>
              setModalityFilter(v)
            }
            style={{ color: '#111' }}
          >
            <Picker.Item
              label="Todas las modalidades"
              value=""
            />
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

      <FlatList
        data={visibleMatches}
        keyExtractor={(item) =>
          item.id.toString()
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              No hay partidos
              disponibles 🏓
            </Text>
          </View>
        }
        renderItem={({
          item,
        }) => {
          const joined =
            item
              .match_players?.[0]
              ?.count || 0

          const total =
            item.players_needed

          const left =
            total - joined

          return (
            <TouchableOpacity
              style={
                styles.card
              }
              onPress={() =>
                router.push(
                  `/match/${item.id}`
                )
              }
            >
              <Text
                style={
                  styles.club
                }
              >
                {
                  item.club_name
                }
              </Text>

              <Text
                style={
                  styles.info
                }
              >
                📍{' '}
                {
                  item.location
                }
                {item._distance != null &&
                  ` · ${item._distance.toFixed(1)} km`}
              </Text>

              {!!item.court && (
                <Text
                  style={
                    styles.info
                  }
                >
                  🎾 Cancha{' '}
                  {
                    item.court
                  }
                </Text>
              )}

              <Text
                style={
                  styles.info
                }
              >
                📅{' '}
                {formatDate(
                  item.start_time
                )}{' '}
                • 🕒{' '}
                {formatHour(
                  item.start_time
                )}
              </Text>

              <Text
                style={
                  styles.info
                }
              >
                👥 {joined}/
                {total}{' '}
                jugadores
              </Text>

              <Text
                style={
                  styles.badges
                }
              >
                🏷️{' '}
                {item
                  .categories
                  ?.name ||
                  '-'}{' '}
                •{' '}
                {item
                  .modalities
                  ?.name ||
                  '-'}
              </Text>

              <View
                style={
                  styles.bottomRow
                }
              >
                <Text
                  style={
                    styles.left
                  }
                >
                  {left > 0
                    ? `Faltan ${left}`
                    : 'Completo'}
                </Text>

                <View
                  style={
                    styles.button
                  }
                >
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Ver
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </>
  )
}

const styles =
  StyleSheet.create({
    loader: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    headerBtn: {
      color: '#0a0a23',
      fontWeight:
        '700',
      fontSize: 14,
      paddingRight: 50,
    },

    filters: {
      flexDirection: 'row',
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },

    filterHalf: {
      flex: 1,
    },

    empty: {
      marginTop: 80,
      alignItems:
        'center',
    },

    emptyText: {
      fontSize: 16,
      color: '#666',
    },

    card: {
      backgroundColor:
        'white',
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      shadowColor:
        '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },

    club: {
      fontSize: 20,
      fontWeight:
        'bold',
      color:
        '#0a0a23',
      marginBottom: 8,
    },

    info: {
      color: '#444',
      marginBottom: 4,
    },

    badges: {
      marginTop: 8,
      fontWeight:
        '600',
      color:
        '#0a0a23',
    },

    bottomRow: {
      marginTop: 14,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    left: {
      fontWeight:
        '700',
      color:
        '#0a0a23',
    },

    button: {
      backgroundColor:
        '#0a0a23',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
    },

    buttonText: {
      color: 'white',
      fontWeight:
        'bold',
    },
  })