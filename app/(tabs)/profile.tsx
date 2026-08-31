import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { showMessage } from '@/lib/utils'

export default function Profile() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [matchesPlayed, setMatchesPlayed] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: userData } =
        await supabase.auth.getUser()

      const user = userData.user

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } =
        await supabase
          .from('profiles')
          .select(`*, categories(name)`)
          .eq('id', user.id)
          .single()

      setProfile(profileData)

      const { count } = await supabase
        .from('match_players')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      setMatchesPlayed(count || 0)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 refresca cada vez que volvés
  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [])
  )

  const handleLogout = async () => {
    try {
      setLogoutLoading(true)

      const { error } =
        await supabase.auth.signOut()

      if (error) {
        showMessage(
          'Error',
          'No se pudo cerrar sesión'
        )
        return
      }

      showMessage(
        'Sesión cerrada',
        'Hasta luego 👋'
      )
    } catch (error) {
      showMessage(
        'Error',
        'Ocurrió un error'
      )
    } finally {
      setLogoutLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#0a0a23"
        />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No tenés perfil aún</Text>
      </View>
    )
  }

  const name = profile.name || 'Sin nombre'

  const category =
    profile.categories?.name ||
    'Sin categoría'

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const memberSince = profile.created_at
    ? new Date(
        profile.created_at
      ).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      })
    : '-'

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Mi Perfil
        </Text>

        <Text style={styles.headerSub}>
          Gestioná tu información personal
        </Text>
      </View>

      <View style={styles.content}>
        {/* AVATAR */}
        <View style={styles.cardCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {name}
          </Text>
        </View>

        {/* INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Información
          </Text>

          <InfoRow
            label="Partidos jugados"
            value={matchesPlayed}
          />

          <Divider />

          <InfoRow
            label="Categoría"
            value={category}
          />

          <Divider />

          <InfoRow
            label="Miembro desde"
            value={memberSince}
          />
        </View>

        {/* EDITAR */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push('/edit_profile')
          }
        >
          <Text style={styles.buttonText}>
            Editar Perfil
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={styles.buttonText}
            >
              Cerrar sesión
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const InfoRow = ({
  label,
  value,
}: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>
      {label}
    </Text>

    <Text style={styles.value}>
      {value}
    </Text>
  </View>
)

const Divider = () => (
  <View style={styles.divider} />
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    backgroundColor: '#0a0a23',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },

  headerSub: {
    color: '#ccc',
    marginTop: 4,
  },

  content: {
    padding: 16,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },

  cardCenter: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 40,
    backgroundColor: '#0a0a23',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    color: '#777',
  },

  value: {
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
  },

  button: {
    backgroundColor: '#0a0a23',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  logoutButton: {
    backgroundColor: '#ff4d4f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})