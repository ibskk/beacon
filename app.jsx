import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { supabase } from './lib/supabase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Main App Stack
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#c2ff00',
        tabBarInactiveTintColor: '#666',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { color: '#000', fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesScreen}
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚽</Text>,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
function RootNavigator({ user }) {
  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

// Screens
function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name }
        }
      });
      if (error) throw error;
      Alert.alert('Success', 'Check your email to confirm signup');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beacon</Text>
      <Text style={styles.subtitle}>Find your game in 60 seconds</Text>
      <ScrollView style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beacon</Text>
      <Text style={styles.subtitle}>Sign in to play</Text>
      <ScrollView style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MapScreen() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyGames();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      console.log('User location:', location.coords);
    }
  };

  const fetchNearbyGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('city', 'Toronto')
        .eq('status', 'open')
        .limit(50);
      if (data) setGames(data);
      if (error) throw error;
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Nearby Games ({games.length})</Text>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </ScrollView>
  );
}

function GamesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Games You've Joined</Text>
      <Text style={styles.placeholder}>Join a game from the Map tab</Text>
    </View>
  );
}

function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Groups & Chats</Text>
      <Text style={styles.placeholder}>Join a group to find recurring games</Text>
    </View>
  );
}

function ProfileScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Profile</Text>
      <Pressable style={[styles.button, styles.dangerButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

// Game Card Component
function GameCard({ game }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sport}>{game.sport}</Text>
        <Text style={styles.level}>{game.level || 'Any'}</Text>
      </View>
      <Text style={styles.venue}>{game.venue_name}</Text>
      <Text style={styles.time}>{new Date(game.starts_at).toLocaleTimeString()}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.spots}>{game.spots_total} players</Text>
        <Pressable style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Join</Text>
        </Pressable>
      </View>
    </View>
  );
}

// App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <RootNavigator user={user} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#000', marginTop: 60, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20, color: '#000' },
  button: { backgroundColor: '#c2ff00', paddingVertical: 14, borderRadius: 8, marginVertical: 10, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  dangerButton: { backgroundColor: '#ff8a3d' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginVertical: 20 },
  placeholder: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sport: { fontSize: 16, fontWeight: '700', color: '#000' },
  level: { fontSize: 12, color: '#666' },
  venue: { fontSize: 14, color: '#333', marginBottom: 4 },
  time: { fontSize: 12, color: '#999', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spots: { fontSize: 12, color: '#666' },
  joinBtn: { backgroundColor: '#c2ff00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  joinBtnText: { color: '#000', fontWeight: '600', fontSize: 12 }
});
