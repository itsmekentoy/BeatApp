import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useUser } from '../context/UserContext';

const isTablet = () => {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600;
};

const financialData = {
  totalSales: 12000,
  totalExpenses: 8000,
  netIncome: 4000,
};

const memberStats = {
  total: 200,
  active: 150,
  todayCheckins: 45,
};

const checkins = [
  { name: 'John Doe', time: '08:30 AM' },
  { name: 'Jane Smith', time: '09:10 AM' },
  { name: 'Mike Lee', time: '09:45 AM' },
];

const expiringMembers = [
  { name: 'Anna Kim', expiry: '2025-10-15' },
  { name: 'Chris Paul', expiry: '2025-10-16' },
];

export default function Home() {
  const tablet = isTablet();
  const { loginData } = useUser();
  const hasFinancialPermission = loginData?.permissions?.some(
    (p) => p.permission === '1' && p.is_granted === 1
  );
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Financial Overview (permission 1) */}
      {hasFinancialPermission && (
        <>
          <Text style={styles.sectionTitle}>Monthly Financial Overview</Text>
          <View style={[styles.row, tablet && styles.rowTablet]}>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Total Sales</Text>
              <Text style={[styles.cardValue, { color: '#27ae60' }]}>₱{financialData.totalSales.toLocaleString()}</Text>
            </View>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Total Expenses</Text>
              <Text style={[styles.cardValue, { color: '#e74c3c' }]}>₱{financialData.totalExpenses.toLocaleString()}</Text>
            </View>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Net Income</Text>
              <Text style={[styles.cardValue, { color: '#f39c12' }]}>₱{financialData.netIncome.toLocaleString()}</Text>
            </View>
          </View>
        </>
      )}

      {/* Membership Stats */}
      <Text style={styles.sectionTitle}>Membership Stats</Text>
      <View style={[styles.row, tablet && styles.rowTablet]}>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Total Members</Text>
          <Text style={styles.cardValue}>{memberStats.total}</Text>
        </View>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Active Members</Text>
          <Text style={styles.cardValue}>{memberStats.active}</Text>
        </View>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Today's Check-ins</Text>
          <Text style={styles.cardValue}>{memberStats.todayCheckins}</Text>
        </View>
      </View>

      {/* Check-ins Table */}
      <Text style={styles.sectionTitle}>Today's Check-ins</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Name</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Time</Text>
        </View>
        {checkins.map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.time}</Text>
          </View>
        ))}
      </View>

      {/* Expiring Members Table */}
      <Text style={styles.sectionTitle}>Expiring Members</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Name</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Expiry</Text>
        </View>
        {expiringMembers.map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.expiry}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#FF6B35',
  },
  row: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  },
  rowTablet: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    flex: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTablet: {
    marginHorizontal: 8,
    minWidth: 180,
  },
  cardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  table: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
});