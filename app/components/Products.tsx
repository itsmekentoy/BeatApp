import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import apiConnector from '../utils/apiConnector';

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

export default function Products() {
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

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [isCategoryDropdownVisible, setIsCategoryDropdownVisible] = useState(false);
  const [isEditCategoryDropdownVisible, setIsEditCategoryDropdownVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [sales, setSales] = useState<Sale[]>([]);
  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    category: '',
    price: 0,
    quantity: 0,
    description: '',
  });
  const [sellFormData, setSellFormData] = useState({
    quantity: 0,
    customerName: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiConnector.request('Beat/products');
      if (response.ok) {
        const data = await response.json();
        const formattedProducts = data.map((product: any) => ({
          id: product.id.toString(),
          name: product.product_name,
          category: product.category,
          price: parseFloat(product.price),
          quantity: product.stock_quantity,
          description: product.description,
        }));
        setProducts(formattedProducts);
      } else {
        Alert.alert('Error', 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilterCategory === 'All' || product.category === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedFilterCategory]);

  const handleAddProduct = async () => {
    if (!formData.name.trim() || !formData.category.trim() || formData.price <= 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: formData.price,
      quantity: formData.quantity,
      description: formData.description,
    };

    const formDataToSend = new FormData();
    formDataToSend.append('id', newProduct.id);
    formDataToSend.append('product_name', newProduct.name);
    formDataToSend.append('category', newProduct.category);
    formDataToSend.append('price', newProduct.price.toString());
    formDataToSend.append('stock_quantity', newProduct.quantity.toString());
    formDataToSend.append('description', newProduct.description);

    try {
      setLoading(true);
      const response = await apiConnector.request('Beat/products/add', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        setProducts([...products, newProduct]);
        resetForm();
        setIsAddModalVisible(false);
        setIsCategoryDropdownVisible(false);
        Alert.alert('Success', 'Product added successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!formData.name.trim() || !formData.category.trim() || formData.price <= 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('product_name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('price', formData.price.toString());
    formDataToSend.append('stock_quantity', formData.quantity.toString());
    formDataToSend.append('description', formData.description);

    try {
      setLoading(true);
      const response = await apiConnector.request(`Beat/products/update/${formData.id}`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const updatedProducts = products.map(p =>
          p.id === formData.id
            ? {
                ...p,
                name: formData.name,
                category: formData.category,
                price: formData.price,
                quantity: formData.quantity,
                description: formData.description,
              }
            : p,
        );

        setProducts(updatedProducts);
        resetForm();
        setIsEditModalVisible(false);
        setIsEditCategoryDropdownVisible(false);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await apiConnector.request(`Beat/products/delete/${id}`, {
              method: 'DELETE',
            });

            if (response.ok) {
              setProducts(products.filter(p => p.id !== id));
              Alert.alert('Success', 'Product deleted successfully');
            } else {
              const errorData = await response.json();
              Alert.alert('Error', errorData.message || 'Failed to delete product');
            }
          } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert('Error', 'An unexpected error occurred');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setIsEditModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', category: '', price: 0, quantity: 0, description: '' });
    setIsCategoryDropdownVisible(false);
    setIsEditCategoryDropdownVisible(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalVisible(true);
  };

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
    setSelectedProduct(product);
    setSellFormData({ quantity: 0, customerName: '' });
    setIsSellModalVisible(true);
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, isTablet && styles.productCardTablet]}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditModal(item)}
          >
            <Icon name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <Icon name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>₱{item.price.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={[styles.detailValue, item.quantity < 10 && styles.lowStock]}>
            {item.quantity} units
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.productDescription}>{item.description}</Text>
      )}
    </View>
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
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', ...CATEGORIES].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                selectedFilterCategory === cat && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilterCategory === cat && styles.filterButtonTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>
            {products.length === 0 ? 'No products yet' : 'No products found'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {products.length === 0
              ? 'Add your first product to get started'
              : 'Try adjusting your search or filters'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Product Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter product name"
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setIsCategoryDropdownVisible(!isCategoryDropdownVisible)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.category && styles.dropdownPlaceholder]}>
                    {formData.category || 'Select category'}
                  </Text>
                  <Icon
                    name={isCategoryDropdownVisible ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
                {isCategoryDropdownVisible && (
                  <View style={styles.dropdown}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, category: cat });
                          setIsCategoryDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cat}</Text>
                        {formData.category === cat && (
                          <Icon name="checkmark" size={18} color="#FF6B35" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Price (₱) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.price.toString()}
                    onChangeText={text =>
                      setFormData({ ...formData, price: parseFloat(text) || 0 })
                    }
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.quantity.toString()}
                    onChangeText={text =>
                      setFormData({ ...formData, quantity: parseInt(text) || 0 })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter product description"
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={text => setFormData({ ...formData, description: text })}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
                <Text style={styles.submitButtonText}>Add Product</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter product name"
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setIsEditCategoryDropdownVisible(!isEditCategoryDropdownVisible)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.category && styles.dropdownPlaceholder]}>
                    {formData.category || 'Select category'}
                  </Text>
                  <Icon
                    name={isEditCategoryDropdownVisible ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
                {isEditCategoryDropdownVisible && (
                  <View style={styles.dropdown}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, category: cat });
                          setIsEditCategoryDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cat}</Text>
                        {formData.category === cat && (
                          <Icon name="checkmark" size={18} color="#FF6B35" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Price (₱) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.price.toString()}
                    onChangeText={text =>
                      setFormData({ ...formData, price: parseFloat(text) || 0 })
                    }
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.quantity.toString()}
                    onChangeText={text =>
                      setFormData({ ...formData, quantity: parseInt(text) || 0 })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter product description"
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={text => setFormData({ ...formData, description: text })}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleEditProduct}>
                <Text style={styles.submitButtonText}>Update Product</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>Sell Product</Text>
              <TouchableOpacity onPress={() => setIsSellModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedProduct && (
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

                  <TouchableOpacity style={styles.submitButton} onPress={handleSellProduct}>
                    <Text style={styles.submitButtonText}>Complete Sale</Text>
                  </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  productCardTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
  },
  deleteBtn: {
    backgroundColor: '#E74C3C',
    padding: 8,
    borderRadius: 4,
  },
  productDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  lowStock: {
    color: '#E74C3C',
  },
  productDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
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
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: -6,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
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
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
