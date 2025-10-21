import apiConnector from '@/app/utils/apiConnector';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Permission {
  viewFinancialOverview: boolean;
  membershipPlan: boolean;
  customerAdd: boolean;
  customerUpdate: boolean;
  customerDelete: boolean;
  addTransaction: boolean;
  expenseAdd: boolean;
  expenseUpdate: boolean;
  expenseDelete: boolean;
  userManagement: boolean;
  emailConfiguration: boolean;
}

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  password: string;
  permissions: Permission;
}

const UserManagement = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Admin',
      role: 'Administrator',
      email: 'admin@gym.com',
      password: 'admin123',
      permissions: {
        viewFinancialOverview: true,
        membershipPlan: true,
        customerAdd: true,
        customerUpdate: true,
        customerDelete: true,
        addTransaction: true,
        expenseAdd: true,
        expenseUpdate: true,
        expenseDelete: true,
        userManagement: true,
        emailConfiguration: true,
      },
    },
    {
      id: '2',
      name: 'Jane Staff',
      role: 'Staff',
      email: 'staff@gym.com',
      password: 'staff123',
      permissions: {
        viewFinancialOverview: false,
        membershipPlan: false,
        customerAdd: true,
        customerUpdate: true,
        customerDelete: false,
        addTransaction: true,
        expenseAdd: false,
        expenseUpdate: false,
        expenseDelete: false,
        userManagement: false,
        emailConfiguration: false,
      },
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    password: '',
  });

  const [permissions, setPermissions] = useState<Permission>({
    viewFinancialOverview: false,
    membershipPlan: false,
    customerAdd: false,
    customerUpdate: false,
    customerDelete: false,
    addTransaction: false,
    expenseAdd: false,
    expenseUpdate: false,
    expenseDelete: false,
    userManagement: false,
    emailConfiguration: false,
  });

  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await apiConnector.request('Beat/users');
      if (response.ok) {
        const data = await response.json();
        const permissionMapping: { [key: string]: keyof Permission } = {
          "1": "viewFinancialOverview",
          "2": "membershipPlan",
          "3": "customerAdd",
          "4": "customerUpdate",
          "5": "customerDelete",
          "6": "addTransaction",
          "7": "expenseAdd",
          "8": "expenseUpdate",
          "9": "expenseDelete",
          "10": "userManagement",
          "11": "emailConfiguration",
        };
        const formattedUsers = data.map((user: any) => {
          // Build permissions object with all keys defaulting to false
          const permissions: Permission = {
            viewFinancialOverview: false,
            membershipPlan: false,
            customerAdd: false,
            customerUpdate: false,
            customerDelete: false,
            addTransaction: false,
            expenseAdd: false,
            expenseUpdate: false,
            expenseDelete: false,
            userManagement: false,
            emailConfiguration: false,
          };
          if (Array.isArray(user.permissions)) {
            user.permissions.forEach((perm: any) => {
              const key = permissionMapping[perm.permission];
              if (key) {
                permissions[key] = perm.is_granted === 1;
              }
            });
          }
          return {
            id: user.id.toString(),
            name: user.name,
            role: user.role,
            email: user.email,
            permissions,
          };
        });
        setUsers(formattedUsers);
      } else {
        Alert.alert('Error', 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const permissionsArray = Object.keys(permissions).map((key, index) => ({
      permission: (index + 1).toString(),
      is_granted: permissions[key as keyof Permission] ? 1 : 0,
    }));

    try {
      const response = await apiConnector.request('Beat/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          password: formData.password,
          permissions: permissionsArray,
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        await fetchUsers(); // Refetch the user list after successful addition
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'User added successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleEditUser = async () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.email.trim() || !selectedUser) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const permissionsArray = Object.keys(permissions).map((key, index) => ({
      permission: (index + 1).toString(),
      is_granted: permissions[key as keyof Permission] ? 1 : 0,
    }));

    const updatedUser: any = {
      name: formData.name,
      role: formData.role,
      email: formData.email,
      permissions: permissionsArray,
    };

    if (formData.password && formData.password.trim()) {
      updatedUser.password = formData.password;
    }

    try {
      const response = await apiConnector.request(`Beat/users/update/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        await fetchUsers(); // Refetch the user list after successful update
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        Alert.alert('Success', 'User updated successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      email: user.email,
      password: user.password,
    });

    // If permissions is already an object, use it directly
    if (typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      setPermissions({
        viewFinancialOverview: !!user.permissions.viewFinancialOverview,
        membershipPlan: !!user.permissions.membershipPlan,
        customerAdd: !!user.permissions.customerAdd,
        customerUpdate: !!user.permissions.customerUpdate,
        customerDelete: !!user.permissions.customerDelete,
        addTransaction: !!user.permissions.addTransaction,
        expenseAdd: !!user.permissions.expenseAdd,
        expenseUpdate: !!user.permissions.expenseUpdate,
        expenseDelete: !!user.permissions.expenseDelete,
        userManagement: !!user.permissions.userManagement,
        emailConfiguration: !!user.permissions.emailConfiguration,
      });
      setShowEditModal(true);
      return;
    }

    // If permissions is an array, map it to Permission object
    const permissionMapping: { [key: string]: keyof Permission } = {
      "1": "viewFinancialOverview",
      "2": "membershipPlan",
      "3": "customerAdd",
      "4": "customerUpdate",
      "5": "customerDelete",
      "6": "addTransaction",
      "7": "expenseAdd",
      "8": "expenseUpdate",
      "9": "expenseDelete",
      "10": "userManagement",
      "11": "emailConfiguration",
    };

    let mapped: Permission = {
      viewFinancialOverview: false,
      membershipPlan: false,
      customerAdd: false,
      customerUpdate: false,
      customerDelete: false,
      addTransaction: false,
      expenseAdd: false,
      expenseUpdate: false,
      expenseDelete: false,
      userManagement: false,
      emailConfiguration: false,
    };

    if (Array.isArray(user.permissions)) {
      user.permissions.forEach((perm: any) => {
        const key = permissionMapping[perm.permission];
        if (key) {
          mapped[key] = perm.is_granted === 1;
        }
      });
      setPermissions(mapped);
      setShowEditModal(true);
      return;
    }

    // Fallback: default to all false
    setPermissions(mapped);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiConnector.request(`Beat/users/delete/${user.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                setUsers(users.filter(u => u.id !== user.id));
                Alert.alert('Success', 'User deleted successfully');
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete user');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      password: '',
    });
    setShowPassword(false);
  };

  const togglePermission = (permissionKey: keyof Permission) => {
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [permissionKey]: !prevPermissions[permissionKey],
    }));
  };

  const PermissionCheckbox = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <TouchableOpacity style={styles.checkboxItem} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Icon name="checkmark" size={16} color="#FFF" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderUserCard = ({ item }: { item: User }) => {
    const permissionCount = Object.values(item.permissions).filter(Boolean).length;

    return (
      <TouchableOpacity 
        style={[styles.userCard, isTablet && styles.userCardTablet]}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Icon name="person" size={isTablet ? 32 : 28} color="#FF6B35" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isTablet && { fontSize: 20 }]}>{item.name}</Text>
            <Text style={[styles.userRole, isTablet && { fontSize: 15 }]}>{item.role}</Text>
            <Text style={[styles.userEmail, isTablet && { fontSize: 14 }]}>
              <Icon name="mail-outline" size={14} color="#666" /> {item.email}
            </Text>
          </View>
        </View>

        <View style={styles.permissionSummary}>
          <Icon name="shield-checkmark-outline" size={16} color="#4CAF50" />
          <Text style={styles.permissionText}>
            {permissionCount} permission{permissionCount !== 1 ? 's' : ''} granted
          </Text>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.editButton, isTablet && styles.editButtonTablet]}
            onPress={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          >
            <Icon name="create-outline" size={isTablet ? 20 : 18} color="#4CAF50" />
            <Text style={[styles.editButtonText, isTablet && { fontSize: 15 }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isTablet && styles.deleteButtonTablet]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteUser(item);
            }}
          >
            <Icon name="trash-outline" size={isTablet ? 20 : 18} color="#FF3B30" />
            <Text style={[styles.deleteButtonText, isTablet && { fontSize: 15 }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={[styles.title, isTablet && { fontSize: 28 }]}>User Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Add User Button */}
        <TouchableOpacity
          style={[styles.addUserButton, isTablet && styles.addUserButtonTablet]}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="person-add" size={isTablet ? 28 : 24} color="#FFF" />
          <Text style={[styles.addUserButtonText, isTablet && { fontSize: 16 }]}>
            Add User
          </Text>
        </TouchableOpacity>

        {/* Users List */}
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No users yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add User" to create one</Text>
            </View>
          }
        />
      </View>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add User</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Icon name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* User Details */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>User Details</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Role *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Administrator, Staff, Manager"
                    value={formData.role}
                    onChangeText={(text) => setFormData({ ...formData, role: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter password"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Permissions */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Permissions</Text>
                <Text style={styles.sectionSubtitle}>Select what this user can access</Text>

                <View style={styles.permissionsGrid}>
                  <PermissionCheckbox
                    label="1. View Financial Overview"
                    checked={permissions.viewFinancialOverview}
                    onToggle={() => togglePermission('viewFinancialOverview')}
                  />
                  <PermissionCheckbox
                    label="2. Membership Plan"
                    checked={permissions.membershipPlan}
                    onToggle={() => togglePermission('membershipPlan')}
                  />
                  <PermissionCheckbox
                    label="3. Customer Add"
                    checked={permissions.customerAdd}
                    onToggle={() => togglePermission('customerAdd')}
                  />
                  <PermissionCheckbox
                    label="4. Customer Update"
                    checked={permissions.customerUpdate}
                    onToggle={() => togglePermission('customerUpdate')}
                  />
                  <PermissionCheckbox
                    label="5. Customer Delete"
                    checked={permissions.customerDelete}
                    onToggle={() => togglePermission('customerDelete')}
                  />
                  <PermissionCheckbox
                    label="6. Add Transaction"
                    checked={permissions.addTransaction}
                    onToggle={() => togglePermission('addTransaction')}
                  />
                  <PermissionCheckbox
                    label="7. Expense Add"
                    checked={permissions.expenseAdd}
                    onToggle={() => togglePermission('expenseAdd')}
                  />
                  <PermissionCheckbox
                    label="8. Expense Update"
                    checked={permissions.expenseUpdate}
                    onToggle={() => togglePermission('expenseUpdate')}
                  />
                  <PermissionCheckbox
                    label="9. Expense Delete"
                    checked={permissions.expenseDelete}
                    onToggle={() => togglePermission('expenseDelete')}
                  />
                  <PermissionCheckbox
                    label="10. User Management"
                    checked={permissions.userManagement}
                    onToggle={() => togglePermission('userManagement')}
                  />
                  <PermissionCheckbox
                    label="11. Email Configuration"
                    checked={permissions.emailConfiguration}
                    onToggle={() => togglePermission('emailConfiguration')}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddUser}
              >
                <Text style={styles.saveButtonText}>Add User</Text>
              </TouchableOpacity>
            </ScrollView>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              <Icon name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* User Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>User Details</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Administrator, Staff, Manager"
                  value={formData.role}
                  onChangeText={(text) => setFormData({ ...formData, role: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter password"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Icon
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.passwordNote}>
                Leave password blank if no changes are needed
              </Text>
            </View>

            {/* Permissions */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Permissions</Text>
              <Text style={styles.sectionSubtitle}>Select what this user can access</Text>

              <View style={styles.permissionsGrid}>
                <PermissionCheckbox
                  label="1. View Financial Overview"
                  checked={permissions.viewFinancialOverview}
                  onToggle={() => togglePermission('viewFinancialOverview')}
                />
                <PermissionCheckbox
                  label="2. Membership Plan"
                  checked={permissions.membershipPlan}
                  onToggle={() => togglePermission('membershipPlan')}
                />
                <PermissionCheckbox
                  label="3. Customer Add"
                  checked={permissions.customerAdd}
                  onToggle={() => togglePermission('customerAdd')}
                />
                <PermissionCheckbox
                  label="4. Customer Update"
                  checked={permissions.customerUpdate}
                  onToggle={() => togglePermission('customerUpdate')}
                />
                <PermissionCheckbox
                  label="5. Customer Delete"
                  checked={permissions.customerDelete}
                  onToggle={() => togglePermission('customerDelete')}
                />
                <PermissionCheckbox
                  label="6. Add Transaction"
                  checked={permissions.addTransaction}
                  onToggle={() => togglePermission('addTransaction')}
                />
                <PermissionCheckbox
                  label="7. Expense Add"
                  checked={permissions.expenseAdd}
                  onToggle={() => togglePermission('expenseAdd')}
                />
                <PermissionCheckbox
                  label="8. Expense Update"
                  checked={permissions.expenseUpdate}
                  onToggle={() => togglePermission('expenseUpdate')}
                />
                <PermissionCheckbox
                  label="9. Expense Delete"
                  checked={permissions.expenseDelete}
                  onToggle={() => togglePermission('expenseDelete')}
                />
                <PermissionCheckbox
                  label="10. User Management"
                  checked={permissions.userManagement}
                  onToggle={() => togglePermission('userManagement')}
                />
                <PermissionCheckbox
                  label="11. Email Configuration"
                  checked={permissions.emailConfiguration}
                  onToggle={() => togglePermission('emailConfiguration')}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleEditUser}
            >
              <Text style={styles.saveButtonText}>Update User</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addUserButton: {
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
  addUserButtonTablet: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addUserButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
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
  userCardTablet: {
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  permissionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  permissionText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  userActions: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
  },
  eyeButton: {
    padding: 12,
  },
  permissionsGrid: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UserManagement;
