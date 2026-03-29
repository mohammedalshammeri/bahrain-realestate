import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/api/api';
import { Employee, EmployeeListResponse } from '../../../src/types/employee';
import { Button } from '../../../src/components/Button';
import { useToast } from '../../../src/context/ToastContext';
import { SkeletonLoader } from '../../../src/components/SkeletonLoader';
import { alignEnd, alignStart, rowDirection as getRowDirection, textAlignStart } from '../../../src/utils/rtl';

export default function EmployeesList() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await api.get<EmployeeListResponse>('/company/employees');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error(error);
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('employees.delete'),
      t('employees.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/company/employees/${id}`);
              fetchEmployees();
              showToast(t('employees.successDelete'), 'success');
            } catch (error) {
              showToast(t('common.error'), 'error');
            }
          },
        },
      ]
    );
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/company/employees/${id}/status`);
      fetchEmployees();
      showToast(t('employees.successStatus'), 'success');
    } catch (error) {
      showToast(t('common.error'), 'error');
    }
  };

  const startAlign = alignStart();
  const endAlign = alignEnd();
  const flexDirection = getRowDirection();
  const textAlign = textAlignStart();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return t('auth.roleOwner');
      case 'MANAGER': return t('auth.roleManager');
      case 'AGENT': return t('auth.roleAgent');
      default: return role;
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection }]}> 
        <View style={[styles.avatar, { backgroundColor: item.role === 'OWNER' ? '#C6A55E' : '#00305D' }]}> 
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={[styles.info, { alignItems: startAlign, marginStart: 12, marginEnd: 12 }]}> 
          <Text style={[styles.name, { textAlign }]}>{item.name}</Text>
          <Text style={[styles.email, { textAlign }]}>{item.email}</Text>
          {item.phone && <Text style={[styles.phone, { textAlign }]}>{item.phone}</Text>}
          <View style={styles.roleBadge}> 
             <Text style={styles.roleText}>
               {getRoleLabel(item.role)}
             </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.disabledBadge]}>
            <Text style={styles.statusText}>{item.isActive ? t('employees.active') : t('employees.disabled')}</Text>
          </View>
        </View>
      </View>

      {item.role !== 'OWNER' && (
        <View style={[styles.actions, { flexDirection }]}> 
          <TouchableOpacity 
            style={[styles.actionButton, item.isActive ? styles.disableButton : styles.enableButton]}
            onPress={() => handleStatusToggle(item.id, item.isActive)}
          >
            <Text style={styles.actionText}>
              {item.isActive ? t('employees.disable') : t('employees.enable')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionText}>{t('employees.delete')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <SkeletonLoader height={100} style={{ marginBottom: 10 }} />
        <SkeletonLoader height={100} style={{ marginBottom: 10 }} />
        <SkeletonLoader height={100} style={{ marginBottom: 10 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('employees.noEmployees')}</Text>
          </View>
        }
      />
      
      <View style={[styles.fabContainer, { alignItems: endAlign }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/company/employees/add')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.fabLabel}>{t('employees.add')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
  },
  email: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 4,
  },
  roleBadge: {
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#C6A55E',
  },
  statusContainer: {
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#00305D',
  },
  disabledBadge: {
    backgroundColor: '#C6A55E',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  disableButton: {
    backgroundColor: '#C6A55E',
  },
  enableButton: {
    backgroundColor: '#00305D',
  },
  deleteButton: {
    backgroundColor: '#D1232A',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#C6A55E',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    start: 20,
    end: 20,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00305D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#00305D',
    fontWeight: '600',
  },
});
