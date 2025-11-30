# Quick Fix: Add Bulk-Sales Permissions

## Immediate Solution (MongoDB)

Run this command in MongoDB Compass, MongoDB Shell, or any MongoDB client:

```javascript
// Update the specific user
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

Or update the role (affects all users with that role):

```javascript
// Update the role
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

## Using the Script

```bash
cd backend
node scripts/addBulkSalesPermissions.js --user 692995d05dd0e4bca4e170a4
```

## Verify the Fix

After updating, the user should be able to access:
- `GET /api/bulk-sales` - Requires `view_bulk_sales`
- `POST /api/bulk-sales` - Requires `create_bulk_sales`
- `PUT /api/bulk-sales/:id` - Requires `update_bulk_sales`
- `DELETE /api/bulk-sales/:id` - Requires `delete_bulk_sales`
- `POST /api/bulk-sales/upload` - Requires `upload_bulk_sales`

