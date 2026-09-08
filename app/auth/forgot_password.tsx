import { useEffect, useState } from 'react'
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
import { showMessage, safeBack } from '../../lib/utils'

export default function ForgotPassword() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] =
    useState(false)

  const [cooldown, setCooldown] =
    useState(0)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer =
      setInterval(() => {
        setCooldown(
          (
            prev
          ) =>
            prev - 1
        )
      }, 1000)

    return () =>
      clearInterval(
        timer
      )
  }, [cooldown])

  const handleReset =
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

      if (
        cooldown > 0
      ) {
        return
      }

      try {
        setLoading(true)

        const { error } =
          await supabase.auth.resetPasswordForEmail(
            email
              .trim()
              .toLowerCase(),
            {
              redirectTo:
                'faltauno://reset-password',
            }
          )

        if (error) {
          const msg =
            error.message.toLowerCase()

          if (
            msg.includes(
              'rate limit'
            )
          ) {
            showMessage(
              'Esperá un momento',
              'Ya enviamos varios correos. Intentá nuevamente en unos minutos 📩'
            )

            setCooldown(
              60
            )

            return
          }

          showMessage(
            'Error',
            error.message
          )

          return
        }

        showMessage(
          'Listo 📩',
          'Si existe una cuenta con ese correo, te enviamos un link para cambiar tu contraseña'
        )

        setCooldown(
          60
        )
      } catch (error) {
        showMessage(
          'Error',
          'No se pudo enviar el correo'
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

        {/* ICON */}
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
          Recuperar contraseña
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Ingresá tu correo y te enviaremos un link para cambiarla
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

          <TouchableOpacity
            style={[
              styles.button,
              cooldown >
                0 && {
                opacity:
                  0.7,
              },
            ]}
            onPress={
              handleReset
            }
            disabled={
              loading ||
              cooldown >
                0
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
                {cooldown >
                0
                  ? `Reintentar en ${cooldown}s`
                  : 'Enviar link'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              safeBack(router, '/auth/login')
            }
          >
            <Text
              style={
                styles.link
              }
            >
              Volver al login
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
      lineHeight: 20,
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
      marginBottom: 14,
      fontSize: 15,
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
  })