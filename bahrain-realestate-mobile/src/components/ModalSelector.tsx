import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rowDirection, textAlignStart } from '../utils/rtl';

interface Option {
  id: number | string;
  label: string;
}

interface ModalSelectorProps {
  label: string;
  options: Option[];
  selectedId: number | string | null;
  onSelect: (id: any) => void;
  placeholder?: string;
  disabled?: boolean;
  hasResetOption?: boolean; // New prop to control the reset option
}

export const ModalSelector: React.FC<ModalSelectorProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  placeholder = 'Select...',
  disabled = false,
  hasResetOption = false, // Default to false
}) => {
  const [visible, setVisible] = useState(false);
  
  const selectedOption = options.find(opt => opt.id === selectedId);
  
  const iconName = visible ? 'chevron-up' : 'chevron-down';
  const rowDir = rowDirection();
  const textAlign = textAlignStart();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.selector, { flexDirection: rowDir }, disabled && styles.disabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.value, { textAlign }, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name={iconName} size={20} color="#C6A55E" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { flexDirection: rowDir }]}>
              <Text style={[styles.modalTitle, { textAlign }]}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#00305D" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.id.toString()}
              ListHeaderComponent={
                hasResetOption ? (
                  <TouchableOpacity 
                    style={[styles.optionItem, { flexDirection: rowDir }]}
                    onPress={() => {
                      onSelect(null);
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.optionLabel, { textAlign, color: '#D1232A' }]}>
                      {placeholder}
                    </Text>
                    {selectedId === null && (
                      <Ionicons name="checkmark" size={20} color="#D1232A" />
                    )}
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.optionItem, { flexDirection: rowDir }]}
                  onPress={() => {
                    onSelect(item.id);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionLabel, { textAlign }, item.id === selectedId && styles.selectedLabel]}>
                    {item.label}
                  </Text>
                  {item.id === selectedId && (
                    <Ionicons name="checkmark" size={20} color="#00305D" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  value: {
    fontSize: 16,
    color: '#00305D',
  },
  placeholder: {
    color: '#C6A55E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#00305D',
  },
  selectedLabel: {
    color: '#00305D',
    fontWeight: 'bold',
  },
});
