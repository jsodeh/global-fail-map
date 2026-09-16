# Phase 4: Admin Authentication - Implementation Guide

## Overview

Admin authentication using **iron-session** (encrypted cookie sessions) with **bcrypt** password hashing. No public registration - first admin created via CLI seed script.

## Architecture

### Session Management
- **iron-session**: Encrypted cookie-based sessions (no JWT complexity)
- **Cookie name**: `progress-map-session`
- **Duration**: 7 days
- **Security**: httpOnly, sameSite=lax, secure in production

### Password Security
- **bcryptjs**: 12 salt rounds
- **Validation**: Min 8 chars, uppercase, lowercase, number
- **No password reset** (phase 4) - add in later phases if needed

### Access Control
- **No public registration endpoint**
- First admin: CLI seed script only (`pnpm db:seed-admin`)
- Additional admins: Created by existing admins from dashboard (Phase 5+)
- Two roles: `admin` and `super_admin`

## Files Created

```
src/lib/auth/
├── session.ts              # iron-session config and SessionData type
├── password.ts             # bcrypt hash/verify/validate
├── server-session.ts       # Server-side session utilities
└── index.ts                # Exports

src/lib/stores/
└── use-admin-session.ts    # Client-side Zustand store

src/app/api/admin/
├── login/route.ts          # POST /api/admin/login
├── logout/route.ts         # POST /api/admin/logout
└── session/route.ts        # GET /api/admin/session

src/app/admin/
├── page.tsx                # Admin dashboard (protected)
└── login/page.tsx          # Login page

scripts/
└── seed-admin.ts           # CLI script to create first admin
```

## Environment Variables

Added to `.env.local`:
```bash
SESSION_SECRET=NwZA+QRS++dffm+fhTugznaG290Fh8q4UpOjrF3MuHc=
```

Generate a new one with:
```bash
openssl rand -base64 32
```

## Usage

### 1. Create First Admin (One-Time Setup)

```bash
pnpm db:seed-admin
```

**Interactive prompts:**
- Admin name
- Admin email
- Password (validated for strength)
- Confirm password

**Output:**
```
✅ Admin account created successfully!
┌─────────────────────────────────────────────────┐
│  Admin Details                                  │
├─────────────────────────────────────────────────┤
│  Name:  John Doe                                │
│  Email: john@example.com                        │
│  Role:  super_admin                             │
└─────────────────────────────────────────────────┘

You can now log in at /admin/login
```

**Note**: First admin is always `super_admin`. Script will refuse to run if any admins already exist.

### 2. Login

Navigate to `/admin/login` and enter email/password.

### 3. Access Dashboard

After login, redirected to `/admin` (currently a placeholder - full dashboard in Phase 5+).

### 4. Logout

Click "Logout" button in dashboard nav.

## API Routes

### POST /api/admin/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "super_admin"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account deactivated

### POST /api/admin/logout
**Response (200):**
```json
{
  "success": true
}
```

### GET /api/admin/session
**Response (200):**
```json
{
  "session": {
    "adminId": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "super_admin",
    "isLoggedIn": true
  }
}
```

Or if not logged in:
```json
{
  "session": {
    "adminId": "",
    "email": "",
    "name": "",
    "role": "admin",
    "isLoggedIn": false
  }
}
```

## Server-Side Session Utilities

Use in API routes and Server Components:

```typescript
import { requireAuth, requireSuperAdmin, getSession } from '@/lib/auth/server-session';

// Get session (no error if not logged in)
const session = await getSession();
if (session.isLoggedIn) {
  // ...
}

// Require authentication (throws if not logged in)
const session = await requireAuth();

// Require super admin (throws if not super admin)
const session = await requireSuperAdmin();
```

**Example protected API route:**
```typescript
import { requireAuth } from '@/lib/auth/server-session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only authenticated admins can reach here
    // session.adminId, session.role available
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

## Client-Side Session Hook

Use in React components:

```typescript
'use client';
import { useAdminSession } from '@/lib/stores/use-admin-session';

function MyComponent() {
  const { session, isLoading, login, logout, fetchSession } = useAdminSession();
  
  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);
  
  // Check if logged in
  if (session.isLoggedIn) {
    return <div>Welcome {session.name}</div>;
  }
  
  // Login
  await login(email, password);
  
  // Logout
  await logout();
}
```

## Security Features

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Session Security
- **httpOnly**: Cookie not accessible via JavaScript (XSS protection)
- **sameSite=lax**: CSRF protection
- **secure**: HTTPS-only in production
- **Encrypted**: iron-session encrypts the entire cookie payload
- **7-day expiration**: Sessions automatically expire

### Account Security
- **No public registration**: Only CLI seed script or existing admins can create accounts
- **Active flag**: Admins can be deactivated (blocks login)
- **Role-based access**: `admin` vs `super_admin` for future permission granularity

## Password Strength Examples

❌ **Weak** (rejected):
- `password` - no uppercase, no number
- `Password` - no number
- `Pass123` - less than 8 characters

✅ **Strong** (accepted):
- `SecurePass123`
- `Admin2026!`
- `MyP@ssw0rd`

## Next Steps (Phase 5+)

With authentication in place, Phase 5 will build:

1. **Admin management UI** (super admins only)
   - List all admins
   - Create new admin accounts
   - Deactivate/reactivate admins
   - Change roles

2. **Project intake forms**
   - Create new projects
   - Add budget data
   - Record status updates
   - Upload source documents

3. **Protected API routes**
   - All project CRUD operations require authentication
   - Super admin-only operations (user management)

## Testing

### Manual Test Flow

1. **Create first admin:**
   ```bash
   pnpm db:seed-admin
   ```
   Enter: name, email, password

2. **Start dev server:**
   ```bash
   pnpm dev
   ```

3. **Navigate to login:**
   http://localhost:3000/admin/login

4. **Enter credentials** and submit

5. **Verify redirect** to /admin dashboard

6. **Check session** in browser DevTools:
   - Application tab → Cookies
   - Should see `progress-map-session` cookie (encrypted, can't read value)

7. **Logout** and verify redirect to login

8. **Try accessing /admin** while logged out - should redirect to login

### Verify Database

```bash
psql $DATABASE_URL -c "SELECT name, email, role, is_active FROM admins;"
```

Should show your created admin.

## Troubleshooting

### "SESSION_SECRET environment variable must be set"
- Ensure `.env.local` exists with `SESSION_SECRET`
- Generate one: `openssl rand -base64 32`

### "Admin accounts already exist"
- Seed script only runs once
- To reset: delete admins from database and run script again
- Or create additional admins from dashboard (Phase 5+)

### Login fails with "Invalid email or password"
- Check email is lowercase (stored as lowercase)
- Verify password meets strength requirements
- Check admin `is_active = true` in database

### Session not persisting
- Check browser cookies are enabled
- Verify `SESSION_SECRET` is set
- In production, ensure HTTPS (secure cookie flag)

## Dependencies Added

```json
{
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "iron-session": "^9.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^3.0.0"
  }
}
```

---

**Phase 4 Status**: Complete ✅  
**Next**: Phase 5 - Admin Intake Forms & Dashboard
