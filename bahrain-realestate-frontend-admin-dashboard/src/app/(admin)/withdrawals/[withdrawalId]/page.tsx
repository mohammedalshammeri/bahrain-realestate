'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface WithdrawalDetail {
  id: number;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt?: string | null;
  method?: string | null;
  notes?: string | null;
  company: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export default function WithdrawalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const withdrawalId = params.withdrawalId as string;

  // State
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  // Fetch withdrawal details
  const fetchWithdrawal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { getWithdrawalById } = await import('@/lib/api/adminApi');
      const response = await getWithdrawalById(parseInt(withdrawalId));
      setWithdrawal(response.data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load withdrawal details.");
    } finally {
      setIsLoading(false);
    }
  }, [withdrawalId]);

  useEffect(() => {
    fetchWithdrawal();
  }, [fetchWithdrawal]);
  // Handle approve withdrawal
  const handleApprove = useCallback(async () => {
    if (!withdrawal) return;
    setActionLoading("approve");
    try {
      const { approveWithdrawal } = await import('@/lib/api/adminApi');
      await approveWithdrawal(withdrawal.id);
      await fetchWithdrawal(); // Refresh data
    } catch (err: any) {
      alert(err.message ?? "Failed to approve withdrawal.");
    } finally {
      setActionLoading(null);
    }
  }, [withdrawal, fetchWithdrawal]);
  // Handle reject withdrawal
  const handleReject = useCallback(async () => {
    if (!withdrawal) return;
    setActionLoading("reject");
    try {
      const { rejectWithdrawal } = await import('@/lib/api/adminApi');
      await rejectWithdrawal(withdrawal.id);
      await fetchWithdrawal(); // Refresh data
    } catch (err: any) {
      alert(err.message ?? "Failed to reject withdrawal.");
    } finally {
      setActionLoading(null);
    }
  }, [withdrawal, fetchWithdrawal]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  // Format date
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

  // Get status badge
  const getStatusBadge = (status: WithdrawalStatus) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get status description
  const getStatusDescription = (status: WithdrawalStatus) => {
    switch (status) {
      case 'PENDING':
        return "This withdrawal is awaiting review.";
      case 'APPROVED':
        return "This withdrawal has been approved.";
      case 'REJECTED':
        return "This withdrawal was rejected.";
      default:
        return "Status unknown.";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-red-800">Failed to load withdrawal details</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchWithdrawal}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    );
  }

  // Not found state
  if (!withdrawal && !isLoading && !error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Withdrawal not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Withdrawal Details</h1>
          {withdrawal && (
            <p className="text-sm text-gray-500 mt-1">
              Request ID: <span className="font-mono">{withdrawal.id}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/withdrawals")}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Withdrawals
        </button>
      </div>

      {/* Main Content */}
      {withdrawal && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Overview (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Withdrawal Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Overview</h2>
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(withdrawal.amount)}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={getStatusBadge(withdrawal.status)}>
                      {withdrawal.status.charAt(0) + withdrawal.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Created At */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900 mt-1">{formatDate(withdrawal.createdAt)}</p>
                </div>

                {/* Processed At */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Processed At</label>
                  <p className="text-gray-900 mt-1">
                    {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '—'}
                  </p>
                </div>

                {/* Method */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Method</label>
                  <p className="text-gray-900 mt-1">{withdrawal.method || '—'}</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900 mt-1">
                    {withdrawal.notes || 'No notes provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Company Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Name</label>
                  <p className="text-gray-900 mt-1 font-medium">{withdrawal.company.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 mt-1">{withdrawal.company.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 mt-1">{withdrawal.company.phone || '—'}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => router.push(`/companies/${withdrawal.company.id}`)}
                  disabled={!withdrawal.company.id}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Company Profile
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            {/* Card 3: Status & Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Actions</h2>
              
              {/* Current Status */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={getStatusBadge(withdrawal.status)}>
                    {withdrawal.status.charAt(0) + withdrawal.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {getStatusDescription(withdrawal.status)}
                </p>
              </div>

              {/* Actions */}
              {withdrawal.status === "PENDING" ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading === "approve"}
                    className="inline-flex items-center justify-center w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "approve" ? (
                      <>
                        <svg className="h-4 w-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve Withdrawal
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading === "reject"}
                    className="inline-flex items-center justify-center w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "reject" ? (
                      <>
                        <svg className="h-4 w-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject Withdrawal
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    This withdrawal can no longer be modified.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
