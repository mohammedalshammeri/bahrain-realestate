# AFS Payment System - Quick Reference Guide

## 🚀 **Quick Start**

### **Environment Setup**
```bash
# Required environment variables
AFS_API_KEY=your_afs_sandbox_key
AFS_MERCHANT_ID=your_merchant_id
AFS_RETURN_URL=https://yourapp.com/payment/success
AFS_CALLBACK_URL=https://yourapi.com/api/company/payments/afs-callback
```

### **Package Credit Values**
| Package Type | Credits Added | Price Example |
|--------------|---------------|---------------|
| `basic` | +10 credits | 100 BHD |
| `standard` | +25 credits | 250 BHD |
| `premium` | +50 credits | 500 BHD |
| `enterprise` | +100 credits | 1000 BHD |

---

## 🔄 **Payment Flow Usage**

### **Frontend Integration Example**
```javascript
// Step 1: Create payment request
const paymentRequest = await fetch('/api/company/payments/request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    packageType: 'premium',
    amount: 500
  })
});

const { data: transaction } = await paymentRequest.json();

// Step 2: Initialize AFS session
const sessionResponse = await fetch('/api/company/payments/session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transactionId: transaction.id,
    amount: 500
  })
});

const { data: session } = await sessionResponse.json();

// Step 3: Redirect user to AFS payment page
window.location.href = session.redirectUrl;
```

---

## 📊 **API Endpoints Reference**

### **1. Create Payment Request**
```http
POST /api/company/payments/request
Authorization: Bearer <jwt_token>

Request:
{
  "packageType": "premium",
  "amount": 500
}

Response:
{
  "success": true,
  "message": "Payment request initialized",
  "data": {
    "id": 123,
    "companyId": 1,
    "packageType": "premium", 
    "amount": 500,
    "status": "pending",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

### **2. Create Payment Session**
```http
POST /api/company/payments/session
Authorization: Bearer <jwt_token>

Request:
{
  "transactionId": 123,
  "amount": 500
}

Response:
{
  "success": true,
  "message": "AFS payment session created",
  "data": {
    "sessionId": "afs_session_1640995200_abc123",
    "redirectUrl": "https://sandbox-ipg.afs.com.kw/checkout/...",
    "transaction": { ... }
  }
}
```

### **3. AFS Callback (Webhook)**
```http
POST /api/company/payments/afs-callback
Content-Type: application/json

Request (from AFS):
{
  "sessionId": "afs_session_1640995200_abc123",
  "orderId": "TX-123",
  "result": "Successful",
  "paymentId": "PM123456789", 
  "status": "success",
  "amount": 500,
  "currency": "BHD",
  "date": "2025-01-01 12:00:00"
}

Response:
{
  "success": true,
  "message": "AFS callback processed successfully",
  "data": {
    "transactionId": 123,
    "status": "success",
    "processed": true
  }
}
```

---

## 🛠 **Testing Commands**

### **Run E2E Tests**
```bash
# Run full test suite
pnpm test

# Run AFS-specific tests
pnpm test:afs

# Run in watch mode
pnpm test:watch
```

### **Manual Database Test**
```bash
# Test database operations
npx tsx test-afs-integration.ts
```

### **Manual API Test**
```bash
# 1. Start the server
pnpm dev

# 2. In another terminal, test APIs
npx tsx manual-afs-test.ts
```

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| `AFS_API_KEY environment variable is required` | Missing env vars | Set all required AFS environment variables |
| `Payment transaction not found` | Invalid sessionId | Verify sessionId matches database record |
| `Company not found` | Invalid companyId | Ensure company exists and JWT token is valid |
| `Invalid or expired token` | Auth failure | Check JWT token and company authentication |

### **Database Checks**
```sql
-- Check payment transactions
SELECT * FROM PaymentTransaction WHERE status = 'pending';

-- Check company balances
SELECT id, name, featuredAdsBalance FROM Company;

-- Check recent payments
SELECT pt.*, c.name as companyName 
FROM PaymentTransaction pt 
JOIN Company c ON pt.companyId = c.id 
ORDER BY pt.createdAt DESC 
LIMIT 10;
```

---

## 📱 **Frontend Integration Notes**

### **Payment Status Handling**
```javascript
// Handle return from AFS payment page
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId');
const status = urlParams.get('status');

if (status === 'success') {
  // Payment successful - refresh balance
  await refreshCompanyBalance();
  showSuccessMessage('Payment completed successfully!');
} else {
  // Payment failed or cancelled
  showErrorMessage('Payment was not completed');
}
```

### **Balance Display**
```javascript
// Fetch current company balance
const balanceResponse = await fetch('/api/company/featured-ads-balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: balance } = await balanceResponse.json();

console.log(`Featured Ads Credits: ${balance.balance}`);
```

---

## 🔒 **Security Notes**

- ✅ **Authentication**: Payment requests require valid JWT tokens
- ✅ **Webhook Security**: Callback endpoint is public (as required by AFS)
- ✅ **Data Validation**: All inputs validated before processing
- ✅ **Error Handling**: Sensitive info not exposed in error messages
- ✅ **Atomic Operations**: Database transactions ensure data consistency

---

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section above
2. Review the complete implementation in `AFS_PAYMENT_INTEGRATION_COMPLETE.md`
3. Run the test suite to verify system functionality
4. Check server logs for detailed error information

---

**🎉 The AFS Payment Integration is ready for production use!**
