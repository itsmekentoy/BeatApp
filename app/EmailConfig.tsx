import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiConnector from './utils/apiConnector';

const EmailConfig = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        const response = await apiConnector.request('Beat/email-management');
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
          setPassword(data.password);
          setLogoUri(data.filepath);
        } else {
          Alert.alert('Error', 'Failed to fetch email configuration');
        }
      } catch (error) {
        console.error('Error fetching email configuration:', error);
        Alert.alert('Error', 'An unexpected error occurred');
      }
    };

    fetchEmailConfig();
  }, []);

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (logoUri) {
      formData.append('filepath', {
        uri: logoUri,
        name: 'logo.jpg',
        type: 'image/jpeg',
      });
    }

    try {
      const response = await apiConnector.request('Beat/email-management/create-or-update', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Email configuration updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update email configuration');
      }
    } catch (error) {
      console.error('Error updating email configuration:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.title, isTablet && { fontSize: 28 }]}>Email Configuration</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.sectionTitle}>Email Logo</Text>
            <Text style={styles.sectionSubtitle}>Upload a logo to appear in email notifications</Text>
            
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={pickLogo}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Icon name="image-outline" size={50} color="#999" />
                  <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
                </View>
              )}
            </TouchableOpacity>

            {logoUri && (
              <TouchableOpacity
                style={styles.removeLogoButton}
                onPress={() => setLogoUri(null)}
              >
                <Icon name="trash-outline" size={18} color="#FF3B30" />
                <Text style={styles.removeLogoText}>Remove Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Email Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>SMTP Settings</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Icon name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., gym@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Password *</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter SMTP password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Icon
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Use an app-specific password for better security
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Icon name="information-circle" size={24} color="#4CAF50" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Email Configuration</Text>
              <Text style={styles.infoText}>
                This email will be used to send notifications about new memberships, 
                renewals, and other important updates to your customers.
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isTablet && styles.saveButtonTablet]}
            onPress={handleSave}
          >
            <Icon name="checkmark-circle" size={24} color="#FFF" />
            <Text style={[styles.saveButtonText, isTablet && { fontSize: 18 }]}>
              Save Configuration
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  logoSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  removeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  removeLogoText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonTablet: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmailConfig;
