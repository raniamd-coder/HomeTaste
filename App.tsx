import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useColors, useTheme } from './context/ThemeContext';
import { RootNavigator } from './navigation/RootNavigator';

function AppContent() {
  const { mode } = useTheme();
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RootNavigator />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
