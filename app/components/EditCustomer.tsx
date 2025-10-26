import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import Icon from 'react-native-vector-icons/Ionicons';
import apiConnector from '../utils/apiConnector';
import connection from '../utils/connection';

const steps = [
  { icon: 'person' }, // Customer Information
  { icon: 'medical' }, // Medical Condition
  { icon: 'scan' }, // RFID Scan
  { icon: 'card' }, // Subscription
  { icon: 'checkmark-done' }, // Confirmation
];

interface FormData {
  // Step 1: Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dob: Date | null;
  age: string;
  address: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
  // Step 2: Medical
  medicalCondition: string;
  // Step 3: RFID
  rfidNumber: string;
  // Step 4: Subscription
  membershipType: string;
  dateOfRegistration: Date;
  startMembershipDate: Date | null;
}

const EditCustomer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const router = useRouter();
  const params = useLocalSearchParams();

  // Loading state for fetching customer to edit
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(true);

  // Form state - initialize with empty/default values (avoid showing placeholder mock data)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dob: null,
    age: '',
    address: '',
    email: '',
    phoneNumber: '',
    profileImage: null,
    medicalCondition: '',
    rfidNumber: '',
    membershipType: '',
    dateOfRegistration: new Date(),
    startMembershipDate: null,
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showRegistrationPicker, setShowRegistrationPicker] = useState(false);
  const [showMembershipDropdown, setShowMembershipDropdown] = useState(false);
  const [showStartMembershipPicker, setShowStartMembershipPicker] = useState(false);
  const [hardwareLoading, setHardwareLoading] = useState(false);

  interface MembershipPlan {
    id: number;
    name: string;
    description?: string;
    price?: string;
    duration_days?: number;
    status?: number;
    created_at?: string;
    updated_at?: string;
  }

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(false);

  // Responsive styles
  const circleSize = isTablet ? 48 : 32;
  const stepFontSize = isTablet ? 18 : 14;
  const labelFontSize = isTablet ? 18 : 14;
  const lineWidth = isTablet ? 48 : 24;
  const stepperMargin = isTablet ? 48 : 32;

  // Initialize NFC Manager on component mount
  useEffect(() => {
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (supported) {
          await NfcManager.start();
        }
      } catch (ex) {
        console.warn('NFC initialization failed:', ex);
      }
    };

    initNfc();

    // Cleanup NFC on unmount
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => { });
    };
  }, []);

  // Load customer data on mount (in production, fetch from API)
  useEffect(() => {
    const loadCustomer = async () => {
      setLoadingCustomer(true);
      try {
        const id = (params as any).customerId;
        if (!id) {
          setLoadingCustomer(false);
          return;
        }
        const resp = await apiConnector.request(`Beat/customer/${id}`);
        const json = await resp.json();
        const obj = json && json.data ? json.data : json;

        // Map API response to local FormData shape with safe fallbacks
        const dobValue = obj?.birthdate || obj?.dob || null;
        const dobDate = dobValue ? new Date(dobValue) : null;

        // Build profile image URL robustly using available base URLs
        const profilePath = obj?.profile_picture;
        const serverBase = (apiConnector.getBaseUrl() || connection.BASE_URL || '').replace(/\/api.*$/i, '');

        const mapped: FormData = {
          firstName: obj?.firstname || obj?.first_name || '',
          middleName: obj?.middlename || obj?.middle_name || '',
          lastName: obj?.lastname || obj?.last_name || '',
          // API: 0 => Female, 1 => Male (per sample)
          gender: typeof obj?.gender !== 'undefined'
            ? (Number(obj.gender) === 0 ? 'Female' : 'Male')
            : (obj?.gender === 'Male' || obj?.gender === 'Female' ? obj.gender : ''),
          dob: dobDate,
          age: obj?.age ? String(obj.age) : (dobDate ? calculateAge(dobDate) : ''),
          address: obj?.address || '',
          email: obj?.email || '',
          phoneNumber: obj?.phone || obj?.phone_number || '',
          profileImage: profilePath
            ? (
              typeof profilePath === 'string' && profilePath.startsWith('http')
                ? profilePath
                : (profilePath.startsWith('/') ? `${serverBase}${profilePath}` : `${serverBase}/storage/${profilePath}`)
            )
            : null,
          medicalCondition: obj?.medical_condition || obj?.medical_history || '',
          // RFID number is provided in `keypab` per sample response
          rfidNumber: obj?.keypab || obj?.rfid_number || obj?.rfid || obj?.card_number || '',
          membershipType: obj?.membership_type?.id ? String(obj.membership_type.id) : (obj?.membership_type?.name || (obj?.membership_id ? String(obj.membership_id) : '')),
          dateOfRegistration: obj?.created_at ? new Date(obj.created_at) : (obj?.date_of_registration ? new Date(obj.date_of_registration) : new Date()),
          startMembershipDate: obj?.membership_start ? new Date(obj.membership_start) : (obj?.start_membership_date ? new Date(obj.start_membership_date) : null),
        };
        console.log(`http://localhost${obj.profile_picture}`);
        setFormData(prev => ({ ...prev, ...mapped }));
      } catch (err) {
        console.error('Failed to load customer for editing:', err);
        Alert.alert('Error', 'Failed to load customer details for editing.');
      } finally {
        setLoadingCustomer(false);
      }
    };

    loadCustomer();
  }, [params.customerId]);

  // Load membership plans (used to display membership type names)
  useEffect(() => {
    const loadPlans = async () => {
      setMembershipLoading(true);
      try {
        const resp = await apiConnector.request('Beat/MembershipPlans');
        const json = await resp.json();

        if (Array.isArray(json)) {
          setMembershipPlans(json as MembershipPlan[]);
        } else if (json && Array.isArray(json.data)) {
          setMembershipPlans(json.data as MembershipPlan[]);
        } else if (json && json.status === 'success' && Array.isArray(json.data)) {
          setMembershipPlans(json.data as MembershipPlan[]);
        } else {
          console.warn('Unexpected MembershipPlans response:', json);
        }
      } catch (err) {
        console.error('Failed to fetch membership plans:', err);
      } finally {
        setMembershipLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Calculate age from DOB
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Handle DOB change
  const handleDobChange = (event: any, selectedDate?: Date) => {
    setShowDobPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dob: selectedDate,
        age: calculateAge(selectedDate),
      }));
    }
  };

  // Handle Registration Date change
  const handleRegistrationDateChange = (event: any, selectedDate?: Date) => {
    setShowRegistrationPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dateOfRegistration: selectedDate }));
    }
  };

  // Handle Start Membership Date change
  const handleStartMembershipDateChange = (event: any, selectedDate?: Date) => {
    setShowStartMembershipPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, startMembershipDate: selectedDate }));
    }
  };

  // (expiration date removed per request)

  // Handle image picker - Show options
  const pickImage = async () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose an option to add your profile photo',
      [
        {
          text: 'Take Photo (Front Camera)',
          onPress: () => takePhoto('front'),
        },
        {
          text: 'Take Photo (Back Camera)',
          onPress: () => takePhoto('back'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => chooseFromGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Take photo with camera
  const takePhoto = async (cameraType: 'front' | 'back') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: cameraType === 'front'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  // Choose from gallery
  const chooseFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate Step 1
  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Validation Error', 'Gender is required');
      return false;
    }
    if (!formData.dob) {
      Alert.alert('Validation Error', 'Date of birth is required');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }
    return true;
  };

  // Validate Step 3
  // Validate Step 2
  const validateStep2 = () => {
    if (!formData.rfidNumber.trim()) {
      Alert.alert('Validation Error', 'RFID number is required');
      return false;
    }
    return true;
  };

  // Validate Step 4
  const validateStep4 = () => {
    if (!formData.membershipType) {
      Alert.alert('Validation Error', 'Membership type is required');
      return false;
    }
    return true;
  };

  // Handle next button
  const handleNext = () => {
    if (currentStep === 0 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep === 3 && !validateStep4()) {
      return;
    }
    setCurrentStep(s => Math.min(steps.length - 1, s + 1));
  };

  // Handle NFC Reading with Phone
  // Handle Hardware Scanner
  const handleHardwareScan = async () => {
    setHardwareLoading(true);
    try {
      // Use the project's api connector to call the Beat/getID endpoint
      const resp = await apiConnector.request('Beat/getID');
      const json = await resp.json();

      if (json && (json.status === 'success' || json.success) && json.data && (json.data.card_number || json.data.card)) {
        const card = String(json.data.card_number || json.data.card);
        updateField('rfidNumber', card);
      } else if (json && json.data && json.data.card_number) {
        const card = String(json.data.card_number);
        updateField('rfidNumber', card);
      } else {
        console.warn('Unexpected scanner response:', json);
        Alert.alert('Scanner Error', 'Invalid response from scanner');
      }
    } catch (error: any) {
      console.error('Hardware scanner request failed:', error);
      Alert.alert('Scanner Error', error?.message || String(error));
    } finally {
      setHardwareLoading(false);
    }
  };

  // Handle update
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const id = (params as any).customerId;
      if (!id) {
        Alert.alert('Error', 'Customer ID is missing');
        return;
      }

      const fd = new FormData();

      // Map fields to backend expected names (similar to AddCustomer)
      fd.append('first_name', formData.firstName);
      fd.append('middle_name', formData.middleName);
      fd.append('last_name', formData.lastName);
      // Send gender as 0/1 - backend expects numeric; we map Female -> 0, Male -> 1
      const genderValue = formData.gender === 'Female' ? '0' : (formData.gender === 'Male' ? '1' : '');
      fd.append('gender', genderValue);
      fd.append('dob', formData.dob ? formData.dob.toISOString().slice(0, 10) : '');
      fd.append('age', formData.age);
      fd.append('address', formData.address);
      fd.append('email', formData.email);
      fd.append('phone_number', formData.phoneNumber);
      fd.append('medical_condition', formData.medicalCondition);
      // rfid/keypab
      fd.append('rfid_number', formData.rfidNumber || '');
      // membership type id
      fd.append('membership_type', formData.membershipType);
      fd.append('date_of_registration', formData.dateOfRegistration ? formData.dateOfRegistration.toISOString() : new Date().toISOString());
      fd.append('start_membership_date', formData.startMembershipDate ? formData.startMembershipDate.toISOString().slice(0, 10) : '');

      // Do NOT append/allow updating profile image from Edit screen (image is fixed)

      const resp = await apiConnector.request(`Beat/customer/update/${id}`, {
        method: 'POST',
        body: fd,
      });

      const json = await resp.json();
      if (json && (json.status === 'success' || json.success)) {
        Alert.alert('Success', 'Customer information updated successfully!', [
          { text: 'OK', onPress: () => router.replace({ pathname: '/ViewCustomer', params: { id } }) }
        ]);
      } else {
        console.warn('Update customer response:', json);
        Alert.alert('Error', json.message || 'Failed to update customer');
      }
    } catch (error: any) {
      console.error('Update customer failed:', error);
      Alert.alert('Error', error?.message || String(error));
    } finally {
      setSaving(false);
    }
  };

  // Render Step 1: Personal Information
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, isTablet && { fontSize: 22 }]}>Personal Information</Text>

      {/* Profile Image (fixed, not editable in Edit screen) */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {formData.profileImage ? (
            <Image source={{ uri: formData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Icon name="person" size={isTablet ? 48 : 40} color="#ccc" />
            </View>
          )}
        </View>
        <Text style={[styles.profileNote, isTablet && { fontSize: 14 }]}>Profile photo cannot be changed here</Text>
      </View>

      {/* Name Fields */}
      <View style={[styles.formRow, isTablet && styles.formRowTablet]}>
        <View style={[styles.formGroup, isTablet && styles.formGroupTablet]}>
          <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
            First Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, isTablet && styles.inputTablet]}
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            placeholder="Enter first name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={[styles.formGroup, isTablet && styles.formGroupTablet]}>
          <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Middle Name</Text>
          <TextInput
            style={[styles.input, isTablet && styles.inputTablet]}
            value={formData.middleName}
            onChangeText={(text) => updateField('middleName', text)}
            placeholder="Enter middle name"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
          Last Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, isTablet && styles.inputTablet]}
          value={formData.lastName}
          onChangeText={(text) => updateField('lastName', text)}
          placeholder="Enter last name"
          placeholderTextColor="#999"
        />
      </View>

      {/* Gender and DOB */}
      <View style={[styles.formRow, isTablet && styles.formRowTablet]}>
        <View style={[styles.formGroup, isTablet && styles.formGroupTablet]}>
          <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
            Gender <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'Male' && styles.genderButtonActive,
                isTablet && styles.genderButtonTablet
              ]}
              onPress={() => updateField('gender', 'Male')}
            >
              <Text style={[
                styles.genderButtonText,
                formData.gender === 'Male' && styles.genderButtonTextActive,
                isTablet && { fontSize: 16 }
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'Female' && styles.genderButtonActive,
                isTablet && styles.genderButtonTablet
              ]}
              onPress={() => updateField('gender', 'Female')}
            >
              <Text style={[
                styles.genderButtonText,
                formData.gender === 'Female' && styles.genderButtonTextActive,
                isTablet && { fontSize: 16 }
              ]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, isTablet && styles.formGroupTablet]}>
          <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
            Date of Birth <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, isTablet && styles.inputTablet]}
            onPress={() => setShowDobPicker(true)}
          >
            <Text style={[styles.dateButtonText, isTablet && { fontSize: 16 }]}>
              {formData.dob ? formData.dob.toLocaleDateString() : 'Select date'}
            </Text>
            <Icon name="calendar-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={formData.dob || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDobChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>

      {/* Age (Auto-computed) */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Age</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled, isTablet && styles.inputTablet]}
          value={formData.age}
          editable={false}
          placeholder="Auto-computed from DOB"
          placeholderTextColor="#999"
        />
      </View>

      {/* Address Section */}
      <Text style={[styles.sectionTitle, isTablet && { fontSize: 20 }]}>
        Address <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Address</Text>
        <TextInput
          style={[styles.input, isTablet && styles.inputTablet]}
          value={formData.address}
          onChangeText={(text) => updateField('address', text)}
          placeholder="Enter your complete address"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Contact Details */}
      <Text style={[styles.sectionTitle, isTablet && { fontSize: 20 }]}>Contact Details</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Email</Text>
        <TextInput
          style={[styles.input, isTablet && styles.inputTablet]}
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          placeholder="Enter email address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, isTablet && styles.inputTablet]}
          value={formData.phoneNumber}
          onChangeText={(text) => updateField('phoneNumber', text)}
          placeholder="Enter phone number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  // Render Step 2: RFID Scan
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, isTablet && { fontSize: 22 }]}>RFID Scan</Text>

      {/* RFID ID Number Input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
          RFID ID Number <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.rfidInputContainer}>
          <Icon name="card-outline" size={20} color="#FF6B35" style={styles.rfidInputIcon} />
          <TextInput
            style={[styles.rfidInput, isTablet && styles.inputTablet]}
            value={formData.rfidNumber}
            onChangeText={(text) => updateField('rfidNumber', text)}
            placeholder="Scan NFC tag or enter RFID number"
            placeholderTextColor="#999"
            keyboardType="default"
            autoCapitalize="characters"
          />
        </View>
        <Text style={[styles.helperText, isTablet && { fontSize: 14 }]}>
          Connect a hardware scanner to read RFID tags
        </Text>
      </View>

      {/* Hardware Scanner Button */}
      <TouchableOpacity
        style={[styles.rfidButton, styles.hardwareButton, isTablet && styles.rfidButtonTablet]}
        onPress={handleHardwareScan}
        disabled={hardwareLoading}
      >
        {hardwareLoading ? (
          <ActivityIndicator size={isTablet ? 'large' : 'small'} color="#FFF" />
        ) : (
          <>
            <Icon name="hardware-chip-outline" size={isTablet ? 26 : 22} color="#FFF" />
            <Text style={[styles.rfidButtonText, isTablet && { fontSize: 16 }]}>Use Hardware Scanner</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render Step 3: Medical Condition
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, isTablet && { fontSize: 22 }]}>Medical Information</Text>

      {/* Medical Condition */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Last Medical Condition</Text>
        <Text style={[styles.helperText, isTablet && { fontSize: 14 }]}>
          Please provide any relevant medical conditions, allergies, or health notes
        </Text>
        <TextInput
          style={[styles.textArea, isTablet && styles.textAreaTablet]}
          value={formData.medicalCondition}
          onChangeText={(text) => updateField('medicalCondition', text)}
          placeholder="Enter any medical conditions, allergies, medications, or health notes..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Render Step 4: Membership Details
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, isTablet && { fontSize: 22 }]}>Subscription</Text>

      {/* Membership Type Dropdown */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>
          Membership Type <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.dropdownSelector, isTablet && styles.inputTablet]}
          onPress={() => setShowMembershipDropdown(true)}
        >
          <Text style={[
            styles.dropdownSelectorText,
            !formData.membershipType && styles.dropdownPlaceholder,
            isTablet && { fontSize: 16 }
          ]}>
            {membershipLoading
              ? 'Loading...'
              : (membershipPlans.find(p => String(p.id) === formData.membershipType)?.name || 'Select membership type')}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Date of Registration */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Date of Registration</Text>
        <TouchableOpacity
          style={[styles.dateButton, isTablet && styles.inputTablet]}
          onPress={() => setShowRegistrationPicker(true)}
        >
          <Text style={[styles.dateButtonText, isTablet && { fontSize: 16 }]}>
            {formData.dateOfRegistration.toLocaleDateString()}
          </Text>
          <Icon name="calendar-outline" size={20} color="#FF6B35" />
        </TouchableOpacity>
        {showRegistrationPicker && (
          <DateTimePicker
            value={formData.dateOfRegistration}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleRegistrationDateChange}
          />
        )}
      </View>

      {/* Start Membership Date */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isTablet && { fontSize: 16 }]}>Start Membership Date</Text>
        <TouchableOpacity
          style={[styles.dateButton, isTablet && styles.inputTablet]}
          onPress={() => setShowStartMembershipPicker(true)}
        >
          <Text style={[styles.dateButtonText, isTablet && { fontSize: 16 }]}>
            {formData.startMembershipDate
              ? formData.startMembershipDate.toLocaleDateString()
              : 'Select start date'}
          </Text>
          <Icon name="calendar-outline" size={20} color="#FF6B35" />
        </TouchableOpacity>
        {showStartMembershipPicker && (
          <DateTimePicker
            value={formData.startMembershipDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartMembershipDateChange}
          />
        )}
      </View>

      {/* Expiration date removed per requirement */}

      {/* Membership Type Dropdown Modal */}
      <Modal
        visible={showMembershipDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMembershipDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMembershipDropdown(false)}
        >
          <View style={[styles.dropdownModal, isTablet && styles.dropdownModalTablet]}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownHeaderText, isTablet && { fontSize: 18 }]}>
                Select Membership Type
              </Text>
              <TouchableOpacity onPress={() => setShowMembershipDropdown(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {membershipPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.dropdownItem,
                    formData.membershipType === String(plan.id) && styles.dropdownItemActive,
                    isTablet && styles.dropdownItemTablet
                  ]}
                  onPress={() => {
                    updateField('membershipType', String(plan.id));
                    setShowMembershipDropdown(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.dropdownItemText,
                      formData.membershipType === String(plan.id) && styles.dropdownItemTextActive,
                      isTablet && { fontSize: 16 }
                    ]}>
                      {plan.name}
                    </Text>
                    {plan.price && (
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{plan.price}</Text>
                    )}
                  </View>
                  {formData.membershipType === String(plan.id) && (
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

  // Render Step 4: Confirmation
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, isTablet && { fontSize: 22 }]}>Confirm Changes</Text>

      <ScrollView style={styles.confirmationContent}>
        {/* Profile Image */}
        {formData.profileImage && (
          <View style={styles.confirmationSection}>
            <Image source={{ uri: formData.profileImage }} style={styles.confirmationImage} />
          </View>
        )}

        {/* Personal Information */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>
            Personal Information
          </Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Full Name:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.firstName} {formData.middleName} {formData.lastName}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Gender:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.gender}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Date of Birth:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.dob?.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Age:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.age} years old
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>Address</Text>
          <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
            {formData.address}
          </Text>
        </View>

        {/* Contact Details */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>
            Contact Details
          </Text>
          {formData.email && (
            <View style={styles.confirmationRow}>
              <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Email:</Text>
              <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
                {formData.email}
              </Text>
            </View>
          )}
          {formData.phoneNumber && (
            <View style={styles.confirmationRow}>
              <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Phone:</Text>
              <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
                {formData.phoneNumber}
              </Text>
            </View>
          )}
        </View>

        {/* RFID Information */}
        {formData.rfidNumber && (
          <View style={styles.confirmationSection}>
            <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>
              RFID Information
            </Text>
            <View style={styles.confirmationRow}>
              <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>RFID ID:</Text>
              <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
                {formData.rfidNumber}
              </Text>
            </View>
          </View>
        )}

        {/* Medical Condition */}
        {formData.medicalCondition && (
          <View style={styles.confirmationSection}>
            <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>
              Medical Condition
            </Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.medicalCondition}
            </Text>
          </View>
        )}

        {/* Membership Details */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSectionTitle, isTablet && { fontSize: 20 }]}>
            Membership Details
          </Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Type:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {membershipPlans.find(p => String(p.id) === formData.membershipType)?.name || formData.membershipType}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, isTablet && { fontSize: 16 }]}>Registration Date:</Text>
            <Text style={[styles.confirmationValue, isTablet && { fontSize: 16 }]}>
              {formData.dateOfRegistration.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isTablet && { fontSize: 28 }]}>Edit Customer</Text>
      {/* Loader while fetching customer data for editing */}
      <Modal visible={loadingCustomer} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Loading customer...</Text>
          </View>
        </View>
      </Modal>
      <View
        style={[
          styles.stepper,
          { marginBottom: stepperMargin },
          isTablet
            ? { width: 500, alignSelf: 'center' }
            : { width: '98%', alignSelf: 'center' }
        ]}
      >
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepContainer}>
            <View style={[
              styles.circle,
              { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
              currentStep === idx && styles.activeCircle
            ]}>
              <Icon
                name={step.icon}
                size={isTablet ? 28 : 20}
                color={currentStep === idx ? '#fff' : '#888'}
              />
            </View>
            {idx < steps.length - 1 && (
              <View style={[styles.line, { width: lineWidth }]} />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.formContent}
        contentContainerStyle={[
          styles.formContentContainer,
          isTablet && { maxWidth: 800, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep3()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep4()}
        {currentStep === 4 && renderStep5()}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isTablet && { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 10 }]}
          onPress={() => {
            if (currentStep === 0) {
              router.back();
            } else {
              setCurrentStep(s => Math.max(0, s - 1));
            }
          }}
        >
          <Text style={[styles.buttonText, isTablet && { fontSize: 18 }]}>
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {currentStep < steps.length - 1 ? (
          <TouchableOpacity
            style={[styles.button, isTablet && { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 10 }]}
            onPress={handleNext}
          >
            <Text style={[styles.buttonText, isTablet && { fontSize: 18 }]}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonSave, isTablet && { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 10 }]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, isTablet && { fontSize: 18 }]}>Update</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Use the same styles from AddCustomer
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 24,
    alignSelf: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: {
    backgroundColor: '#FF6B35',
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: '#eee',
  },
  formContent: {
    flex: 1,
  },
  formContentContainer: {
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  profileNote: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
    alignSelf: 'center',
  },
  formRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  },
  formRowTablet: {
    flexDirection: 'row',
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupTablet: {
    flex: 1,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputTablet: {
    paddingVertical: 14,
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
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
    minHeight: 120,
  },
  textAreaTablet: {
    minHeight: 150,
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonTablet: {
    paddingVertical: 14,
  },
  genderButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownSelectorText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  confirmationContent: {
    flex: 1,
  },
  confirmationSection: {
    marginBottom: 24,
  },
  confirmationSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12,
  },
  confirmationImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  confirmationRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 140,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#999',
  },
  buttonSave: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // RFID Scan Styles
  rfidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  rfidInputIcon: {
    marginRight: 8,
  },
  rfidInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  rfidButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  rfidButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  rfidButtonTablet: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 85,
  },
  nfcButton: {
    backgroundColor: '#4CAF50',
  },
  hardwareButton: {
    backgroundColor: '#2196F3',
  },
  rfidButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Loader overlay (used when fetching customer data)
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

export default EditCustomer;
