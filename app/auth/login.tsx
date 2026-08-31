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
import { showMessage } from '../../lib/utils'
import { useRouter } from 'expo-router'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] =
    useState('')
  const [loading, setLoading] =
    useState(false)
  const [showResend, setShowResend] =
    useState(false)

  const handleLogin =
    async () => {
      if (
        !email.trim() ||
        !password
      ) {
        showMessage(
          'Error',
          'Completá todos los campos'
        )
        return
      }

      try {
        setLoading(true)
        setShowResend(false)

        const { error } =
          await supabase.auth.signInWithPassword(
            {
              email:
                email
                  .trim()
                  .toLowerCase(),
              password,
            }
          )

        if (!error) {
          showMessage(
            'Éxito',
            'Sesión iniciada 🚀'
          )
          return
        }

        const msg =
          error.message.toLowerCase()

        if (
          msg.includes(
            'confirm'
          ) ||
          msg.includes(
            'not confirmed'
          )
        ) {
          setShowResend(true)

          showMessage(
            'Cuenta no confirmada',
            'Revisá tu email o reenviá el correo 📩'
          )
          return
        }

        if (
          msg.includes(
            'invalid'
          )
        ) {
          showMessage(
            'Error',
            'Correo o contraseña incorrectos 🔒'
          )
          return
        }

        showMessage(
          'Error',
          error.message
        )
      } catch (error) {
        showMessage(
          'Error',
          'Ocurrió un error'
        )
      } finally {
        setLoading(false)
      }
    }

  const resendEmail =
    async () => {
      if (
        !email.trim()
      ) {
        showMessage(
          'Error',
          'Ingresá tu email'
        )
        return
      }

      const { error } =
        await supabase.auth.resend(
          {
            type:
              'signup',
            email:
              email
                .trim()
                .toLowerCase(),
          }
        )

      if (error) {
        showMessage(
          'Error',
          error.message
        )
      } else {
        showMessage(
          'Correo reenviado',
          'Revisá tu bandeja 📩'
        )
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
          Falta Uno
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Encontrá partidos
          y jugadores
        </Text>

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

          {/* 🔥 NUEVO */}
          <TouchableOpacity
            onPress={() =>
              router.push(
                '/auth/forgot_password'
              )
            }
          >
            <Text
              style={
                styles.forgot
              }
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.button
            }
            onPress={
              handleLogin
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
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/auth/register'
              )
            }
          >
            <Text
              style={
                styles.link
              }
            >
              ¿No tenés cuenta?
              Registrate
            </Text>
          </TouchableOpacity>

          {showResend && (
            <TouchableOpacity
              onPress={
                resendEmail
              }
            >
              <Text
                style={
                  styles.smallLink
                }
              >
                Reenviar correo
                de confirmación
              </Text>
            </TouchableOpacity>
          )}
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
    },

    forgot: {
      textAlign: 'right',
      color: '#0a0a23',
      fontSize: 13,
      marginBottom: 12,
      fontWeight: '600',
    },

    button: {
      backgroundColor:
        '#0a0a23',
      padding: 15,
      borderRadius: 12,
      alignItems:
        'center',
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

    smallLink: {
      textAlign: 'center',
      marginTop: 14,
      color: '#777',
      fontSize: 13,
    },
  })