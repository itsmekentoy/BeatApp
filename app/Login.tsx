import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiConnector from './utils/apiConnector';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await apiConnector.request('Beat/LoginAccount', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const file = new File(Paths.cache, 'userSession.txt');
        if (!file.exists) {
          file.create();
        }
        file.write(JSON.stringify(result)); // Save the successful login response
        console.log('User session saved:', result);

        router.replace('/'); // Redirect to the main page
      } else {
        if (response.status === 422) {
          const errors = result.errors;
          const errorMessage = Object.keys(errors)
            .map((key) => `${key}: ${errors[key].join(', ')}`)
            .join('\n');
          Alert.alert('Validation Error', errorMessage);
        } else if (response.status === 401) {
          Alert.alert('Login Failed', result.message || 'Invalid email or password');
        } else {
          Alert.alert('Error', result.message || 'An unknown error occurred.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact your administrator to reset your password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <Icon name="lock-closed" size={80} color="#FF6B35" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Login Form */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Icon name="mail" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <Icon name="key" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#ccc"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Email: admin@beatapp.com</Text>
            <Text style={styles.demoText}>Password: admin123</Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Text style={styles.buttonText}>Sign In</Text>
                <Icon name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* Server Config Link */}
          <TouchableOpacity
            style={styles.serverConfigLink}
            onPress={() => {
              setEmail(''); // Clear the email input
              setPassword(''); // Clear the password input
              router.replace('/ServerConfig');
            }}
          >
            <Icon name="settings" size={16} color="#FF6B35" />
            <Text style={styles.serverConfigText}>Change Server</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  formSection: {
    width: '100%',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
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
  eyeButton: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  demoContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  loginButton: {
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
    marginBottom: 15,
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
  serverConfigLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  serverConfigText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
