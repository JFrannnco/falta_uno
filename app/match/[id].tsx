import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

type Player = {
  user_id: string
  profile?: {
    id: string
    name: string
    categories?: {
      name: string
    }
  } | null
}

type Match = {
  id: string
  location: string
  club_name: string
  players_needed: number
  start_time: string
  end_time: string
  categories?: {
    name: string
  }
  modalities?: {
    name: string
  }
  match_players?: Player[]
}

export default function MatchDetail() {
  const { id } = useLocalSearchParams()
  const matchId = Array.isArray(id) ? id[0] : id

  const router = useRouter()

  const [match, setMatch] =
    useState<Match | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [userId, setUserId] =
    useState<string | null>(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    fetchMatch()
  }, [matchId])

  const getUser = async () => {
    const { data } =
      await supabase.auth.getUser()

    setUserId(data.user?.id || null)
  }

  const fetchMatch = async () => {
    try {
      setLoading(true)

      const { data: matchData } =
        await supabase
          .from('matches')
          .select(`
            *,
            categories (
              name
            ),
            modalities (
              name
            ),
            match_players (
              user_id
            )
          `)
          .eq('id', matchId)
          .single()

      if (!matchData) return

      const players =
        matchData.match_players || []

      const ids = players.map(
        (p: any) => p.user_id
      )

      let map: any = {}

      if (ids.length > 0) {
        const { data: profiles } =
          await supabase
            .from('profiles')
            .select(`
              id,
              name,
              categories (
                name
              )
            `)
            .in('id', ids)

        profiles?.forEach(
          (p: any) => {
            map[p.id] = p
          }
        )
      }

      const playersFull =
        players.map((p: any) => ({
          ...p,
          profile:
            map[p.user_id] ||
            null,
        }))

      setMatch({
        ...matchData,
        match_players:
          playersFull,
      })
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const isJoined =
    match?.match_players?.some(
      (p) => p.user_id === userId
    )

  const joinMatch = async () => {
    if (!userId || !match)
      return

    const current =
      match.match_players
        ?.length || 0

    if (
      current >=
      match.players_needed
    )
      return

    await supabase
      .from('match_players')
      .insert([
        {
          match_id: matchId,
          user_id: userId,
        },
      ])

    fetchMatch()
  }

  const leaveMatch = async () => {
    if (!userId) return

    await supabase
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', userId)

    fetchMatch()
  }

  if (loading || !match) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#0a0a23"
        />
      </View>
    )
  }

  const current =
    match.match_players?.length ||
    0

  const faltan =
    match.players_needed -
    current

  const start = new Date(
    match.start_time
  )

  const end = new Date(
    match.end_time
  )

  const fecha =
    start.toLocaleDateString(
      'es-ES',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }
    )

  const horaInicio =
    start.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )

  const horaFin =
    end.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: 16,
      }}
    >
      <TouchableOpacity
        onPress={() =>
          router.back()
        }
        style={styles.back}
      >
        <Ionicons
          name="arrow-back"
          size={26}
        />
      </TouchableOpacity>

      {/* CARD INFO */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {match.club_name}
        </Text>

        <Text style={styles.gray}>
          📍 {match.location}
        </Text>

        <View
          style={styles.badges}
        >
          <View
            style={
              styles.badgeBlue
            }
          >
            <Text
              style={
                styles.badgeText
              }
            >
              {match
                .categories
                ?.name ||
                'Sin categoría'}
            </Text>
          </View>

          <View
            style={
              styles.badgePink
            }
          >
            <Text
              style={
                styles.badgeText
              }
            >
              {match
                .modalities
                ?.name ||
                'Sin modalidad'}
            </Text>
          </View>
        </View>

        <View
          style={styles.divider}
        />

        <InfoRow
          label="📅 Fecha"
          value={fecha}
        />

        <InfoRow
          label="⏰ Hora"
          value={`${horaInicio} - ${horaFin}`}
        />

        <InfoRow
          label="👥 Jugadores"
          value={`${current} de ${match.players_needed}`}
        />
      </View>

      {/* PLAYERS */}
      <View style={styles.card}>
        <Text
          style={styles.section}
        >
          Jugadores confirmados
        </Text>

        {match.match_players?.map(
          (
            player,
            index
          ) => {
            const isMe =
              player.user_id ===
              userId

            const name =
              isMe
                ? 'Vos'
                : player
                    .profile
                    ?.name ||
                  `Jugador ${index + 1}`

            const category =
              player
                .profile
                ?.categories
                ?.name ||
              'Sin categoría'

            return (
              <View
                key={
                  player.user_id
                }
                style={
                  styles.playerRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.playerName
                    }
                  >
                    👤 {name}
                  </Text>

                  <Text
                    style={
                      styles.playerCat
                    }
                  >
                    {
                      category
                    }
                  </Text>
                </View>

                {isMe && (
                  <Text
                    style={
                      styles.you
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>
            )
          }
        )}

        {faltan > 0 && (
          <Text
            style={
              styles.gray
            }
          >
            Faltan {faltan}{' '}
            jugadores
          </Text>
        )}
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        onPress={
          isJoined
            ? leaveMatch
            : joinMatch
        }
        disabled={
          !isJoined &&
          current >=
            match.players_needed
        }
        style={[
          styles.button,
          !isJoined &&
            current >=
              match.players_needed && {
              opacity: 0.5,
            },
        ]}
      >
        <Text
          style={
            styles.buttonText
          }
        >
          {isJoined
            ? 'Salir del Partido'
            : current >=
              match.players_needed
            ? 'Partido Completo'
            : 'Unirme al Partido'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const InfoRow = ({
  label,
  value,
}: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>
      {label}
    </Text>

    <Text style={styles.value}>
      {value}
    </Text>
  </View>
)

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#f5f5f5',
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
    },

    back: {
      marginBottom: 10,
    },

    card: {
      backgroundColor:
        'white',
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },

    title: {
      fontSize: 22,
      fontWeight: 'bold',
    },

    gray: {
      color: 'gray',
      marginTop: 6,
    },

    badges: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    badgeBlue: {
      backgroundColor:
        '#e3f2fd',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },

    badgePink: {
      backgroundColor:
        '#fce4ec',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },

    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },

    divider: {
      height: 1,
      backgroundColor:
        '#eee',
      marginVertical: 12,
    },

    section: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },

    infoRow: {
      marginBottom: 10,
    },

    label: {
      color: 'gray',
      marginBottom: 3,
    },

    value: {
      fontWeight: '600',
    },

    playerRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        '#f0f0f0',
    },

    playerName: {
      fontWeight: '600',
    },

    playerCat: {
      color: 'gray',
      fontSize: 13,
      marginTop: 2,
    },

    you: {
      color: 'green',
      fontWeight: 'bold',
      fontSize: 18,
    },

    button: {
      backgroundColor:
        '#0a0a23',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 30,
    },

    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  })