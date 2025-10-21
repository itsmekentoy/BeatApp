import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import apiConnector from '../utils/apiConnector';

interface Expense {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
}

const Expenses = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();
  const { loginData } = useUser();
  const hasAddExpensePermission = loginData?.permissions?.some(
    (p) => p.permission === '7' && p.is_granted === 1
  );

  // Mock expense data
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', date: new Date('2025-10-15'), category: 'Utilities', description: 'Electricity Bill', amount: 3500 },
    { id: '2', date: new Date('2025-10-12'), category: 'Maintenance', description: 'Equipment Repair', amount: 2800 },
    { id: '3', date: new Date('2025-10-10'), category: 'Supplies', description: 'Cleaning Products', amount: 1200 },
    { id: '4', date: new Date('2025-10-08'), category: 'Utilities', description: 'Water Bill', amount: 1500 },
    { id: '5', date: new Date('2025-10-05'), category: 'Staff', description: 'Trainer Salary', amount: 15000 },
    { id: '6', date: new Date('2025-09-28'), category: 'Equipment', description: 'New Dumbbells', amount: 8500 },
    { id: '7', date: new Date('2025-09-20'), category: 'Utilities', description: 'Internet Bill', amount: 2000 },
    { id: '8', date: new Date('2025-09-15'), category: 'Supplies', description: 'Towels & Mats', amount: 3200 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track submission

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter expenses based on search and date range
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Date range filter
      const expenseDate = new Date(expense.date);
      const matchesDateRange = (!startDate || expenseDate >= startDate) &&
                              (!endDate || expenseDate <= endDate);

      return matchesSearch && matchesDateRange;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculate monthly total (current month)
  const calculateMonthlyTotal = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return filteredExpenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((total, exp) => total + exp.amount, 0);
  };

  // Calculate yearly total (current year)
  const calculateYearlyTotal = () => {
    const currentYear = new Date().getFullYear();
    return filteredExpenses
      .filter(exp => new Date(exp.date).getFullYear() === currentYear)
      .reduce((total, exp) => total + exp.amount, 0);
  };

  // Handle add expense
  const handleAddExpense = async () => {
    if (!newExpense.category.trim() || !newExpense.description.trim() || !newExpense.amount.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true); // Set submitting state to true

    const expense: Expense = {
      date: new Date(),
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      id: ''
    };

    const formData = new FormData();
    formData.append('expense_date', expense.date.toISOString());
    formData.append('expense_type', expense.category);
    formData.append('description', expense.description);
    formData.append('amount', expense.amount.toString());

    try {
      const response = await apiConnector.request('Beat/expenses/add', {
        method: 'POST',
        body: formData,
      });
      console.log('Add Expense Response:', response);

      if (response.ok) {
        const result = await response.json();
        expense.id = result.id; // Assuming the API returns the new expense ID
        setExpenses([expense, ...expenses]);
        setNewExpense({ category: '', description: '', amount: '' });
        setShowAddModal(false);
        Alert.alert('Success', 'Expense added successfully!');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      const response = await apiConnector.request('Beat/expenses');
      if (response.ok) {
        const data = await response.json();
        const formattedExpenses = data.map((expense: any) => ({
          id: expense.id.toString(),
          date: new Date(expense.expense_date),
          category: expense.expense_type,
          description: expense.description,
          amount: parseFloat(expense.amount),
        }));
        setExpenses(formattedExpenses);
      } else {
        Alert.alert('Error', 'Failed to fetch expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  React.useEffect(() => {
    fetchExpenses();
  }, []);

  // Render table header
  const renderTableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableCell, styles.headerText, isTablet && styles.headerTextTablet, isTablet ? styles.dateColumnTablet : styles.dateColumn]}>Date</Text>
      <Text style={[styles.tableCell, styles.headerText, isTablet && styles.headerTextTablet, isTablet ? styles.categoryColumnTablet : styles.categoryColumn]}>Category</Text>
      <Text style={[styles.tableCell, styles.headerText, isTablet && styles.headerTextTablet, isTablet ? styles.descriptionColumnTablet : styles.descriptionColumn]}>Description</Text>
      <Text style={[styles.tableCell, styles.headerText, isTablet && styles.headerTextTablet, isTablet ? styles.amountColumnTablet : styles.amountColumn]}>Amount</Text>
    </View>
  );

  // Render expense row
  const hasEditExpensePermission = loginData?.permissions?.some((p) => p.permission === '8' && p.is_granted === 1);
  const hasDeleteExpensePermission = loginData?.permissions?.some((p) => p.permission === '9' && p.is_granted === 1);
  const renderExpenseRow = ({ item }: { item: Expense }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, isTablet && { fontSize: 15 }, isTablet ? styles.dateColumnTablet : styles.dateColumn]}>
        {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>
      <Text style={[styles.tableCell, isTablet && { fontSize: 15 }, isTablet ? styles.categoryColumnTablet : styles.categoryColumn]}>{item.category}</Text>
      <Text style={[styles.tableCell, isTablet && { fontSize: 15 }, isTablet ? styles.descriptionColumnTablet : styles.descriptionColumn]}>{item.description}</Text>
      <Text style={[styles.tableCell, isTablet && { fontSize: 15 }, isTablet ? styles.amountColumnTablet : styles.amountColumn, styles.amountText]}>
        ₱{item.amount.toLocaleString()}
      </Text>
      {/* Action Buttons */}
      <View style={styles.actionCell}>
        {hasEditExpensePermission && (
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="create-outline" size={18} color="#3498db" />
          </TouchableOpacity>
        )}
        {hasDeleteExpensePermission && (
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="trash-outline" size={18} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isTablet && { fontSize: 28 }]}>Expenses</Text>
        {hasAddExpensePermission && (
          <TouchableOpacity
            style={[styles.addButton, isTablet ? { padding: 14, borderRadius: 12 } : { padding: 10, borderRadius: 8 }]}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add-circle" size={isTablet ? 28 : 22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category or description..."
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

        <View style={styles.dateFilterContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Icon name="calendar-outline" size={18} color="#FF6B35" />
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString() : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateToText}>to</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Icon name="calendar-outline" size={18} color="#FF6B35" />
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toLocaleDateString() : 'End Date'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setStartDate(null);
                setEndDate(null);
              }}
            >
              <Icon name="refresh" size={18} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      

      {/* Expenses Table */}
      <View style={styles.tableContainer}>
        <Text style={[styles.tableTitle, isTablet && { fontSize: 20 }]}>Expense Records</Text>
        {isTablet ? (
          <View style={[styles.tableWrapper, styles.tableWrapperTablet]}>
            {renderTableHeader()}
            <FlatList
              data={filteredExpenses}
              keyExtractor={(item) => item.id}
              renderItem={renderExpenseRow}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="receipt-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {searchQuery || startDate || endDate ? 'No expenses found' : 'No expenses recorded yet'}
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableWrapper}>
              {renderTableHeader()}
              <FlatList
                data={filteredExpenses}
                keyExtractor={(item) => item.id}
                renderItem={renderExpenseRow}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="receipt-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchQuery || startDate || endDate ? 'No expenses found' : 'No expenses recorded yet'}
                    </Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        )}
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isTablet && { fontSize: 22 }]}>Add New Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Category *</Text>
                <TextInput
                  style={[styles.input, isTablet && styles.inputTablet]}
                  value={newExpense.category}
                  onChangeText={(text) => setNewExpense({ ...newExpense, category: text })}
                  placeholder="e.g., Utilities, Maintenance, Staff"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Description *</Text>
                <TextInput
                  style={[styles.input, isTablet && styles.inputTablet]}
                  value={newExpense.description}
                  onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
                  placeholder="Brief description of the expense"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Amount *</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={[styles.amountInput, isTablet && styles.inputTablet]}
                    value={newExpense.amount}
                    onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Date of Expense */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Date of Expense *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, isTablet && styles.inputTablet]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: newExpense.date ? '#333' : '#999' }}>
                    {newExpense.date || 'Select a date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setNewExpense({ ...newExpense, date: selectedDate.toISOString().split('T')[0] });
                      }
                    }}
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddExpense}
                disabled={isSubmitting} // Disable button while submitting
              >
                <Text style={styles.saveButtonText}>{isSubmitting ? 'Adding...' : 'Add Expense'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  addButtonTablet: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  dateToText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FFE8E0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  totalsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  totalsContainerTablet: {
    gap: 16,
  },
  totalBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlyBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  yearlyBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  totalPeriod: {
    fontSize: 12,
    color: '#999',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableWrapper: {
    minWidth: 600,
  },
  tableWrapperTablet: {
    width: '100%',
    flex: 1,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tableCell: {
    fontSize: 13,
    color: '#333',
    paddingHorizontal: 12,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  headerTextTablet: {
    fontSize: 14,
  },
  dateColumn: {
    width: 120,
  },
  categoryColumn: {
    width: 140,
  },
  descriptionColumn: {
    width: 220,
  },
  amountColumn: {
    width: 120,
    textAlign: 'right',
  },
  /* Tablet responsive columns - use flex instead of fixed width */
  dateColumnTablet: {
    flex: 1,
  },
  categoryColumnTablet: {
    flex: 1.3,
  },
  descriptionColumnTablet: {
    flex: 2.5,
  },
  amountColumnTablet: {
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentTablet: {
    width: '70%',
    maxHeight: '70%',
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
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  inputTablet: {
    paddingVertical: 12,
    fontSize: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 14,
    color: '#333',
  },
  dateInput: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Expenses;
