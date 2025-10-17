import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Settings() {
  const router = useRouter();

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#FF6B35" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && (
        <Icon name="chevron-forward" size={20} color="#999" />
      ))}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          <Icon name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.profileName}>Gym Owner</Text>
        <Text style={styles.profileEmail}>owner@gym.com</Text>
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <SettingSection title="Gym Settings">
        <SettingItem
          icon="pricetag"
          title="Membership Plan"
          subtitle="Manage subscription plans and pricing"
          onPress={() => router.push('/Membership')}
        />
        <SettingItem
          icon="mail"
          title="Email Setting"
          subtitle="Configure email notifications and alerts"
          onPress={() => router.push('/EmailConfig')}
        />
      </SettingSection>

      <SettingSection title="User Management">
        <SettingItem
          icon="people"
          title="User Management"
          subtitle="Manage staff accounts and permissions"
          onPress={() => router.push('/UserManagement')}
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingItem
          icon="information-circle"
          title="About App"
          subtitle="Developer and Version Info"
          onPress={() => {}}
        />
      </SettingSection>

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton}>
          <Icon name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Gym Management System</Text>
        <Text style={styles.footerText}>Developed by Kent Cortieguerra</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2024 All Rights Reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 3,
  },
  logoutSection: {
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});