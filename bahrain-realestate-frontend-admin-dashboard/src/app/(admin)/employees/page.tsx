'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmployees, updateEmployeeStatus, Employee, ApiError } from '@/lib/api/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeesResponseData {
  employees: Employee[];
  pagination?: {
    page?: number;
    totalPages?: number;
    total?: number;
    limit?: number;
  };
}

export default function EmployeesPage() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const fetchEmployees = useCallback(async (page: number = 1, searchTerm: string = '', role: string = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getEmployees(searchTerm, role, page) as {
        success: boolean;
        data?: EmployeesResponseData;
      };
      
      if (response.success && response.data && Array.isArray(response.data.employees)) {
        setEmployees(response.data.employees);
        
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page || page,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.total || 0,
            limit: response.data.pagination.limit || 10
          });
        }
      } else {
        setEmployees([]);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('companyEmployees.messages.loadFail'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchEmployees(1, search, roleFilter);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchEmployees, search, roleFilter]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (!confirm(t('companyEmployees.messages.confirmStatusChange', { status: newStatus }))) return;
    
    try {
      await updateEmployeeStatus(id, newStatus);
      void fetchEmployees(pagination.page, search, roleFilter);
    } catch {
      alert(t('companyEmployees.messages.updateFail'));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyEmployees.title')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
             <div className="relative">
                <input
                  type="text"
                  placeholder={t('companyEmployees.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('companyEmployees.filters.allRoles')}</option>
              <option value="OWNER">{t('companyEmployees.filters.owner')}</option>
              <option value="MANAGER">{t('companyEmployees.filters.manager')}</option>
              <option value="AGENT">{t('companyEmployees.filters.agent')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.name')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.email')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.company')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.role')}</th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.status')}</th>
                <th className="px-6 py-4 text-end text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('companyEmployees.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b dark:border-gray-700 last:border-0">
                    {Array.from({ length: 6 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.company?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        employee.role === 'OWNER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        employee.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                      }`}>
                        {t(`companyEmployees.filters.${employee.role?.toLowerCase()}`) || employee.role || 'Employee'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        employee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {employee.isActive ? t('companyEmployees.status.active') : t('companyEmployees.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                      {employee.role !== 'OWNER' && (
                        <div className="flex items-center justify-end gap-2">
                          {employee.isActive ? (
                            <button
                              onClick={() => handleStatusChange(employee.id, 'blocked')}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                              title={t('companyEmployees.actions.block')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(employee.id, 'active')}
                              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                              title={t('companyEmployees.actions.activate')}
                            >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                     <div className="flex flex-col items-center justify-center space-y-3">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-base font-medium text-gray-900 dark:text-white">{t('companyEmployees.messages.noEmployees')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => void fetchEmployees(pagination.page - 1, search, roleFilter)}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
             {t('common.pageOf', { current: pagination.page, total: pagination.totalPages })}
            </span>
            <button
              onClick={() => void fetchEmployees(pagination.page + 1, search, roleFilter)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
