# Adding Bulk-Sales Permissions

## Quick Fix Options

### Option 1: Update User's permissionsOverride (Recommended for immediate fix)

Run this MongoDB command or use the script:

```javascript
// MongoDB Shell or Compass
db.users.updateOne(
  { _id: ObjectId("692995d05dd0e4bca4e170a4") },
  { 
    $addToSet: { 
      permissionsOverride: { 
        $each: [
          "view_bulk_sales",
          "create_bulk_sales",
          "update_bulk_sales",
          "delete_bulk_sales",
          "upload_bulk_sales"
        ]
      }
    },
    $set: { updatedAt: new Date() }
  }
)
```

### Option 2: Update the Role

```javascript
// MongoDB Shell or Compass
db.roles.updateOne(
  { _id: ObjectId("69230c0482d916ebf8ddc87c") },
  { 
    $addToSet: { 
      permissions: { 
        $each: [
          "view_bulk_sales",
          "create_bulk_sales",
          "update_bulk_sales",
          "delete_bulk_sales",
          "upload_bulk_sales"
        ]
      }
    },
    $set: { updatedAt: new Date() }
  }
)
```

### Option 3: Use the Script

```bash
# Add to specific user
node scripts/addBulkSalesPermissions.js --user 692995d05dd0e4bca4e170a4

# Add to specific role
node scripts/addBulkSalesPermissions.js --role 69230c0482d916ebf8ddc87c

# Add to all admin users
node scripts/addBulkSalesPermissions.js --admin

# Add to Admin role (affects all users with Admin role)
node scripts/addBulkSalesPermissions.js --admin-role
```

## Required Permissions for Bulk-Sales

- `view_bulk_sales` - View bulk sales list (GET /api/bulk-sales)
- `create_bulk_sales` - Create bulk sales (POST /api/bulk-sales)
- `update_bulk_sales` - Update bulk sales (PUT /api/bulk-sales/:id)
- `delete_bulk_sales` - Delete bulk sales (DELETE /api/bulk-sales/:id)
- `upload_bulk_sales` - Upload CSV file (POST /api/bulk-sales/upload)

