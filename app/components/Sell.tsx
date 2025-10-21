import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Whey Protein',
      category: 'Supplements',
      price: 1500,
      quantity: 25,
      description: 'High-quality whey protein powder',
    },
    {
      id: '2',
      name: 'Pre-Workout',
      category: 'Supplements',
      price: 1200,
      quantity: 15,
      description: 'Energy boost before workout',
    },
    {
      id: '3',
      name: 'Water Bottle',
      category: 'Accessories',
      price: 500,
      quantity: 50,
      description: '1L water bottle',
    },
    {
      id: '4',
      name: 'Resistance Band',
      category: 'Equipment',
      price: 300,
      quantity: 30,
      description: 'Set of 3 resistance bands',
    },
  ]);

  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellFormData, setSellFormData] = useState({
    quantity: 0,
    customerName: '',
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

  const handleSellProduct = () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'No product selected');
      return;
    }

    if (sellFormData.quantity <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    if (sellFormData.quantity > selectedProduct.quantity) {
      Alert.alert('Error', 'Insufficient stock. Available: ' + selectedProduct.quantity);
      return;
    }

    const totalPrice = sellFormData.quantity * selectedProduct.price;
    const newSale: Sale = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: sellFormData.quantity,
      totalPrice: totalPrice,
      customerName: sellFormData.customerName.trim() || undefined,
      date: new Date().toLocaleDateString(),
    };

    // Update product quantity
    const updatedProducts = products.map(p =>
      p.id === selectedProduct.id
        ? { ...p, quantity: p.quantity - sellFormData.quantity }
        : p,
    );
    setProducts(updatedProducts);

    // Add to sales record
    setSales([...sales, newSale]);

    // Reset and close modal
    setSellFormData({ quantity: 0, customerName: '' });
    setIsSellModalVisible(false);
    Alert.alert('Success', `Sold ${sellFormData.quantity} unit(s) of ${selectedProduct.name}\nTotal: ₱${totalPrice.toLocaleString()}`);
  };

  const openSellModal = (product: Product) => {
    setSelectedProduct(null);
    setSellFormData({ quantity: 0, customerName: '' });
    setIsSellModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Sales Record</Text>
          <TouchableOpacity
            style={styles.sellProductButton}
            onPress={() => openSellModal(products[0])}
          >
            <Icon name="add-circle" size={24} color="#fff" />
            <Text style={styles.sellProductButtonText}>Sell Product</Text>
          </TouchableOpacity>
        </View>
        {sales.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Sales:</Text>
            <Text style={styles.summaryAmount}>
              ₱{sales.reduce((sum, sale) => sum + sale.totalPrice, 0).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Sales History Section */}
      {sales.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No Sales Yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Sell Product" to record your first sale</Text>
        </View>
      ) : (
        <View style={styles.salesTableSection}>
          {/* Sales Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Product</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
          </View>

          {/* Sales Table Rows */}
          <FlatList
            data={sales}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.tableCellText}>{item.productName}</Text>
                  {item.customerName && (
                    <Text style={styles.customerNameText}>Buyer: {item.customerName}</Text>
                  )}
                </View>
                <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center', fontSize: 12 }]}>
                  {item.date}
                </Text>
                <Text style={[styles.tableCellText, { flex: 0.8, textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCellText, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#27ae60' }]}>
                  ₱{item.totalPrice.toLocaleString()}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Sell Product Modal */}
      <Modal
        visible={isSellModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduct ? 'Sell Product' : 'Select Product'}
              </Text>
              <TouchableOpacity onPress={() => setIsSellModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {!selectedProduct ? (
                <>
                  {/* Product Selection */}
                  <View style={styles.productListContainer}>
                    {products.map(product => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productSelectItem}
                        onPress={() => setSelectedProduct(product)}
                      >
                        <View style={styles.productSelectInfo}>
                          <Text style={styles.productSelectName}>{product.name}</Text>
                          <Text style={styles.productSelectCategory}>{product.category}</Text>
                          <Text style={styles.productSelectPrice}>
                            Price: ₱{product.price.toLocaleString()} | Stock: {product.quantity}
                          </Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color="#FF6B35" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.productInfoBox}>
                    <Text style={styles.productInfoLabel}>Product:</Text>
                    <Text style={styles.productInfoValue}>{selectedProduct.name}</Text>

                    <Text style={styles.productInfoLabel}>Available Stock:</Text>
                    <Text style={[styles.productInfoValue, selectedProduct.quantity < 10 && styles.lowStockValue]}>
                      {selectedProduct.quantity} units
                    </Text>

                    <Text style={styles.productInfoLabel}>Price per Unit:</Text>
                    <Text style={styles.productInfoValue}>₱{selectedProduct.price.toLocaleString()}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quantity to Sell *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter quantity"
                      keyboardType="numeric"
                      value={sellFormData.quantity.toString()}
                      onChangeText={text =>
                        setSellFormData({ ...sellFormData, quantity: parseInt(text) || 0 })
                      }
                    />
                  </View>

                  {sellFormData.quantity > 0 && (
                    <View style={styles.totalBox}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Quantity:</Text>
                        <Text style={styles.totalValue}>{sellFormData.quantity} unit(s)</Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Unit Price:</Text>
                        <Text style={styles.totalValue}>₱{selectedProduct.price.toLocaleString()}</Text>
                      </View>
                      <View style={[styles.totalRow, styles.totalRowHighlight]}>
                        <Text style={styles.totalLabelBold}>Total Amount:</Text>
                        <Text style={styles.totalValueBold}>₱{(sellFormData.quantity * selectedProduct.price).toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Customer Name (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter customer name"
                      value={sellFormData.customerName}
                      onChangeText={text =>
                        setSellFormData({ ...sellFormData, customerName: text })
                      }
                    />
                  </View>

                  <View style={styles.modalButtonGroup}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        setSelectedProduct(null);
                        setSellFormData({ quantity: 0, customerName: '' });
                      }}
                    >
                      <Text style={styles.backButtonText}>Back to Products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSellProduct}>
                      <Text style={styles.submitButtonText}>Complete Sale</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalContentTablet: {
    maxHeight: '80%',
    marginHorizontal: 100,
    borderRadius: 20,
    marginBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalForm: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  productInfoBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  productInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  productInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lowStockValue: {
    color: '#e74c3c',
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
});
