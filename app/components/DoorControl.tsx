import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DoorControl = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const [door1Status, setDoor1Status] = useState<'locked' | 'unlocked'>('locked');
  const [door2Status, setDoor2Status] = useState<'locked' | 'unlocked'>('locked');
  const [showInfo, setShowInfo] = useState(false);

  const handleOpenDoor1 = () => {
    setDoor1Status('unlocked');
    // Here you would typically send a command to your door hardware
    Alert.alert('Success', 'First door unlocked');
    
    // Auto-lock after 5 seconds
    setTimeout(() => {
      setDoor1Status('locked');
    }, 5000);
  };

  const handleOpenDoor2 = () => {
    setDoor2Status('unlocked');
    // Here you would typically send a command to your door hardware
    Alert.alert('Success', 'Second door unlocked');
    
    // Auto-lock after 5 seconds
    setTimeout(() => {
      setDoor2Status('locked');
    }, 5000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="key" size={isTablet ? 36 : 32} color="#FF6B35" />
        <Text style={[styles.title, isTablet && { fontSize: 28 }]}>Door Control</Text>
        <Text style={[styles.subtitle, isTablet && { fontSize: 16 }]}>
          Remotely unlock gym entrance doors
        </Text>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusText}>System Online</Text>
        </View>
      </View>

      {/* Door Controls */}
      <View style={[styles.doorsContainer, isTablet && styles.doorsContainerTablet]}>
        {/* Door 1 */}
        <View style={[styles.doorCard, isTablet && styles.doorCardTablet]}>
          <View style={styles.doorHeader}>
            <Icon 
              name={door1Status === 'locked' ? 'lock-closed' : 'lock-open'} 
              size={isTablet ? 50 : 40} 
              color={door1Status === 'locked' ? '#FF6B35' : '#4CAF50'} 
            />
            <Text style={[styles.doorTitle, isTablet && { fontSize: 24 }]}>First Door</Text>
            <Text style={[styles.doorSubtitle, isTablet && { fontSize: 15 }]}>
              Main Entrance
            </Text>
          </View>

          <View style={styles.doorStatus}>
            <Text style={[
              styles.statusBadge,
              door1Status === 'locked' ? styles.lockedBadge : styles.unlockedBadge,
              isTablet && { fontSize: 15, paddingVertical: 10, paddingHorizontal: 18 }
            ]}>
              {door1Status === 'locked' ? 'LOCKED' : 'UNLOCKED'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.openButton,
              isTablet && styles.openButtonTablet,
              door1Status === 'unlocked' && styles.openButtonDisabled
            ]}
            onPress={handleOpenDoor1}
            disabled={door1Status === 'unlocked'}
          >
            <Icon name="key" size={isTablet ? 26 : 22} color="#FFF" />
            <Text style={[styles.openButtonText, isTablet && { fontSize: 18 }]}>
              {door1Status === 'locked' ? 'Open Door' : 'Opening...'}
            </Text>
          </TouchableOpacity>

          {door1Status === 'unlocked' && (
            <Text style={styles.autoLockText}>Auto-locking in 5 seconds...</Text>
          )}
        </View>

        {/* Door 2 */}
        <View style={[styles.doorCard, isTablet && styles.doorCardTablet]}>
          <View style={styles.doorHeader}>
            <Icon 
              name={door2Status === 'locked' ? 'lock-closed' : 'lock-open'} 
              size={isTablet ? 50 : 40} 
              color={door2Status === 'locked' ? '#FF6B35' : '#4CAF50'} 
            />
            <Text style={[styles.doorTitle, isTablet && { fontSize: 24 }]}>Second Door</Text>
            <Text style={[styles.doorSubtitle, isTablet && { fontSize: 15 }]}>
              Side Entrance
            </Text>
          </View>

          <View style={styles.doorStatus}>
            <Text style={[
              styles.statusBadge,
              door2Status === 'locked' ? styles.lockedBadge : styles.unlockedBadge,
              isTablet && { fontSize: 15, paddingVertical: 10, paddingHorizontal: 18 }
            ]}>
              {door2Status === 'locked' ? 'LOCKED' : 'UNLOCKED'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.openButton,
              isTablet && styles.openButtonTablet,
              door2Status === 'unlocked' && styles.openButtonDisabled
            ]}
            onPress={handleOpenDoor2}
            disabled={door2Status === 'unlocked'}
          >
            <Icon name="key" size={isTablet ? 26 : 22} color="#FFF" />
            <Text style={[styles.openButtonText, isTablet && { fontSize: 18 }]}>
              {door2Status === 'locked' ? 'Open Door' : 'Opening...'}
            </Text>
          </TouchableOpacity>

          {door2Status === 'unlocked' && (
            <Text style={styles.autoLockText}>Auto-locking in 5 seconds...</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  doorsContainer: {
    flex: 1,
    gap: 16,
  },
  doorsContainerTablet: {
    flexDirection: 'row',
    gap: 20,
  },
  doorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  doorCardTablet: {
    flex: 1,
    padding: 30,
  },
  doorHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  doorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  doorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  doorStatus: {
    marginBottom: 20,
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  lockedBadge: {
    backgroundColor: '#FFEBEE',
    color: '#FF3B30',
  },
  unlockedBadge: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  openButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 200,
    justifyContent: 'center',
  },
  openButtonTablet: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    minWidth: 250,
  },
  openButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  openButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoLockText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 10,
    fontStyle: 'italic',
  },
  infoButton: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoButtonTablet: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  infoButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});

export default DoorControl;
