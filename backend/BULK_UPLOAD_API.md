# Bulk User Upload API Documentation

## Overview
The Bulk User Upload feature allows administrators to create multiple users at once by uploading a CSV or Excel file. The system validates all data before creation and provides detailed error reporting.

## Endpoints

### 1. Download Template
**GET** `/api/auth/bulk-upload/template/`

Downloads a CSV template file with sample data.

**Response:** CSV file download

---

### 2. Preview Upload
**POST** `/api/auth/bulk-upload/preview/`

Upload a file and get validation preview without creating users.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (CSV or XLSX file)

**Response:**
```json
{
  "preview": [
    {
      "employee_id": "EMP-20001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "department": "Security",
      "designation": "Guard",
      "client_name": "SecureGuard India",
      "site_name": "Mumbai HQ",
      "role": "trainee",
      "row_number": 2,
      "status": "valid",
      "errors": []
    },
    {
      "employee_id": "EMP-20002",
      "first_name": "Jane",
      "last_name": "",
      "email": "invalid-email",
      "department": "Training",
      "designation": "Trainer",
      "client_name": "",
      "site_name": "",
      "role": "trainer",
      "row_number": 3,
      "status": "error",
      "errors": [
        "Last name is required",
        "Invalid email format"
      ]
    }
  ],
  "total_rows": 2,
  "valid_count": 1,
  "error_count": 1,
  "file_name": "users.csv"
}
```

---

### 3. Create Users
**POST** `/api/auth/bulk-upload/create/`

Create users from validated rows.

**Request:**
```json
{
  "validated_rows": [
    {
      "employee_id": "EMP-20001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "department": "Security",
      "designation": "Guard",
      "client_name": "SecureGuard India",
      "site_name": "Mumbai HQ",
      "role": "trainee",
      "row_number": 2,
      "status": "valid",
      "errors": []
    }
  ]
}
```

**Response:**
```json
{
  "created_count": 1,
  "skipped_count": 0,
  "errors": [],
  "message": "Successfully created 1 users. 0 rows were skipped."
}
```

---

## CSV File Format

### Required Columns
1. **Employee ID** - Unique identifier (will be used as username)
2. **First Name** - User's first name
3. **Last Name** - User's last name
4. **Email** - Valid email address
5. **Department** - Department name (optional)
6. **Designation** - Job title (optional)
7. **Client** - Client name (optional)
8. **Site** - Site name (optional)
9. **Role** - User role (required)

### Valid Roles
- `trainee` or `guard` → Creates trainee user
- `trainer` or `instructor` → Creates trainer user
- `admin` or `manager` → Creates admin user
- `superadmin` or `super admin` → Creates superadmin user

### Example CSV
```csv
Employee ID,First Name,Last Name,Email,Department,Designation,Client,Site,Role
EMP-20001,John,Doe,john.doe@example.com,Security,Guard,SecureGuard India,Mumbai HQ,trainee
EMP-20002,Jane,Smith,jane.smith@example.com,Training,Trainer,SecureGuard India,Delhi Office,trainer
```

---

## Validation Rules

### Employee ID
- Required
- Must be unique in the file
- Must not already exist in the database
- Will be used as the username

### Email
- Required
- Must be valid email format
- Must be unique in the file
- Must not already exist in the database

### Name
- First name and last name are required
- Can contain letters, spaces, and hyphens

### Role
- Required
- Must be one of the valid roles listed above
- Case-insensitive

### Default Password
All created users will have a default password: `{employee_id}@123`

Example: User with Employee ID `EMP-20001` will have password `EMP-20001@123`

**Users should change their password on first login.**

---

## Error Handling

### File Errors
- Invalid file format (not CSV or XLSX)
- Missing required columns
- File encoding issues

### Row Errors
- Duplicate Employee ID (in file or database)
- Duplicate email (in file or database)
- Missing required fields
- Invalid email format
- Invalid role

All errors are reported with row numbers for easy correction.

---

## Permissions
Only users with `admin` or `superadmin` roles can perform bulk uploads.

---

## Tenant Scoping
- **Superadmin**: Can create users for any tenant
- **Admin**: Can only create users for their own tenant

---

## Best Practices

1. **Download the template** first to ensure correct format
2. **Start with a small test file** (5-10 users) to verify format
3. **Review the preview** carefully before creating users
4. **Fix all errors** before uploading, or accept that error rows will be skipped
5. **Inform users** of their default passwords and require password change
6. **Keep a backup** of your CSV file for records

---

## Example Usage Flow

1. Admin downloads template: `GET /api/auth/bulk-upload/template/`
2. Admin fills in user data in Excel/CSV
3. Admin uploads file for preview: `POST /api/auth/bulk-upload/preview/`
4. System validates and returns preview with errors
5. Admin fixes errors and re-uploads, or proceeds with valid rows
6. Admin confirms creation: `POST /api/auth/bulk-upload/create/`
7. System creates users and returns results
8. Admin notifies users of their credentials
