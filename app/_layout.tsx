import {
  Stack,
  Redirect,
  useSegments,
  usePathname,
  useRouter,
} from 'expo-router'
import {
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import {
  ActivityIndicator,
  View,
} from 'react-native'
import * as Location from 'expo-location'
import {
  setPendingRedirect,
  getPendingRedirect,
  clearPendingRedirect,
} from '../lib/pendingRedirect'

export default function RootLayout() {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] =
    useState(true)

  const [session, setSession] =
    useState<any>(null)

  const [
    profileComplete,
    setProfileComplete,
  ] = useState<
    boolean | null
  >(null)

  const [
    isRecovery,
    setIsRecovery,
  ] = useState(false)

  const segments =
    useSegments()

  const loadProfile =
    async (
      userId: string
    ) => {
      try {
        const {
          data: profile,
          error,
        } =
          await supabase
            .from(
              'profiles'
            )
            .select(
              'name, category_id'
            )
            .eq(
              'id',
              userId
            )
            .maybeSingle()

        if (error) {
          setProfileComplete(
            false
          )
          return
        }

        if (
          profile?.name?.trim() &&
          profile?.category_id
        ) {
          setProfileComplete(
            true
          )
        } else {
          setProfileComplete(
            false
          )
        }
      } catch {
        setProfileComplete(
          false
        )
      }
    }

  const saveUserLocation =
    async (
      userId: string
    ) => {
      try {
        const {
          status,
        } =
          await Location.requestForegroundPermissionsAsync()

        if (
          status !==
          'granted'
        )
          return

        const current =
          await Location.getCurrentPositionAsync(
            {}
          )

        const lat =
          current
            .coords
            .latitude

        const lng =
          current
            .coords
            .longitude

        const geo =
          await Location.reverseGeocodeAsync(
            {
              latitude:
                lat,
              longitude:
                lng,
            }
          )

        const city =
          geo?.[0]
            ?.city ||
          geo?.[0]
            ?.district ||
          geo?.[0]
            ?.subregion ||
          ''

        await supabase
          .from(
            'profiles'
          )
          .update({
            latitude:
              lat,
            longitude:
              lng,
            city,
          })
          .eq(
            'id',
            userId
          )
      } catch (
        error
      ) {
        console.log(
          'Error location:',
          error
        )
      }
    }

  useEffect(() => {
    const init =
      async () => {
        const {
          data,
        } =
          await supabase.auth.getSession()

        const current =
          data.session

        setSession(
          current
        )

        if (
          current?.user
        ) {
          setProfileComplete(
            null
          )

          loadProfile(
            current.user.id
          )

          saveUserLocation(
            current.user.id
          )

          setTimeout(
            () => {
              setProfileComplete(
                (
                  prev
                ) =>
                  prev ===
                  null
                    ? false
                    : prev
              )
            },
            3000
          )
        } else {
          setProfileComplete(
            null
          )
        }

        setLoading(
          false
        )
      }

    init()
  }, [])

  useEffect(() => {
    const {
      data:
        listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          setSession(
            session
          )

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {
            setIsRecovery(
              true
            )

            router.replace(
              '/auth/reset_password'
            )

            return
          }

          if (
            session?.user
          ) {
            setProfileComplete(
              null
            )

            loadProfile(
              session.user.id
            )

            saveUserLocation(
              session.user.id
            )

            setTimeout(
              () => {
                setProfileComplete(
                  (
                    prev
                  ) =>
                    prev ===
                    null
                      ? false
                      : prev
                )
              },
              3000
            )
          } else {
            setProfileComplete(
              null
            )
          }
        }
      )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            'center',
          alignItems:
            'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const inAuth =
    segments[0] ===
    'auth'

  const inCompleteProfile =
    segments[0] ===
    'complete_profile'

  const inResetPassword =
    segments[1] ===
    'reset_password'

  if (
    isRecovery &&
    !inResetPassword
  ) {
    return (
      <Redirect href="/auth/reset_password" />
    )
  }

  if (
    session &&
    profileComplete ===
      null &&
    !isRecovery
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            'center',
          alignItems:
            'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (
    !session &&
    !inAuth
  ) {
    /*
      SE GUARDA A DÓNDE IBA, no sólo que "no tenía sesión". Alguien que toca
      un link compartido (`faltauno://match/123`) sin estar logueado cae
      acá antes de llegar a esa pantalla — sin este guardado, después del
      login no había forma de saber que el destino real era el partido y
      no la lista general.
    */
    setPendingRedirect(pathname)

    return (
      <Redirect href="/auth/login" />
    )
  }

  if (
    session &&
    profileComplete ===
      false &&
    !inCompleteProfile &&
    !isRecovery
  ) {
    return (
      <Redirect href="/complete_profile" />
    )
  }

  if (
    session &&
    profileComplete ===
      true &&
    inCompleteProfile
  ) {
    const destino =
      getPendingRedirect() ||
      '/(tabs)/matches'

    clearPendingRedirect()

    return (
      <Redirect href={destino as any} />
    )
  }

  if (
    session &&
    inAuth &&
    !inResetPassword &&
    !isRecovery
  ) {
    const destino =
      getPendingRedirect() ||
      '/(tabs)/matches'

    clearPendingRedirect()

    return (
      <Redirect href={destino as any} />
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown:
          false,
      }}
    />
  )
}