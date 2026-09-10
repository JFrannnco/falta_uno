import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import {
  Stack,
  useFocusEffect,
  useRouter,
} from 'expo-router'
import { supabase } from '../../lib/supabase'

/**
 * Partidos cancelados propios: los que creé y los que me uní, filtrados a
 * `status = 'cancelled'`. Pantalla aparte de "Mis partidos" a propósito —
 * ahí ya no aparecen (ver `my_matches.tsx`), así que sin este lugar no
 * habría forma de volver a verlos.
 */
export default function CancelledMatches() {
  const router = useRouter()

  const [matches, setMatches] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const loadMatches = useCallback(async () => {
    setLoading(true)

    const { data: userData } =
      await supabase.auth.getUser()

    const user = userData.user

    if (!user) {
      setLoading(false)
      return
    }

    const selectMatch = `
      *,
      categories(name),
      modalities(name),
      match_players(count)
    `

    const [{ data: owned }, { data: playerRows }] =
      await Promise.all([
        supabase
          .from('matches')
          .select(selectMatch)
          .eq('owner_id', user.id)
          .eq('status', 'cancelled'),
        supabase
          .from('match_players')
          .select('match_id')
          .eq('user_id', user.id),
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
        .eq('status', 'cancelled')

      joined = data || []
    }

    const all = [
      ...(owned || []),
      ...joined,
    ].sort(
      (a, b) =>
        new Date(b.start_time).getTime() -
        new Date(a.start_time).getTime()
    )

    setMatches(all)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadMatches()
    }, [loadMatches])
  )

  const formatDate = (date: string) => {
    const d = new Date(date)

    return d.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatHour = (date: string) => {
    const d = new Date(date)

    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Partidos cancelados',
          headerShown: true,
          headerBackTitle: 'Volver',
          headerTintColor: '#0a0a23',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No tenés partidos cancelados
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const joined =
            item.match_players?.[0]?.count || 0

          const total = item.players_needed

          return (
            <View style={styles.card}>
              <Text style={styles.club}>
                {item.club_name}
              </Text>

              <Text style={styles.info}>
                📍 {item.location}
              </Text>

              <Text style={styles.info}>
                📅 {formatDate(item.start_time)} •
                🕒 {formatHour(item.start_time)}
              </Text>

              <Text style={styles.info}>
                👥 {joined}/{total} jugadores
              </Text>

              <Text style={styles.badges}>
                🏷️ {item.categories?.name || '-'} •{' '}
                {item.modalities?.name || '-'}
              </Text>

              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() =>
                  router.push(`/match/${item.id}`)
                }
              >
                <Text style={styles.whiteText}>
                  Ver
                </Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    marginTop: 80,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    color: '#666',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    opacity: 0.75,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  club: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a0a23',
    marginBottom: 8,
  },

  info: {
    color: '#444',
    marginBottom: 4,
  },

  badges: {
    marginTop: 8,
    fontWeight: '600',
    color: '#0a0a23',
  },

  viewBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#0a0a23',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  whiteText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
