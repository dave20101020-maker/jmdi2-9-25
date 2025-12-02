# NorthStar Authentication System

## Overview

The NorthStar backend uses JWT-based authentication with httpOnly cookies for secure session management. The system includes user registration, login, email verification, password reset, and role-based access control.

## Architecture

### Key Components

1. **User Model** (`backend/models/User.js`)
   - Stores user credentials and profile information
   - Includes subscription tier and pillar access control
   - Tracks gamification data (streaks, badges)
   - Manages settings and preferences

2. **Auth Middleware** (`backend/middleware/authMiddleware.js`)
   - `authRequired`: Protects routes requiring authentication
   - `requirePillarAccess`: Controls access to specific wellness pillars based on subscription
   - `logout`: Clears authentication cookies

3. **User Controller** (`backend/controllers/userController.js`)
   - Handles user registration, login, verification
   - Manages password reset flow
   - Provides user profile CRUD operations

4. **Auth Routes** (`backend/routes/auth.js`)
   - Legacy auth routes (can be migrated to /api/users)
   
5. **User Routes** (`backend/routes/userRoutes.js`)
   - Modern auth and user management endpoints

## User Model Schema

```javascript
{
  name: String,                    // User's display name
  username: String,                // Unique username (3-30 chars)
  email: String,                   // Unique email (validated)
  passwordHash: String,            // Bcrypt hashed password
  subscriptionTier: String,        // 'free' | 'basic' | 'premium' | 'nhs_referred'
  allowedPillars: [String],        // Accessible wellness pillars based on tier
  
  // Pillar progress tracking
  pillars: Map<String, {
    score: Number,                 // Current pillar score (0-100)
    lastUpdated: Date,
    isActive: Boolean
  }>,
  
  // User settings
  settings: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    },
    privacy: {
      profileVisibility: String,   // 'public' | 'friends' | 'private'
      showActivity: Boolean,
      showStats: Boolean
    },
    preferences: {
      theme: String,               // 'light' | 'dark' | 'auto'
      language: String,
      timezone: String,
      startOfWeek: String          // 'sunday' | 'monday'
    },
    coaching: {
      aiCoachEnabled: Boolean,
      coachingFrequency: String,   // 'daily' | 'weekly' | 'asNeeded'
      focusAreas: [String]
    }
  },
  
  // Gamification
  current_streak: Number,
  longest_streak: Number,
  badges: [String],
  
  // Email verification
  emailVerified: Boolean,
  verificationToken: String,
  verificationTokenExpires: Date,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Account management
  isActive: Boolean,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Public Endpoints (No Authentication)

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "subscriptionTier": "free"  // optional, defaults to 'free'
}

Response 201:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "subscriptionTier": "free",
    "allowedPillars": ["sleep", "mental_health"],
    "emailVerified": false
  },
  "message": "User registered successfully. Please check your email to verify your account."
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "emailOrUsername": "johndoe",
  "password": "securePassword123"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "subscriptionTier": "free",
    "allowedPillars": ["sleep", "mental_health"],
    "emailVerified": false,
    "settings": { ... }
  }
}
```

#### Verify Email
```http
POST /api/users/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}

Response 200:
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Forgot Password
```http
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response 200:
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent"
}
```

#### Reset Password
```http
POST /api/users/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}

Response 200:
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Protected Endpoints (Authentication Required)

All protected endpoints require a valid JWT token in either:
- Cookie: `ns_token` (httpOnly)
- Header: `Authorization: Bearer <token>`

#### Get Current User
```http
GET /api/users/me
Cookie: ns_token=<jwt_token>

Response 200:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "subscriptionTier": "free",
    "allowedPillars": ["sleep", "mental_health"],
    "pillars": { ... },
    "settings": { ... },
    "emailVerified": false,
    "current_streak": 5,
    "longest_streak": 10,
    "badges": ["early_bird", "consistent"],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-12-02T12:00:00.000Z"
  }
}
```

#### Update Current User
```http
PUT /api/users/me
Cookie: ns_token=<jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "settings": {
    "preferences": {
      "theme": "dark"
    }
  }
}

Response 200:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Smith",
    "username": "johndoe",
    "email": "john@example.com",
    "settings": { ... }
  }
}
```

#### Change Password
```http
POST /api/users/change-password
Cookie: ns_token=<jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}

Response 200:
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Resend Verification Email
```http
POST /api/users/resend-verification
Cookie: ns_token=<jwt_token>

Response 200:
{
  "success": true,
  "message": "Verification email sent"
}
```

#### Export User Data (GDPR)
```http
GET /api/users/export
Cookie: ns_token=<jwt_token>

Response 200:
Content-Type: application/json
Content-Disposition: attachment; filename="northstar_export_user_id_2025-12-02.json"

{
  "exportedAt": "2025-12-02T12:00:00.000Z",
  "profile": { ... },
  "onboarding": { ... },
  "pillarScores": [ ... ],
  "actionPlans": [ ... ],
  "messages": [ ... ],
  "challenges": [ ... ],
  "friends": [ ... ],
  "checkins": [ ... ],
  "notifications": [ ... ]
}
```

#### Delete Account
```http
POST /api/users/delete-account
Cookie: ns_token=<jwt_token>

Response 200:
{
  "success": true
}
```

#### Logout
```http
POST /api/auth/logout

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Subscription Tiers & Pillar Access

### Free Tier
- Access to 2 pillars: `sleep`, `mental_health`

### Basic Tier
- Access to 4 pillars: `sleep`, `diet`, `exercise`, `physical_health`

### Premium & NHS Referred
- Access to all 8 pillars: `sleep`, `diet`, `exercise`, `physical_health`, `mental_health`, `finances`, `social`, `spirituality`

## Middleware Usage

### Protect a Route
```javascript
import { authRequired } from '../middleware/authMiddleware.js';

router.get('/protected', authRequired, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### Require Pillar Access
```javascript
import { authRequired, requirePillarAccess } from '../middleware/authMiddleware.js';

// Pillar ID from route param
router.get('/pillar/:pillarId', authRequired, requirePillarAccess('pillarId'), (req, res) => {
  // User has access to this pillar
});

// Pillar ID from request body
router.post('/checkin', authRequired, requirePillarAccess('pillarId'), (req, res) => {
  // req.body.pillarId is validated
});
```

## Security Features

1. **Password Hashing**: bcrypt with salt rounds (10)
2. **JWT Tokens**: 7-day expiration, httpOnly cookies
3. **Rate Limiting**: 20 requests per 15 minutes for auth endpoints
4. **Token Verification**: Automatic verification with user lookup
5. **Password Strength**: Minimum 8 characters
6. **Secure Cookies**: httpOnly, secure (production), sameSite
7. **Email Enumeration Protection**: Generic messages for forgot password
8. **Token Expiration**: 24h for email verification, 1h for password reset

## Environment Variables

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
JWT_COOKIE_NAME=ns_token
NODE_ENV=production
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (not authenticated or invalid credentials)
- `403`: Forbidden (authenticated but no access)
- `404`: Not Found
- `409`: Conflict (duplicate email/username)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## TODO

- [ ] Implement email sending service (verification & password reset)
- [ ] Add OAuth providers (Google, Apple, Facebook)
- [ ] Implement refresh tokens
- [ ] Add two-factor authentication (2FA)
- [ ] Add admin role and permissions system
- [ ] Add account suspension/moderation features
- [ ] Add login history and session management
- [ ] Implement CAPTCHA for registration/login
