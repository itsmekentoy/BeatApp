import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import apiConnector from '../utils/apiConnector';
import connection from '../utils/connection';

// Mock data - In production, this would come from a database
const mockCheckIns = [
  { id: '1', date: '2025-10-15', time: '08:30 AM', duration: '2 hours' },
  { id: '2', date: '2025-10-13', time: '07:00 AM', duration: '1.5 hours' },
  { id: '3', date: '2025-10-11', time: '06:00 PM', duration: '1 hour' },
  { id: '4', date: '2025-10-09', time: '08:00 AM', duration: '2 hours' },
  { id: '5', date: '2025-10-07', time: '07:30 AM', duration: '1.5 hours' },
];

const mockPayments = [
  { id: '1', date: '2025-10-01', amount: '₱1,500', method: 'Cash', status: 'Paid' },
  { id: '2', date: '2025-09-01', amount: '₱1,500', method: 'GCash', status: 'Paid' },
  { id: '3', date: '2025-08-01', amount: '₱1,500', method: 'Cash', status: 'Paid' },
  { id: '4', date: '2025-07-01', amount: '₱1,500', method: 'Bank Transfer', status: 'Paid' },
];

interface AccordionSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  isTablet: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, children, isTablet }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.accordionContainer, isTablet && styles.accordionContainerTablet]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.accordionTitleContainer}>
          <Icon name={icon} size={isTablet ? 24 : 20} color="#FF6B35" />
          <Text style={[styles.accordionTitle, isTablet && { fontSize: 18 }]}>{title}</Text>
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={isTablet ? 24 : 20}
          color="#666"
        />
      </TouchableOpacity>
      {expanded && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
};

const ViewCustomer: React.FC = () => {
  const router = useRouter();
  const { loginData } = useUser();
  const hasEditCustomerPermission = loginData?.permissions?.some(
    (p) => p.permission === '4' && p.is_granted === 1
  );
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [deleting, setDeleting] = useState(false);
  // Freeze modal states
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [freezeMonths, setFreezeMonths] = useState('1');
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeMode, setFreezeMode] = useState<'freeze' | 'unfreeze'>('freeze');
  const [freezing, setFreezing] = useState(false);

  const paramsLocal: any = params;
  const customerId = paramsLocal.id;

  // Move fetchCustomer out so it can be reused after actions (freeze/update)
  const fetchCustomer = async (id: string | number) => {
    setLoading(true);
    try {
      const resp = await apiConnector.request(`Beat/customer/${id}`);
      const json = await resp.json();
      // backend may return the object directly or wrap it
      const obj = json && json.data ? json.data : json;
      setCustomer(obj);
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch when customerId is present and whenever the screen becomes focused
    if (customerId && isFocused) fetchCustomer(customerId);
  }, [customerId, isFocused]);

  // Handle freezing the account by months
  const handleFreezeSubmit = async () => {
    const id = customerId;
    if (!id) {
      Alert.alert('Error', 'Missing customer id');
      return;
    }

    const months = parseInt(freezeMonths, 10);
    if (isNaN(months) || months <= 0) {
      Alert.alert('Validation', 'Please enter a valid number of months');
      return;
    }

    setFreezing(true);
    try {
      const fd = new FormData();
      // send months and reason; include alternate key names for backend compatibility
      fd.append('months', String(months));
      fd.append('number_of_months', String(months));
      if (freezeReason && freezeReason.trim().length > 0) {
        fd.append('reason', freezeReason);
        fd.append('freeze_reason', freezeReason);
      }

      const resp = await apiConnector.request(`Beat/customer/freeze/${id}`, {
        method: 'POST',
        body: fd,
      });

      const json = await resp.json();
      if (json && (json.status === 'success' || json.success)) {
        Alert.alert('Success', `Account frozen for ${months} month(s)`);
        setFreezeModalVisible(false);
        setFreezeReason('');
        // Refresh customer details
        await fetchCustomer(id);
      } else {
        console.warn('Freeze response:', json);
        Alert.alert('Error', json?.message || 'Failed to freeze account');
      }
    } catch (err) {
      console.error('Failed to freeze account:', err);
      Alert.alert('Error', 'Failed to freeze account');
    } finally {
      setFreezing(false);
    }
  };

  // Handle unfreeze (remove freeze)
  const handleUnfreezeSubmit = async () => {
    const id = customerId;
    if (!id) {
      Alert.alert('Error', 'Missing customer id');
      return;
    }

    // reason is optional but preferred
    const reason = freezeReason?.trim();

    setFreezing(true);
    try {
      const fd = new FormData();
      if (reason) {
        fd.append('reason', reason);
        fd.append('freeze_reason', reason);
      }

      const resp = await apiConnector.request(`Beat/customer/unfreeze/${id}`, {
        method: 'POST',
        body: fd,
      });

      const json = await resp.json();
      if (json && (json.status === 'success' || json.success)) {
        Alert.alert('Success', `Account has been unfrozen`);
        setFreezeModalVisible(false);
        setFreezeReason('');
        // Refresh customer details
        await fetchCustomer(id);
      } else {
        console.warn('Unfreeze response:', json);
        Alert.alert('Error', json?.message || 'Failed to unfreeze account');
      }
    } catch (err) {
      console.error('Failed to unfreeze account:', err);
      Alert.alert('Error', 'Failed to unfreeze account');
    } finally {
      setFreezing(false);
    }
  };

  const handleDeleteCustomer = async (id: string | number) => {
    setDeleting(true);
    try {
      // Call delete endpoint. Backend may expect POST or DELETE; using POST here.
      const resp = await apiConnector.request(`Beat/customer/delete/${id}`, { method: 'DELETE' });
      const json = await resp.json();
      if (json && (json.status === 'success' || json.success)) {
        // Navigate back to the customer list and force that screen to become focused
        // (the Customer list component refetches when it becomes focused)
        Alert.alert('Deleted', 'Customer has been deleted.', [
          { text: 'OK', onPress: () => router.replace({ pathname: '/', params: { refresh: Date.now() } }) }
        ]);
      } else {
        console.warn('Delete customer response:', json);
        Alert.alert('Error', json?.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Failed to delete customer:', err);
      Alert.alert('Error', 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const InfoRow = ({ label, value, isTablet }: { label: string; value: string; isTablet: boolean }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, isTablet && { fontSize: 15 }]}>{label}:</Text>
      <Text style={[styles.infoValue, isTablet && { fontSize: 15 }]}>{value}</Text>
    </View>
  );

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

  const determineStatus = (membershipEnd?: string | null, status?: number) => {
    if (membershipEnd) {
      // Use local date to avoid UTC timezone edge-cases
      const today = moment().startOf('day');
      const endDate = moment(membershipEnd).startOf('day');
      const daysRemaining = endDate.diff(today, 'days');
      if (daysRemaining < 0) return 'Expired';
      if (daysRemaining <= 7) return 'Expiring';
      return 'Active';
    }
    if (status === 2) return 'Freeze';
    if (status === 3) return 'Terminated';
    if (status === 1) return 'Active';
    return 'Inactive';
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    // Expecting HH:mm:ss
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const date = new Date();
    date.setHours(h, m, parts[2] ? parseInt(parts[2], 10) : 0, 0);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={[styles.header, isTablet && { paddingHorizontal: 32 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTablet && { fontSize: 22 }]}>Customer Details</Text>
        <View style={styles.headerActions}>
          {loginData?.permissions?.some((p) => p.permission === '5' && p.is_granted === 1) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                // Confirm before deleting
                Alert.alert(
                  'Delete Customer',
                  'Are you sure you want to delete this customer? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCustomer(customerId) }
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Icon name="trash-outline" size={24} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loader while fetching customer details */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Loading customer...</Text>
          </View>
        </View>
      </Modal>

      {/* Freeze Account Modal */}
      <Modal visible={freezeModalVisible} transparent animationType="slide" onRequestClose={() => setFreezeModalVisible(false)}>
        <View style={styles.freezeModalContainer}>
          <View style={styles.freezeModalContent}>
            {freezeMode === 'freeze' ? (
              <>
                <Text style={styles.freezeModalTitle}>Freeze Account</Text>
                <Text style={{ marginBottom: 8 }}>Enter number of months to freeze:</Text>
                <TextInput
                  style={styles.freezeModalInput}
                  value={freezeMonths}
                  onChangeText={setFreezeMonths}
                  keyboardType="numeric"
                  placeholder="e.g. 1"
                  editable={!freezing}
                />
              </>
            ) : (
              <>
                <Text style={styles.freezeModalTitle}>Unfreeze Account</Text>
                <Text style={{ marginBottom: 8 }}>Reason for unfreezing (optional):</Text>
              </>
            )}

            <TextInput
              style={styles.freezeModalInput}
              value={freezeReason}
              onChangeText={setFreezeReason}
              placeholder={freezeMode === 'freeze' ? 'Optional reason for freezing' : 'Optional reason for unfreezing'}
              editable={!freezing}
            />

            <View style={styles.freezeModalButtons}>
              <TouchableOpacity
                style={[styles.freezeModalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setFreezeModalVisible(false)}
                disabled={freezing}
              >
                <Text style={styles.freezeModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.freezeModalButton, { backgroundColor: freezeMode === 'freeze' ? '#f39c12' : '#27ae60' }]}
                onPress={freezeMode === 'freeze' ? handleFreezeSubmit : handleUnfreezeSubmit}
                disabled={freezing}
              >
                {freezing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.freezeModalButtonText, { color: '#fff' }]}>{freezeMode === 'freeze' ? 'Freeze' : 'Unfreeze'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deleting overlay */}
      <Modal visible={deleting} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Deleting customer...</Text>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 900, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, isTablet && styles.profileSectionTablet]}>
          <View style={styles.profileImageContainer}>
            {(() => {
              const profilePath = customer?.profile_picture;
              const serverBase = (apiConnector.getBaseUrl() || connection.BASE_URL || '').replace(/\/api.*$/i, '');
              let uri: string | undefined = undefined;
              if (profilePath) {
                if (typeof profilePath === 'string' && profilePath.startsWith('http')) {
                  uri = profilePath;
                } else if (typeof profilePath === 'string' && profilePath.startsWith('/')) {
                  uri = `${serverBase}${profilePath}`;
                } else {
                  uri = `${serverBase}/storage/${profilePath}`;
                }
              }

              return uri ? (
                <Image source={{ uri }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profilePlaceholder, isTablet && { width: 140, height: 140 }]}>
                  <Icon name="person" size={isTablet ? 70 : 60} color="#ccc" />
                </View>
              );
            })()}
          </View>

          <Text style={[styles.customerName, isTablet && { fontSize: 28 }]}>{`${customer?.firstname || ''} ${customer?.middlename || ''} ${customer?.lastname || ''}`.trim()}</Text>

          {/* Computed membership/status badge */}
          {(() => {
            // Prioritize explicit flags from API
            let statusLabel = '';
            if (customer?.is_terminated) {
              statusLabel = 'Terminated';
            } else if (customer?.is_frozen) {
              statusLabel = 'Freeze';
            } else {
              statusLabel = determineStatus(customer?.membership_end, customer?.status);
            }

            return (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusLabel) }]}>
                <Text style={[styles.statusText, isTablet && { fontSize: 15 }]}>{statusLabel}</Text>
              </View>
            );
          })()}

          <View style={[styles.membershipInfo, isTablet && styles.membershipInfoTablet]}>
            <View style={styles.membershipContent}>
              <View style={styles.membershipItem}>
                <Icon name="card-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
                <Text style={[styles.membershipLabel, isTablet && { fontSize: 14 }]}>Membership</Text>
                <Text style={[styles.membershipValue, isTablet && { fontSize: 16 }]}>
                  {customer?.membership_type?.name || '-'}
                </Text>
              </View>
              <View style={styles.membershipDivider} />
              <View style={styles.membershipItem}>
                <Icon name="calendar-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
                <Text style={[styles.membershipLabel, isTablet && { fontSize: 14 }]}>Started</Text>
                <Text style={[styles.membershipValue, isTablet && { fontSize: 16 }]}>
                  {customer?.membership_start ? new Date(customer.membership_start).toLocaleDateString() : '-'}
                </Text>
              </View>
              <View style={styles.membershipDivider} />
              <View style={styles.membershipItem}>
                <Icon name="lock-closed-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
                <Text style={[styles.membershipLabel, isTablet && { fontSize: 14 }]}>Frozen</Text>
                <Text style={[styles.membershipValue, isTablet && { fontSize: 16 }]}>
                  {customer?.status === 2 ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
            <View style={styles.membershipButtonDivider} />
            <View style={styles.membershipButtonRow}>
              {loginData?.permissions?.some((p) => p.permission === '5' && p.is_granted === 1) && (
                <TouchableOpacity
                  style={[styles.membershipActionButton, styles.transactionButton, isTablet && styles.membershipActionButtonTablet]}
                  onPress={() => router.push({
                    pathname: '/CreateTransaction',
                    params: { customerId: customer.id, customerName: `${customer?.firstname || ''} ${customer?.lastname || ''}`.trim() }
                  })}
                >
                  <Icon name="add-circle-outline" size={isTablet ? 20 : 18} color="#fff" />
                  <Text style={[styles.membershipActionButtonText, isTablet && { fontSize: 12 }]}>
                    Transaction
                  </Text>
                </TouchableOpacity>
              )}

              {hasEditCustomerPermission && (
                <>
                  <TouchableOpacity
                    style={[styles.membershipActionButton, styles.editButton, isTablet && styles.membershipActionButtonTablet]}
                    onPress={() => router.push({
                      pathname: '/EditCustomer',
                      params: { customerId: customer.id }
                    })}
                  >
                    <Icon name="create-outline" size={isTablet ? 20 : 18} color="#fff" />
                    <Text style={[styles.membershipActionButtonText, isTablet && { fontSize: 12 }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.membershipActionButton, styles.freezeButton, isTablet && styles.membershipActionButtonTablet]}
                    onPress={() => {
                      const mode = customer?.is_frozen ? 'unfreeze' : 'freeze';
                      setFreezeMode(mode);
                      setFreezeModalVisible(true);
                    }}
                  >
                    <Icon name="pause-outline" size={isTablet ? 20 : 18} color="#fff" />
                    <Text style={[styles.membershipActionButtonText, isTablet && { fontSize: 12 }]}>
                      {customer?.is_frozen ? 'Unfreeze' : 'Freeze'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.membershipActionButton, styles.terminateButton, isTablet && styles.membershipActionButtonTablet]}
                    onPress={() => Alert.alert('Terminate Membership', 'Are you sure you want to terminate this membership?')}
                  >
                    <Icon name="close-circle-outline" size={isTablet ? 20 : 18} color="#fff" />
                    <Text style={[styles.membershipActionButtonText, isTablet && { fontSize: 12 }]}>
                      Terminate
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information Accordion */}
        <AccordionSection title="Personal Information" icon="person-outline" isTablet={isTablet}>
          <InfoRow label="First Name" value={customer?.firstname || ''} isTablet={isTablet} />
          <InfoRow label="Middle Name" value={customer?.middlename || ''} isTablet={isTablet} />
          <InfoRow label="Last Name" value={customer?.lastname || ''} isTablet={isTablet} />
          <InfoRow label="Gender" value={typeof customer?.gender !== 'undefined' ? (customer.gender === 0 ? 'Male' : 'Female') : ''} isTablet={isTablet} />
          <InfoRow label="Date of Birth" value={customer?.birthdate ? new Date(customer.birthdate).toLocaleDateString() : ''} isTablet={isTablet} />
          <InfoRow label="Age" value={customer?.age ? `${customer.age} years old` : ''} isTablet={isTablet} />
          <View style={styles.divider} />
          <Text style={[styles.sectionSubtitle, isTablet && { fontSize: 16 }]}>Contact Details</Text>
          <InfoRow label="Email" value={customer?.email || ''} isTablet={isTablet} />
          <InfoRow label="Phone" value={customer?.phone || ''} isTablet={isTablet} />
          <View style={styles.divider} />
          <Text style={[styles.sectionSubtitle, isTablet && { fontSize: 16 }]}>Address</Text>
          <InfoRow label="Address" value={customer?.address || ''} isTablet={isTablet} />
        </AccordionSection>

        {/* Medical Information Accordion */}
        <AccordionSection title="Medical Information" icon="medical-outline" isTablet={isTablet}>
          <Text style={[styles.medicalText, isTablet && { fontSize: 15 }]}>
            {customer?.medical_condition ?? customer?.medical_history ?? 'No medical conditions reported.'}
          </Text>
        </AccordionSection>

        {/* Check-in History Table */}
        <View style={[styles.tableContainer, isTablet && styles.tableContainerTablet]}>
          <View style={styles.tableHeader}>
            <Icon name="checkmark-circle-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
            <Text style={[styles.tableTitle, isTablet && { fontSize: 18 }]}>Check-in History</Text>
          </View>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                Date
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                Time
              </Text>
            </View>
            {/* Table Body */}
            {(customer?.attendance_monitorings || []).map((checkIn: any, index: number) => (
              <View
                key={checkIn.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                  {checkIn.attendance_date ? new Date(checkIn.attendance_date).toLocaleDateString() : ''}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                  {formatTime(checkIn.check_in_time)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment History Table */}
        <View style={[styles.tableContainer, isTablet && styles.tableContainerTablet]}>
          <View style={styles.tableHeader}>
            <Icon name="wallet-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
            <Text style={[styles.tableTitle, isTablet && { fontSize: 18 }]}>Payment History</Text>
          </View>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                Date
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                Amount
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCell3, isTablet && { fontSize: 14 }]}>
                Method
              </Text>
            </View>
            {/* Table Body */}
            {(customer?.customer_payment_transactions || []).map((payment: any, index: number) => (
              <View
                key={payment.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : ''}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                  {payment.amount}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell3, isTablet && { fontSize: 14 }]}>
                  {payment.payment_method || payment.method || ''}
                </Text>
                {/* Status column removed as requested */}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonTablet: {
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSectionTablet: {
    paddingVertical: 40,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  membershipInfo: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membershipInfoTablet: {
    maxWidth: 500,
  },
  membershipContent: {
    flexDirection: 'row',
    padding: 16,
  },
  membershipItem: {
    flex: 1,
    alignItems: 'center',
  },
  membershipDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  membershipButtonDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
  membershipLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  membershipValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  membershipButtonRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  membershipActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  membershipActionButtonTablet: {
    paddingVertical: 12,
  },
  membershipActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  transactionButton: {
    backgroundColor: '#27ae60',
  },
  editButton: {
    backgroundColor: '#FF6B35',
  },
  freezeButton: {
    backgroundColor: '#f39c12',
  },
  terminateButton: {
    backgroundColor: '#e74c3c',
  },
  // Accordion
  accordionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  accordionContainerTablet: {
    marginHorizontal: 24,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  accordionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accordionContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
    marginTop: 4,
  },
  medicalText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
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
  // Freeze modal styles
  freezeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  freezeModalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  freezeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  freezeModalInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  freezeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  freezeModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  // Tables
  tableContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  tableContainerTablet: {
    marginHorizontal: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  table: {
    backgroundColor: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableHeaderRow: {
    backgroundColor: '#f8f9fa',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#fafafa',
  },
  tableHeaderCell: {
    fontWeight: '600',
    color: '#666',
    fontSize: 13,
    padding: 12,
  },
  tableCell: {
    fontSize: 13,
    color: '#333',
    padding: 12,
  },
  tableCell1: {
    flex: 2,
  },
  tableCell2: {
    flex: 2,
  },
  tableCell3: {
    flex: 1.5,
  },
  tableCell4: {
    flex: 1.5,
  },
  statusPaid: {
    color: '#27ae60',
    fontWeight: '600',
  },
});

export default ViewCustomer;
