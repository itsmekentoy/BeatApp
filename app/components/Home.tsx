import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useUser } from '../context/UserContext';
import apiConnector from '../utils/apiConnector';

const isTablet = () => {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600;
};

// Dashboard state will be populated from the backend
type Dashboard = any;

export default function Home() {
  const tablet = isTablet();
  const { loginData } = useUser();
  const hasFinancialPermission = loginData?.permissions?.some(
    (p) => p.permission === '1' && p.is_granted === 1
  );
  const isFocused = useIsFocused();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiConnector.request('Beat/dashboard');
        let body: any = null;
        try {
          body = await res.json();
        } catch (e) {
          body = null;
        }
        if (!mounted) return;
        if (res.ok) {
          setDashboard(body);
        } else {
          // still set body if available so UI can show partial info
          setDashboard(body);
          setError((body && body.message) || `Server returned ${res.status}`);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, [isFocused]);

  const totalSales = dashboard?.total_sales ?? 0;
  const totalExpenses = dashboard?.total_expenses ?? 0;
  const netIncome = dashboard?.net_income ?? 0;
  const totalMembers = dashboard?.total_customers ?? 0;
  const activeMembers = dashboard?.active_members_count ?? 0;
  const todayCheckins = dashboard?.today_checkin_count ?? 0;
  const expiringMembers = dashboard?.expiring_memberships ?? [];
  const latestCheckins = dashboard?.latest_checkins ?? [];

  const getCustomerFullName = (c: any) => {
    if (!c) return '—';
    const first = c.firstname ?? c.first_name ?? '';
    const last = c.lastname ?? c.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full.length ? full : '—';
  };

  const formatCheckinTime = (item: any) => {
    // Try common fields in the payload
    const raw = item?.check_in_time ?? item?.time ?? item?.created_at ?? item?.attendance_time ?? null;
    if (!raw) return '—';

    // If the raw value looks like HH:mm:ss (e.g., 23:06:43)
    if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) {
      return moment(raw, 'HH:mm:ss').format('hh:mm A');
    }

    // If the raw value looks like a full ISO timestamp
    const maybeIso = moment(raw);
    if (maybeIso.isValid()) {
      return maybeIso.format('hh:mm A');
    }

    // Fallback: return original
    return String(raw);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Error */}
      {error && (
        <Text style={{ color: '#c0392b', marginBottom: 8 }}>Error loading dashboard: {error}</Text>
      )}

      {/* Financial Overview (permission 1) */}
      {hasFinancialPermission && (
        <>
          <Text style={styles.sectionTitle}>Monthly Financial Overview</Text>
          <View style={[styles.row, tablet && styles.rowTablet]}>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Total Sales</Text>
              <Text style={[styles.cardValue, { color: '#27ae60' }]}>₱{Number(totalSales).toLocaleString()}</Text>
            </View>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Total Expenses</Text>
              <Text style={[styles.cardValue, { color: '#e74c3c' }]}>₱{Number(totalExpenses).toLocaleString()}</Text>
            </View>
            <View style={[styles.card, tablet && styles.cardTablet]}>
              <Text style={styles.cardLabel}>Net Income</Text>
              <Text style={[styles.cardValue, { color: '#f39c12' }]}>₱{Number(netIncome).toLocaleString()}</Text>
            </View>
          </View>
        </>
      )}

      {/* Membership Stats */}
      <Text style={styles.sectionTitle}>Membership Stats</Text>
      <View style={[styles.row, tablet && styles.rowTablet]}>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Total Members</Text>
          <Text style={styles.cardValue}>{totalMembers}</Text>
        </View>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Active Members</Text>
          <Text style={styles.cardValue}>{activeMembers}</Text>
        </View>
        <View style={[styles.card, tablet && styles.cardTablet]}>
          <Text style={styles.cardLabel}>Today's Check-ins</Text>
          <Text style={styles.cardValue}>{todayCheckins}</Text>
        </View>
      </View>

      {/* Check-ins Table */}
      <Text style={styles.sectionTitle}>Today's Check-ins</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Name</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Time</Text>
        </View>
        {latestCheckins.map((item: any, idx: number) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCell}>{getCustomerFullName(item?.beat_customer)}</Text>
            <Text style={styles.tableCell}>{formatCheckinTime(item)}</Text>
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
        {expiringMembers.map((item: any, idx: number) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCell}>{item?.beat_customer ? getCustomerFullName(item.beat_customer) : getCustomerFullName(item)}</Text>
            <Text style={styles.tableCell}>{item?.membership_expiry_date ?? item?.membership_end ?? item?.expiry ?? '—'}</Text>
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