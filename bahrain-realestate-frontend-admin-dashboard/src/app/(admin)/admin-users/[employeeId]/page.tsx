'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface SystemEmployee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SystemEmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<SystemEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }, []);

  const fetchEmployeeDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { getSystemEmployeeById } = await import('@/lib/api/adminApi');
      const response = await getSystemEmployeeById(parseInt(employeeId));
      setEmployee(response.data as SystemEmployee);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load employee details'));
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, getErrorMessage]);

  useEffect(() => {
    if (employeeId) {
      void fetchEmployeeDetails();
    }
  }, [employeeId, fetchEmployeeDetails]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (role) {
      case 'SUPER_ADMIN':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'ADMIN':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    if (isActive) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  const handleBack = () => {
    router.push("/admin-users");
  };

  const handleToggleEmployee = () => {
    alert("Coming soon");
  };

  const handleDeleteEmployee = () => {
    alert("Coming soon");
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Cards skeletons */}
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: index === 0 ? 7 : 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
              {index === 1 && (
                <div className="flex space-x-4 mt-6">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold mb-6">Employee Details</h1>
            <p className="text-gray-600">Error loading employee information</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Employee</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchEmployeeDetails}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold mb-6">Employee Details</h1>
          <p className="text-gray-600">{employee.name}</p>
        </div>
      </div>

      {/* Basic Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Name
              </label>
              <p className="text-sm text-gray-900">{employee.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-900">{employee.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone
              </label>
              <p className="text-sm text-gray-900">{employee.phone || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Role
              </label>
              <span className={getRoleBadge(employee.role)}>
                {employee.role}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Employee ID
              </label>
              <p className="text-sm text-gray-900 font-mono">{employee.id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-900">{formatDate(employee.createdAt)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Updated At
              </label>
              <p className="text-sm text-gray-900">{formatDate(employee.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Status</h2>
        </div>
        <div className="px-6 py-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Status
            </label>
            <span className={getStatusBadge(employee.isActive)}>
              {employee.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleToggleEmployee}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                employee.isActive
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {employee.isActive ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 18M5.636 5.636L6 6" />
                  </svg>
                  Disable Employee
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enable Employee
                </>
              )}
            </button>

            <button
              onClick={handleDeleteEmployee}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
