import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { showMessage, safeBack } from '@/lib/utils'

export default function EditProfile() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [showCategories, setShowCategories] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) {
        safeBack(router, '/auth/login')
        return
      }

      // perfil actual
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, category_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setName(profile.name || '')
        setCategoryId(profile.category_id)
      }

      // categorias
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true })

      setCategories(cats || [])
    } catch {
      showMessage('Error', 'No se pudo cargar el perfil')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Carga inicial al montar — mismo patrón que el resto de la app, ver la
  // nota completa en `(tabs)/create_match.tsx`.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!name.trim()) {
      showMessage('Error', 'Ingresá tu nombre')
      return
    }

    if (!categoryId) {
      showMessage('Error', 'Seleccioná una categoría')
      return
    }

    try {
      setSaving(true)

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          category_id: categoryId,
        })
        .eq('id', user.id)

      if (error) {
        showMessage('Error', 'No se pudo guardar')
        return
      }

      showMessage('Éxito', 'Perfil actualizado', () =>
        safeBack(router)
      )
    } catch {
      showMessage('Error', 'Ocurrió un error')
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = categories.find(
    (item) => item.id === categoryId
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a0a23" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router)}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Editar Perfil</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.label}>Categoría</Text>

          {/* SELECTOR */}
          <TouchableOpacity
            style={styles.select}
            onPress={() =>
              setShowCategories(!showCategories)
            }
          >
            <Text
              style={{
                color: selectedCategory
                  ? '#111'
                  : '#888',
              }}
            >
              {selectedCategory
                ? selectedCategory.name
                : 'Seleccionar categoría'}
            </Text>

            <Text style={{ fontSize: 18 }}>⌄</Text>
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.dropdown}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.option}
                  onPress={() => {
                    setCategoryId(item.id)
                    setShowCategories(false)
                  }}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Guardar cambios
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 14,
    backgroundColor: '#fff',
    color: '#111',
  },

  select: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
  },

  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },

  button: {
    backgroundColor: '#0a0a23',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
})