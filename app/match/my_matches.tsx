import { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

/** Trae `matches` que NO estén cancelados: los que creé + los que me uní. */
const fetchMisPartidosActivos = async (
  userId: string
) => {
  const selectMatch = `
    *,
    categories(name),
    modalities(name),
    match_players(count)
  `

  /*
    DOS CONSULTAS, NO UNA. "Mis partidos" tiene que mostrar los que creé Y
    los que me uní sin haberlos creado. Unirse no siempre deja una fila en
    `match_players` para el dueño (el insert de `create_match.tsx` no
    chequea error), así que filtrar sólo por `match_players` perdería
    partidos propios en ese caso. Se traen los dos conjuntos por separado y
    se unen acá, sin duplicar por id.
  */
  const [{ data: owned }, { data: playerRows }] =
    await Promise.all([
      supabase
        .from('matches')
        .select(selectMatch)
        .eq('owner_id', userId)
        .neq('status', 'cancelled'),
      supabase
        .from('match_players')
        .select('match_id')
        .eq('user_id', userId),
    ])

  const joinedIds = (playerRows || [])
    .map((r: any) => r.match_id)
    .filter(
      (id: any) =>
        !(owned || []).some(
          (m: any) => m.id === id
        )
    )

  let joined: any[] = []

  if (joinedIds.length > 0) {
    const { data } = await supabase
      .from('matches')
      .select(selectMatch)
      .in('id', joinedIds)
      .neq('status', 'cancelled')

    joined = data || []
  }

  return [...(owned || []), ...joined]
}

export default function MyMatches() {
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

  const [userId, setUserId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  const loadMatches = useCallback(async () => {
    setLoading(true)

    const { data: userData } =
      await supabase.auth.getUser()

    const user =
      userData.user

    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [
      { data: profile },
      { data: cats },
      { data: mods },
      all,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('categories').select('*'),
      supabase.from('modalities').select('*'),
      fetchMisPartidosActivos(user.id),
    ])

    setMyCoords({
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    })

    setCategories(cats || [])
    setModalities(mods || [])
    setMatches(all)
    setLoading(false)
  }, [])

  /*
    MISMO ORDEN QUE "Partidos": primero por cercanía a la ubicación del
    perfil, y a igual distancia, por horario. Ver la nota completa en
    `(tabs)/matches.tsx` — es el mismo criterio, no uno nuevo.
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

  /*
    useFocusEffect y no useEffect: esta pantalla se abre una sola vez por
    navegación, así que un useEffect de montaje sólo carga la primera vez. Al
    volver de editar un partido (misma instancia de la pantalla, no un montaje
    nuevo) la lista quedaba con los datos viejos hasta volver a entrar a
    editar — recién ahí se veía el cambio, porque esa pantalla sí vuelve a
    consultar por id. useFocusEffect corre cada vez que la pantalla vuelve a
    tener foco, mismo patrón que ya usa `(tabs)/matches.tsx`.
  */
  useFocusEffect(
    useCallback(() => {
      loadMatches()
    }, [loadMatches])
  )

  const cancelMatch = (
    id: number
  ) => {
    Alert.alert(
      'Cancelar partido',
      '¿Seguro que querés cancelarlo?',
      [
        {
          text: 'No',
          style:
            'cancel',
        },
        {
          text: 'Sí',
          style:
            'destructive',
          onPress:
            async () => {
              await supabase
                .from(
                  'matches'
                )
                .update({
                  status:
                    'cancelled',
                })
                .eq(
                  'id',
                  id
                )

              loadMatches()
            },
        },
      ]
    )
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
          title:
            'Mis Partidos',
          headerShown:
            true,
          headerBackTitle:
            'Volver',
          headerTintColor:
            '#0a0a23',
          headerTitleStyle:
            {
              fontWeight:
                '700',
            },
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  '/match/cancelled_matches'
                )
              }
            >
              <Text
                style={
                  styles.headerBtn
                }
              >
                Cancelados
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
              Todavía no
              creaste
              partidos 🏓
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

          const isOwner =
            item.owner_id === userId

          return (
            <View
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.topRow
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
                  style={[
                    styles.status,
                    item.status ===
                    'cancelled'
                      ? styles.cancelled
                      : styles.active,
                  ]}
                >
                  {item.status ===
                  'cancelled'
                    ? 'Cancelado'
                    : 'Activo'}
                </Text>
              </View>

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
                  styles.actions
                }
              >
                <TouchableOpacity
                  style={
                    styles.viewBtn
                  }
                  onPress={() =>
                    router.push(
                      `/match/${item.id}`
                    )
                  }
                >
                  <Text
                    style={
                      styles.whiteText
                    }
                  >
                    Ver
                  </Text>
                </TouchableOpacity>

                {isOwner && (
                  <TouchableOpacity
                    style={
                      styles.editBtn
                    }
                    onPress={() =>
                      router.push({
                        pathname:
                          '/match/edit_match',
                        params: {
                          id: item.id,
                        },
                      })
                    }
                  >
                    <Text
                      style={
                        styles.darkText
                      }
                    >
                      Editar
                    </Text>
                  </TouchableOpacity>
                )}

                {isOwner &&
                  item.status !==
                  'cancelled' && (
                  <TouchableOpacity
                    style={
                      styles.cancelBtn
                    }
                    onPress={() =>
                      cancelMatch(
                        item.id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.whiteText
                      }
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
      />
    </>
  )
}

const styles =
  StyleSheet.create({
    headerBtn: {
      color: '#0a0a23',
      fontWeight: '700',
      fontSize: 14,
      paddingRight: 16,
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

    loader: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
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

    topRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 8,
    },

    club: {
      fontSize: 20,
      fontWeight:
        'bold',
      color:
        '#0a0a23',
      flex: 1,
      marginRight: 10,
    },

    status: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      fontSize: 12,
      fontWeight:
        '700',
    },

    active: {
      backgroundColor:
        '#e7f7ed',
      color:
        '#1f8b4c',
    },

    cancelled: {
      backgroundColor:
        '#fdeaea',
      color:
        '#d33',
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

    actions: {
      flexDirection:
        'row',
      gap: 8,
      marginTop: 14,
      flexWrap:
        'wrap',
    },

    viewBtn: {
      backgroundColor:
        '#0a0a23',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    editBtn: {
      backgroundColor:
        '#f0f0f0',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    cancelBtn: {
      backgroundColor:
        '#d33',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    whiteText: {
      color: 'white',
      fontWeight:
        '700',
    },

    darkText: {
      color:
        '#0a0a23',
      fontWeight:
        '700',
    },
  })