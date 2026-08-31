import { useCallback, useState } from 'react'
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
import { supabase } from '../../lib/supabase'

export default function Matches() {
  const router = useRouter()

  const [matches, setMatches] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const loadMatches = async () => {
    const { data, error } =
      await supabase
        .from('matches')
        .select(`
          *,
          categories(name),
          modalities(name),
          match_players(count)
        `)
        .order('start_time', {
          ascending: true,
        })

    if (!error) {
      setMatches(data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadMatches()
    }, [])
  )

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

      <FlatList
        data={matches}
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