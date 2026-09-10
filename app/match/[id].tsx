import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Share,
} from 'react-native'
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router'
import { createURL } from 'expo-linking'
import { supabase } from '../../lib/supabase'
import { safeBack } from '../../lib/utils'
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
  reva_link?: string | null
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

  const [toast, setToast] =
    useState<string | null>(null)

  const getUser = async () => {
    const { data } =
      await supabase.auth.getUser()

    setUserId(data.user?.id || null)
  }

  const fetchMatch = useCallback(async () => {
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
  }, [matchId])

  /*
    Carga inicial al montar (usuario + partido) — mismo patrón que el resto
    de la app, ver la nota completa en `(tabs)/create_match.tsx`. No hay
    "sistema externo" que sincronizar, es simplemente traer los datos una
    vez que la pantalla existe.
  */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getUser()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatch()
  }, [fetchMatch])

  const isJoined =
    match?.match_players?.some(
      (p) => p.user_id === userId
    )

  const showToast = (
    message: string
  ) => {
    setToast(message)

    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

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

    /*
      NO DEJAR UNIRSE A DOS PARTIDOS QUE SE PISAN EN HORARIO. Se trae la lista
      de partidos (activos, sin contar este mismo) a los que la persona ya
      está anotada, y se compara el rango [start_time, end_time) de cada uno
      contra el del partido que está por unirse. Se hace acá, no en la base,
      porque todavía no hay ninguna restricción/trigger que lo impida del
      lado de Postgres.
    */
    const { data: myRows } =
      await supabase
        .from('match_players')
        .select(
          'matches(id, start_time, end_time, status)'
        )
        .eq('user_id', userId)

    const newStart = new Date(
      match.start_time
    ).getTime()

    const newEnd = new Date(
      match.end_time
    ).getTime()

    const overlaps = (
      myRows || []
    ).some((row: any) => {
      const other = row.matches

      if (
        !other ||
        other.id === matchId ||
        other.status === 'cancelled'
      )
        return false

      const otherStart = new Date(
        other.start_time
      ).getTime()

      const otherEnd = new Date(
        other.end_time
      ).getTime()

      return (
        otherStart < newEnd &&
        otherEnd > newStart
      )
    })

    if (overlaps) {
      showToast(
        'Ya estás anotado en otro partido a esa hora'
      )
      return
    }

    const { error } =
      await supabase
        .from('match_players')
        .insert([
          {
            match_id: matchId,
            user_id: userId,
          },
        ])

    if (!error) {
      showToast('Te uniste al partido ✅')
    }

    fetchMatch()
  }

  const leaveMatch = async () => {
    if (!userId) return

    const { error } =
      await supabase
        .from('match_players')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId)

    if (!error) {
      showToast('Saliste del partido')
    }

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

  /*
    `createURL` (expo-linking) arma el link correcto según dónde corre la
    app: `exp://...` en desarrollo, `faltauno://...` en un build instalado.
    Hoy —sin APK todavía— ese link no abre nada del otro lado, pero el
    texto y el flujo de compartir ya quedan listos para cuando exista un
    build real: no hay que tocar esta pantalla de nuevo, solo instalar la
    app y el mismo link empieza a funcionar.
  */
  const shareMatch = async () => {
    const link = createURL(
      `/match/${matchId}`
    )

    const cupos =
      faltan > 0
        ? `Faltan ${faltan} jugador${
            faltan === 1 ? '' : 'es'
          } 🙋`
        : 'Partido completo'

    const mensaje =
      `🏓 ${match.club_name}\n` +
      `📍 ${match.location}\n` +
      `📅 ${fecha} • 🕒 ${horaInicio} - ${horaFin}\n` +
      `${cupos}\n\n` +
      `Sumate desde Falta Uno:\n${link}`

    try {
      await Share.share({
        message: mensaje,
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            safeBack(router, '/(tabs)/matches')
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {match.club_name}
        </Text>

        <TouchableOpacity
          onPress={shareMatch}
        >
          <Ionicons
            name="share-social-outline"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>
            {toast}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          padding: 16,
        }}
      >
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
              Categoría:{' '}
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
              Modalidad:{' '}
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

        {!!match.reva_link && (
          <TouchableOpacity
            style={styles.revaBtn}
            onPress={() =>
              Linking.openURL(
                match.reva_link as string
              )
            }
          >
            <Text style={styles.revaBtnText}>
              Ver / reservar en Reva
            </Text>
          </TouchableOpacity>
        )}
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
    </View>
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

    header: {
      backgroundColor:
        '#0a0a23',
      paddingTop: 55,
      paddingBottom: 18,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },

    toast: {
      position: 'absolute',
      top: 100,
      right: 16,
      maxWidth: '75%',
      backgroundColor:
        '#0a0a23',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
      zIndex: 10,
    },

    toastText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 13,
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

    revaBtn: {
      marginTop: 12,
      alignSelf: 'flex-start',
      backgroundColor: '#eef2ff',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    revaBtnText: {
      color: '#0a0a23',
      fontWeight: '700',
      fontSize: 13,
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