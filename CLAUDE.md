# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EMS CONNECT is a React Native mobile application built with Expo Router for emergency medical services. The app serves two user roles:
- **Community Users**: Report emergencies and request help
- **Responders**: Receive dispatch assignments and manage emergency responses

**Tech Stack:**
- React Native 0.81.5 + Expo SDK 54
- Expo Router (file-based routing)
- TypeScript
- Axios for API calls
- Laravel Sanctum authentication (backend: https://emsconnect.online/api)
- Agora for voice calls
- expo-location for GPS tracking
- expo-notifications for dispatch alerts

## Development Commands

```bash
# Start development server
npm start

# Run on platforms
npm run android
npm run ios
npm run web

# Linting
npm run lint

# Rebuild native code (required after changing app.json or adding native dependencies)
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

## Architecture

### Authentication & Role-Based Routing

The app uses a custom auth system with role-based navigation:
- `app/_layout.tsx`: Root layout wraps the app in `AuthProvider` and `DispatchProvider`
- `src/contexts/AuthContext.tsx`: Manages authentication state, stores Sanctum token in expo-secure-store
- Navigation logic redirects users to role-specific tabs after login:
  - Responders → `/(tabs)/responder/home`
  - Community → `/(tabs)/community/home`

**Auth Flow:**
1. User logs in via `app/auth/login.tsx`
2. Backend returns Sanctum token + user role
3. Token stored securely, auto-injected into all API requests via axios interceptor (see `src/services/api.ts`)
4. 401 responses automatically clear auth state

### Dispatch System (Responders Only)

Real-time dispatch management system with foreground location tracking:

**State Management:**
- `src/contexts/DispatchContext.tsx`: Global dispatch state
  - Manages duty status (on/off)
  - Polls dispatches every 5 seconds when on duty
  - Tracks location every 30 seconds via `setInterval`
  - Triggers notifications for new assignments

**Key Services:**
- `src/services/dispatch.service.ts`: API calls for dispatches, location updates, duty status
- `src/services/location.service.ts`: Foreground GPS tracking (high accuracy)
- `src/services/notification.service.ts`: Local push notifications

**Dispatch Lifecycle:**
```
assigned → accepted → en_route → arrived → completed
           ↓
        declined
```

**Important:** Location tracking is foreground-only (app must be open). Stops automatically when responder goes off duty.

### Service Layer Pattern

All backend communication follows this pattern (see `src/services/`):
```typescript
import api from './api'; // Auto-injects Bearer token

export const myFunction = async (data: RequestType): Promise<ResponseType> => {
  try {
    const response = await api.post<ResponseType>('/endpoint', data);
    return response.data;
  } catch (error: any) {
    console.error('[Service Name] Error:', error.response?.data || error.message);
    throw error;
  }
};
```

**Available Services:**
- `auth.service.ts`: Login, signup, email verification
- `incident.service.ts`: Create/manage emergency incidents
- `dispatch.service.ts`: Dispatch management (responders)
- `user.service.ts`: Profile management
- `call.service.ts`: Emergency voice calls

### Expo Router File Structure

File-based routing with role-specific tabs:
```
app/
├── _layout.tsx                    # Root: AuthProvider + DispatchProvider
├── auth/
│   ├── login.tsx                  # Login screen
│   ├── signup.tsx                 # Registration
│   └── verify-email.tsx           # Email verification
└── (tabs)/
    ├── _layout.tsx                # Tab navigator (role-aware)
    ├── community/                 # Community user screens
    │   ├── _layout.tsx            # Community tabs
    │   ├── home.tsx
    │   ├── emergency-call.tsx
    │   └── history.tsx
    └── responder/                 # Responder screens
        ├── _layout.tsx            # Responder tabs
        ├── home.tsx               # Duty toggle, dispatch summary
        ├── incidents.tsx          # Active dispatches list
        ├── incident-details.tsx   # Dispatch detail + status updates
        ├── map.tsx
        └── profile.tsx
```

**Navigation:** Use `useRouter()` from expo-router for navigation between screens.

### Theme System

Centralized theme in `src/config/theme.ts`:
- `Colors`: Brand colors (primary: #8B2A2A), status colors, role-specific accents
- `Spacing`: Consistent spacing scale (xs: 4, sm: 8, md: 16, lg: 24, xl: 32)
- `BorderRadius`: Consistent border radii
- `FontSizes`: Typography scale

**Usage:**
```typescript
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
```

### Environment Configuration

**API Base URL:**
- Production: `https://emsconnect.online/api` (hardcoded in `src/config/env.ts`)
- Development: Override via `.env` file with `EXPO_PUBLIC_API_BASE_URL`

**Environment variables:**
- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL (optional, defaults to production)
- `EXPO_PUBLIC_AGORA_APP_ID`: Agora app ID for voice calls

## Key Patterns to Follow

### 1. Context Pattern
When adding new global state, follow the AuthContext/DispatchContext pattern:
- Create context in `src/contexts/`
- Export `Provider` component and `useContext` hook
- Wrap in `app/_layout.tsx`

### 2. API Service Pattern
All API calls go through `src/services/api.ts` axios instance:
- Sanctum Bearer token auto-injected via request interceptor
- 401 errors auto-clear authentication
- All services use try-catch with descriptive console errors

### 3. Type Definitions
Types live in `src/types/`:
- `auth.types.ts`: User, auth requests/responses
- `incident.types.ts`: Incident model
- `dispatch.types.ts`: Dispatch, location updates, duty status
- `call.types.ts`: Voice call types

Always define request/response interfaces for API calls.

### 4. Permission Handling
Location and notification permissions are requested on-demand:
- Location: When toggling duty ON (responders)
- Notifications: When toggling duty ON (responders)
- Show clear error messages if denied
- Check `src/services/location.service.ts` and `src/services/notification.service.ts` for patterns

## Platform-Specific Notes

### iOS
- Location permission: `NSLocationWhenInUseUsageDescription` in app.json
- Background modes configured for location and remote notifications
- No background location tracking (foreground only)

### Android
- Permissions in app.json: `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`
- Notification channels configured in `notification.service.ts`
- No foreground service (foreground-only location tracking)

## Backend Integration

**Base URL:** `https://emsconnect.online/api`

**Authentication:** Laravel Sanctum
- Login returns `{ token, user, role }`
- Token stored in expo-secure-store
- All requests include `Authorization: Bearer {token}` header

**Key Endpoints:**
- Auth: `/auth/login`, `/auth/signup`, `/auth/verify-email`
- Incidents: `/incidents`, `/incidents/my`, `/incidents/:id/cancel`
- Dispatches (responders): `/responder/dispatches`, `/responder/location`, `/responder/status`
- Calls: `/call/start`, `/call/end`, `/call/active`

## Common Gotchas

1. **After adding native dependencies or changing app.json:** Run `npx expo prebuild --clean` then rebuild
2. **Dispatch polling:** Only runs when responder is on duty; stops immediately when going off duty
3. **Location tracking:** Foreground-only; stops when app is backgrounded or closed
4. **Role-based routing:** Navigation redirects are handled in `app/_layout.tsx` via useEffect
5. **API errors:** 401 errors automatically clear auth state and redirect to login
6. **Sanctum token:** Stored in expo-secure-store, survives app restarts

## Debugging Tips

**Console Logging Pattern:**
All services use prefixed logs for easy filtering:
```
[API Request] POST /responder/location
[DispatchContext] Starting location tracking
[Notification Service] Dispatch notification shown: 123
```

Filter console by service name to debug specific areas.

**Common Issues:**
- "No dispatch polling": Check if responder is on duty (isOnDuty state)
- "Location not updating": Check permissions, verify foreground service is running
- "401 Unauthorized": Token expired or invalid; auth cleared automatically
- "Navigation not working": Check role in AuthContext matches expected route
