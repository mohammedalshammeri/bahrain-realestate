'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemEmployee {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: string;
}

interface PaginationResponse {
  data: SystemEmployee[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function SystemEmployeesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [employees, setEmployees] = useState<SystemEmployee[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1);
        fetchEmployees(1, search);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Fetch employees on page change
  useEffect(() => {
    fetchEmployees(currentPage, search);
  }, [currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchEmployees(1, '');
  }, []);  const fetchEmployees = async (page: number, searchTerm: string) => {
    try {
      setIsLoading(true);
      setError(null);
        const { getSystemEmployees } = await import('@/lib/api/adminApi');
      const response = await getSystemEmployees(searchTerm, page);
      
      // The backend returns data structure: { data: { employees: [], pagination: {} } }
      // So we need to access response.data.employees and response.data.pagination
      if (response.data && response.data.employees) {
        setEmployees(response.data.employees);
        setPagination({
          total: response.data.pagination?.total || 0,
          page: response.data.pagination?.page || 1,
          pageSize: response.data.pagination?.limit || 10,
          totalPages: response.data.pagination?.totalPages || 0
        });
      } else {
        // Fallback if structure is different
        setEmployees([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load system employees');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-BH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
    switch (role) {
      case 'SUPER_ADMIN':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`;
      case 'ADMIN':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300`;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return t('adminUsers.roles.super_admin');
      case 'ADMIN':
        return t('adminUsers.roles.admin');
      case 'MANAGER':
        return t('adminUsers.roles.manager');
      default:
        return role;
    }
  };

  const handleAddEmployee = () => {
    router.push("/admin-users/create");
  };

  const handleViewEmployee = (employeeId: number) => {
    router.push(`/admin-users/${employeeId}`);
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm(t('adminUsers.confirmDelete') || 'Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      const { deleteSystemEmployee } = await import('@/lib/api/adminApi');
      await deleteSystemEmployee(employeeId);
      fetchEmployees(currentPage, search);
    } catch (err: any) {
      alert(err.message || t('adminUsers.deleteError') || 'Failed to delete employee');
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRetry = () => {
    fetchEmployees(currentPage, search);
  };

  // Loading skeleton
  if (isLoading && employees.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Title skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>

        {/* Search + Add Employee row skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="animate-pulse flex flex-col sm:flex-row gap-4 justify-between">
             <div className="h-10 w-full sm:max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
             <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse">
            {/* Table header skeleton */}
            <div className="bg-gray-50/50 dark:bg-gray-700/50 px-6 py-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
            
            {/* Table rows skeleton */}
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="px-6 py-4 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('adminUsers.title')}</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-900/50 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('adminUsers.errors.loading')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Title */}
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminUsers.title')}</h1>
      </div>

      {/* Top Actions Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
             <div className="relative">
                 <input
                  type="text"
                  placeholder={t('adminUsers.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
            </div>
          </div>

          {/* Add Employee Button */}
          <button
            onClick={handleAddEmployee}
             className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('adminUsers.addEmployee')}
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('adminUsers.table.name')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('adminUsers.table.email')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('adminUsers.table.role')}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('adminUsers.table.createdAt')}
                </th>
                <th className="px-6 py-4 text-end text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('adminUsers.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getRoleBadge(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(employee.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewEmployee(employee.id)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          title={t('adminUsers.actions.view')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                          title={t('adminUsers.actions.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                     <div className="flex flex-col items-center justify-center space-y-3">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('adminUsers.messages.noEmployees')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {search 
                          ? t('adminUsers.messages.noSearchResults', { query: search })
                          : t('adminUsers.messages.emptyState')
                        }
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          {t('adminUsers.actions.clearSearch')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
         <div className="flex justify-center pt-4">
          <nav className="flex items-center gap-1">
             <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
             {t('common.pageOf', { current: currentPage, total: pagination.totalPages })}
            </span>
             <button
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && !error && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {search ? (
            <>{t('adminUsers.messages.showingEmployees', { count: employees.length, total: pagination.total })}</>
          ) : (
            <>{t('adminUsers.messages.totalEmployees', { count: pagination.total })}</>
          )}
        </div>
      )}
    </div>
  );
}
