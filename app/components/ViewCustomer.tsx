import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  // Mock customer data - In production, fetch based on params.id
  const customer = {
    id: params.id || '1',
    name: params.name || 'John Doe',
    profileImage: null, // Would come from database
    membershipType: 'Monthly',
    dateStarted: '2025-01-15',
    status: 'Active',
    // Personal Information
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    gender: 'Male',
    dob: '1990-05-15',
    age: '35',
    email: 'john.doe@email.com',
    phone: '+63 912 345 6789',
    address: '123 Main Street, Barangay San Jose, Quezon City, Metro Manila, 1100',
    region: 'Metro Manila',
    province: 'NCR',
    city: 'Quezon City',
    barangay: 'San Jose',
    street: '123 Main Street',
    zipCode: '1100',
    // Medical Information
    medicalCondition: 'No major health issues. Has mild hypertension, currently managed with medication. Regular check-ups recommended.',
  };

  const InfoRow = ({ label, value, isTablet }: { label: string; value: string; isTablet: boolean }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, isTablet && { fontSize: 15 }]}>{label}:</Text>
      <Text style={[styles.infoValue, isTablet && { fontSize: 15 }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button and Action Icons */}
      <View style={[styles.header, isTablet && { paddingHorizontal: 32 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTablet && { fontSize: 22 }]}>Customer Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isTablet && styles.actionButtonTablet]}
            onPress={() => router.push({
              pathname: '/CreateTransaction',
              params: { customerId: customer.id, customerName: customer.name }
            })}
          >
            <Icon name="add-circle" size={isTablet ? 28 : 24} color="#27ae60" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, isTablet && styles.actionButtonTablet]}
            onPress={() => router.push({
              pathname: '/EditCustomer',
              params: { customerId: customer.id }
            })}
          >
            <Icon name="create-outline" size={isTablet ? 28 : 24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>

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
            {customer.profileImage ? (
              <Image source={{ uri: customer.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, isTablet && { width: 140, height: 140 }]}>
                <Icon name="person" size={isTablet ? 70 : 60} color="#ccc" />
              </View>
            )}
          </View>
          <Text style={[styles.customerName, isTablet && { fontSize: 28 }]}>{customer.name}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: '#27ae60' }]}>
            <Text style={[styles.statusText, isTablet && { fontSize: 15 }]}>{customer.status}</Text>
          </View>

          <View style={[styles.membershipInfo, isTablet && styles.membershipInfoTablet]}>
            <View style={styles.membershipItem}>
              <Icon name="card-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
              <Text style={[styles.membershipLabel, isTablet && { fontSize: 14 }]}>Membership</Text>
              <Text style={[styles.membershipValue, isTablet && { fontSize: 16 }]}>
                {customer.membershipType}
              </Text>
            </View>
            <View style={styles.membershipDivider} />
            <View style={styles.membershipItem}>
              <Icon name="calendar-outline" size={isTablet ? 24 : 20} color="#FF6B35" />
              <Text style={[styles.membershipLabel, isTablet && { fontSize: 14 }]}>Started</Text>
              <Text style={[styles.membershipValue, isTablet && { fontSize: 16 }]}>
                {new Date(customer.dateStarted).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Personal Information Accordion */}
        <AccordionSection title="Personal Information" icon="person-outline" isTablet={isTablet}>
          <InfoRow label="First Name" value={customer.firstName} isTablet={isTablet} />
          <InfoRow label="Middle Name" value={customer.middleName} isTablet={isTablet} />
          <InfoRow label="Last Name" value={customer.lastName} isTablet={isTablet} />
          <InfoRow label="Gender" value={customer.gender} isTablet={isTablet} />
          <InfoRow label="Date of Birth" value={new Date(customer.dob).toLocaleDateString()} isTablet={isTablet} />
          <InfoRow label="Age" value={`${customer.age} years old`} isTablet={isTablet} />
          <View style={styles.divider} />
          <Text style={[styles.sectionSubtitle, isTablet && { fontSize: 16 }]}>Contact Details</Text>
          <InfoRow label="Email" value={customer.email} isTablet={isTablet} />
          <InfoRow label="Phone" value={customer.phone} isTablet={isTablet} />
          <View style={styles.divider} />
          <Text style={[styles.sectionSubtitle, isTablet && { fontSize: 16 }]}>Address</Text>
          <InfoRow label="Street" value={customer.street} isTablet={isTablet} />
          <InfoRow label="Barangay" value={customer.barangay} isTablet={isTablet} />
          <InfoRow label="City" value={customer.city} isTablet={isTablet} />
          <InfoRow label="Province" value={customer.province} isTablet={isTablet} />
          <InfoRow label="Region" value={customer.region} isTablet={isTablet} />
          <InfoRow label="Zip Code" value={customer.zipCode} isTablet={isTablet} />
        </AccordionSection>

        {/* Medical Information Accordion */}
        <AccordionSection title="Medical Information" icon="medical-outline" isTablet={isTablet}>
          <Text style={[styles.medicalText, isTablet && { fontSize: 15 }]}>
            {customer.medicalCondition || 'No medical conditions reported.'}
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
              <Text style={[styles.tableHeaderCell, styles.tableCell3, isTablet && { fontSize: 14 }]}>
                Duration
              </Text>
            </View>
            {/* Table Body */}
            {mockCheckIns.map((checkIn, index) => (
              <View 
                key={checkIn.id} 
                style={[
                  styles.tableRow, 
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                  {new Date(checkIn.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                  {checkIn.time}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell3, isTablet && { fontSize: 14 }]}>
                  {checkIn.duration}
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
              <Text style={[styles.tableHeaderCell, styles.tableCell4, isTablet && { fontSize: 14 }]}>
                Status
              </Text>
            </View>
            {/* Table Body */}
            {mockPayments.map((payment, index) => (
              <View 
                key={payment.id} 
                style={[
                  styles.tableRow, 
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCell1, isTablet && { fontSize: 14 }]}>
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell2, isTablet && { fontSize: 14 }]}>
                  {payment.amount}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell3, isTablet && { fontSize: 14 }]}>
                  {payment.method}
                </Text>
                <Text style={[styles.tableCell, styles.tableCell4, styles.statusPaid, isTablet && { fontSize: 14 }]}>
                  {payment.status}
                </Text>
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  membershipItem: {
    flex: 1,
    alignItems: 'center',
  },
  membershipDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
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
