import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface TransactionData {
  amount: string;
  paymentMethod: string;
  transactionDate: Date;
  newExpirationDate: Date | null;
  referenceNumber: string;
  notes: string;
}

const CreateTransaction: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [formData, setFormData] = useState<TransactionData>({
    amount: '',
    paymentMethod: '',
    transactionDate: new Date(),
    newExpirationDate: null,
    referenceNumber: '',
    notes: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);

  const paymentMethods = ['Cash', 'GCash', 'PayMaya', 'Bank Transfer', 'Credit Card', 'Debit Card'];

  // Update form field
  const updateField = (field: keyof TransactionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, transactionDate: selectedDate }));
    }
  };

  // Handle expiration date change
  const handleExpirationDateChange = (event: any, selectedDate?: Date) => {
    setShowExpirationPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, newExpirationDate: selectedDate }));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.amount.trim()) {
      Alert.alert('Validation Error', 'Amount is required');
      return false;
    }
    if (isNaN(parseFloat(formData.amount))) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (!formData.paymentMethod) {
      Alert.alert('Validation Error', 'Payment method is required');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // TODO: Implement save functionality (e.g., save to database)
    Alert.alert(
      'Success',
      `Payment of ₱${parseFloat(formData.amount).toLocaleString()} recorded successfully!`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isTablet && { paddingHorizontal: 32 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTablet && { fontSize: 22 }]}>New Transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info */}
        <View style={[styles.customerInfo, isTablet && styles.customerInfoTablet]}>
          <Icon name="person-circle-outline" size={isTablet ? 48 : 40} color="#FF6B35" />
          <View style={styles.customerInfoText}>
            <Text style={[styles.customerLabel, isTablet && { fontSize: 14 }]}>Customer</Text>
            <Text style={[styles.customerName, isTablet && { fontSize: 20 }]}>
              {params.customerName || 'Unknown Customer'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Amount */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
              Amount <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, isTablet && { fontSize: 18 }]}>₱</Text>
              <TextInput
                style={[styles.amountInput, isTablet && styles.inputTablet]}
                value={formData.amount}
                onChangeText={(text) => updateField('amount', text)}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
              Payment Method <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dropdownSelector, isTablet && styles.inputTablet]}
              onPress={() => setShowPaymentMethodDropdown(true)}
            >
              <Icon name="wallet-outline" size={20} color="#666" />
              <Text
                style={[
                  styles.dropdownSelectorText,
                  !formData.paymentMethod && styles.dropdownPlaceholder,
                  isTablet && { fontSize: 16 }
                ]}
              >
                {formData.paymentMethod || 'Select payment method'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Transaction Date */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Transaction Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, isTablet && styles.inputTablet]}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-outline" size={20} color="#666" />
              <Text style={[styles.dateButtonText, isTablet && { fontSize: 16 }]}>
                {formData.transactionDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.transactionDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* New Expiration Date */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
              New Expiration Date
            </Text>
            <Text style={[styles.helperText, isTablet && { fontSize: 13 }]}>
              (Optional - Update membership expiration date)
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, isTablet && styles.inputTablet]}
              onPress={() => setShowExpirationPicker(true)}
            >
              <Icon name="calendar" size={20} color="#FF6B35" />
              <Text style={[styles.dateButtonText, isTablet && { fontSize: 16 }]}>
                {formData.newExpirationDate 
                  ? formData.newExpirationDate.toLocaleDateString() 
                  : 'Select new expiration date'}
              </Text>
            </TouchableOpacity>
            {showExpirationPicker && (
              <DateTimePicker
                value={formData.newExpirationDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleExpirationDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Reference Number */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Reference Number</Text>
            <Text style={[styles.helperText, isTablet && { fontSize: 13 }]}>
              (Optional - for GCash, Bank Transfer, etc.)
            </Text>
            <View style={styles.inputWithIcon}>
              <Icon name="document-text-outline" size={20} color="#666" />
              <TextInput
                style={[styles.inputWithIconText, isTablet && styles.inputTablet]}
                value={formData.referenceNumber}
                onChangeText={(text) => updateField('referenceNumber', text)}
                placeholder="Enter reference/transaction number"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Notes</Text>
            <Text style={[styles.helperText, isTablet && { fontSize: 13 }]}>
              (Optional - Additional information)
            </Text>
            <TextInput
              style={[styles.textArea, isTablet && styles.textAreaTablet]}
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Enter any additional notes or remarks..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Summary Box */}
          <View style={[styles.summaryBox, isTablet && styles.summaryBoxTablet]}>
            <Text style={[styles.summaryTitle, isTablet && { fontSize: 16 }]}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isTablet && { fontSize: 15 }]}>Amount:</Text>
              <Text style={[styles.summaryValue, isTablet && { fontSize: 18 }]}>
                ₱{formData.amount ? parseFloat(formData.amount).toLocaleString() : '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isTablet && { fontSize: 15 }]}>Method:</Text>
              <Text style={[styles.summaryValue, isTablet && { fontSize: 15 }]}>
                {formData.paymentMethod || 'Not selected'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isTablet && { fontSize: 15 }]}>Date:</Text>
              <Text style={[styles.summaryValue, isTablet && { fontSize: 15 }]}>
                {formData.transactionDate.toLocaleDateString()}
              </Text>
            </View>
            {formData.newExpirationDate && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isTablet && { fontSize: 15 }]}>New Expiration:</Text>
                <Text style={[styles.summaryValue, isTablet && { fontSize: 15 }]}>
                  {formData.newExpirationDate.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isTablet && styles.buttonTablet]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, isTablet && { fontSize: 18 }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, isTablet && styles.buttonTablet]}
          onPress={handleSave}
        >
          <Icon name="checkmark-circle" size={20} color="#fff" />
          <Text style={[styles.buttonText, isTablet && { fontSize: 18 }]}>Save Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Method Dropdown Modal */}
      <Modal
        visible={showPaymentMethodDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentMethodDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentMethodDropdown(false)}
        >
          <View style={[styles.dropdownModal, isTablet && styles.dropdownModalTablet]}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownHeaderText, isTablet && { fontSize: 18 }]}>
                Select Payment Method
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodDropdown(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.dropdownItem,
                    formData.paymentMethod === method && styles.dropdownItemActive,
                    isTablet && styles.dropdownItemTablet
                  ]}
                  onPress={() => {
                    updateField('paymentMethod', method);
                    setShowPaymentMethodDropdown(false);
                  }}
                >
                  <Icon
                    name={
                      method === 'Cash' ? 'cash-outline' :
                      method === 'GCash' || method === 'PayMaya' ? 'phone-portrait-outline' :
                      method === 'Bank Transfer' ? 'business-outline' :
                      'card-outline'
                    }
                    size={22}
                    color={formData.paymentMethod === method ? '#FF6B35' : '#666'}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formData.paymentMethod === method && styles.dropdownItemTextActive,
                      isTablet && { fontSize: 16 }
                    ]}
                  >
                    {method}
                  </Text>
                  {formData.paymentMethod === method && (
                    <Icon name="checkmark" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerInfoTablet: {
    padding: 20,
  },
  customerInfoText: {
    marginLeft: 16,
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    marginBottom: 16,
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
  required: {
    color: '#FF6B35',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  inputTablet: {
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
  },
  textAreaTablet: {
    minHeight: 120,
    fontSize: 16,
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryBoxTablet: {
    padding: 24,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonTablet: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonPrimary: {
    backgroundColor: '#27ae60',
  },
  buttonSecondary: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  dropdownModalTablet: {
    maxWidth: 500,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownItemTablet: {
    paddingVertical: 18,
  },
  dropdownItemActive: {
    backgroundColor: '#FFF5F0',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default CreateTransaction;
