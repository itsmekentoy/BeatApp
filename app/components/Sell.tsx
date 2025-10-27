import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiConnector from '../utils/apiConnector'; // Adjust the import based on your project structure

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
}

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  customerName?: string;
  date: string;
}

const CATEGORIES = ['Supplements', 'Accessories', 'Equipment', 'Apparel', 'Other'];

export default function Sell() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [products, setProducts] = useState<Product[]>([]);
  // Date filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  // Fetch sold products (transactions)
  const fetchSoldProducts = async () => {
    setLoadingMessage('Loading sold products...');
    setLoading(true);
    try {
      const response = await apiConnector.request('Beat/sold-products');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      } else {
        Alert.alert('Error', 'Failed to fetch sold products');
      }
    } catch (error) {
      console.error('Error fetching sold products:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [sellFormData, setSellFormData] = useState({
    customerName: '',
    customerEmail: '',
    quantity: 0,
  });

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilterCategory === 'All' || product.category === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedFilterCategory]);

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0 || quantity > product.quantity) {
      Alert.alert('Error', 'Invalid quantity');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });

    setTotalPrice(prevTotal => prevTotal + product.price * quantity);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'No products in the cart');
      return;
    }

    if (!sellFormData.customerEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const saleData = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        total_price: item.product.price * item.quantity,
      }));

      const response = await apiConnector.request('Beat/sell-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: sellFormData.customerName,
          customer_email: sellFormData.customerEmail,
          items: saleData,
        }),
      });

      if (response.ok) {
        // Update local state after successful sale
        const updatedProducts = products.map(product => {
          const cartItem = cart.find(item => item.product.id === product.id);
          if (cartItem) {
            return { ...product, quantity: product.quantity - cartItem.quantity };
          }
          return product;
        });

        setProducts(updatedProducts);
        setCart([]);
        setTotalPrice(0);
        setIsSellModalVisible(false);
        // Refresh sold products list so the newly completed sale appears
        await fetchSoldProducts();
        Alert.alert('Success', 'Sale completed successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to complete sale');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const openSellModal = (product: Product) => {
    setSelectedProduct(null);
    setIsSellModalVisible(true);
  };

  const renderSellModal = () => (
    <Modal
      visible={isSellModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsSellModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sell Products</Text>

          {/* Customer Name Input */}
          <TextInput
            style={styles.input}
            placeholder="Enter Customer Name"
            value={sellFormData.customerName}
            onChangeText={(text) => setSellFormData({ ...sellFormData, customerName: text })}
          />

          {/* Customer Email Input */}
          <TextInput
            style={styles.input}
            placeholder="Enter Customer Email"
            value={sellFormData.customerEmail}
            onChangeText={(text) => setSellFormData({ ...sellFormData, customerEmail: text })}
          />

          {/* Dropdown for Product Selection */}
          <Text style={styles.label}>Select Product</Text>
          <Picker
            style={styles.picker} // Applied the picker style with border
            selectedValue={selectedProduct?.id || ''}
            onValueChange={(itemValue: string) => {
              const product = products.find(p => p.id === itemValue);
              if (product) {
                const existingItem = cart.find(cartItem => cartItem.product.id === product.id);
                if (existingItem) {
                  Alert.alert('Error', 'Product already in cart');
                } else {
                  setCart([...cart, { product, quantity: 1 }]);
                }
              }
            }}
          >
            <Picker.Item label="Select a product" value="" />
            {products
              .filter(product => product.quantity > 0) // Exclude products with quantity 0
              .map(product => (
                <Picker.Item key={product.id} label={product.name} value={product.id} />
              ))}
          </Picker>

          {/* Cart Items */}
          <Text style={styles.label}>Cart</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Text style={styles.cartProductName}>{item.product.name}</Text>
                <TextInput
                  style={styles.cartQuantityInput}
                  keyboardType="numeric"
                  value={item.quantity.toString()}
                  onChangeText={(text) => {
                    const quantity = parseInt(text) || 0;
                    if (quantity > item.product.quantity) {
                      Alert.alert('Error', 'Insufficient stock');
                    } else {
                      setCart(prevCart =>
                        prevCart.map(cartItem =>
                          cartItem.product.id === item.product.id
                            ? { ...cartItem, quantity }
                            : cartItem
                        )
                      );
                    }
                  }}
                />
                <Text style={styles.cartSubtotal}>
                  Subtotal: ₱{(item.product.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            )}
          />

          {/* Grand Total */}
          <Text style={styles.grandTotal}>Grand Total: ₱{cart.reduce((total, item) => total + item.product.price * item.quantity, 0).toLocaleString()}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteSale}
            >
              <Text style={styles.completeButtonText}>Complete Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const fetchProducts = async () => {
    try {
      const response = await apiConnector.request('Beat/products');
      if (response.ok) {
        const data = await response.json();
        const formattedProducts = data.map((product: any) => ({
          id: product.id.toString(),
          name: product.product_name,
          category: product.category,
          description: product.description,
          price: parseFloat(product.price),
          quantity: product.stock_quantity,
        }));
        setProducts(formattedProducts);
      } else {
        Alert.alert('Error', 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  React.useEffect(() => {
    fetchProducts();
    fetchSoldProducts();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Sold Products</Text>
          <TouchableOpacity
            style={styles.sellProductButton}
            onPress={() => openSellModal(products[0])}
          >
            <Icon name="add-circle" size={24} color="#fff" />
            <Text style={styles.sellProductButtonText}>Sell Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Filter UI */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ flex: 1 }}>
          <Text style={styles.label}>Start Date</Text>
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text>{startDate ? startDate.toLocaleDateString() : 'Select start date'}</Text>
            <Icon name="calendar-outline" size={20} color="#666" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ flex: 1 }}>
          <Text style={styles.label}>End Date</Text>
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text>{endDate ? endDate.toLocaleDateString() : 'Select end date'}</Text>
            <Icon name="calendar-outline" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No Sold Products Yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.transactionBox}
              onPress={() => {
                setSelectedTransaction(item);
                setIsTransactionModalVisible(true);
              }}
            >
              <Text style={styles.transactionName}>{item.customer_name}</Text>
              <Text style={styles.transactionTotal}>₱ {parseFloat(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.transactionDate}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        />
      )}

      {/* Transaction Modal */}
      <Modal
        visible={isTransactionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTransactionModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sold Items</Text>
            {selectedTransaction && (
              <>
                <Text style={styles.transactionNameModal}>{selectedTransaction.customer_name}</Text>
                <Text style={styles.transactionTotalModal}>₱ {parseFloat(selectedTransaction.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.transactionDateModal}>{new Date(selectedTransaction.created_at).toLocaleString()}</Text>
                <FlatList
                  data={selectedTransaction.items}
                  keyExtractor={item => item.product_id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.soldItemBox}>
                      <Text style={{ fontWeight: 'bold' }}>{item.product_name}</Text>
                      <Text>Category: {item.category}</Text>
                      <Text>Quantity: {item.quantity}</Text>
                      <Text>Price: ₱{parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                      <Text>Subtotal: ₱{parseFloat(item.sub_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    </View>
                  )}
                  contentContainerStyle={{ gap: 8 }}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsTransactionModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sell Product Modal */}
      {renderSellModal()}

      {/* Fullscreen loader modal for sold products */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>{loadingMessage || 'Please wait...'}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  transactionName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FF6B35',
    marginBottom: 4,
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  transactionNameModal: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#FF6B35',
    marginBottom: 4,
    textAlign: 'center',
  },
  transactionTotalModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 2,
    textAlign: 'center',
  },
  transactionDateModal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  transactionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  soldItemBox: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sellProductButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sellProductButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryBox: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE8D6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productCardTablet: {
    marginRight: 12,
    minWidth: 300,
  },
  productHeader: {
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  productDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  lowStock: {
    color: '#e74c3c',
  },
  productDescription: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 12,
  },
  sellButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sellButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  productSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salesTableSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productListContainer: {
    gap: 0,
  },
  productSelectItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productSelectInfo: {
    flex: 1,
    marginRight: 12,
  },
  productSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productSelectCategory: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  productSelectPrice: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  salesHistorySection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  salesHistoryHeader: {
    marginBottom: 16,
  },
  salesHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  totalSalesAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27ae60',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  tableCellText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  customerNameText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saleInfo: {
    flex: 1,
  },
  saleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  saleCustomer: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saleDetails: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  salePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#27ae60',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27ae60',
  },
  quantityContainer: {
    marginBottom: 16,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 12,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalBox: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE8D6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalRowHighlight: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE8D6',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  totalLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  cartQuantityInput: {
    fontSize: 18, // Increased font size
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    width: 60, // Adjusted width for better visibility
    marginRight: 8,
  },
  cartSubtotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
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

