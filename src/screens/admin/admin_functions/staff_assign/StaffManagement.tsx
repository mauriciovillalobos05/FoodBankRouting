import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';

const StaffManagement = ({ navigation }: any) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const staffList = [
    'Nombre/ID staff 1',
    'Nombre/ID staff 2', 
    'Nombre/ID staff 3',
    'Nombre/ID staff 4',
    'Nombre/ID staff 5',
  ];

  const toggleStaffSelection = (staff: string) => {
    setSelectedStaff(prev => 
      prev.includes(staff) 
        ? prev.filter(s => s !== staff)
        : [...prev, staff]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Administrar Staff</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Dropdown Section */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={styles.dropdownText}>Staff disponible para la ruta</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Staff List */}
          {isDropdownOpen && (
            <View style={styles.staffList}>
              {staffList.map((staff, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.staffItem,
                    selectedStaff.includes(staff) && styles.staffItemSelected
                  ]}
                  onPress={() => toggleStaffSelection(staff)}
                >
                  <Text style={[
                    styles.staffItemText,
                    selectedStaff.includes(staff) && styles.staffItemTextSelected
                  ]}>
                    {staff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 40,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#5C5C60',
    fontWeight: 'bold',
    flex: 0.8
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  dropdownContainer: {
    marginBottom: 40,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#5C5C60',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#5C5C60',
  },
  staffList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  staffItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  staffItemSelected: {
    backgroundColor: '#E8E3FF',
  },
  staffItemText: {
    fontSize: 16,
    color: '#5C5C60',
  },
  staffItemTextSelected: {
    color: '#5050FF',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffManagement;