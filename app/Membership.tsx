import apiConnector from '@/app/utils/apiConnector';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MembershipPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  duration_days: number;
  status: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

const Membership = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
  });

  const durationOptions = [
    'Daily',
    'Weekly',
    'Monthly',
    'Quarterly',
    'Semi-Annual',
    'Yearly',
    'Lifetime',
  ];

  const durationMapping: { [key: number]: string } = {
    1: 'Daily',
    7: 'Weekly',
    30: 'Monthly',
    90: 'Quarterly',
    180: 'Semi-Annual',
    365: 'Yearly',
  };

  const getDurationLabel = (days: number): string => {
    return durationMapping[days] || 'Lifetime';
  };

  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const fetchMembershipPlans = async () => {
    try {
      console.log('Fetching membership plans...');
      const response = await apiConnector.request('Beat/MembershipPlans');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      const formattedPlans = data.map((plan: MembershipPlan) => ({
        ...plan,
        price: parseFloat(plan.price) || 0, // Ensure price is a valid number
        duration_days: typeof plan.duration_days === 'string' ? parseInt(plan.duration_days, 10) || 0 : plan.duration_days, // Ensure duration is a valid integer
      }));
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      Alert.alert('Error', 'Failed to fetch membership plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  // Handle add plan
  const handleAddPlan = async () => {
    if (!formData.name?.trim() || !formData.duration || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields: Name, Price, and Duration');
      return;
    }

    try {
      setLoading(true);
      const response = await apiConnector.request('Beat/MembershipPlan/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null, // Nullable field
          price: parseFloat(formData.price) || 0, // Ensure price is a number
          duration_days: parseInt(formData.duration, 10) || 0, // Ensure duration is an integer
        }),
      });

      if (response.ok) {
        const newPlan = await response.json();
        console.log('Server response:', newPlan); // Log the server response for debugging

        if (!newPlan || typeof newPlan !== 'object') {
          Alert.alert('Error', 'Unexpected response from server. Please try again later.');
          return;
        }

        // Ensure the new plan has a valid `id`
        const validPlan = {
          ...newPlan,
          id: newPlan.id || Date.now(), // Use a fallback `id` if missing
        };

        setPlans([...plans, validPlan]);
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Membership plan added successfully');

        // Re-fetch membership plans after adding a new plan
        await fetchMembershipPlans();
      } else if (response.status === 404) {
        Alert.alert('Error', 'Endpoint not found (404). Please check the URL.');
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData); // Log error details for debugging
        Alert.alert('Error', errorData.message || 'Failed to add membership plan');
      }
    } catch (error) {
      console.error('Error adding membership plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit plan
  const handleEditPlan = async () => {
    if (!formData.name.trim() || !formData.duration || !formData.price || !formData.description.trim() || !selectedPlan) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await apiConnector.request(`Beat/MembershipPlan/update/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null, // Nullable field
          price: parseFloat(formData.price),
          duration_days: parseInt(formData.duration, 10),
        }),
      });

      if (response.ok) {
        await fetchMembershipPlans(); // Refresh the membership plans
        setShowEditModal(false);
        setSelectedPlan(null);
        resetForm();
        Alert.alert('Success', 'Membership plan updated successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update membership plan');
      }
    } catch (error) {
      console.error('Error updating membership plan:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete plan
  const handleDeletePlan = async (plan: MembershipPlan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiConnector.request(`Beat/MembershipPlan/delete/${plan.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                await fetchMembershipPlans(); // Refresh the membership plans
                Alert.alert('Success', 'Membership plan deleted successfully');
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete membership plan');
              }
            } catch (error) {
              console.error('Error deleting membership plan:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open edit modal
  const openEditModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      duration: plan.duration_days.toString(), // Ensure duration is a string
      price: plan.price.toString(), // Ensure price is a string
      description: plan.description,
    });
    setShowEditModal(true);
  };  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      duration: '',
      price: '',
      description: '',
    });
  };

  // Render plan card
  const renderPlanCard = ({ item }: { item: MembershipPlan }) => (
    <View style={[styles.planCard, isTablet && styles.planCardTablet]}>
      <View style={styles.planHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planName, isTablet && { fontSize: 20 }]}>{item.name}</Text>
          <Text style={[styles.planDescription, isTablet && { fontSize: 14 }]}>
            {item.description}
          </Text>
          <Text style={[styles.planDuration, isTablet && { fontSize: 15 }]}>
            <Icon name="time-outline" size={isTablet ? 16 : 14} color="#666" /> {item.duration_days} days
          </Text>
        </View>
        <Text style={[styles.planPrice, isTablet && { fontSize: 26 }]}>
          ₱{parseFloat(item.price).toLocaleString()}
        </Text>
      </View>

      <View style={styles.planActions}>
        <TouchableOpacity
          style={[styles.editButton, isTablet && styles.editButtonTablet]}
          onPress={() => openEditModal(item)}
        >
          <Icon name="create-outline" size={isTablet ? 20 : 18} color="#4CAF50" />
          <Text style={[styles.editButtonText, isTablet && { fontSize: 15 }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isTablet && styles.deleteButtonTablet]}
          onPress={() => handleDeletePlan(item)}
        >
          <Icon name="trash-outline" size={isTablet ? 20 : 18} color="#FF3B30" />
          <Text style={[styles.deleteButtonText, isTablet && { fontSize: 15 }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render duration picker modal
  const renderDurationPicker = () => (
    <Modal
      visible={showDurationPicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDurationPicker(false)}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setShowDurationPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select Duration</Text>
          {Object.entries(durationMapping).map(([days, label]) => (
            <TouchableOpacity
              key={days}
              style={styles.pickerOption}
              onPress={() => {
                setFormData({ ...formData, duration: label });
                setShowDurationPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{label}</Text>
              {formData.duration === label && (
                <Icon name="checkmark" size={20} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.pickerOption}
            onPress={() => {
              setFormData({ ...formData, duration: 'Lifetime' });
              setShowDurationPicker(false);
            }}
          >
            <Text style={styles.pickerOptionText}>Lifetime</Text>
            {formData.duration === 'Lifetime' && (
              <Icon name="checkmark" size={20} color="#FF6B35" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render form modal
  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        isEdit ? setShowEditModal(false) : setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit' : 'Add'} Membership Plan</Text>
            <TouchableOpacity
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
                resetForm();
              }}
            >
              <Icon name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBodyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
          >
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Plan Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Premium Plan"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration (in days)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 30"
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Perfect for beginners and casual gym-goers"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Price (₱)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1500"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={isEdit ? handleEditPlan : handleAddPlan}
              >
                <Text style={styles.saveButtonText}>
                  {isEdit ? 'Update' : 'Add'} Plan
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.title, isTablet && { fontSize: 28 }]}>Membership Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Add Plan Button */}
      <TouchableOpacity
        style={[styles.addPlanButton, isTablet && styles.addPlanButtonTablet]}
        onPress={() => setShowAddModal(true)}
      >
        <Icon name="add-circle" size={isTablet ? 28 : 24} color="#FFF" />
        <Text style={[styles.addPlanButtonText, isTablet && { fontSize: 16 }]}>
          Add New Plan
        </Text>
      </TouchableOpacity>

      {/* Plans List */}
      <FlatList
        data={plans}
        renderItem={renderPlanCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="pricetag-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No membership plans yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add New Plan" to create one</Text>
          </View>
        }
      />

      {/* Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderDurationPicker()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addPlanButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addPlanButtonTablet: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addPlanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardTablet: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  planDescription: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
    lineHeight: 18,
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  editButtonTablet: {
    paddingVertical: 12,
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonTablet: {
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    height: '70%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentTablet: {
    width: '70%',
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalBodyScroll: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  durationInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  durationText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Duration Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});

export default Membership;
