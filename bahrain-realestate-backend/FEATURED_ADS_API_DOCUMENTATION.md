# Featured Ads System API Documentation

## Overview
The Featured Ads system allows companies to promote their properties by featuring them for enhanced visibility. Only company owners and managers can feature properties, and it requires available featured ad credits.

## Authentication
All endpoints require authentication with a valid JWT token for company employees.

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Feature a Property

**Endpoint:** `PATCH /api/company/properties/:id/feature`

**Description:** Makes a property featured by consuming 1 credit from the company's featured ads balance.

**Path Parameters:**
- `id` (number) - The property ID to feature

**Authorization:** Company employee (OWNER or MANAGER only)

**Request Example:**
```bash
PATCH /api/company/properties/123/feature
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "property": {
      "id": 123,
      "companyId": 5,
      "type": "apartment",
      "purpose": "sale",
      "price": "150000.00",
      "governorate": "Manama",
      "area": "Juffair",
      "branch": null,
      "description": "Beautiful 2-bedroom apartment...",
      "locationLat": "26.216667",
      "locationLng": "50.583333",
      "bedrooms": 2,
      "bathrooms": 2,
      "areaSqm": 120,
      "isFeatured": true,
      "status": "active",
      "expiresAt": "2025-01-02T05:19:35.000Z",
      "createdAt": "2024-12-02T05:19:35.000Z",
      "updatedAt": "2024-12-02T06:30:15.000Z",
      "company": {
        "id": 5,
        "name": "Prime Properties Bahrain",
        "email": "info@primeproperties.bh",
        "phone": "+973 1234 5678"
      },
      "propertyImages": [
        {
          "id": 1,
          "propertyId": 123,
          "imageUrl": "https://example.com/image1.jpg",
          "displayOrder": 1,
          "createdAt": "2024-12-02T05:19:35.000Z"
        }
      ]
    },
    "remainingBalance": 4
  },
  "message": "Property featured successfully"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**400 Bad Request - Property ID Missing:**
```json
{
  "success": false,
  "message": "Property ID is required"
}
```

**403 Forbidden - Insufficient Role:**
```json
{
  "success": false,
  "message": "Only company owners and managers can feature properties"
}
```

**400 Bad Request - Insufficient Balance:**
```json
{
  "success": false,
  "message": "Insufficient featured ads balance. Please purchase more featured ad credits."
}
```

**404 Not Found - Company:**
```json
{
  "success": false,
  "message": "Company not found"
}
```

**404 Not Found - Property:**
```json
{
  "success": false,
  "message": "Property not found"
}
```

**403 Forbidden - Property Ownership:**
```json
{
  "success": false,
  "message": "Unauthorized to feature this property"
}
```

**400 Bad Request - Inactive Property:**
```json
{
  "success": false,
  "message": "Cannot feature inactive properties"
}
```

**400 Bad Request - Already Featured:**
```json
{
  "success": false,
  "message": "Property is already featured"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

### 2. Get Featured Ads Balance

**Endpoint:** `GET /api/company/featured-ads-balance`

**Description:** Retrieves the current featured ads balance for the authenticated company.

**Authorization:** Company employee (all roles)

**Request Example:**
```bash
GET /api/company/featured-ads-balance
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "companyId": 5,
    "featuredAdsBalance": 8
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Company not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Business Logic

### Feature Property Requirements
1. **Authentication**: Must be a valid company employee
2. **Authorization**: Only OWNER or MANAGER roles can feature properties
3. **Balance**: Company must have `featuredAdsBalance > 0`
4. **Property Ownership**: Property must belong to the authenticated company
5. **Property Status**: Property must be `active`
6. **Not Already Featured**: Property must not already be featured (`isFeatured = false`)

### Transaction Flow
When a property is featured:
1. Validate all requirements above
2. Execute atomic transaction:
   - Set `property.isFeatured = true`
   - Set `property.updatedByEmployeeId = currentEmployeeId`
   - Decrement `company.featuredAdsBalance` by 1
3. Return updated property with remaining balance

### Cost Structure
- **Cost per Feature**: 1 credit from `featuredAdsBalance`
- **Credits are Non-Refundable**: Once used, credits cannot be restored
- **Balance Management**: Companies need to purchase additional credits when balance reaches 0

## Role Permissions

| Role | Feature Property | View Balance |
|------|-----------------|--------------|
| OWNER | ✅ Yes | ✅ Yes |
| MANAGER | ✅ Yes | ✅ Yes |
| AGENT | ❌ No | ✅ Yes |

## Integration Examples

### JavaScript/React Frontend
```javascript
class FeaturedAdsService {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async featureProperty(propertyId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/company/properties/${propertyId}/feature`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    return result;
  }

  async getFeaturedAdsBalance() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/company/featured-ads-balance`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    return result;
  }
}

// Usage
const featuredAds = new FeaturedAdsService('https://api.example.com', userToken);

try {
  // Check balance before featuring
  const balance = await featuredAds.getFeaturedAdsBalance();
  console.log(`Current balance: ${balance.data.featuredAdsBalance}`);
  
  if (balance.data.featuredAdsBalance > 0) {
    // Feature the property
    const result = await featuredAds.featureProperty(123);
    console.log('Property featured successfully');
    console.log(`Remaining balance: ${result.data.remainingBalance}`);
  } else {
    console.log('Insufficient balance. Please purchase more credits.');
  }
} catch (error) {
  console.error('Error:', error.message);
}
```

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';

const PropertyCard = ({ property, onFeature }) => {
  const [balance, setBalance] = useState(null);
  const [featuring, setFeaturing] = useState(false);

  const handleFeature = async () => {
    if (balance <= 0) {
      alert('Insufficient featured ads balance');
      return;
    }

    setFeaturing(true);
    try {
      const result = await onFeature(property.id);
      setBalance(result.data.remainingBalance);
      alert('Property featured successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setFeaturing(false);
  };

  return (
    <div className="property-card">
      <h3>{property.description}</h3>
      <p>Price: {property.price} BHD</p>
      <p>Status: {property.isFeatured ? '⭐ Featured' : 'Regular'}</p>
      
      {!property.isFeatured && (
        <button 
          onClick={handleFeature} 
          disabled={featuring || balance === 0}
        >
          {featuring ? 'Featuring...' : 'Make Featured'}
        </button>
      )}
      
      <small>Balance: {balance} credits</small>
    </div>
  );
};
```

### Mobile App (React Native)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class FeaturedAdsAPI {
  static async featureProperty(propertyId) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(
      `${API_BASE_URL}/api/company/properties/${propertyId}/feature`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json();
  }

  static async getBalance() {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(
      `${API_BASE_URL}/api/company/featured-ads-balance`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    return await response.json();
  }
}
```

## Testing

### Manual Testing Scenarios

#### 1. Happy Path - Owner Features Property
```bash
# 1. Login as company owner
POST /api/auth/employee/login
{
  "email": "owner@company.com",
  "password": "password123"
}

# 2. Check balance
GET /api/company/featured-ads-balance
# Expected: { "success": true, "data": { "featuredAdsBalance": 5 } }

# 3. Feature property
PATCH /api/company/properties/123/feature
# Expected: Success with remaining balance = 4
```

#### 2. Error Path - Agent Attempts to Feature
```bash
# 1. Login as agent
POST /api/auth/employee/login
{
  "email": "agent@company.com",
  "password": "password123"
}

# 2. Attempt to feature property
PATCH /api/company/properties/123/feature
# Expected: 403 Forbidden - "Only company owners and managers can feature properties"
```

#### 3. Error Path - Insufficient Balance
```bash
# 1. Login as owner with 0 balance company
# 2. Attempt to feature property
PATCH /api/company/properties/123/feature
# Expected: 400 Bad Request - "Insufficient featured ads balance"
```

### Automated Testing (Jest)
```javascript
describe('Featured Ads System', () => {
  test('should feature property successfully for owner', async () => {
    const response = await request(app)
      .patch('/api/company/properties/123/feature')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.property.isFeatured).toBe(true);
    expect(response.body.data.remainingBalance).toBe(4);
  });

  test('should reject agent attempting to feature', async () => {
    const response = await request(app)
      .patch('/api/company/properties/123/feature')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Only company owners and managers');
  });

  test('should return current balance', async () => {
    const response = await request(app)
      .get('/api/company/featured-ads-balance')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('featuredAdsBalance');
  });
});
```

## Database Schema

### Related Tables

**companies:**
```sql
featuredAdsBalance INT DEFAULT 0  -- Available featured ad credits
```

**properties:**
```sql
isFeatured BOOLEAN DEFAULT FALSE          -- Whether property is featured
updatedByEmployeeId INT                   -- Who last updated (tracks featuring action)
```

### Transaction Example
```sql
BEGIN;
  UPDATE properties 
  SET isFeatured = TRUE, updatedByEmployeeId = ?
  WHERE id = ? AND companyId = ?;
  
  UPDATE companies 
  SET featuredAdsBalance = featuredAdsBalance - 1 
  WHERE id = ? AND featuredAdsBalance > 0;
COMMIT;
```

## Monitoring & Analytics

### Key Metrics to Track
- Featured ads usage per company
- Conversion rates for featured properties
- Revenue from featured ad purchases
- Balance utilization patterns

### Recommended Logging
```javascript
// Log featured property events
logger.info('Property featured', {
  companyId,
  propertyId,
  employeeId,
  employeeRole,
  remainingBalance,
  timestamp: new Date()
});
```

## Future Enhancements

1. **Batch Featuring**: Feature multiple properties at once
2. **Scheduled Featuring**: Schedule properties to be featured at specific times
3. **Featured Duration**: Time-limited featured status (e.g., 7 days)
4. **Analytics Dashboard**: Track featured property performance
5. **Auto-renewal**: Automatically re-feature popular properties
6. **Pricing Tiers**: Different costs for different feature levels

## Support & Troubleshooting

### Common Issues

**Q: Why can't an agent feature properties?**
A: Only company owners and managers have permission to feature properties as it involves spending company credits.

**Q: What happens if balance reaches 0?**
A: No more properties can be featured until more credits are purchased.

**Q: Can I unfeature a property to get credits back?**
A: No, credits are consumed when featuring and cannot be refunded.

**Q: Why can't I feature an inactive property?**
A: Only active properties can be featured to ensure quality listings.

### Error Resolution
- **401 Unauthorized**: Check JWT token validity and expiration
- **403 Forbidden**: Verify employee role permissions
- **400 Insufficient Balance**: Purchase more featured ad credits
- **404 Property Not Found**: Verify property ID and ownership
