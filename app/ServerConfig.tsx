import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ServerConfig() {
  const router = useRouter();
  const [serverIP, setServerIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateIPAddress = (ip: string) => {
    const ipRegex =
      /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(localhost|127\.0\.0\.1)$|^(\d+\.\d+\.\d+\.\d+:\d+)$/;
    return ipRegex.test(ip);
  };

  const saveIPAddress = async (ip: string) => {
    try {
      const formattedIP = ip.startsWith('http://') || ip.startsWith('https://') ? ip : `http://${ip}`;
      const file = new File(Paths.cache, 'serverConfig.txt');

      if (file.exists) {
        file.delete(); // Remove the old file to ensure the new IP is saved
      }

      file.create(); // Create a new file
      file.write(`${formattedIP}/api`); // Write the new IP address to the file
      console.log('Updated file content:', file.textSync()); // Log the updated content for verification
    } catch (error) {
      console.error('Error saving IP address:', error);
    }
  };

  const handleContinue = async () => {
    if (!serverIP.trim()) {
      Alert.alert('Error', 'Please enter a server IP address');
      return;
    }

    if (!validateIPAddress(serverIP.trim())) {
      Alert.alert('Invalid IP Address', 'Please enter a valid IP address or localhost');
      return;
    }

    try {
      setLoadingMessage('Connecting to server...');
      setLoading(true);

      const formattedIP = serverIP.startsWith('http://') || serverIP.startsWith('https://') ? serverIP : `http://${serverIP}`;
      const fullUrl = `${formattedIP}/api/Beat/CheckConnection`;
      console.log('Full URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await saveIPAddress(serverIP);
        router.push('/Login');
      } else {
        const file = new File(Paths.cache, 'serverConfig.txt');
        if (file.exists) {
          file.delete(); // Remove the existing file
        }
        file.create(); // Create a new empty file
        Alert.alert('Connection Failed', result.message || 'Unable to connect to the server. Please set up the server again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  const checkAndRedirect = async () => {
    try {
      const file = new File(Paths.cache, 'serverConfig.txt');

      if (file.exists) {
        setLoadingMessage('Verifying server configuration...');
        setLoading(true);

        const content = file.textSync();
        console.log('Loaded server configuration:', content);

        const response = await fetch(`${content}/Beat/CheckConnection`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          router.push('/Login');
        } else {
          file.delete(); // Remove the file if the server is unreachable
          Alert.alert('Connection Error', 'Unable to connect to the server. Please set up the server again.');
        }
      }
    } catch (error) {
      console.error('Error checking server configuration:', error);
      Alert.alert('Error', 'Failed to verify server configuration. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  useEffect(() => {
    checkAndRedirect();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <Icon name="server" size={80} color="#FF6B35" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Server Configuration</Text>
          <Text style={styles.subtitle}>Enter your server IP address to connect</Text>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Server IP Address *</Text>
              <View style={styles.inputContainer}>
                <Icon name="globe" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 192.168.1.100 or localhost"
                  value={serverIP}
                  onChangeText={setServerIP}
                  placeholderTextColor="#ccc"
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                You can use your local IP address, localhost, or IP:PORT format
              </Text>
            </View>
          </View>

          {/* Examples */}
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Examples:</Text>
            <Text style={styles.example}>• 192.168.1.100</Text>
            <Text style={styles.example}>• localhost</Text>
            <Text style={styles.example}>• 192.168.1.100:3000</Text>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue to Login</Text>
                <Icon name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen loader modal (same design as Customer list) */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>{loadingMessage || 'Please wait...'}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  examplesContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  examplesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  example: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
