# Authentication System Documentation

## Overview

The MyMovieList application uses **Supabase Authentication** to handle user registration, login, password reset, and session management. Supabase provides a complete authentication solution with email verification, secure password hashing, and JWT-based sessions.

---

## Architecture

### Key Components

1. **Supabase Client** (`lib/supabaseClient.ts`)
   - Initializes the Supabase client with environment variables
   - Provides a singleton instance for the entire application

2. **Authentication Library** (`lib/auth.ts`)
   - Wrapper functions for common authentication operations
   - Functions: `signUp()`, `signIn()`, `checkEmailExists()`, `resetPassword()`

3. **Authentication UI**
   - **AuthForm Component** (`app/components/AuthForm/AuthForm.tsx`)
     - Handles login, signup, and forgot password forms
     - Manages form state and validation
     - Implements email confirmation polling
   - **Authentication Page** (`app/authentication/page.tsx`)
     - Main authentication route
     - Toggle between login and signup modes
   - **Reset Password Page** (`app/authentication/reset-password/page.tsx`)
     - Handles password reset flow after user clicks email link

---

## Authentication Flow

### 1. User Registration (Sign Up)

```
User fills form → Check email doesn't exist → Create account in Supabase → 
Send confirmation email → Poll for confirmation → Auto-login on confirmation
```

**Step-by-step:**

1. User enters username, email, password, and confirms password
2. Form validates that passwords match
3. System checks if email already exists using `checkEmailExists()`
4. Supabase creates user account with `signUp(email, password)`
5. Supabase sends confirmation email to user
6. System starts polling (every 5 seconds, max 12 attempts = 60 seconds)
7. When user confirms email, polling detects successful login
8. User is automatically redirected to home page

**Code Location:** `AuthForm.tsx` → `handleSubmit()` when `!isLogin`

**Supabase API:**
```typescript
await supabase.auth.signUp({ email, password })
```

---

### 2. User Login (Sign In)

```
User enters credentials → Supabase validates → Creates session → Redirect to home
```

**Step-by-step:**

1. User enters email and password
2. System calls `signIn(email, password)`
3. Supabase validates credentials and creates JWT session
4. On success, user is redirected to home page (`/`)
5. On failure, error message is displayed

**Code Location:** `AuthForm.tsx` → `handleSubmit()` when `isLogin`

**Supabase API:**
```typescript
await supabase.auth.signInWithPassword({ email, password })
```

---

### 3. Password Reset (Forgot Password)

```
User requests reset → Supabase sends email → User clicks link → 
Session created → User enters new password → Password updated
```

**Step-by-step:**

1. User clicks "Forgot your password?" on login form
2. User enters email address
3. System calls `resetPassword(email)`
4. Supabase sends password reset email with magic link
5. User clicks link in email
6. Link redirects to `/authentication/reset-password` with auth token
7. System validates token by checking session
8. User enters and confirms new password
9. System updates password with `supabase.auth.updateUser()`
10. User is redirected to login page

**Code Locations:**
- Request reset: `AuthForm.tsx` → `handleSubmit()` when `isForgotPassword`
- Reset page: `app/authentication/reset-password/page.tsx`

**Supabase API:**
```typescript
// Send reset email
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/authentication/reset-password`
})

// Update password
await supabase.auth.updateUser({ password: newPassword })
```


## Session Management

### How Sessions Work

1. **Session Creation**: When a user logs in, Supabase creates a JWT (JSON Web Token) and stores it in browser storage
2. **Session Persistence**: Sessions are automatically persisted across page reloads
3. **Session Validation**: Supabase automatically refreshes tokens before expiration
4. **Session Retrieval**: Use `supabase.auth.getSession()` to check current session

### Checking Authentication Status

```typescript
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // User is authenticated
  const user = session.user
}
```

---

## Email Confirmation Polling

### Why Polling?

After signup, users must confirm their email. The system implements polling to automatically log users in once they confirm, providing a seamless experience without requiring them to manually log in again.

### Implementation Details

**Polling Parameters:**
- **Interval**: 5 seconds (5000ms)
- **Max Attempts**: 12 (total 60 seconds)
- **Method**: Attempts login in background

**Code Location:** `AuthForm.tsx` → `startPollingForConfirmation()`

```typescript
const pollInterval = 5000  // 5 seconds
const maxAttempts = 12     // 60 seconds total

// Polls by attempting sign in every 5 seconds
// On success: redirects to home
// On max attempts: stops and shows timeout message
```

---

## Security Features

### 1. Password Requirements
- Minimum 6 characters (enforced by Supabase)
- Password confirmation on signup
- Secure hashing via Supabase (bcrypt)

### 2. Email Verification
- Required before first login
- Prevents fake account creation
- Confirmation link sent via Supabase

### 3. Password Reset Security
- Magic link with time-limited token
- Token validates via Supabase session
- Old password not required (email verification is sufficient)

### 4. Duplicate Email Prevention
- Checks email existence before signup
- Prevents multiple accounts with same email
- User-friendly error messages

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Passwords do not match" | Confirmation password mismatch | Re-enter matching passwords |
| "This email is already in use" | Email exists in database | Use different email or login |
| "Invalid or expired reset link" | Password reset token expired | Request new reset email |
| "Confirmation timed out" | Email not confirmed within 60s | Manually login after confirming |
| "Not yet confirmed" | Attempting login before email confirmation | Check email and confirm account |

---

## API Reference

### `lib/auth.ts` Functions

#### `signUp(email: string, password: string)`
Creates a new user account.

**Returns:** `{ user: User | null, error: Error | null }`

**Example:**
```typescript
const { user, error } = await signUp('user@example.com', 'password123')
```

---

#### `signIn(email: string, password: string)`
Authenticates an existing user.

**Returns:** `Promise<void>`

**Throws:** Error if authentication fails

**Example:**
```typescript
try {
  await signIn('user@example.com', 'password123')
  // Redirect to home
} catch (error) {
  // Show error message
}
```

---

#### `checkEmailExists(email: string)`
Checks if an email is already registered.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const exists = await checkEmailExists('user@example.com')
if (exists) {
  // Show "email already in use" error
}
```

---

#### `resetPassword(email: string)`
Sends password reset email.

**Returns:** `Promise<void>`

**Throws:** Error if email sending fails

**Example:**
```typescript
try {
  await resetPassword('user@example.com')
  // Show success message
} catch (error) {
  // Show error message
}
```

---

## UI Components

### AuthForm Component

**Props:**
- `isLogin: boolean` - Toggle between login/signup mode
- `toggleMode: () => void` - Function to switch modes

**States:**
- Login mode: Email + Password
- Signup mode: Username + Email + Password + Confirm Password
- Forgot Password mode: Email only

**Features:**
- Form validation
- Loading states
- Success/error messages
- Email confirmation polling
- Forgot password toggle

---

### Reset Password Page

**Route:** `/authentication/reset-password`

**Features:**
- Token validation on mount
- New password + confirmation
- Password strength check (min 6 chars)
- Auto-redirect after success

---

## Supabase Dashboard Configuration

### Email Templates

Configure in Supabase Dashboard → Authentication → Email Templates

1. **Confirm signup**: Sent when user creates account
2. **Reset password**: Sent when user requests password reset
3. **Magic link**: (Optional) For passwordless login

### Authentication Settings

Configure in Supabase Dashboard → Authentication → Settings

- **Email confirmation**: Required (recommended)
- **Redirect URLs**: Add your application URLs
  - `http://localhost:3000/authentication/reset-password`
  - `https://yourdomain.com/authentication/reset-password`

---

## Database Integration

### User Table Structure

Supabase creates an `auth.users` table automatically:

```sql
auth.users
  - id (uuid) - Primary key
  - email (text) - User email
  - encrypted_password (text) - Hashed password
  - email_confirmed_at (timestamp) - Confirmation timestamp
  - created_at (timestamp)
  - updated_at (timestamp)
```

### Linking to Custom Tables

You can link user data to your custom tables:

```sql
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text,
  avatar_url text,
  created_at timestamp DEFAULT now()
);
```

---

## Testing Authentication

### Manual Testing Checklist

- [ ] Sign up with new email
- [ ] Receive confirmation email
- [ ] Confirm email via link
- [ ] Auto-login after confirmation
- [ ] Sign out and sign in manually
- [ ] Request password reset
- [ ] Click reset link in email
- [ ] Update password successfully
- [ ] Sign in with new password
- [ ] Test invalid credentials
- [ ] Test duplicate email signup
- [ ] Test password mismatch on signup

---

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify email in Supabase Dashboard → Authentication → Users
3. Check email service configuration in Supabase settings
4. Ensure email templates are properly configured

### Session Not Persisting
1. Check browser storage (localStorage/cookies)
2. Verify Supabase URL and Anon Key are correct
3. Check for CORS issues in browser console
4. Ensure `.env.local` variables are prefixed with `NEXT_PUBLIC_`

### Password Reset Link Not Working
1. Check redirect URL in Supabase settings
2. Verify token hasn't expired (default: 1 hour)
3. Ensure `/authentication/reset-password` route exists
4. Check browser console for errors

---

## Future Enhancements

### Potential Improvements

1. **OAuth Integration**: Add Google, GitHub, Facebook login
2. **Two-Factor Authentication**: Add 2FA for enhanced security
3. **Remember Me**: Persist sessions longer
4. **Account Deletion**: Allow users to delete their accounts
5. **Email Change**: Allow users to update their email address
6. **Profile Management**: Add username, avatar, bio fields
7. **Session Management**: Show active sessions, logout from all devices

### OAuth Example

```typescript
// Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

---

## Conclusion

The authentication system is built on Supabase's robust infrastructure, providing:
- ✅ Secure password hashing and storage
- ✅ Email verification
- ✅ Password reset functionality
- ✅ JWT-based session management
- ✅ Automatic token refresh
- ✅ User-friendly error handling
- ✅ Modern, responsive UI

For questions or issues, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
- Project repository issues

---

**Last Updated:** November 26, 2025
