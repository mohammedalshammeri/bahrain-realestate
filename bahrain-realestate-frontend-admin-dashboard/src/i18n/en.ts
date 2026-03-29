export const en = {
  common: {
    back: "Back",
    pageOf: "Page {current} of {total}",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    actions: "Actions",
    loading: "Loading...",
    noData: "No data available",
    success: "Success",
    error: "Error",
    search: "Search...",
    filter: "Filter",
    reset: "Reset",
    close: "Close",
    logout: "Logout",
    language: "Language",
    profile: "Profile",
    settings: "Settings",
    dashboard: "Dashboard",
    appName: "Property Hub",
    appShortName: "BPH",
    yes: "Yes",
    no: "No",
    preview: "Preview",
    refresh: "Refresh",
    now: "Now",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    tryAdjustingTerms: "Try adjusting your search terms",
    noResults: "No results found for \"{query}\"",
    typeToSearch: "Type at least 2 characters to search",
    searchPlaceholder: "Search companies, properties, complaints...",
    types: {
      company: "Company",
      property: "Property",
      complaint: "Complaint",
      employee: "Employee"
    },
    currency: "BD",
    perMonth: "/month",
    na: "N/A",
    page: "Page",
    of: "of",
    total: "Total",
    previous: "Previous",
    next: "Next",
    save: "Save",
    selectAll: "Select all",
    clear: "Clear",
    showing: "Showing",
    tryAgain: "Try Again"
  },
  auth: {
    loggingOut: "Logging out..."
  },
  navigation: {
    dashboard: "Dashboard",
    companies: "Companies",
    properties: "Properties",
    individuals: "Individuals",
    complaints: "Complaints",
    employees: "Employees",
    ads: "Ads Management",
    withdrawals: "Withdrawals",
    adminUsers: "Admin Users",
    payments: "Payments",
    packages: "Packages",
    subscriptionRequests: "Subscription Requests",
    system: "System",
  },
  subscriptionRequests: {
    title: "Subscription Requests",
    listTitle: "Manage Subscription Requests",
    company: "Company",
    package: "Package",
    status: "Status",
    date: "Date",
    approve: "Approve",
    reject: "Reject",
    approveConfirm: "Are you sure you want to approve this request?",
    rejectConfirm: "Are you sure you want to reject this request?",
    statusUpdated: "Request status updated successfully",
    failedLoad: "Failed to load requests"
  },
  dashboard: {
    title: "Admin Dashboard - Bahrain Property Hub",
    totalCompanies: "Total Companies",
    totalEmployees: "Total Employees",
    totalProperties: "Total Properties",
    activeProperties: "Active Properties",
    openComplaints: "Open Complaints",
    activeUsers: "Active Users",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    blocked: "Blocked",
    active: "Active",
    featured: "Featured",
    viewComplaints: "View Complaints",
    quickActions: "Quick Actions",
    manageCompanies: "Manage Companies",
    manageProperties: "Manage Properties",
    manageAds: "Manage Ads",
    welcomeTitle: "Welcome to Bahrain Property Hub Admin",
    welcomeSubtitle: "Manage your real estate properties, companies, and customer complaints from this dashboard.",
    recentCompanies: "Recent Companies",
    recentProperties: "Recent Properties",
    recentComplaints: "Recent Complaints",
    noNewCompanies: "No new companies",
    noNewProperties: "No new properties",
    noNewComplaints: "No new complaints",
    retry: "Retry",
    loadingFailed: "Failed to fetch data",
    errorFetch: "Error fetching data",
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    noNotifications: "No new notifications",
    expiring: {
      title: "Properties expiring soon (24 hours)",
      description: "You have {count} properties expiring within a day",
      hoursLeft: "{hours} hours left",
      callOwner: "Call owner: {phone}",
      viewAll: "View all properties"
    },
    companies: {
        pending: "Pending Companies",
        waitingApproval: "{count} companies waiting for approval"
    },
    complaints: {
        new: "New Complaints",
        received: "{count} new complaints received"
    }
  },
  companies: {
    title: "Companies",
    searchPlaceholder: "Search companies...",
    allStatuses: "All Statuses",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    blocked: "Blocked",
    export: "Export CSV",
    add: "Add Company",
    viewCr: "View CR",
    table: {
      name: "Company Name",
      cr: "CR Number",
      email: "Email",
      phone: "Phone",
      status: "Status",
      employeesLimit: "Employees Limit",
      subscription: "Subscription",
      actions: "Actions",
      createdAt: "Created At"
    },
    subscription: {
      free: "Free",
      daysLeft: "{days} days left",
      expired: "Expired",
      adsUsage: "Ads: {used} used / {left} left"
    },
    actions: {
      activate: "Activate",
      suspend: "Suspend",
      delete: "Delete",
      approve: "Approve",
      reject: "Reject",
      block: "Block",
      unblock: "Unblock"
    },
    noData: "No companies found",
    failedLoad: "Failed to load companies",
    statusUpdated: "Company status updated",
    failedUpdate: "Failed to update company status",
    stats: {
        total: "Total Companies",
        approved: "Approved",
        pending: "Pending"
    },
    refreshed: "Companies list refreshed",
    failedRefresh: "Failed to refresh companies list",
    noExport: "No companies to export",
    exportSuccess: "Successfully exported companies",
    exportFail: "Failed to export companies",
    errorLoading: "Error Loading Companies",
    tryAgain: "Try Again",
    noResultsParams: "Try adjusting your search terms"
  },
  properties: {
    stats: {
        total: "Total Properties",
        available: "Available",
        sale: "For Sale",
        rent: "For Rent"
    },
    duration: {
      pausedForPending: "Duration is paused until the property is activated",
      notAvailableForRejected: "No duration is calculated for rejected properties",
      notAvailableForSoldOrRented: "Duration cannot be changed for sold or rented properties",
      edit: "Edit duration",
      renew: "Renew duration",
      set: "Set duration",
      confirm: "Confirm duration",
      modalTitleEdit: "Edit property duration",
      modalTitleSet: "Set property duration",
      modalTitleRenew: "Renew property duration",
      descriptionEdit: "Set the new total display duration for this property in the app. The current remaining time will be replaced.",
      descriptionSet: "Set how long this property should be visible in the app after it is activated.",
      descriptionRenew: "The display duration for this property has ended. Set a new duration so the property appears again in the app after renewal.",
      // Newly used keys for remaining/expired labels
      expired: "Expired",
      notSet: "Not set",
      remainingLabel: "Remaining time",
      expiresAtLabel: "Expires at:",
      setDurationTitle: "Set duration or expiry date for property",
      daysLabel: "Number of days",
      expiresAtField: "Expiry date",
      helperText:
        "You can either set the number of days or a specific expiry date. When the duration ends, the property will automatically be put on hold."
    },
    filters: {
        governorate: "Governorate",
        purpose: "Purpose",
        status: "Status",
        type: "Type",
        dateFrom: "Date From",
        dateTo: "Date To",
        all: "All",
        search: "Search Properties...",
        company: "Filter by Company",
        title: "Filter Properties",
        allTypes: "All Types",
      allCompanies: "All Companies",
      clear: "Clear Filters",
      sort: "Sort by:",
      newest: "Newest first",
      oldest: "Oldest first"
    },
    types: {
      apartments: "Apartments",
      villas_houses: "Villas/Houses",
      lands: "Lands",
      buildings: "Buildings",
      offices: "Offices",
      studio: "Studio",
      shops: "Shops",
      warehouses: "Warehouses",
      labor_accommodation: "Labor Accommodation",
      commercial_complexes: "Commercial Complexes",
      chalets: "Chalets",
      traditional_houses: "Traditional Houses",
      farms: "Farms",
      halls: "Halls",
      under_construction: "Under Construction",
      camps: "Camps",
      misc: "Miscellaneous"
    },
    purposes: {
      sale: "Sale",
      rent: "Rent"
    },
    governorates: {
      "Capital Governorate": "Capital Governorate",
      "Muharraq Governorate": "Muharraq Governorate",
      "Northern Governorate": "Northern Governorate",
      "Southern Governorate": "Southern Governorate",
      "Capital": "Capital",
      "Muharraq": "Muharraq",
      "Northern": "Northern",
      "Southern": "Southern"
    },
    areas: {
      "Gudaibiya": "Gudaibiya",
      "Manama": "Manama",
      "Juffair": "Juffair",
      "Adliya": "Adliya",
      "Seef": "Seef",
      "Hoora": "Hoora",
      "Zinj": "Zinj",
      "Sanabis": "Sanabis",
      "Isa Town": "Isa Town",
      "Riffa": "Riffa",
      "Saar": "Saar",
      "Budaiya": "Budaiya",
      "Hamad Town": "Hamad Town",
      "Tubli": "Tubli",
      "Busaiteen": "Busaiteen",
      "Hidd": "Hidd",
      "Amwaj Islands": "Amwaj Islands",
      "Diyar Al Muharraq": "Diyar Al Muharraq",
      "Sanad": "Sanad",
      "Durrat Al Bahrain": "Durrat Al Bahrain",
      "Salmabad": "Salmabad",
      "Sitra": "Sitra",
      "Muharraq": "Muharraq",
      "Arad": "Arad",
      "Galali": "Galali",
      "Janabiya": "Janabiya",
      "Jasra": "Jasra",
      "Sehla": "Sehla",
      "Barbar": "Barbar",
      "Dumistan": "Dumistan",
      "Bani Jamra": "Bani Jamra",
      "Diraz": "Diraz",
      "Karbabad": "Karbabad",
      "A'ali": "A'ali",
      "Jurdab": "Jurdab",
      "Halat Al Naim": "Halat Al Naim",
      "Halat Bu Maher": "Halat Bu Maher",
      "Ras Rumman": "Ras Rumman"
    },
    table: {
      image: "Image",
      id: "ID",
      property: "Property",
      location: "Governorate",
      price: "Price",
      type: "Type",
      purpose: "Purpose",
      status: "Status",
      features: "Features",
      featured: "Featured",
      featuredPlus: "Featured+",
      company: "Company",
      actions: "Actions",
      createdAt: "Created At",
      title: "Title",
    },
    title: "Title",
    area: "Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    description: "Description",
    ownerAndCompany: "Owner / Company",
    createdBy: "Created By",
    videos: "Videos",
    editProperty: "Edit Property",
    status: {
        active: "Active",
        pending: "Pending",
        rejected: "Rejected",
        sold: "Sold",
        rented: "Rented"
    },
    userRoles: {
      owner: "Owner",
      agent: "Agent",
      company: "Company"
    },
    actions: {
        view: "View Details",
        edit: "Edit",
        delete: "Delete",
        approve: "Approve",
        reject: "Reject",
        feature: "Feature",
        unfeature: "Unfeature",
        bulkApprove: "Approve Selected",
        bulkReject: "Reject Selected",
        bulkDelete: "Delete Selected",
        clearSelection: "Clear selection",
        selectedCount: "{count} selected",
        approving: "Approving...",
        rejecting: "Rejecting...",
        deleting: "Deleting...",
        export: "Export CSV",
        refresh: "Refresh"
    },
    errors: {
        loading: "Error Loading Properties",
        tryAgain: "Try Again",
        notFound: "No properties found",
        notFoundHint: "Try adjusting your filters."
    },
    messages: {
        confirmDelete: "Are you sure you want to delete this property?",
      confirmApprove: "Are you sure you want to approve this property?",
      confirmReject: "Are you sure you want to reject this property?",
      confirmActivate: "Are you sure you want to activate this property now?",
        deleteSuccess: "Property deleted successfully",
        deleteFail: "Failed to delete property",
        updateSuccess: "Property updated successfully",
        updateFail: "Failed to update property",
        featureSuccess: "Property featured status updated",
        featureFail: "Failed to update featured status",
        confirmBulkApprove: "Are you sure you want to approve {count} properties?",
        approveSuccess: "Properties approved successfully",
        approveFail: "Failed to approve some properties",
        confirmBulkReject: "Are you sure you want to reject {count} properties?",
        rejectSuccess: "Properties rejected successfully",
        rejectFail: "Failed to reject some properties",
        confirmBulkDelete: "Are you sure you want to delete {count} properties? This action cannot be undone.",
        bulkDeleteSuccess: "Properties deleted successfully",
        bulkDeleteFail: "Failed to delete some properties"
    }
  },
  pagination: {
    showing: "Showing {from} to {to} of {total} entries",
    previous: "Previous",
    next: "Next"
  },
  adminUsers: {
    title: "System Employees",
    searchPlaceholder: "Search employees by name or email...",
    addEmployee: "Add Employee",
    table: {
      name: "Name",
      email: "Email",
      role: "Role",
      createdAt: "Created At",
      actions: "Actions"
    },
    actions: {
      view: "View Employee",
      delete: "Delete Employee",
      clearSearch: "Clear search"
    },
    messages: {
      noEmployees: "No system employees found",
      noSearchResults: "No employees match your search for \"{query}\"",
      emptyState: "No system employees have been created yet.",
      showingEmployees: "Showing {count} of {total} employees",
      totalEmployees: "Total: {count} employees"
    },
    roles: {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager"
    },
    create: {
      title: "Add System Employee",
      namePlaceholder: "Enter employee's full name",
      emailPlaceholder: "Enter email address",
      selectRole: "Select a role",
      password: "Password",
      passwordPlaceholder: "Enter password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm password",
      saveEmployee: "Save Employee",
      saving: "Saving...",
      requiredFields: "Please fill in all required fields",
      passwordsNoMatch: "Passwords do not match",
      errorCreating: "An error occurred while creating the system employee"
    }
  },
  individualProperties: {
    title: "Individual Properties",
    titleWithStatus: "Individual Properties ({status})",
    description: "Review individual submissions and send approved ones to marketing companies.",
    searchPlaceholder: "Search title, area, owner…",
    status: {
      all: "All",
      draft: "Draft",
      pending_admin: "Pending Admin",
      sent_to_companies: "Sent to Companies",
      active: "Active",
      rejected: "Rejected",
      sold: "Sold",
      rented: "Rented"
    },
    offerStatus: {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected"
    },
    fields: {
        title: "Title",
        governorate: "Governorate",
        area: "Area",
        type: "Type",
        purpose: "Purpose",
        description: "Description",
        name: "Name",
        contact: "Contact",
      images: "Images",
        videos: "Videos"
    },
    table: {
      id: "ID",
      titleArea: "Title / Area",
      owner: "Owner",
      minPrice: "Min Price",
      offers: "Offers",
    },
    reason: "Reason: ",
    cannotDistribute: "Cannot distribute in status: {status}",
    actions: {
        approveAndSend: "Approve & Send",
        approveSend: "Approve & Send",
        markSold: "Mark Sold",
        markRented: "Mark Rented",
        reject: "Reject",
        edit: "Edit",
        delete: "Delete",
      reset: "Reset",
      send: "Send",
      viewOffers: "View offers"
    },
    distribute: {
        title: "Send to companies",
        subtitle: "Choose ALL or select specific companies.",
        allCompanies: "All approved companies",
        selectedCompanies: "Selected companies",
        searchCompanies: "Search companies...",
        selectAll: "Select all",
        clear: "Clear",
        selectedCount: "Selected: {count}",
        send: "Send"
    },
    edit: {
        title: "Edit property #{id}",
        subtitle: "Admin edit (MVP): title, price, location, type, description.",
        noVideo: "No video provided",
        videos: "Videos"
    },
    preview: {
        propertyId: "Property #{id}",
        videos: "Videos ({count})"
    },
    messages: {
        noData: "No individual submissions found.",
        noTitle: "(no title)",
        noDescription: "No description",
        reason: "Reason",
        confirmSend: "Confirm sending this property?",
        selectCompany: "Please select at least one company",
        rejectionReason: "Enter rejection reason:",
        confirmRejectActive: "This property is ACTIVE. Rejecting can revoke accepted offers and unpublish. Continue?",
        confirmReset: "Reset this property back to PENDING_ADMIN and remove all offers?",
        confirmSold: "Mark this property as SOLD? The owner will be notified.",
        confirmDelete: "Delete this property permanently? This action cannot be undone and will remove it from everywhere including the mobile app.",
        failedDistribute: "Failed to distribute property",
        failedReject: "Failed to reject property",
        failedReset: "Failed to reset property",
        failedMarkSold: "Failed to mark property as sold",
        failedDelete: "Failed to delete property",
        failedUpdate: "Failed to update property",
        failedLoadCompanies: "Failed to load companies",
        failedLoadOffers: "Failed to load company offers for this property",
        noOffers: "No company offers for this property yet.",
        soldViaThisCompany: "Sold via this company",
        chooseWinningOffer: "Select the company that completed the sale, then confirm."
    }
  },
  companyEmployees: {
    title: "Employees Management",
    searchPlaceholder: "Search by name, email or company...",
    filters: {
        allRoles: "All Roles",
        owner: "Owner",
        manager: "Manager",
        agent: "Agent"
    },
    table: {
        name: "Name",
        email: "Email",
        company: "Company",
        role: "Role",
        status: "Status",
        actions: "Actions"
    },
    status: {
        active: "Active",
        inactive: "Inactive"
    },
    actions: {
        block: "Block",
        activate: "Activate"
    },
    messages: {
        confirmStatusChange: "Are you sure you want to change status to {status}?",
        updateFail: "Failed to update status",
        loadFail: "Failed to load employees",
        noEmployees: "No employees found"
    }
  },
  complaints: {
    title: "Complaints",
    description: "Manage and review complaints submitted by users",
    filters: {
      status: "Filter by Status:",
      type: "Filter by Type:",
      sort: "Sort by:",
      newest: "Newest first",
      oldest: "Oldest first",
      allStatus: "All Status",
      allTypes: "All Types"
    },
    status: {
      new: "New",
      under_review: "Under Review",
      resolved: "Resolved",
      closed: "Closed"
    },
    submitterType: {
      individual: "Individual",
      company: "Company"
    },
    types: {
      property: "Property Complaint",
      company: "Company Complaint",
      general: "General Complaint"
    },
    table: {
      id: "Complaint ID",
      submitter: "Submitter",
      target: "Target",
      message: "Message",
      status: "Status",
      createdAt: "Created At",
      action: "Action"
    },
    details: {
      title: "Complaint Details",
      submitterInfo: "Submitter Information",
      complaintInfo: "Complaint Information",
      complaintType: "Complaint Type",
      targetCompany: "Target Company",
      targetProperty: "Target Property",
      propertyImage: "Property Image",
      message: "Complaint Message",
      adminNotes: "Admin Notes",
      resolvedAt: "Resolved At",
      updateStatus: "Update Status"
    },
    messages: {
      showing: "Showing {count} of {total} complaints",
      noComplaints: "No complaints found",
      noMatch: "No complaints match the selected status filter.",
      errorLoading: "Error Loading Complaints",
      tryAgain: "Try Again"
    },
    summary: {
      total: "Total Complaints",
      new: "New",
      underReview: "Under Review",
      resolved: "Resolved"
    }
  },
  ads: {
    title: "Ads Management",
    searchPlaceholder: "Search ads by property title or ID...",
    filters: {
      allAdTypes: "All Ad Types",
      regular: "Regular",
      featured: "Featured",
      allStatuses: "All Statuses",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    table: {
      propertyTitle: "Property Title",
      companyName: "Company Name",
      adType: "Ad Type",
      status: "Status",
      createdAt: "Created At",
      actions: "Actions"
    },
    status: {
      approved: "Approved",
      rejected: "Rejected",
      pending: "Pending"
    },
    actions: {
      setFeatured: "Set as Featured",
      unsetFeatured: "Unset Featured",
      view: "View Property",
      approve: "Approve Ad",
      reject: "Reject Ad",
      delete: "Delete Ad"
    },
    messages: {
      loading: "Loading ads...",
      errorLoading: "Error Loading Ads",
      tryAgain: "Try Again",
      noAds: "No ads found",
      noMatch: "No ads match your current filters.",
      noAdsCreated: "No ads have been created yet.",
      clearFilters: "Clear all filters",
      confirmApprove: "Approve this ad?",
      confirmReject: "Reject this ad?",
      rejectReason: "Rejection reason (required):",
      confirmDelete: "Archive this ad? (Soft delete)",
      confirmSetFeatured: "Set this ad as Featured?",
      confirmUnsetFeatured: "Unset Featured for this ad?",
      onlyApprovedFeatured: "Only approved ads can be set as Featured.",
      failedApprove: "Failed to approve ad",
      failedReject: "Failed to reject ad",
      failedDelete: "Failed to delete ad",
      showing: "Showing {count} of {total} ads",
      total: "Total: {count} ads"
    },
    pagination: {
      previous: "Previous",
      next: "Next",
      pageOf: "Page {current} of {total}"
    }
  },
  packages: {
    title: "Packages Management",
    add: "Add Package",
    edit: "Edit Package",
    form: {
      nameAr: "Name (AR)",
      nameEn: "Name (EN)",
      price: "Price",
      durationDays: "Duration (Days)",
      adsLimit: "Ads Limit",
      featuredAdsLimit: "Featured Limit",
      descriptionAr: "Description (AR)",
      descriptionEn: "Description (EN)"
    }
  },
  payments: {
    title: "Payments",
    searchPlaceholder: "Search by company name or ID...",
    filters: {
      allStatuses: "All Statuses",
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
      refunded: "Refunded"
    },
    table: {
      company: "Company",
      amount: "Amount",
      type: "Type",
      status: "Status",
      transactionId: "Transaction ID",
      createdAt: "Created At"
    },
    status: {
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
      refunded: "Refunded"
    },
    messages: {
      loading: "Loading payments...",
      errorLoading: "Error Loading Payments",
      tryAgain: "Try Again",
      noPayments: "No payments found",
      noMatch: "No payments match your current filters.",
      clearFilters: "Clear all filters",
      showing: "Showing {count} of {total} payments",
      total: "Total: {count} payments"
    }
  },
  withdrawals: {
    title: "Withdrawal Requests",
    searchPlaceholder: "Search by company name...",
    filters: {
      allStatuses: "All Statuses",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    table: {
      company: "Company",
      amount: "Amount",
      status: "Status",
      requestedAt: "Requested At",
      actions: "Actions"
    },
    status: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    actions: {
      approve: "Approve",
      reject: "Reject"
    },
    messages: {
      loading: "Loading withdrawals...",
      errorLoading: "Error Loading Withdrawals",
      tryAgain: "Try Again",
      noWithdrawals: "No withdrawal requests found",
      noMatch: "No withdrawals match your current filters.",
      clearFilters: "Clear all filters",
      confirmApprove: "Approve this withdrawal request?",
      confirmReject: "Reject this withdrawal request?",
      failedApprove: "Failed to approve withdrawal",
      failedReject: "Failed to reject withdrawal",
      showing: "Showing {count} of {total} withdrawals",
      total: "Total: {count} withdrawals"
    }
  },
  settings: {
    title: "Settings",
    general: {
      title: "General Settings",
      websiteName: "Website Name",
      websiteNamePlaceholder: "Enter website name",
      supportEmail: "Support Email",
      supportEmailPlaceholder: "Enter support email",
      supportPhone: "Support Phone",
      supportPhonePlaceholder: "Enter support phone number"
    },
    payment: {
      title: "Payment & AFS Integration",
      merchantId: "AFS Merchant ID",
      merchantIdPlaceholder: "Enter AFS merchant ID",
      apiKey: "AFS API Key",
      apiKeyPlaceholder: "Enter AFS API key",
      callbackUrl: "AFS Callback URL",
      callbackUrlPlaceholder: "Enter callback URL",
      description: "Configure AFS Payment Gateway integration settings for featured ads and other payment processing."
    },
    actions: {
      saveChanges: "Save Changes",
      saving: "Saving..."
    },
    messages: {
      saveSuccess: "Settings saved successfully!",
      saveFailed: "Failed to save settings. Please try again."
    },
    info: {
      title: "Settings Information",
      generalInfo: "General settings control the basic information displayed across the platform",
      afsInfo: "AFS (Al Fardan Services) integration is required for processing payments",
      testingInfo: "Make sure to test payment settings in a development environment first"
    }
  },
  profile: {
    title: "My Profile",
    fullName: "Full Name",
    email: "Email Address",
    role: "Role",
    accountCreated: "Account Created",
    editProfile: "Edit Profile",
    roles: {
      superAdmin: "Super Administrator",
      admin: "Administrator"
    },
    errors: {
      loadingProfile: "Error Loading Profile",
      tryAgain: "Try Again"
    },
    messages: {
      editComingSoon: "Edit profile functionality will be implemented soon"
    }
  },
  system: {
    title: "System Settings",
    platformName: "Platform Name",
    platformNamePlaceholder: "Enter platform name",
    contactEmail: "Contact Email",
    contactEmailPlaceholder: "Enter contact email",
    contactPhone: "Contact Phone",
    contactPhonePlaceholder: "Enter contact phone number",
    defaultFreeAds: "Default Free Ads",
    defaultFreeAdsPlaceholder: "Enter default number of free ads",
    defaultFeaturedAds: "Default Featured Ads",
    defaultFeaturedAdsPlaceholder: "Enter default number of featured ads",
    googleMapsApiKey: "Google Maps API Key",
    googleMapsApiKeyPlaceholder: "Enter Google Maps API key",
    termsAndConditions: "Terms and Conditions",
    termsAndConditionsPlaceholder: "Enter terms and conditions...",
    privacyPolicy: "Privacy Policy",
    privacyPolicyPlaceholder: "Enter privacy policy...",
    required: "*",
    saveSettings: "Save Settings",
    saving: "Saving...",
    cancel: "Cancel",
    messages: {
      requiredFields: "Platform Name and Contact Email are required",
      saveSuccess: "System settings saved successfully",
      saveFailed: "An error occurred while saving system settings"
    }
  }
};