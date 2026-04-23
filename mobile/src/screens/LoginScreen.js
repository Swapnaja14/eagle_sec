import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await authAPI.login({ username, password });
      // App.js conditional rendering swaps Stack.Screen automatically
      // once isLoggedIn flips to true — no manual navigation needed.
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert("Error", "Invalid credentials");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
