import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import apiConnector from '../utils/apiConnector';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return '#27ae60';
    case 'Inactive': return '#e74c3c';
    case 'Expiring': return '#f39c12';
    case 'Expired': return '#c0392b';
    case 'Freeze': return '#3498db';
    case 'Terminated': return '#7f8c8d';
    default: return '#888';
  }
};

const determineStatus = (membershipEnd: string | null, status: number) => {
  // Prefer local date comparison to match user's expectations (avoid UTC off-by-one).
  if (membershipEnd) {
    const today = moment().startOf('day');
    const endDate = moment(membershipEnd).startOf('day');
    const daysRemaining = endDate.diff(today, 'days');

    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining <= 7) return 'Expiring';
    return 'Active';
  }

  // No end date — fall back to numeric status codes.
  if (status === 2) return 'Freeze';
  if (status === 3) return 'Terminated';
  if (status === 1) return 'Inactive';
  return 'Inactive';
};

const Customer: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { loginData } = useUser();
  const hasAddCustomerPermission = loginData?.permissions?.some(
    (p) => p.permission === '3' && p.is_granted === 1
  );

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiConnector.request('Beat/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initially
    fetchCustomers();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    // Refetch when this screen becomes focused (so returning from AddCustomer reloads list)
    if (isFocused) fetchCustomers();
  }, [isFocused]);

  const filteredCustomers = customers.filter((customer: any) =>
    customer.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: any) => {
    const status = determineStatus(item.membership_end, item.status);

    return (
      <TouchableOpacity
        style={[styles.card, isTablet && styles.cardTablet]}
        onPress={() => router.push({
          pathname: '/ViewCustomer',
          params: { id: item.id, name: `${item.firstname} ${item.lastname}` }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <Text style={styles.name}>{`${item.firstname} ${item.lastname}`}</Text>
          <Text style={[styles.status, { color: getStatusColor(status) }]}>{status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Expiry:</Text>
          <Text style={styles.expiry}>{item.membership_end}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Customer List</Text>
        {hasAddCustomerPermission && (
          <TouchableOpacity
            style={[styles.addButton, isTablet ? { padding: 14, borderRadius: 12 } : { padding: 10, borderRadius: 8 }]}
            onPress={() => router.push('/AddCustomer')}
          >
            <Icon name="person-add" size={isTablet ? 28 : 22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or status..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Fullscreen loader while fetching customers */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Loading customers...</Text>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredCustomers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? { gap: 16 } : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 16,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTablet: {
    marginHorizontal: 8,
    minWidth: 250,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  expiry: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
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

export default Customer;