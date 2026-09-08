import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { showMessage } from '../../lib/utils'

export default function ResetPassword() {
  const router = useRouter()

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  const handleUpdatePassword =
    async () => {
      if (
        !password ||
        !confirmPassword
      ) {
        showMessage(
          'Error',
          'Completá todos los campos'
        )
        return
      }

      if (
        password.length < 6
      ) {
        showMessage(
          'Error',
          'La contraseña debe tener al menos 6 caracteres'
        )
        return
      }

      if (
        password !==
        confirmPassword
      ) {
        showMessage(
          'Error',
          'Las contraseñas no coinciden'
        )
        return
      }

      try {
        setLoading(true)

        const { error } =
          await supabase.auth.updateUser(
            {
              password,
            }
          )

        if (error) {
          showMessage(
            'Error',
            error.message
          )
          return
        }

        showMessage(
          'Éxito 🔐',
          'Tu contraseña fue actualizada',
          () =>
            router.replace(
              '/auth/login'
            )
        )
      } catch (error) {
        showMessage(
          'Error',
          'No se pudo actualizar'
        )
      } finally {
        setLoading(false)
      }
    }

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : undefined
      }
      style={
        styles.container
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/* LOGO */}
        <View
          style={
            styles.logoBox
          }
        >
          <Text
            style={
              styles.logo
            }
          >
            🔐
          </Text>
        </View>

        <Text
          style={
            styles.title
          }
        >
          Nueva contraseña
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Elegí una nueva clave para seguir jugando
        </Text>

        {/* CARD */}
        <View
          style={
            styles.card
          }
        >
          <TextInput
            placeholder="Nueva contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={
              setPassword
            }
            secureTextEntry
            style={
              styles.input
            }
          />

          <TextInput
            placeholder="Confirmar contraseña"
            placeholderTextColor="#999"
            value={
              confirmPassword
            }
            onChangeText={
              setConfirmPassword
            }
            secureTextEntry
            style={
              styles.input
            }
          />

          <TouchableOpacity
            style={
              styles.button
            }
            onPress={
              handleUpdatePassword
            }
            disabled={
              loading
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Guardar contraseña
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#0a0a23',
    },

    content: {
      flex: 1,
      justifyContent:
        'center',
      padding: 22,
    },

    logoBox: {
      width: 72,
      height: 72,
      borderRadius: 40,
      backgroundColor:
        'white',
      alignSelf: 'center',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 18,
    },

    logo: {
      fontSize: 34,
    },

    title: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
    },

    subtitle: {
      color: '#cfcfcf',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 28,
      fontSize: 14,
    },

    card: {
      backgroundColor:
        'white',
      borderRadius: 18,
      padding: 18,
    },

    input: {
      borderWidth: 1,
      borderColor:
        '#e5e5e5',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      fontSize: 15,
    },

    button: {
      backgroundColor:
        '#0a0a23',
      padding: 15,
      borderRadius: 12,
      alignItems:
        'center',
      marginTop: 6,
    },

    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  })