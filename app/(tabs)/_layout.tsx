import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import AntDesign from '@expo/vector-icons/AntDesign'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'

export default function TabsLayout() {
  const [loading, setLoading] = useState(false)

  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          height: 70,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
        },

        tabBarLabelPosition: 'below-icon',

        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="tennis-ball-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create_match"
        options={{
          title: 'Crear Partido',
          tabBarIcon: ({ color }) => (
            <AntDesign name="plus-circle" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}