import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  color: string;
}

export default function Subscription() {
  const plans: Plan[] = [
    {
      id: '1',
      name: 'Basic',
      price: 29,
      duration: 'month',
      color: '#2196F3',
      features: [
        'Access to gym equipment',
        'Locker room access',
        'Free WiFi',
        'Water dispenser',
      ],
    },
    {
      id: '2',
      name: 'Premium',
      price: 59,
      duration: 'month',
      color: '#FF6B35',
      popular: true,
      features: [
        'All Basic features',
        'Group fitness classes',
        'Personal trainer (2x/month)',
        'Nutrition consultation',
        'Sauna & steam room',
        'Guest passes (2/month)',
      ],
    },
    {
      id: '3',
      name: 'Elite',
      price: 99,
      duration: 'month',
      color: '#9C27B0',
      features: [
        'All Premium features',
        'Unlimited personal training',
        'Meal planning',
        'Priority booking',
        'Massage therapy (1x/month)',
        'Unlimited guest passes',
      ],
    },
  ];

  const recentSubscriptions = [
    { id: '1', member: 'John Doe', plan: 'Premium', date: '2024-10-13', amount: 59 },
    { id: '2', member: 'Sarah Smith', plan: 'Basic', date: '2024-10-12', amount: 29 },
    { id: '3', member: 'Mike Johnson', plan: 'Elite', date: '2024-10-11', amount: 99 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Membership Plans</Text>
        <Text style={styles.headerSubtitle}>Choose the perfect plan for your members</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScroll}>
        {plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.popularCard]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={[styles.planHeader, { backgroundColor: plan.color }]}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.duration}>/{plan.duration}</Text>
              </View>
            </View>
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Icon name="checkmark-circle" size={20} color={plan.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.selectButton, { backgroundColor: plan.color }]}>
              <Text style={styles.selectButtonText}>Select Plan</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Subscriptions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentSubscriptions.map((sub) => (
          <View key={sub.id} style={styles.subscriptionItem}>
            <View style={styles.subscriptionIcon}>
              <Icon name="card" size={24} color="#4CAF50" />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionMember}>{sub.member}</Text>
              <Text style={styles.subscriptionPlan}>{sub.plan} Plan</Text>
              <Text style={styles.subscriptionDate}>{new Date(sub.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.subscriptionAmount}>${sub.amount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Subscription Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Icon name="people" size={30} color="#2196F3" />
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Basic Members</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="star" size={30} color="#FF6B35" />
            <Text style={styles.statNumber}>68</Text>
            <Text style={styles.statLabel}>Premium Members</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="trophy" size={30} color="#9C27B0" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Elite Members</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  plansScroll: {
    paddingVertical: 20,
    paddingLeft: 15,
  },
  planCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  popularBadge: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    alignItems: 'center',
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    padding: 25,
    alignItems: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 24,
    color: '#fff',
    marginTop: 5,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  duration: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
  },
  featuresContainer: {
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  subscriptionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  subscriptionMember: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subscriptionPlan: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  subscriptionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});