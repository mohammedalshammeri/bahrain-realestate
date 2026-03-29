# Advanced Property Search API Documentation

## Overview
The advanced property search endpoint provides comprehensive filtering, sorting, and pagination capabilities for searching properties in the Bahrain Real Estate system.

## Endpoint
```
GET /api/public/search
```

## Features
- ✅ **Advanced Filtering**: Filter by multiple property attributes
- ✅ **Flexible Sorting**: Sort by price or creation date
- ✅ **Pagination**: Skip/take with total count
- ✅ **Validation**: Input validation with error messages
- ✅ **Performance**: Optimized Prisma queries with AND logic

## Query Parameters

### Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `governorate` | string | Filter by governorate | `?governorate=Manama` |
| `area` | string | Filter by area | `?area=Juffair` |
| `purpose` | string | Property purpose (`sale` or `rent`) | `?purpose=sale` |
| `type` | string | Property type | `?type=apartment` |
| `minPrice` | number | Minimum price | `?minPrice=50000` |
| `maxPrice` | number | Maximum price | `?maxPrice=200000` |
| `bedrooms` | number | Exact number of bedrooms | `?bedrooms=3` |
| `bathrooms` | number | Exact number of bathrooms | `?bathrooms=2` |
| `isFeatured` | boolean | Filter featured properties | `?isFeatured=true` |

### Pagination
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | number | 0 | Number of items to skip |
| `take` | number | 10 | Number of items to return (max 50) |

### Sorting
| Parameter | Type | Default | Description | Options |
|-----------|------|---------|-------------|---------|
| `sortBy` | string | `createdAt` | Field to sort by | `price`, `createdAt` |
| `sortOrder` | string | `desc` | Sort direction | `asc`, `desc` |

## Example Requests

### Basic Search
```bash
GET /api/public/search?governorate=Manama&purpose=sale
```

### Advanced Search with Price Range
```bash
GET /api/public/search?governorate=Manama&purpose=sale&minPrice=100000&maxPrice=300000&bedrooms=3&sortBy=price&sortOrder=asc
```

### Featured Properties Only
```bash
GET /api/public/search?isFeatured=true&take=5
```

### Pagination Example
```bash
GET /api/public/search?skip=20&take=10&sortBy=createdAt&sortOrder=desc
```

### Complex Search
```bash
GET /api/public/search?governorate=Manama&area=Juffair&type=apartment&purpose=rent&minPrice=800&maxPrice=1500&bedrooms=2&bathrooms=2&isFeatured=false&skip=0&take=15&sortBy=price&sortOrder=asc
```

## Response Format

### Success Response
```json
{
  "success": true,
  "items": [
    {
      "id": 1,
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
      "isFeatured": false,
      "status": "active",
      "expiresAt": "2025-01-02T05:19:35.000Z",
      "createdAt": "2024-12-02T05:19:35.000Z",
      "updatedAt": "2024-12-02T05:19:35.000Z",
      "company": {
        "id": 5,
        "name": "Prime Properties Bahrain",
        "email": "info@primeproperties.bh",
        "phone": "+973 1234 5678"
      },
      "propertyImages": [
        {
          "id": 1,
          "propertyId": 1,
          "imageUrl": "https://example.com/image1.jpg",
          "displayOrder": 1,
          "createdAt": "2024-12-02T05:19:35.000Z"
        }
      ]
    }
  ],
  "totalCount": 45,
  "skip": 0,
  "take": 10,
  "pagination": {
    "total": 45,
    "skip": 0,
    "take": 10,
    "pages": 5
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "sortBy must be 'price' or 'createdAt'"
}
```

#### Price Range Error (400)
```json
{
  "success": false,
  "message": "minPrice cannot be greater than maxPrice"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Implementation Details

### Service Layer (`public.service.ts`)

```typescript
export const searchPropertiesService = async (filters: SearchFilters) => {
  // Build WHERE clause using Prisma AND logic
  const whereConditions: any[] = [{ status: "active" }];
  
  // Add filters dynamically
  if (filters.governorate) {
    whereConditions.push({ governorate: filters.governorate });
  }
  // ... other filters
  
  const where = { AND: whereConditions };
  
  // Execute query with includes and sorting
  const [properties, totalCount] = await Promise.all([
    db.property.findMany({ where, include: {...}, skip, take, orderBy }),
    db.property.count({ where })
  ]);
  
  return { success: true, items: properties, totalCount, skip, take };
};
```

### Controller Layer (`public.controller.ts`)

```typescript
export const searchPropertiesController = async (req: Request, res: Response) => {
  // Parse and validate query parameters
  const filters = {
    governorate: req.query.governorate as string,
    // ... other filters with type conversion and validation
  };
  
  // Input validation
  if (filters.sortBy && !['price', 'createdAt'].includes(filters.sortBy)) {
    return res.status(400).json({ success: false, message: "Invalid sortBy" });
  }
  
  // Call service and return response
  const result = await searchPropertiesService(filters);
  res.status(200).json(result);
};
```

## Query Optimization

### Database Performance
- Uses Prisma's `AND` logic for efficient WHERE clauses
- Parallel execution of count and data queries with `Promise.all()`
- Proper indexing on frequently searched fields
- Includes only necessary related data

### Query Structure
```prisma
// Efficient WHERE with AND conditions
where: {
  AND: [
    { status: "active" },
    { governorate: "Manama" },
    { purpose: "sale" },
    { price: { gte: "100000", lte: "300000" } }
  ]
}

// Optimized includes
include: {
  company: { select: { id, name, email, phone } },
  propertyImages: { orderBy: { displayOrder: "asc" } }
}
```

## Validation Rules

1. **Sort Parameters**: Only `price` and `createdAt` allowed for `sortBy`
2. **Sort Order**: Only `asc` and `desc` allowed for `sortOrder`
3. **Price Range**: `minPrice` cannot be greater than `maxPrice`
4. **Pagination**: `take` is limited to maximum 50 items
5. **Boolean Values**: `isFeatured` accepts `'true'`, `'false'`, or undefined

## Performance Considerations

- **Pagination Limit**: Maximum 50 results per request to prevent performance issues
- **Index Usage**: Queries utilize database indexes on `status`, `governorate`, `purpose`, etc.
- **Response Size**: Only essential company data included to reduce payload
- **Caching**: Consider implementing Redis caching for frequent searches

## Usage Examples

### Frontend Integration
```javascript
// React/JavaScript example
const searchProperties = async (filters) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/public/search?${queryParams}`);
  return await response.json();
};

// Usage
const results = await searchProperties({
  governorate: 'Manama',
  purpose: 'sale',
  minPrice: 100000,
  maxPrice: 300000,
  bedrooms: 3,
  sortBy: 'price',
  sortOrder: 'asc'
});
```

### Mobile App Integration
```swift
// Swift example
func searchProperties(filters: [String: Any]) async -> SearchResult {
  let queryItems = filters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
  var urlComponents = URLComponents(string: "/api/public/search")!
  urlComponents.queryItems = queryItems
  
  let (data, _) = try await URLSession.shared.data(from: urlComponents.url!)
  return try JSONDecoder().decode(SearchResult.self, from: data)
}
```

## Testing

### Test Cases
1. **Basic Filters**: Test each filter parameter individually
2. **Combined Filters**: Test multiple filters together
3. **Price Ranges**: Test min/max price combinations
4. **Sorting**: Test both sort fields and orders
5. **Pagination**: Test skip/take with various values
6. **Validation**: Test invalid parameters and edge cases
7. **Empty Results**: Test searches that return no results
8. **Performance**: Test with large datasets

### Sample Test Data
```bash
# Test individual filters
curl "/api/public/search?governorate=Manama"
curl "/api/public/search?purpose=sale"
curl "/api/public/search?minPrice=100000"

# Test combinations
curl "/api/public/search?governorate=Manama&purpose=sale&bedrooms=3"

# Test sorting
curl "/api/public/search?sortBy=price&sortOrder=asc"

# Test pagination
curl "/api/public/search?skip=10&take=5"

# Test validation errors
curl "/api/public/search?sortBy=invalid"
curl "/api/public/search?minPrice=200000&maxPrice=100000"
```
