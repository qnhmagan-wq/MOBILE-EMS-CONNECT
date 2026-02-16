# EMS CONNECT - Complete Project Documentation (Capstone)

## Context

This document provides a comprehensive technical documentation of the **EMS CONNECT** mobile application, a React Native emergency medical services platform built for a capstone school project. The application serves two user roles: **Community Users** (who report emergencies) and **Responders** (who receive dispatch assignments and manage responses).

---

## 1. Project Overview

| Attribute | Detail |
|-----------|--------|
| **App Name** | EMS CONNECT |
| **Platform** | iOS & Android (React Native) |
| **Framework** | Expo SDK 54 + Expo Router 6 |
| **Language** | TypeScript (strict mode) |
| **React Native** | 0.81.5 |
| **React** | 19.1.0 |
| **Backend** | Laravel API (https://emsconnect.online/api) |
| **Authentication** | Laravel Sanctum (Bearer Token) |
| **Voice Calls** | Agora RTC SDK |
| **Maps** | Google Maps (react-native-maps) + OpenRouteService |
| **State Management** | React Context API |
| **Local Storage** | expo-secure-store |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.30 | Core framework |
| expo-router | ~6.0.21 | File-based navigation |
| axios | ^1.13.2 | HTTP client |
| react-native-agora | ^4.5.3 | Voice calls (Agora RTC) |
| react-native-maps | ^1.26.20 | Google Maps integration |
| expo-location | ~19.0.8 | GPS tracking |
| expo-notifications | ~0.32.15 | Push notifications |
| expo-secure-store | ^15.0.8 | Encrypted local storage |
| expo-task-manager | ~14.0.9 | Background tasks |
| expo-image-picker | ~17.0.10 | Camera/gallery access |
| expo-av | ~16.0.8 | Audio playback (ringtones) |
| expo-haptics | ~15.0.8 | Vibration feedback |
| date-fns | ^4.1.0 | Date formatting |

---

## 2. Project File Structure

```
MOBILE-EMS-CONNECT/
├── app/                              # Screens (Expo Router file-based routing)
│   ├── _layout.tsx                   # Root layout: AuthProvider + DispatchProvider + IncomingCallProvider
│   ├── incoming-call-modal.tsx       # Global incoming call modal screen
│   ├── active-incoming-call-modal.tsx # Global active incoming call modal screen
│   ├── auth/                         # Authentication screens
│   │   ├── _layout.tsx               # Auth stack navigator
│   │   ├── login.tsx                 # Login screen
│   │   ├── signup.tsx                # Registration screen
│   │   └── verify.tsx                # Email verification (6-digit code)
│   └── (tabs)/                       # Role-based tab navigation
│       ├── _layout.tsx               # Tab container stack
│       ├── index.tsx                 # Role-based redirect
│       ├── community/                # Community user screens (5 tabs + hidden)
│       │   ├── _layout.tsx           # Community tab navigator
│       │   ├── home.tsx              # SOS emergency button
│       │   ├── report.tsx            # Maps - responder tracking
│       │   ├── messages.tsx          # Incident conversations list
│       │   ├── first-aid.tsx         # First aid topic grid
│       │   ├── profile.tsx           # User profile
│       │   ├── emergency-call.tsx    # Active voice call screen
│       │   ├── incident-details.tsx  # Incident detail view
│       │   ├── chat.tsx              # Real-time messaging
│       │   ├── history.tsx           # Incident history list
│       │   ├── first-aid-detail.tsx  # Step-by-step first aid instructions
│       │   ├── edit-profile.tsx      # Edit personal/medical info
│       │   ├── incoming-call.tsx     # Incoming call screen
│       │   └── active-incoming-call.tsx  # Active voice call (incoming)
│       └── responder/                # Responder screens (4 tabs + hidden)
│           ├── _layout.tsx           # Responder tab navigator
│           ├── home.tsx              # Duty status dashboard
│           ├── incidents.tsx         # Dispatch assignments list
│           ├── map.tsx               # Incident overview map
│           ├── profile.tsx           # Responder profile
│           ├── incident-details.tsx  # Dispatch detail + status workflow
│           ├── route-map.tsx         # Navigation to incident
│           ├── hospital-navigation.tsx  # Route to hospital
│           └── edit-profile.tsx      # Edit responder info
├── src/                              # Source code modules
│   ├── services/                     # API & external service integrations
│   │   ├── api.ts                    # Axios instance + auth interceptors
│   │   ├── auth.service.ts           # Login, signup, verification
│   │   ├── incident.service.ts       # Incident CRUD
│   │   ├── dispatch.service.ts       # Dispatch management
│   │   ├── user.service.ts           # Profile management
│   │   ├── call.service.ts           # Voice call lifecycle
│   │   ├── message.service.ts        # Chat messaging
│   │   ├── location.service.ts       # Foreground GPS tracking
│   │   ├── backgroundLocation.service.ts  # Background GPS tracking
│   │   ├── notification.service.ts   # Push notifications
│   │   ├── tracking.service.ts       # Responder location tracking
│   │   ├── storage.service.ts        # Secure local storage
│   │   ├── openroute.service.ts      # OpenRouteService routing/geocoding
│   │   ├── maps.service.ts           # Google Directions API
│   │   └── ringtone.service.ts       # Audio/vibration for calls
│   ├── contexts/                     # Global state management
│   │   ├── AuthContext.tsx            # Authentication state
│   │   ├── DispatchContext.tsx        # Dispatch & location tracking
│   │   └── IncomingCallContext.tsx    # Admin-initiated calls
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAgoraCall.ts           # Agora voice call management
│   │   ├── useDispatchPolling.ts     # Dispatch assignment polling
│   │   ├── useIncidents.ts           # Incident creation & management
│   │   ├── useIncidentTracking.ts    # Real-time responder tracking
│   │   ├── useIncomingCallPolling.ts # Incoming call detection
│   │   └── useMessagePolling.ts      # Chat message polling
│   ├── types/                        # TypeScript type definitions
│   │   ├── auth.types.ts             # User, credentials, responses
│   │   ├── dispatch.types.ts         # Dispatch, location, duty status
│   │   ├── incident.types.ts         # Incident model
│   │   ├── call.types.ts             # Voice call types
│   │   ├── message.types.ts          # Chat message types
│   │   ├── tracking.types.ts         # Real-time tracking types
│   │   └── api.types.ts              # Generic API types
│   ├── config/                       # Configuration constants
│   │   ├── env.ts                    # API URLs, Agora App ID
│   │   ├── theme.ts                  # Colors, spacing, typography
│   │   ├── maps.ts                   # Map settings, markers
│   │   └── maptiler.ts              # MapTiler tile server
│   ├── components/                   # Shared UI components
│   │   ├── PreArrivalModal.tsx       # Multi-patient pre-arrival form
│   │   └── IncomingCallDebugOverlay.tsx  # Debug overlay
│   └── utils/                        # Utility functions
│       ├── responsive.ts             # Responsive scaling
│       ├── coordinates.ts            # GPS coordinate validation
│       ├── time.ts                   # Date/time formatting
│       ├── errorTracking.ts          # Global error handling
│       └── actionTracking.ts         # User action analytics
├── assets/                           # Static assets
│   └── images/                       # Icons, splash, adaptive icons
├── app.json                          # Expo configuration
├── package.json                      # Dependencies & scripts
└── tsconfig.json                     # TypeScript configuration
```

---

## 3. Authentication System

### 3.1 Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Login   │────>│ Backend  │────>│ Store Token  │────>│ Role-Based   │
│  Screen  │     │ Validates│     │ in SecureStore│     │ Navigation   │
└─────────┘     └──────────┘     └──────────────┘     └──────────────┘
                                                             │
                                          ┌──────────────────┼──────────────────┐
                                          │                                     │
                                 ┌────────▼────────┐               ┌───────────▼──────────┐
                                 │ Community Home   │               │ Responder Home        │
                                 │ /(tabs)/community│               │ /(tabs)/responder     │
                                 └─────────────────┘               └──────────────────────┘
```

**Registration Flow:** Signup → Email Verification (6-digit code) → Auto-Login

### 3.2 AuthContext (`src/contexts/AuthContext.tsx`)

Manages global authentication state with persistence across app restarts.

**State:**
- `user: User | null` - Current user object
- `token: string | null` - Sanctum bearer token
- `role: 'responder' | 'community' | null` - User role
- `isAuthenticated: boolean` - Auth status
- `isLoading: boolean` - Loading state

**Key Methods:**
| Method | Description |
|--------|-------------|
| `login(credentials)` | Authenticates user, stores token/user/role in SecureStore |
| `signup(credentials)` | Registers user (does NOT set auth - requires email verification) |
| `verifyEmail(credentials)` | Confirms email with 6-digit code, stores auth data |
| `logout()` | Clears all auth data from SecureStore |
| `restoreAuth()` | Called on app start - restores session from SecureStore |

### 3.3 API Interceptors (`src/services/api.ts`)

- **Request Interceptor:** Auto-injects `Authorization: Bearer {token}` from SecureStore
- **Response Interceptor:** On 401 Unauthorized, automatically clears auth and redirects to login
- **Timeout:** 30 seconds
- **Base URL:** `https://emsconnect.online/api`

### 3.4 Secure Storage (`src/services/storage.service.ts`)

Uses `expo-secure-store` (encrypted on-device storage) for:
- `AUTH_TOKEN` - Sanctum bearer token
- `USER_DATA` - User object (JSON)
- `USER_ROLE` - Role string

---

## 4. Screen-by-Screen Documentation

### 4.1 Authentication Screens

#### Login Screen (`app/auth/login.tsx`)
- Email/password form with validation
- Email regex validation, password min 6 characters
- Error handling: 422 (inactive account), 401 (invalid credentials), 500+ (server errors), network errors
- Redirects to role-specific home on success

#### Signup Screen (`app/auth/signup.tsx`)
- Fields: first name, last name, username, email, phone, password, confirm password
- Validation: username (alphanumeric + underscore), password (8+ chars, uppercase, lowercase, number)
- Maps Laravel validation errors to individual form fields
- Routes to email verification on success

#### Email Verification (`app/auth/verify.tsx`)
- 6-digit numeric code input with auto-focus and auto-submit
- Paste handling (fills multiple digits), backspace navigation
- Resend code functionality with masked email display
- Auto-submits when all 6 digits entered

### 4.2 Community User Screens

#### Home / SOS (`community/home.tsx`)
- Large SOS button requiring 3-second press-and-hold to activate
- Press timer prevents accidental activation
- Navigates to emergency-call screen on successful hold
- Dark red/maroon theme with medkit icon

#### Emergency Call (`community/emergency-call.tsx`)
- Creates incident (captures GPS + reverse geocoded address)
- Initiates Agora voice call with incident ID
- Call states: Getting Location → Connecting → Waiting → In Call → Ready
- Controls: Emergency Call (green), Mute/Unmute, End Call (red), Cancel
- Uses `useAgoraCall()` hook for voice management

#### Maps / Responder Tracking (`community/report.tsx`)
- Google Maps with live responder location markers
- Select active incident to view assigned responders
- Bottom sheet with responder cards (name, status, ETA, distance)
- Route polylines showing responder paths
- Call responder button per card
- Live polling indicator

#### Messages (`community/messages.tsx`)
- Lists active emergency conversations (pending, dispatched, in_progress incidents)
- Single conversation card for emergency support center
- Unread badge, status indicator, incident preview
- Tap to open chat screen

#### Chat (`community/chat.tsx`)
- Real-time messaging with 2-second polling
- Auto-scroll to latest message, mark as read automatically
- Image picking (up to 5MB) with preview before sending
- Pull-to-refresh, max 2000 chars per message
- Own messages (right-aligned, dark red), others (left-aligned, light)
- Uses `useMessagePolling()` hook

#### First Aid (`community/first-aid.tsx`)
- 2x3 grid of 6 first aid topics: CPR, Choking, Bleeding, Burns, Fractures, Seizures
- Image cards with overlay titles from Unsplash
- Tap to view detailed instructions

#### First Aid Detail (`community/first-aid-detail.tsx`)
- Step-by-step instructions for each emergency type (8 steps each)
- Sections: "When to Use" (bullets), "Step-by-Step" (numbered), "Important Warnings" (red highlight)
- Color-coded per topic, emergency call button

#### Profile (`community/profile.tsx`)
- Displays: name, email, phone, medical info (blood type, allergies, conditions, medications)
- Menu: Edit Profile, User Settings, About Us, Sign Out

#### Edit Profile (`community/edit-profile.tsx`)
- Editable: first name, last name, phone, blood type (8 options), allergies, conditions, medications
- Email read-only, custom blood type picker
- Loads from API, saves via `updateProfile()`, refreshes auth context

#### Incident History (`community/history.tsx`)
- Lists all user incidents with status tracking
- Polls every 15 seconds, shows alerts on status changes
- Cards: icon, type, status badge, description, location, date, unread badge

#### Incident Details (`community/incident-details.tsx`)
- Status badge, incident type, location, description, timeline (reported → dispatched → completed)
- Actions: View Messages, Track Responders, Cancel Incident
- Polls every 10 seconds for updates

#### Incoming Call (`community/incoming-call.tsx`)
- Shows admin caller info, incident context, pulsing animation
- Answer (green) → joins Agora channel; Reject (red) → declines
- Auto-dismiss if call cancelled externally

#### Active Incoming Call (`community/active-incoming-call.tsx`)
- Call duration timer (MM:SS), connecting animation
- Controls: Mute toggle, End Call (red)

### 4.3 Responder Screens

#### Home / Dashboard (`responder/home.tsx`)
- Location Tracking Status: ACTIVE (Background) / INACTIVE
- Backend connection status, last update timestamp
- Active Services: Background Location, Dispatch Monitoring
- Active Dispatches count, Ready/Offline status indicator
- Location permission warning if needed

#### Incidents / Dispatch List (`responder/incidents.tsx`)
- Header: welcome text, Available/Busy toggle, notification bell
- **Active Dispatches:** cards with incident type, status badge (NEW/ACCEPTED/EN ROUTE/etc.), priority badge (HIGH/MID/LOW), location, description, distance & duration
- **Nearby Incidents:** horizontal scroll, "Tap to Accept" button, distance & ETA
- Off-duty state: "You are Off Duty" message

#### Map Overview (`responder/map.tsx`)
- Continuous GPS tracking (5s interval or 10m movement)
- Incident markers with type icons, info callouts on tap
- Live location subscription, permission request on mount
- Floating panel: active incident count

#### Incident Details (`responder/incident-details.tsx`)
- Dispatch status with elapsed time, incident info, reporter contact (phone button)
- Response timeline (8 events)

**Status Workflow Actions:**
```
assigned    → "Accept" or "Decline"
accepted    → "On My Way" (en_route)
en_route    → "I've Arrived"
arrived     → "Going to Hospital" OR "Complete Without Transport"
transporting → "Complete at Hospital"
```

- Pre-Arrival Info modal (optional patient form)
- Navigate button opens route map

#### Route Map / Navigation (`responder/route-map.tsx`)
- Google Maps with live location tracking (every 5s)
- Route calculation via Directions API, distance & ETA display
- "I've Arrived" button, external Google Maps link
- Route updates every 3rd location update (15s), only if moved >100m
- Haversine formula fallback for distance

#### Hospital Navigation (`responder/hospital-navigation.tsx`)
- Route from current location to assigned hospital
- Google Maps integration with real-time tracking
- Distance and ETA display

#### Profile (`responder/profile.tsx`)
- Avatar, role badge, name, badge number, hospital assigned
- Menu: Edit Profile, User Settings, Sign Out
- Completed Responses gallery (last 10 completed incidents)

#### Edit Profile (`responder/edit-profile.tsx`)
- Fields: first name, last name, phone, badge/ID number, hospital assigned
- Email read-only, saves via `updateProfile()`

---

## 5. Service Layer

All services use the centralized `api.ts` axios instance with auto-injected Bearer token.

### 5.1 Auth Service (`src/services/auth.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `login(credentials)` | POST `/auth/login` | Returns token + user + role; saves to SecureStore |
| `signup(credentials)` | POST `/auth/signup` | Registers user; does NOT set auth state |
| `verifyEmail(credentials)` | POST `/auth/verify-email` | 6-digit code verification; saves auth data |
| `resendVerificationCode(email)` | POST `/auth/resend-verification` | Resends verification code |
| `logout()` | - | Clears all auth data from storage |
| `getCurrentUser()` | - | Retrieves user from local storage |

### 5.2 Incident Service (`src/services/incident.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `createIncident(data)` | POST `/incidents` | Creates emergency report with location |
| `getIncidents()` | GET `/incidents/my` | Gets user's incident history |
| `getIncident(id)` | GET `/incidents/:id` | Gets specific incident details |
| `cancelIncident(id)` | POST `/incidents/:id/cancel` | Cancels active incident |

### 5.3 Dispatch Service (`src/services/dispatch.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `updateLocation(lat, lng)` | POST `/responder/location` | Sends GPS coordinates to backend |
| `updateDutyStatus(status)` | POST `/responder/status` | Sets on/off duty; critical for tracking |
| `getDispatches()` | GET `/responder/dispatches` | Fetches assigned + nearby incidents |
| `updateDispatchStatus(id, status)` | POST `/responder/dispatches/:id/status` | Progress dispatch through workflow |
| `submitPreArrival(id, data)` | POST `/responder/dispatches/:id/pre-arrival` | Submit patient info |
| `submitMultiPatientPreArrival(id, patients)` | POST `/responder/dispatches/:id/pre-arrival` | Multi-patient submission |
| `getHospitalRoute(id)` | GET `/responder/dispatches/:id/hospital-route` | Get hospital destination + route |

### 5.4 Call Service (`src/services/call.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `startCall(incident_id?)` | POST `/call/start` | Initiates Agora voice call |
| `endCall(call_id)` | POST `/call/end` | Terminates call |
| `getActiveCall()` | GET `/call/active` | Checks for active call |
| `pollIncomingCall()` | GET `/call/incoming` | Polls for admin-initiated calls |
| `answerIncomingCall(call_id)` | POST `/call/answer` | Accept incoming call |
| `rejectIncomingCall(call_id)` | POST `/call/reject` | Reject incoming call |

### 5.5 Message Service (`src/services/message.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `sendMessage(data)` | POST `/messages` | Send text/image (multipart/form-data) |
| `getMessages(incident_id, page)` | GET `/messages?incident_id=X&page=Y` | Paginated message history |
| `getUnreadCount(incident_id?)` | GET `/messages/unread-count` | Unread message count |
| `markAsRead(message_id)` | POST `/messages/{id}/mark-read` | Mark message as read |

### 5.6 User Service (`src/services/user.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `getProfile()` | GET `/user` | Fetch current user profile |
| `updateProfile(data)` | PUT `/user/profile` | Update profile; syncs to local storage |
| `changePassword(data)` | PUT `/user/password` | Change password with current password validation |

### 5.7 Location Services

**Foreground (`src/services/location.service.ts`):**
- `requestLocationPermissions()` - Request foreground permission
- `getCurrentLocation(timeout?)` - High-accuracy GPS with Promise.race timeout
- `startContinuousTracking(callback)` - Watch position (10m distance, 5s interval)
- `stopContinuousTracking()` - Cancel watch subscription
- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine formula (km)

**Background (`src/services/backgroundLocation.service.ts`):**
- Task name: `background-location-task`
- Update interval: 10 seconds, high accuracy
- Foreground service notification: "EMS Connect Active"
- Auto-sends location + duty status to backend
- 3-attempt retry logic on start; 422 error recovery
- `startBackgroundLocationTracking()` / `stopBackgroundLocationTracking()`

### 5.8 Notification Service (`src/services/notification.service.ts`)

- Android channels: "dispatches" (HIGH priority), "incoming_calls" (MAX priority)
- `showDispatchNotification(dispatch)` - Alert with reverse-geocoded address
- `showIncomingCallNotification(call)` - Incoming call alert
- `setupNotificationHandlers(onTap)` - Tap and receive listeners
- `initializeNotifications()` - Request permissions, configure channels

### 5.9 Tracking Service (`src/services/tracking.service.ts`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `getIncidentTracking(id)` | GET `/incidents/:id/tracking` | Real-time responder locations, routes, ETAs |

### 5.10 Routing Services

**OpenRouteService (`src/services/openroute.service.ts`):**
- `getRoute(start, end)` - Driving directions with turn-by-turn steps
- `getDistanceMatrix(sources, destinations)` - Multi-point distance/duration
- `geocode(address)` / `reverseGeocode(lat, lng)` - Address conversion
- Free tier: 2,000 requests/day

**Google Directions (`src/services/maps.service.ts`):**
- `getRoute(origin, destination)` - Driving route with encoded polyline
- `decodePolyline(encoded)` - Converts polyline to coordinate array

### 5.11 Other Services

**Storage (`src/services/storage.service.ts`):** SecureStore wrapper for token, user, role

**Ringtone (`src/services/ringtone.service.ts`):** Audio playback via expo-av + vibration via expo-haptics for incoming calls

---

## 6. Context (State Management) Layer

### 6.1 AuthContext
See Section 3.2 above. Wraps entire app.

### 6.2 DispatchContext (`src/contexts/DispatchContext.tsx`)

Global state for responder duty status, location tracking, and dispatch management.

**State:**
- `isTrackingActive` - Whether background location is active
- `hasLocationPermission` - Permission granted
- `locationLastSent: Date | null` - Last GPS update timestamp
- `isBackendConfirmed` - Backend confirmed receiving location
- `dispatches: Dispatch[]` - All assigned dispatches
- `activeDispatches: Dispatch[]` - Non-completed/declined dispatches
- `nearbyIncidents: NearbyIncident[]` - Pending nearby incidents

**Auto-Start Flow (on responder login):**
1. Request location + notification permissions
2. Set duty status to ON DUTY (backend requirement)
3. Start background location tracking
4. Send initial location immediately
5. Start foreground periodic updates (15s fallback)
6. Start dispatch polling (10s)

**Stop Flow (logout/off-duty):**
1. Stop polling
2. Stop foreground periodic updates
3. Stop background tracking
4. Set duty status to OFF DUTY

### 6.3 IncomingCallContext (`src/contexts/IncomingCallContext.tsx`)

Manages admin-initiated voice calls to community users.

**State:**
- `incomingCall: IncomingCall | null`
- `callState: 'idle' | 'ringing' | 'answering' | 'connected' | 'ended'`
- `isPolling: boolean`

**Flow:**
1. Polls backend every 3 seconds for incoming calls
2. On new call: plays ringtone + vibration + notification + navigates to incoming-call screen
3. Answer: stops audio, calls API, returns Agora channel name
4. Reject: stops audio, calls API, resets state
5. End: calls API, resets state after 500ms delay

---

## 7. Custom Hooks

### 7.1 useAgoraCall (`src/hooks/useAgoraCall.ts`)
Manages Agora RTC voice call lifecycle.
- Initializes Agora engine on mount with microphone permission
- Event handlers: `onJoinChannelSuccess`, `onUserJoined`, `onUserOffline`
- `startCall(incidentId)` - Creates backend call + joins Agora channel
- `endCall()` - Leaves channel + ends backend call
- `toggleMute()` - Toggles local audio mute
- `answerCall(callId, channelName)` - Joins existing channel
- Tracks call duration with 1-second interval timer

### 7.2 useDispatchPolling (`src/hooks/useDispatchPolling.ts`)
Polls dispatches every **10 seconds**.
- Detects new dispatches via Set-based ID tracking
- Shows notifications for new assignments
- `updateDispatchStatus()` with optimistic local state merge
- Start/stop polling with cleanup

### 7.3 useIncidents (`src/hooks/useIncidents.ts`)
Manages incident creation for community users.
- `createIncident(type, description)` - Gets GPS → reverse geocodes → creates incident
- Handles specific HTTP errors (401, 422, 404, 5xx, network)
- `loadIncidents()` / `startPolling(interval)` for history
- Default poll: 15 seconds

### 7.4 useIncidentTracking (`src/hooks/useIncidentTracking.ts`)
Real-time responder tracking polling every **3 seconds**.
- `startTracking(incidentId)` / `stopTracking()`
- Auto-stops when backend's `tracking_available` becomes false
- Uses ref for incident ID to avoid dependency issues

### 7.5 useIncomingCallPolling (`src/hooks/useIncomingCallPolling.ts`)
Detects admin-initiated calls every **3 seconds**.
- Deduplication with lastSeenCallId ref
- Separate `pausePolling()` (preserves state) vs `stopPolling()` (full reset)
- Callback-injection pattern via refs to avoid closure issues

### 7.6 useMessagePolling (`src/hooks/useMessagePolling.ts`)
Chat message polling every **2 seconds**.
- App state awareness: pauses when backgrounded, resumes on foreground
- `sendMessage()` with image upload (multipart/form-data)
- `markMessagesAsRead()` with parallel Promise.all
- Optimistic UI updates

---

## 8. Type System

### 8.1 User & Auth Types (`src/types/auth.types.ts`)
```typescript
UserRole = 'responder' | 'community'
User { id, email, name, first_name?, last_name?, phone_number?, role,
       badge_number?, hospital_assigned?, blood_type?, allergies?,
       existing_conditions?, medications? }
```

### 8.2 Dispatch Types (`src/types/dispatch.types.ts`)
```typescript
DutyStatus = 'on_duty' | 'off_duty'
ResponderStatus = 'idle' | 'busy' | 'offline'
DispatchStatus = 'assigned' | 'accepted' | 'declined' | 'en_route' |
                 'arrived' | 'transporting_to_hospital' | 'completed'
Dispatch { id, incident_id, responder_id, status, distance, duration,
           timestamps (assigned/accepted/en_route/arrived/completed),
           incident: { type, status, location, reporter? },
           hospital_route? }
NearbyIncident { incident_id, type, distance, ETA, location, can_accept }
```

### 8.3 Incident Types (`src/types/incident.types.ts`)
```typescript
IncidentType = 'medical' | 'fire' | 'accident' | 'crime' | 'natural_disaster' | 'other'
IncidentStatus = 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled'
Incident { id, type, status, latitude, longitude, address, description, timestamps }
```

### 8.4 Call Types (`src/types/call.types.ts`)
```typescript
Call { id, user_id, incident_id?, channel_name, status, timestamps }
IncomingCall { id, incident_id, channel_name, admin_caller, incident, started_at }
IncomingCallState = 'idle' | 'ringing' | 'answering' | 'connected' | 'ended'
```

### 8.5 Message Types (`src/types/message.types.ts`)
```typescript
Message { id, incident_id, sender_id, sender: { name, role }, message?, image_url?, is_read, created_at }
```

### 8.6 Tracking Types (`src/types/tracking.types.ts`)
```typescript
ResponderTracking { id, name, phone, dispatch_id, status, current_location?,
                    distance?, eta?, route?, timeline }
```

---

## 9. Utility Modules

### 9.1 Responsive Scaling (`src/utils/responsive.ts`)
Reference device: iPhone 12/13 Pro (390x844). Functions:
- `scaleWidth(size)` / `scaleHeight(size)` - Dimension-specific scaling
- `scaleFontSize(size)` - Font scaling with 0.85x-1.3x clamp
- `scale(size)` - Balanced scaling (average of width/height)
- `isSmallScreen()` (<375px) / `isTablet()` (>=768px)
- `getResponsiveButtonSize(size)` - Clamped circular button sizing

### 9.2 Coordinate Validation (`src/utils/coordinates.ts`)
Type-safe GPS validation preventing map crashes:
- `isValidCoordinate(coord)` - TypeScript type guard, range validation
- `getSafeCoordinate(coord, fallback)` - Falls back to Manila, Philippines default
- `areValidPolylineCoordinates(coords)` - Array validation for routes

### 9.3 Time Formatting (`src/utils/time.ts`)
Using date-fns: `getElapsedTime()`, `getRelativeTime()`, `formatDateTime()`, `formatTime()`, `formatDate()`

### 9.4 Error Tracking (`src/utils/errorTracking.ts`)
- `initializeErrorTracking()` - Global error handler via React Native ErrorUtils
- `trackError(error, context?, data?)` - Manual error logging with stack traces

### 9.5 Action Tracking (`src/utils/actionTracking.ts`)
- `trackAction(action, context?)` - Console-based user action logging
- Predefined ActionTypes enum: LOGIN, DUTY_TOGGLE, DISPATCH_ACCEPT, etc.

---

## 10. Configuration

### 10.1 Theme (`src/config/theme.ts`)
- **Primary:** #8B2A2A (dark red/maroon)
- **Accent:** #D4A574 (warm gold)
- **Status:** success=#34C759, warning=#FFB800, danger=#FF3B30, info=#007AFF
- **Spacing:** xs=4, sm=8, md=16, lg=24, xl=32, xxl=40
- **Border Radius:** sm=8, md=12, lg=16, round=20, circle=50
- **Font Sizes:** xs=12, sm=14, md=16, lg=18, xl=20, xxl=24

### 10.2 Maps (`src/config/maps.ts`)
- Default region: Manila, Philippines (14.5995, 120.9842)
- Arrival threshold: 100 meters
- Location update: 5s interval, 10m distance filter
- Route stroke: #3B82F6, width 4

### 10.3 App Configuration (`app.json`)
- iOS: NSLocationAlwaysAndWhenInUseUsageDescription, UIBackgroundModes (location, fetch, remote-notification)
- Android: RECORD_AUDIO, ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION, POST_NOTIFICATIONS, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION
- Min SDK: 24, Target SDK: 35
- Plugins: expo-router, react-native-maps, expo-location, expo-notifications, expo-splash-screen, expo-build-properties
- New Architecture enabled, Typed Routes enabled, React Compiler enabled

### 10.4 Environment Variables (`.env.example`)
- `EXPO_PUBLIC_API_BASE_URL` - Backend API (default: https://emsconnect.online/api)
- `EXPO_PUBLIC_AGORA_APP_ID` - Agora voice call app ID
- `EXPO_PUBLIC_ORS_API_KEY` - OpenRouteService API key

---

## 11. Shared Components

### 11.1 PreArrivalModal (`src/components/PreArrivalModal.tsx`)
Multi-patient pre-arrival form for responders:
- Supports 1-20 patients per incident
- Fields per patient: name, sex, age, incident type (with suggestions), caller name, estimated arrival
- Quick ETA buttons (5/10/15/20/30 min)
- Incident type suggestions: Cardiac Arrest, Stroke, Trauma, etc.
- Per-patient validation with error display
- Update confirmation for re-submissions

### 11.2 IncomingCallDebugOverlay (`src/components/IncomingCallDebugOverlay.tsx`)
Development-only debug overlay:
- Minimized pill or expanded panel
- Shows: polling status, call state, incoming call ID, caller name, errors
- Rolling log of last 20 state changes with timestamps

---

## 12. Key Architectural Patterns

### 12.1 Dispatch Lifecycle (State Machine)
```
assigned ──> accepted ──> en_route ──> arrived ──> transporting_to_hospital ──> completed
    │                                     │
    └──> declined                         └──> completed (without transport)
```

### 12.2 Polling Architecture
| System | Interval | Purpose |
|--------|----------|---------|
| Dispatch Polling | 10s | Fetch new dispatch assignments |
| Location Updates | 10s (background) / 15s (foreground fallback) | Send GPS to backend |
| Incident Tracking | 3s | Real-time responder locations |
| Incoming Calls | 3s | Detect admin-initiated calls |
| Chat Messages | 2s | Real-time messaging |
| Incident History | 15s | Status change detection |
| Incident Details | 10s | Single incident updates |

### 12.3 Dual Location Tracking
- **Primary:** Background location task via `expo-task-manager` (works when app minimized)
- **Fallback:** Foreground periodic updates every 15s via `setInterval`
- Both send to same backend endpoint; backend handles deduplication
- Duty status MUST be set before location updates (otherwise 422 error)

### 12.4 Error Recovery Pattern
- 422 "responder not on duty" → Auto-attempts duty status recovery
- 401 "unauthorized" → Auto-clears auth and redirects to login
- Network errors → Console log + user-friendly error message
- Location timeout → Fallback to last known location

---

## 13. Development Commands

```bash
npm start           # Start Expo development server
npm run android     # Build and run on Android
npm run ios         # Build and run on iOS
npm run web         # Start web version
npm run lint        # Run ESLint

# After native dependency changes:
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

---

## 14. Verification / Testing Plan

1. **Auth Flow:** Login → verify role redirect → logout → verify redirect to login
2. **Community SOS:** Hold SOS 3s → verify location capture → verify incident creation → verify Agora call
3. **Chat:** Send text → verify delivery → send image → verify upload → verify read receipts
4. **Responder Duty:** Toggle on → verify background location starts → verify dispatch polling → toggle off → verify cleanup
5. **Dispatch Workflow:** Accept → En Route → Arrived → Complete → verify each status transition
6. **Navigation:** Route map → verify live location → verify route updates → verify "I've Arrived"
7. **Incoming Calls:** Simulate admin call → verify ringtone → answer → verify Agora join → end call

---

## Appendix A: Detailed Function-by-Function Documentation

This appendix provides a detailed explanation of every function in the codebase — how it works internally, what its purpose is, and how it fits into the overall system.

---

### A.1 API Layer (`src/services/api.ts`)

This file creates and exports a single shared Axios HTTP client instance that all other services use. It is the foundation of all backend communication.

**Axios Instance Creation:**
- Creates an Axios instance with `baseURL` set to the backend API (`https://emsconnect.online/api`), default headers for JSON content type, and a 30-second timeout. Every service imports this instance instead of creating their own, ensuring consistent configuration.

**Request Interceptor — `api.interceptors.request.use()`:**
- **Purpose:** Automatically attaches the user's authentication token to every outgoing HTTP request.
- **How it works:** Before each request is sent, the interceptor retrieves the stored Sanctum token from `expo-secure-store` via `getToken()`. If a token exists, it sets the `Authorization: Bearer {token}` header on the request. This means individual services never need to handle authentication manually — it's all automatic.
- It also logs every request (method, URL, data, timestamp) to the console for debugging.

**Response Interceptor — `api.interceptors.response.use()`:**
- **Purpose:** Handles global error responses and auto-logout on expired tokens.
- **How it works:** On successful responses, it logs the response details. On error responses, it categorizes the error into three types:
  1. **Server error (status code received):** Logs the status, data, and stack trace.
  2. **Network error (no response):** Logs that the server didn't respond (connection issue).
  3. **Setup error:** Logs errors that occurred while building the request.
- **Critical behavior:** If the response status is `401 Unauthorized`, the interceptor automatically calls `clearAll()` to delete all stored auth data (token, user, role). This effectively logs the user out and forces them back to the login screen, preventing stale token issues.

---

### A.2 Auth Service (`src/services/auth.service.ts`)

Handles all authentication operations between the app and the Laravel backend.

**`login(credentials: LoginCredentials): Promise<LoginResponse>`**
- **Purpose:** Authenticates a user with email and password.
- **How it works:** Sends a POST request to `/auth/login` with the credentials. The backend validates them against the database and returns a response containing `{ token, user, role }`. The function then persists all three values to secure storage using `saveToken()`, `saveUser()`, and `saveRole()` — this ensures the user stays logged in across app restarts. Returns the full response so the AuthContext can update its React state.

**`signup(credentials: SignupCredentials): Promise<SignupResponse>`**
- **Purpose:** Registers a new user account.
- **How it works:** Sends a POST request to `/auth/signup` with registration fields (name, email, phone, password). Importantly, this function does NOT save any auth data — the user must verify their email first. The backend sends a 6-digit verification code to the email address. Returns the response (success message).

**`verifyEmail(credentials: VerificationCredentials): Promise<VerificationResponse>`**
- **Purpose:** Completes registration by verifying the user's email with a 6-digit code.
- **How it works:** Sends a POST to `/auth/verify-email` with the email and code. On success, the backend returns `{ token, user, role }` just like login. The function saves all three to secure storage, effectively logging the user in immediately after verification.

**`resendVerificationCode(credentials: ResendVerificationCredentials): Promise<{ message: string }>`**
- **Purpose:** Requests a new verification code if the original expired or wasn't received.
- **How it works:** Sends a POST to `/auth/resend-verification` with the email. Returns a success message.

**`logout(): Promise<void>`**
- **Purpose:** Logs the user out by clearing all stored authentication data.
- **How it works:** Calls `clearAll()` which deletes the token, user data, and role from `expo-secure-store`. Does not call any backend endpoint — the Sanctum token simply becomes unused.

**`getCurrentUser(): Promise<User | null>`**
- **Purpose:** Retrieves the cached user object from local storage.
- **How it works:** Calls `getUser()` which reads the `USER_DATA` key from `expo-secure-store` and parses the JSON. Returns null if no user is stored.

---

### A.3 Incident Service (`src/services/incident.service.ts`)

Manages emergency incident CRUD operations for community users.

**`createIncident(request: CreateIncidentRequest): Promise<CreateIncidentResponse>`**
- **Purpose:** Reports a new emergency to the backend.
- **How it works:** Sends a POST to `/incidents` with the incident type, GPS coordinates (latitude/longitude), reverse-geocoded address, and description. The backend creates the incident record, marks it as "pending", and returns the created incident object. Dispatchers on the admin panel then see this incident and can assign responders.

**`getIncidents(): Promise<Incident[]>`**
- **Purpose:** Fetches all incidents belonging to the current user.
- **How it works:** Sends a GET to `/incidents/my`. The backend filters incidents by the authenticated user's ID and returns them. The function extracts the `incidents` array from the response wrapper and returns it directly.

**`getIncident(id: number): Promise<Incident>`**
- **Purpose:** Fetches detailed information for a single incident.
- **How it works:** Sends a GET to `/incidents/{id}`. Returns the full incident object including status, location, timestamps, and any assigned responders.

**`cancelIncident(id: number): Promise<{ message: string; incident: Incident }>`**
- **Purpose:** Cancels an active incident that hasn't been completed yet.
- **How it works:** Sends a POST to `/incidents/{id}/cancel`. The backend updates the incident status to "cancelled" and notifies any assigned responders. Returns the updated incident.

---

### A.4 Dispatch Service (`src/services/dispatch.service.ts`)

Core service for responder operations — location reporting, duty status, and dispatch management.

**`updateLocation(location: LocationUpdateRequest): Promise<LocationUpdateResponse>`**
- **Purpose:** Sends the responder's current GPS coordinates to the backend.
- **How it works:** Sends a POST to `/responder/location` with `{ latitude, longitude }`. The backend stores this as the responder's current location, which is used for dispatch assignment (nearest responder) and community user tracking (showing responder position on map). This is called every 10 seconds by background tracking and every 15 seconds by the foreground fallback.

**`updateDutyStatus(request: DutyStatusRequest): Promise<DutyStatusResponse>`**
- **Purpose:** Toggles the responder between on-duty and off-duty states on the backend.
- **How it works:** Sends a POST to `/responder/status` with `{ is_on_duty: boolean, responder_status: string }`. This is a **critical prerequisite** — the backend rejects location updates (422 error) if the responder is not on duty. The function includes comprehensive error handling: 500 errors create a special `BACKEND_500` error for graceful handling, 404 indicates a missing endpoint, 422 indicates invalid payload, and 401/403 indicate auth issues. Each error type gets a descriptive message.

**`getDispatches(): Promise<GetDispatchesResponse>`**
- **Purpose:** Fetches all dispatch assignments and nearby incidents for the current responder.
- **How it works:** Sends a GET to `/responder/dispatches`. The backend returns two arrays: `dispatches` (incidents specifically assigned to this responder) and `nearby_incidents` (pending incidents near the responder's location that they could accept). The function logs the count of each for debugging.

**`updateDispatchStatus(dispatchId: number, request: UpdateDispatchStatusRequest): Promise<UpdateDispatchStatusResponse>`**
- **Purpose:** Advances a dispatch through its lifecycle (accept → en_route → arrived → completed).
- **How it works:** Sends a POST to `/responder/dispatches/{id}/status` with the new status string. The backend validates the state transition (e.g., can't go from "assigned" to "arrived" — must go through "accepted" and "en_route" first), updates the dispatch, and returns the updated object.

**`submitPreArrival(dispatchId: number, request: PreArrivalRequest): Promise<PreArrivalResponse>`**
- **Purpose:** Submits patient information before arriving at the hospital (legacy single-patient version).
- **How it works:** Sends a POST to `/responder/dispatches/{id}/pre-arrival` with patient details (name, age, sex, condition). The hospital receives this information to prepare for the patient's arrival.

**`submitMultiPatientPreArrival(dispatchId: number, patients: Patient[]): Promise<MultiPatientPreArrivalResponse>`**
- **Purpose:** Submits information for multiple patients in a single incident.
- **How it works:** Sends a POST to the same endpoint but wraps the data as `{ patients: [...] }`. Logs the patient count and backend response for verification.

**`getHospitalRoute(dispatchId: number): Promise<GetHospitalRouteResponse>`**
- **Purpose:** Gets the destination hospital and driving route for a dispatch.
- **How it works:** Sends a GET to `/responder/dispatches/{id}/hospital-route`. The backend returns the hospital name/location and a pre-calculated route. Used by the hospital navigation screen.

---

### A.5 Call Service (`src/services/call.service.ts`)

Manages voice call lifecycle between the app and backend.

**`startCall(request: StartCallRequest): Promise<StartCallResponse>`**
- **Purpose:** Initiates a new voice call, optionally tied to an incident.
- **How it works:** Sends a POST to `/call/start` with an optional `incident_id`. The backend creates a call record, generates an Agora channel name, and returns `{ call, channel_name }`. The channel name is then used to join the Agora voice channel.

**`endCall(request: EndCallRequest): Promise<EndCallResponse>`**
- **Purpose:** Terminates an active voice call.
- **How it works:** Sends a POST to `/call/end` with the `call_id`. The backend marks the call as ended and notifies other participants.

**`getActiveCall(): Promise<ActiveCallResponse>`**
- **Purpose:** Checks if the current user has any active (ongoing) call.
- **How it works:** Sends a GET to `/call/active`. Returns `{ call: Call | null }`. Used to prevent starting a new call while one is active, and to auto-reject incoming calls when busy.

**`pollIncomingCall(): Promise<IncomingCallResponse>`**
- **Purpose:** Checks if an admin is trying to call the current user.
- **How it works:** Sends a GET to `/call/incoming`. Returns `{ has_incoming_call: boolean, call?: IncomingCall }`. Polled every 3 seconds by `useIncomingCallPolling` for community users.

**`answerIncomingCall(request: AnswerCallRequest): Promise<AnswerCallResponse>`**
- **Purpose:** Accepts an incoming admin call.
- **How it works:** Sends a POST to `/call/answer` with `{ call_id }`. The backend marks the call as answered and returns the `channel_name` needed to join the Agora voice channel.

**`rejectIncomingCall(request: RejectCallRequest): Promise<RejectCallResponse>`**
- **Purpose:** Declines an incoming admin call.
- **How it works:** Sends a POST to `/call/reject` with `{ call_id }`. The backend marks the call as rejected and notifies the admin.

---

### A.6 Message Service (`src/services/message.service.ts`)

Handles real-time chat messaging for incident conversations.

**`sendMessage(request: SendMessageRequest): Promise<Message>`**
- **Purpose:** Sends a text message and/or image in an incident conversation.
- **How it works:** Constructs a `FormData` object with `incident_id` and optionally `message` (text) and `image` (file object with uri/name/type). Sends as a POST to `/messages` with `multipart/form-data` content type. The backend stores the message and associates it with the incident. Returns the created message object.

**`getMessages(incidentId: number, page: number): Promise<GetMessagesResponse>`**
- **Purpose:** Fetches paginated message history for an incident.
- **How it works:** Sends a GET to `/messages` with query parameters `incident_id` and `page`. The backend returns messages sorted by creation time with pagination metadata.

**`getUnreadCount(incidentId?: number): Promise<number>`**
- **Purpose:** Gets the count of unread messages for display badges.
- **How it works:** Sends a GET to `/messages/unread-count` with an optional `incident_id` filter. If no incident ID is provided, returns the total unread count across all incidents. Extracts and returns just the `unread_count` number.

**`markAsRead(messageId: number): Promise<void>`**
- **Purpose:** Marks a single message as read.
- **How it works:** Sends a POST to `/messages/{id}/mark-read`. The backend updates the message's `is_read` flag. This is called in bulk by `useMessagePolling` for all visible unread messages.

---

### A.7 User Service (`src/services/user.service.ts`)

Manages user profile operations.

**`getProfile(): Promise<UserProfile>`**
- **Purpose:** Fetches the authenticated user's complete profile from the backend.
- **How it works:** Sends a GET to `/user`. Returns the full user object including role-specific fields (badge_number for responders, blood_type for community users).

**`updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse>`**
- **Purpose:** Updates the user's profile information.
- **How it works:** Sends a PUT to `/user/profile` with the changed fields. The backend updates the user record and returns the updated user object. Critically, the function then calls `saveUser()` to update the locally cached user data in `expo-secure-store`, keeping the local copy in sync with the server.

**`changePassword(data): Promise<{ message: string }>`**
- **Purpose:** Changes the user's password.
- **How it works:** Sends a PUT to `/user/password` with `current_password`, `password`, and `password_confirmation`. The backend validates the current password, then hashes and stores the new one.

---

### A.8 Location Service (`src/services/location.service.ts`)

Manages foreground GPS tracking using `expo-location`.

**`requestLocationPermissions(): Promise<LocationPermissionResult>`**
- **Purpose:** Requests the user's permission to access GPS location.
- **How it works:** Calls `Location.requestForegroundPermissionsAsync()` from expo-location. Returns `{ granted: boolean, canAskAgain: boolean }`. If denied and `canAskAgain` is false, the user must manually enable it in device settings.

**`getCurrentLocation(timeoutMs: number = 10000): Promise<LocationUpdate>`**
- **Purpose:** Gets a single high-accuracy GPS fix with timeout protection.
- **How it works:** First checks if permission is granted. Then uses `Promise.race()` between the actual GPS request (`Location.getCurrentPositionAsync` with high accuracy) and a timeout promise. If GPS takes longer than `timeoutMs` (default 10 seconds), the timeout wins and throws an error. On success, creates a `LocationUpdate` object with latitude, longitude, and timestamp, caches it as `lastKnownLocation`, and returns it.

**`startContinuousTracking(callback, options?): Promise<void>`**
- **Purpose:** Starts real-time GPS watching that fires on every position change.
- **How it works:** Calls `Location.watchPositionAsync()` with configurable accuracy (default: High), distance interval (default: 10 meters), and time interval (default: 5 seconds). Each update calls the provided callback with a `LocationUpdate` object and updates the `lastKnownLocation` cache. If a previous subscription exists, it's removed first to prevent duplicates.

**`stopContinuousTracking(): void`**
- **Purpose:** Stops the GPS watch subscription.
- **How it works:** Calls `.remove()` on the stored `LocationSubscription` reference and sets it to null.

**`calculateDistance(lat1, lon1, lat2, lon2): number`**
- **Purpose:** Calculates the straight-line distance between two GPS coordinates.
- **How it works:** Implements the Haversine formula using Earth's radius (6,371 km). Converts degree differences to radians, applies the spherical trigonometry formula, and returns the result in kilometers. Used for determining if a responder has moved enough to warrant a route recalculation.

**`hasLocationPermission(): Promise<boolean>`**
- **Purpose:** Checks if foreground location permission is currently granted without prompting.
- **How it works:** Calls `Location.getForegroundPermissionsAsync()` and returns whether status is 'granted'.

**`getLocationErrorMessage(error): string`**
- **Purpose:** Converts technical location errors into user-friendly messages.
- **How it works:** Pattern-matches the error message string against known patterns (permission, timeout, unavailable, denied) and returns an appropriate human-readable message.

---

### A.9 Background Location Service (`src/services/backgroundLocation.service.ts`)

Manages GPS tracking that continues even when the app is minimized or the screen is off.

**Background Task Definition — `TaskManager.defineTask(BACKGROUND_LOCATION_TASK)`**
- **Purpose:** Defines the code that runs every time the OS delivers a new location in the background.
- **How it works:** Registered at module load time (before any component renders). When triggered by the OS, it extracts the latest GPS coordinates from the `data.locations` array and sends them to the backend via `updateLocation()`. If the backend returns a 422 error (responder not on duty), it attempts automatic recovery by calling `updateDutyStatus()` to set the responder back on duty, then retries the location update. Errors don't crash the task — it logs and continues.

**`requestBackgroundLocationPermissions(): Promise<{ granted, canAskAgain }>`**
- **Purpose:** Requests both foreground AND background location permissions.
- **How it works:** First requests foreground permission, then if granted, requests background permission (required on iOS and Android 10+). Both must be granted for background tracking to work.

**`startBackgroundLocationTracking(retryCount = 0): Promise<void>`**
- **Purpose:** Registers the background location task with the OS.
- **How it works:** First checks if the task is already registered (prevents duplicates). Requests foreground permission. Then calls `Location.startLocationUpdatesAsync()` with: high accuracy, 10-second update interval, zero distance filter (update even when stationary), a foreground service notification ("EMS Connect Active" with brand color), and iOS background location indicator (blue bar). If startup fails, it retries up to 3 times with a 2-second delay between attempts.

**`stopBackgroundLocationTracking(): Promise<void>`**
- **Purpose:** Unregisters the background location task.
- **How it works:** Checks if the task is registered, then calls `Location.stopLocationUpdatesAsync()`. Safe to call even if not tracking.

**`isBackgroundTrackingActive(): Promise<boolean>`**
- **Purpose:** Checks if the background task is currently registered and running.
- **How it works:** Calls `TaskManager.isTaskRegisteredAsync()` and returns the result.

---

### A.10 Notification Service (`src/services/notification.service.ts`)

Manages local push notifications for dispatch alerts and incoming calls.

**`initializeNotifications(): Promise<boolean>`**
- **Purpose:** Sets up the notification system — requests permission and configures Android channels.
- **How it works:** Checks existing permission status; if not granted, prompts the user. On Android, creates two notification channels: "dispatches" (HIGH importance with vibration pattern) and "incoming_calls" (MAX importance with strong vibration, visible on lock screen). Returns whether permission was granted.

**`showDispatchNotification(dispatch: Dispatch): Promise<void>`**
- **Purpose:** Shows a push notification when a new dispatch is assigned to a responder.
- **How it works:** First checks if the incident address looks like raw coordinates (regex pattern). If so, calls OpenRouteService `reverseGeocode()` to convert coordinates to a human-readable address. Then schedules an immediate local notification with the title "New Emergency Dispatch" and body containing the incident type and address. The notification data payload includes dispatch and incident IDs for handling taps.

**`showIncomingCallNotification(call: IncomingCall): Promise<void>`**
- **Purpose:** Shows a notification for admin-initiated incoming calls.
- **How it works:** Schedules an immediate notification with MAX priority, the admin's name, and the incident ID. Uses the "incoming_calls" channel on Android for maximum visibility.

**`setupNotificationHandlers(onDispatchTap): { responseSubscription, receivedSubscription }`**
- **Purpose:** Registers listeners for notification interactions.
- **How it works:** Sets up two listeners: `addNotificationResponseReceivedListener` fires when the user taps a notification (extracts the dispatchId and calls the callback), and `addNotificationReceivedListener` fires when a notification arrives while the app is in the foreground (logs the data). Returns both subscriptions for cleanup.

**`cancelAllNotifications(): Promise<void>`**
- **Purpose:** Dismisses all visible notifications.

**`hasNotificationPermission(): Promise<boolean>`**
- **Purpose:** Checks if notification permission is granted without prompting.

---

### A.11 Tracking Service (`src/services/tracking.service.ts`)

**`getIncidentTracking(incidentId: number): Promise<TrackingResponse>`**
- **Purpose:** Fetches real-time locations of all responders assigned to a specific incident.
- **How it works:** Sends a GET to `/incidents/{id}/tracking`. The backend returns an object with `responders` (array of responder locations, routes, ETAs, and status) and `tracking_available` (boolean indicating if the incident is still active). Used by the community user's map screen to show live responder positions. Polled every 3 seconds by `useIncidentTracking`.

---

### A.12 OpenRouteService (`src/services/openroute.service.ts`)

A class-based service providing routing, distance, and geocoding via the OpenRouteService API (free alternative to Google Maps).

**`getRoute(start, end): Promise<RouteResult>`**
- **Purpose:** Calculates a driving route between two GPS coordinates.
- **How it works:** Normalizes input coordinates to [longitude, latitude] format (ORS uses lon/lat, opposite of most map libraries). Sends a POST to `/directions/driving-car/geojson` requesting the fastest route with turn-by-turn instructions. Parses the GeoJSON response to extract: route coordinates (converted back to {latitude, longitude} for react-native-maps), total distance and duration, and step-by-step navigation instructions. Handles specific errors: 401 (invalid API key), 429 (rate limit).

**`getDistanceMatrix(sources, destinations): Promise<DistanceMatrixResult>`**
- **Purpose:** Calculates driving distances and durations between multiple origin-destination pairs simultaneously.
- **How it works:** Combines all source and destination coordinates into a single locations array, then specifies source and destination indices. Sends a POST to `/matrix/driving-car` requesting both distance and duration metrics. Returns a 2D array where `distances[i][j]` is the driving distance from source i to destination j.

**`geocode(address): Promise<GeocodingResult | null>`**
- **Purpose:** Converts a text address to GPS coordinates.
- **How it works:** Sends a GET to `/geocode/search` with the address text. Returns the top result's coordinates, formatted address, and confidence score. Returns null if no results found.

**`reverseGeocode(latitude, longitude): Promise<string | null>`**
- **Purpose:** Converts GPS coordinates to a human-readable address string.
- **How it works:** Sends a GET to `/geocode/reverse` with the point coordinates. Returns the formatted address label of the nearest result, or null if nothing found. Used by the notification service to show addresses instead of raw coordinates.

**`formatDistance(meters)` / `formatDuration(seconds)`**
- **Purpose:** Helper methods to convert raw numbers to human-readable strings like "2.5 km" or "15 min".

---

### A.13 Google Maps Service (`src/services/maps.service.ts`)

**`getRoute(origin, destination): Promise<RouteResponse>`**
- **Purpose:** Gets driving directions from Google's Directions API.
- **How it works:** Constructs a URL with origin/destination coordinates and the API key. Uses `fetch()` (not Axios) to call Google's API. Parses the response to extract the route's encoded polyline, distance, and duration. Calls `decodePolyline()` to convert the encoded polyline string into an array of coordinate objects.

**`decodePolyline(encoded: string): RouteCoordinate[]`**
- **Purpose:** Converts a Google Maps encoded polyline string into an array of lat/lng coordinates.
- **How it works:** Implements the standard Google polyline decoding algorithm: reads bytes from the encoded string, shifts bits to reconstruct delta-encoded latitude and longitude values, accumulates the deltas, and divides by 1e5 to get decimal degrees.

---

### A.14 Storage Service (`src/services/storage.service.ts`)

A thin wrapper around `expo-secure-store` that provides typed key-value storage.

**`saveToken(token)` / `getToken()`** — Stores/retrieves the Sanctum bearer token string.

**`saveUser(user)` / `getUser()`** — Stores the User object as JSON string / retrieves and parses it back.

**`saveRole(role)` / `getRole()`** — Stores/retrieves the role string ('responder' or 'community').

**`clearAll()`** — Deletes all three keys. Called during logout and on 401 errors.

All operations use `expo-secure-store` which provides encrypted storage on both iOS (Keychain) and Android (EncryptedSharedPreferences).

---

### A.15 Ringtone Service (`src/services/ringtone.service.ts`)

Manages audio and vibration alerts for incoming calls.

**`playRingtone(): Promise<void>`**
- **Purpose:** Starts playing an audio alert for incoming calls.
- **How it works:** Currently uses haptics-based vibration only (audio playback code is commented out but prepared for future use with an `expo-av` Sound object). The audio code, when enabled, would configure audio mode for incoming calls (plays in silent mode, stays active in background) and loop a notification sound file.

**`stopRingtone(): Promise<void>`**
- **Purpose:** Stops audio playback and unloads the sound resource.

**`startVibration(): Promise<void>`**
- **Purpose:** Starts a repeating vibration pattern for incoming calls.
- **How it works:** Triggers an initial haptic notification via `Haptics.notificationAsync()`, then sets up a 1-second interval that repeats the haptic feedback. The interval continues until explicitly stopped.

**`stopVibration(): void`**
- **Purpose:** Stops the repeating vibration by clearing the interval.

**`stopAll(): Promise<void>`**
- **Purpose:** Convenience method that stops both ringtone and vibration at once. Called when answering, rejecting, or when a call is cancelled.

---

### A.16 AuthContext (`src/contexts/AuthContext.tsx`)

The root authentication state provider that wraps the entire app.

**`restoreAuth()`**
- **Purpose:** Restores the user's login session when the app starts.
- **How it works:** Called once in a `useEffect` on mount. Reads token, user, and role from `expo-secure-store`. If all three exist, sets them in React state — this means the user is still logged in. If any are missing, the user remains unauthenticated and sees the login screen. Uses try/catch so a storage read error doesn't crash the app.

**`login(credentials)`**
- **Purpose:** Logs the user in and updates React state.
- **How it works:** Calls `authService.login()` which handles the API call and storage. Then sets `token`, `user`, and `role` in React state, which triggers the navigation system to redirect to the appropriate home screen.

**`signup(credentials)`**
- **Purpose:** Registers a new user.
- **How it works:** Calls `authService.signup()`. Does NOT update React state because the user must verify their email first.

**`verifyEmail(credentials)`**
- **Purpose:** Completes registration and logs the user in.
- **How it works:** Calls `authService.verifyEmail()` which stores auth data. Updates React state with the returned token/user/role, triggering navigation to the home screen.

**`logout()`**
- **Purpose:** Logs the user out and resets all state.
- **How it works:** Calls `authService.logout()` to clear storage, then sets token/user/role to null in React state. This triggers the navigation system to redirect to the login screen.

**`isAuthenticated` (computed):** Returns `true` only if both `token` and `user` are non-null.

**`useAuth()` hook:** Provides access to the auth context from any component. Throws an error if used outside the provider.

---

### A.17 DispatchContext (`src/contexts/DispatchContext.tsx`)

The central orchestrator for responder duty status, location tracking, and dispatch management. This is the most complex context in the app.

**`sendLocationUpdate()`**
- **Purpose:** Gets the current GPS position and sends it to the backend.
- **How it works:** Calls `locationService.getCurrentLocation()` then `dispatchService.updateLocation()`. On success, updates `locationLastSent` and `isBackendConfirmed` state. On 422 error (not on duty), it attempts automatic recovery: sets duty status back to on_duty, then retries the location update. This self-healing behavior prevents the situation where the backend loses the duty status but the app thinks it's still tracking.

**`startPeriodicLocationUpdates()`**
- **Purpose:** Starts a foreground interval timer that sends location updates every 15 seconds.
- **How it works:** Uses `setInterval()` to call `sendLocationUpdate()` repeatedly. This serves as a fallback in case the background location task fails to start or stops unexpectedly.

**`autoStartTracking()`**
- **Purpose:** Performs the full startup sequence when a responder logs in.
- **How it works (step by step):**
  1. Requests background location permission — shows settings prompt if denied
  2. Requests notification permission — shows warning if denied (non-blocking)
  3. Sets duty status to ON DUTY on the backend — this MUST succeed before location updates work
  4. Starts background location tracking via `expo-task-manager`
  5. Sends an immediate location update (so admin sees the responder right away)
  6. Starts the foreground periodic update fallback (every 15 seconds)
  7. Starts dispatch polling (every 10 seconds)

**`stopTracking()`**
- **Purpose:** Performs the full shutdown sequence during logout or going off-duty.
- **How it works:** Stops dispatch polling, stops foreground periodic updates, stops background tracking, then sets duty status to OFF DUTY on the backend. Each step is wrapped in try/catch so one failure doesn't prevent the rest from executing.

**Auto-start useEffect:**
- Watches the `user` state. When a responder logs in, checks if background tracking is already active; if not, calls `autoStartTracking()`. When the user logs out (user becomes null), calls `stopTracking()`.

---

### A.18 IncomingCallContext (`src/contexts/IncomingCallContext.tsx`)

Manages the complete lifecycle of admin-initiated voice calls to community users.

**`handleNewCall(call: IncomingCall)`**
- **Purpose:** Processes a newly detected incoming call.
- **How it works (step by step):**
  1. Checks if user is already in a call via `getActiveCall()` — if busy, auto-rejects
  2. Checks if `callState` is idle — if not, auto-rejects (prevents double-handling)
  3. Sets call state to "ringing"
  4. Starts ringtone audio playback
  5. Starts vibration pattern
  6. Shows a push notification
  7. Navigates to the incoming call modal screen (with a 100ms delay for state propagation)

**`answerCall(): Promise<{ success, channelName?, error? }>`**
- **Purpose:** Accepts an incoming call and returns the Agora channel name.
- **How it works:** Uses `isAnsweringRef` to prevent double-answering (race condition protection). Stops ringtone and vibration, sets state to "answering", calls `callService.answerIncomingCall()` to notify the backend, sets state to "connected", and returns the channel name. The calling screen then uses this channel name to join the Agora voice channel.

**`rejectCall(): Promise<void>`**
- **Purpose:** Declines the incoming call.
- **How it works:** Stops ringtone/vibration, calls `callService.rejectIncomingCall()`, resets state to "idle".

**`endCall(): Promise<void>`**
- **Purpose:** Ends an active (connected) call.
- **How it works:** Calls `callService.endCall()`, stops any remaining audio, sets state to "ended", then after 500ms sets state back to "idle".

**Auto-start polling useEffect:**
- When a community user is authenticated, starts the incoming call polling. When they log out or role changes, stops polling.

---

### A.19 useAgoraCall Hook (`src/hooks/useAgoraCall.ts`)

Manages the Agora RTC voice engine for real-time audio communication.

**Initialization (useEffect on mount):**
- Requests Android microphone permission, creates the Agora engine with the app ID, configures it for communication channel profile, registers event handlers, and enables audio.

**Event handlers:**
- `onJoinChannelSuccess`: Called when the user successfully joins a voice channel. Sets state to "waiting for answer" (the other party hasn't joined yet).
- `onUserJoined`: Called when another user (admin/responder) joins the channel. Sets state to "in call" and starts the duration timer.
- `onUserOffline`: Called when the other party leaves. Logged but doesn't auto-end the call.

**`startCall(incidentId?)`**
- Creates a backend call record via `startCallAPI()`, receives a channel name, then joins that Agora channel as a broadcaster.

**`endCall()`**
- Leaves the Agora channel, calls `endCallAPI()` to notify the backend, resets all call state, and clears the duration timer.

**`toggleMute()`**
- Calls `agoraEngine.muteLocalAudioStream()` to toggle the microphone on/off.

**`answerCall(callId, channelName)`**
- Joins an existing Agora channel (created by the admin). Sets the call ID for later reference and joins as broadcaster.

**Duration timer (`startDurationTimer`):**
- A 1-second interval that increments `callDuration` by 1 each tick, displayed as MM:SS on the call screen.

---

### A.20 useDispatchPolling Hook (`src/hooks/useDispatchPolling.ts`)

Manages periodic fetching of dispatch assignments for responders.

**`refreshDispatches()`**
- **Purpose:** Fetches current dispatches and detects new ones.
- **How it works:** Calls `dispatchService.getDispatches()` to get assigned dispatches and nearby incidents. Compares received dispatch IDs against a `Set` of previously seen IDs (`lastSeenDispatchIds`). For any new dispatch not in the set, calls `showDispatchNotification()` to alert the responder. Updates the set with current IDs.

**`startPolling()`**
- Sets up a `setInterval` that calls `refreshDispatches()` every 10 seconds. Does an immediate initial fetch. Prevents duplicate polling if already active.

**`stopPolling()`**
- Clears the interval, empties the dispatch list, and clears the seen IDs set.

**`updateDispatchStatus(dispatchId, status)`**
- Calls the backend to update a dispatch's status, then **optimistically merges** the response into local state. This means the UI updates immediately without waiting for the next poll cycle. It preserves the existing `incident` data on the dispatch in case the backend response doesn't include it.

**`activeDispatches` (computed):**
- Filters the full dispatch list to exclude "completed" and "declined" statuses.

---

### A.21 useIncidents Hook (`src/hooks/useIncidents.ts`)

Manages incident creation and history for community users.

**`getCurrentLocation()` (internal)**
- Requests foreground location permission, gets high-accuracy GPS fix, then reverse-geocodes the coordinates using `expo-location`'s built-in geocoder. Constructs a readable address from street number, street, district, city, and region. Falls back to raw coordinates if geocoding fails.

**`createIncident(type, description)`**
- **Purpose:** Full incident creation flow.
- **How it works:** First gets location (with detailed error handling for permission denied, timeout, and general errors). Builds a `CreateIncidentRequest` with type, coordinates, address, and description. Calls the API. Handles specific HTTP errors: 401 (auth expired), 422 (validation with field-specific messages), 404 (endpoint missing), 5xx (server errors), and network errors. On success, adds the new incident to local state.

**`loadIncidents()`**
- Fetches all user incidents from the backend and updates local state.

**`startPolling(intervalMs = 15000)`**
- Creates a polling interval that calls `loadIncidents()` periodically. Returns a cleanup function to stop polling (used in useEffect return).

---

### A.22 useIncidentTracking Hook (`src/hooks/useIncidentTracking.ts`)

Polls responder locations for community users watching their assigned responders.

**`startTracking(incidentId)`**
- Stores the incident ID in a ref (to avoid dependency issues), does an initial fetch of tracking data, then sets up a 3-second polling interval.

**`refreshTracking()`**
- Calls `trackingService.getIncidentTracking()` with the stored incident ID. If the response indicates `tracking_available: false` (incident completed/cancelled), automatically stops polling.

**`stopTracking()`**
- Clears the polling interval. Keeps the incident ID ref for potential resume.

---

### A.23 useIncomingCallPolling Hook (`src/hooks/useIncomingCallPolling.ts`)

Detects admin-initiated calls for community users.

**`pollOnce()`**
- Calls `pollIncomingCall()` API. If a new call is detected (different ID from `lastSeenCallId`), stores the call in state and calls the `onNewCall` callback. Uses deduplication to prevent processing the same call multiple times.

**`startPolling(onNewCall, onCallCanceled)`**
- Stores callbacks in refs (to avoid closure staleness), does an initial poll, then sets up a 3-second interval.

**`pausePolling()`**
- Stops the interval but **preserves call state** (incoming call data and last seen ID). Used during active calls so polling doesn't interfere.

**`stopPolling()`**
- Stops the interval AND **resets all state** (clears incoming call, last seen ID, callbacks, and error). Used on logout.

---

### A.24 useMessagePolling Hook (`src/hooks/useMessagePolling.ts`)

Manages real-time chat messaging with app state awareness.

**`startPolling(incidentId)`**
- Stores the incident ID in a ref, does an initial fetch, then sets up a 2-second polling interval.

**`sendMessage(incidentId, text?, imageUri?)`**
- Constructs the message request. If an image is provided, extracts the filename and MIME type from the URI. Calls `messageService.sendMessage()`, then **optimistically adds** the returned message to local state for instant UI feedback. Also triggers a full refresh to ensure consistency.

**`markMessagesAsRead(messageIds)`**
- Uses `Promise.all()` to mark multiple messages as read in parallel (one API call per message). Updates local state to reflect read status immediately.

**App state listener (useEffect):**
- Listens for app foreground/background transitions via React Native's `AppState`. When the app goes to the background, pauses polling (clears interval) to save battery. When the app returns to the foreground, immediately fetches new messages and resumes polling.

---

### A.25 Responsive Utility (`src/utils/responsive.ts`)

Scales UI dimensions to look correct across different screen sizes.

**`scaleWidth(size)` / `scaleHeight(size)`** — Multiplies the input by the ratio of the current screen dimension to the reference device (iPhone 12/13 Pro: 390x844). Uses `PixelRatio.roundToNearestPixel()` for crisp rendering.

**`scaleFontSize(size)`** — Same as width scaling but clamped between 0.85x and 1.3x to prevent text from becoming unreadably small on small phones or oversized on tablets.

**`scale(size)`** — Uses the average of width and height scaling factors for elements that should scale proportionally in both directions.

**`getResponsiveButtonSize(baseSize)`** — Returns a scaled button size with absolute min/max constraints: large buttons (SOS) stay between 200-300px, medium buttons between 80-140px, small buttons between 50-80px.

---

### A.26 Coordinate Validation (`src/utils/coordinates.ts`)

Prevents map crashes from invalid GPS data — a common source of crashes in React Native Maps.

**`isValidCoordinate(coord)`** — TypeScript type guard that checks: non-null object, numeric latitude and longitude, no NaN values, latitude in [-90, 90] range, longitude in [-180, 180] range. If all pass, TypeScript narrows the type to guarantee both fields exist.

**`getSafeCoordinate(coord, fallback)`** — Returns the original coordinate if valid, otherwise returns the fallback. Default fallback is Manila, Philippines (14.5995, 120.9842).

**`areValidPolylineCoordinates(coords)`** — Validates an entire array of coordinates (used for route polylines). Returns true only if the array is non-empty and every coordinate passes `isValidCoordinate()`.

---

### A.27 Time Utility (`src/utils/time.ts`)

Date/time formatting functions using the `date-fns` library.

**`getElapsedTime(timestamp)`** — Returns duration since a timestamp without suffix, e.g., "2 hours", "30 minutes". Used for dispatch elapsed time displays.

**`getRelativeTime(timestamp)`** — Same as above but with "ago" suffix, e.g., "2 hours ago". Used for message timestamps.

**`formatDateTime(timestamp)`** — Full date and time, e.g., "Dec 24, 2025 10:30 AM". Used for incident timelines.

**`formatTime(timestamp)`** — Time only, e.g., "10:30 AM". Used for chat message timestamps.

**`formatDate(timestamp)`** — Date only, e.g., "Dec 24, 2025". Used for history screens.

---

### A.28 Error Tracking (`src/utils/errorTracking.ts`)

Global error capture system.

**`initializeErrorTracking()`**
- **Purpose:** Installs a global error handler that catches all unhandled JavaScript errors.
- **How it works:** Uses React Native's `ErrorUtils.setGlobalHandler()` to intercept uncaught errors. When an error occurs, it constructs an `ErrorLog` with the message, full stack trace, whether it was fatal, platform (iOS/Android), and timestamp. Logs the error to console. After logging, calls the default error handler to preserve normal crash behavior. A backend logging endpoint is prepared but commented out for future use.

**`trackError(error, context?, additionalData?)`**
- **Purpose:** Manually log a caught error with additional context.
- **How it works:** Creates an `ErrorLog` from the error (supporting both Error objects and arbitrary values), merges in the context string and additional data, and logs it. Used in catch blocks throughout the app for consistent error reporting.

---

### A.29 Action Tracking (`src/utils/actionTracking.ts`)

User action logging for debugging and analytics.

**`trackAction(action, context?)`**
- **Purpose:** Logs a user action with an optional context object.
- **How it works:** Simply logs to console with `[USER ACTION]` prefix, the action name, context data, and timestamp. A backend analytics endpoint is prepared but commented out.

**`ActionTypes` (const object)**
- **Purpose:** Provides a centralized dictionary of all trackable action names for consistency.
- **Categories:** AUTH (login/logout), DUTY (toggle on/off), DISPATCH (accept/decline/complete), NAVIGATION (screen changes), FORM (pre-arrival submit), LOCATION (permission/update events), NOTIFICATION (permission/receive/tap), MAP (route/center/select), and CALL (phone call actions).
