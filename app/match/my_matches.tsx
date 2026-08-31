import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function MyMatches() {
  const router = useRouter()

  const [matches, setMatches] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    setLoading(true)

    const { data: userData } =
      await supabase.auth.getUser()

    const user =
      userData.user

    if (!user) {
      setLoading(false)
      return
    }

    const { data } =
      await supabase
        .from('matches')
        .select(`
          *,
          categories(name),
          modalities(name),
          match_players(count)
        `)
        .eq('owner_id', user.id)
        .order(
          'start_time',
          { ascending: true }
        )

    setMatches(data || [])
    setLoading(false)
  }

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
        }}
      />

      <FlatList
        data={matches}
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

                {item.status !==
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