import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useRouter } from 'expo-router'
import { Picker } from '@react-native-picker/picker'

export default function CompleteProfile() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [categoryId, setCategoryId] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')

      setCategories(data || [])

      if (data?.length) {
        setCategoryId(data[0].id)
      }

      setLoading(false)
    }

    fetchCategories()
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Ingresá tu nombre')
      return
    }

    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      setSaving(false)
      return
    }

    console.log('Saving profile...', {
      id: user.id,
      name,
      categoryId,
    })

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name.trim(),
        category_id: categoryId,
      })

    setSaving(false)

    if (error) {
      console.log('ERROR:', error)
      alert(error.message)
      return
    }

    console.log('Saved OK')

    // 🔥 IMPORTANTE: volver al layout
    router.replace('/matches')
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 100 }} />
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 16 }}>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        Completá tu perfil
      </Text>

      <Text style={{ color: 'gray', marginBottom: 20 }}>
        Necesitamos algunos datos para empezar
      </Text>

      <Text>Nombre</Text>
      <TextInput
        placeholder="Ej: Juan Pérez"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        style={inputStyle}
      />

      <Text style={{ marginTop: 15 }}>Categoría</Text>
      <View style={inputStyle}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(itemValue: string) => setCategoryId(itemValue)}
          style={{ color: '#111' }}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={button}
        disabled={saving}
      >
        <Text style={buttonText}>
          {saving ? 'Guardando...' : 'Continuar'}
        </Text>
      </TouchableOpacity>

    </View>
  )
}

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 12,
  marginTop: 5,
  color: '#111',
} as const

const button = {
  backgroundColor: '#0a0a23',
  padding: 16,
  borderRadius: 12,
  marginTop: 20,
} as const

const buttonText = {
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
} as const