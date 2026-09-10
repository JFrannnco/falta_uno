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
import { supabase } from '../../lib/supabase'
import { showMessage, safeBack } from '../../lib/utils'
import { useRouter } from 'expo-router'

export default function Register() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] =
    useState('')
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  const handleRegister =
    async () => {
      if (
        !email ||
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

        // 🔥 Crear usuario auth
        const {
          data,
          error,
        } =
          await supabase.auth.signUp(
            {
              email:
                email.trim(),
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

        const user =
          data.user

        if (!user) {
          showMessage(
            'Error',
            'No se pudo crear la cuenta'
          )
          return
        }

        // 🔥 Ya registrado
        if (
          user
            .identities
            ?.length === 0
        ) {
          showMessage(
            'Ya estás registrado',
            'Intentá iniciar sesión 🔐',
            () =>
              router.replace(
                '/auth/login'
              )
          )

          return
        }

        // 🔥 Guardar email en profiles
        await supabase
          .from(
            'profiles'
          )
          .upsert({
            id: user.id,
            email:
              email.trim(),
          })

        showMessage(
          'Revisá tu email 📩',
          'Te enviamos un correo para confirmar tu cuenta',
          () =>
            router.replace(
              '/auth/login'
            )
        )
      } catch {
        showMessage(
          'Error',
          'Ocurrió un error'
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
        {/* BACK */}
        <TouchableOpacity
          onPress={() =>
            safeBack(router, '/auth/login')
          }
          style={
            styles.backButton
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ←
          </Text>
        </TouchableOpacity>

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
            🏓
          </Text>
        </View>

        <Text
          style={
            styles.title
          }
        >
          Crear cuenta
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Sumate a Falta Uno
        </Text>

        {/* CARD */}
        <View
          style={
            styles.card
          }
        >
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={
              setEmail
            }
            autoCapitalize="none"
            keyboardType="email-address"
            style={
              styles.input
            }
          />

          <TextInput
            placeholder="Contraseña"
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
              handleRegister
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
                Registrarme
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.replace(
                '/auth/login'
              )
            }
          >
            <Text
              style={
                styles.link
              }
            >
              Ya tengo cuenta
            </Text>
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

    backButton: {
      position:
        'absolute',
      top: 55,
      left: 20,
      zIndex: 10,
    },

    backText: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
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
      fontSize: 30,
      fontWeight: 'bold',
      textAlign: 'center',
    },

    subtitle: {
      color: '#cfcfcf',
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 28,
      fontSize: 15,
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
      color: '#111',
      backgroundColor: '#fff',
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

    link: {
      textAlign: 'center',
      marginTop: 18,
      color: '#0a0a23',
      fontWeight: '600',
    },
  })