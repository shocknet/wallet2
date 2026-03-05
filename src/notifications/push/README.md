# Push Notifications System

## Overview

This implementation provides contextual push notifications with deep linking and identity switching for multi-identity wallets.

## Architecture

### Components

1. **Intent Bus** (`intentBus.ts`)
   - Parses notification payloads into structured intents
   - Handles both web (URL params/postMessage) and native notifications
   - Stores intents in sessionStorage for persistence across app restarts

2. **Push Controller** (`PushController.tsx`)
   - React component that handles notification routing
   - Switches identities when notification is for inactive identity
   - Navigates to appropriate screen with context

3. **Token Management** (`tokenCache.ts`, `nativeToken.ts`, `webToken.ts`)
   - Registers Firebase Cloud Messaging tokens
   - Caches tokens in localStorage
   - Handles token refresh

4. **Enrollment Listener** (`../listeners/push/push.ts`)
   - Redux middleware listener
   - Automatically enrolls tokens with all nprofile sources
   - Re-enrolls when sources become fresh/available

5. **Capture** (`capture.ts`)
   - Early capture of notification intents (before React loads)
   - Handles cold start (URL params) and warm start (postMessage)

### Flow

#### Web (Cold Start)
1. User taps notification while app is closed
2. Service worker opens app with URL params: `?push=1&identity_hint=...&action_type=...&notif_op_id=...`
3. `captureWebEarly()` runs before React, parses URL, stores intent in sessionStorage
4. App loads, switches to correct identity
5. `PushController` consumes intent, navigates to Home with operation context
6. Home page opens OperationModal with the specific operation

#### Web (Warm Start)
1. User taps notification while app is open
2. Service worker posts message to app with intent data
3. `captureWebEarly()` listener receives message, stores intent
4. `PushController` immediately handles intent

#### Native
1. User taps notification
2. Capacitor fires `pushNotificationActionPerformed` event
3. `captureNativeEarly()` parses notification data, stores intent
4. `PushController` handles intent (same flow as web)

## Notification Types

### Current Types
- `payment-received` - User received a payment
- `payment-sent` - User sent a payment

Both navigate to `/home` with the operation ID in state.

### Adding New Types

1. Add to type union in `intentBus.ts`:
```typescript
export type PushActionType = "payment-received" | "payment-sent" | "your-new-type";
```

2. Add intent data type:
```typescript
export type YourNewTypeIntentData = {
	action_type: "your-new-type";
	// ... additional data fields
};
```

3. Add to union:
```typescript
export type PushActionData = PaymentReceivedIntentData | PaymentSentIntentData | YourNewTypeIntentData;
```

4. Update parser in `parsePushIntentFromPayload()`:
```typescript
if (actionType === "your-new-type") {
	// Parse and validate your data
	actionData = { action_type: "your-new-type", /* ... */ };
}
```

5. Update routing in `PushController.tsx` `routeForIntent()`:
```typescript
if (i.actionData?.action_type === "your-new-type") {
	return { path: "/your-page", state: { /* ... */ } };
}
```

## Backend Integration

The backend should send notifications with this structure:

### Firebase Cloud Messaging Format

```json
{
  "notification": {
    "title": "Payment Received",
    "body": "You received 1000 sats"
  },
  "data": {
    "identity_hint": "npub1...",
    "actionData": {
      "action_type": "payment-received",
      "notif_op_id": "op_123abc"
    }
  }
}
```

Or flat structure (both supported):

```json
{
  "notification": {
    "title": "Payment Received",
    "body": "You received 1000 sats"
  },
  "data": {
    "identity_hint": "npub1...",
    "action_type": "payment-received",
    "notif_op_id": "op_123abc"
  }
}
```

### Required Fields
- `identity_hint`: The npub of the identity this notification is for
- `action_type`: The notification category (must match `PushActionType`)
- Action-specific fields (e.g., `notif_op_id` for payment notifications)

## Testing

### 1. Test Token Enrollment

Check browser console for:
```
[Push] New token registered: eyJhbGciOiJIUzI1NI...
[Push] Enrolling token with 2 sources
[Push] Enrolled token with source Alice: OK
[Push] Enrolled token with source Bob: OK
```

### 2. Test Web Notifications (Warm)

1. Open app in browser
2. Use Firebase Console or backend to send test notification
3. Click notification
4. Check console for:
```
[Push] Service worker message: {...}
[Push] Parsed intent from service worker: {...}
[PushController] Handling push intent: {...}
```

### 3. Test Web Notifications (Cold)

1. Close all app tabs
2. Send test notification
3. Click notification
4. Check console for:
```
[Push] Cold start with push params: {...}
[PushController] Handling push intent: {...}
```

### 4. Test Identity Switching

1. Have 2+ identities configured
2. Switch to Identity A
3. Send notification for Identity B
4. Click notification
5. App should switch to Identity B and navigate correctly

### 5. Test Native (iOS/Android)

1. Build and install app: `npm run android:run`
2. Send notification to device
3. Tap notification
4. Check native logs for intent handling

## Debugging

Enable detailed logging by checking browser console:
- All push-related logs are prefixed with `[Push]`
- Service worker logs appear in service worker console (Chrome DevTools > Application > Service Workers)

## Known Limitations

1. **Web**: Browser must support service workers and push notifications
2. **Native**: Requires Firebase project configuration
3. **Identity switching**: Inactive identities must be able to "wake up" when notification arrives
4. **Service Worker**: Must be registered and active for web notifications

## Security

- Tokens are cached in localStorage (encrypted at OS level)
- Identity hints are public keys (npubs)
- Operation IDs should be non-guessable UUIDs
- Backend validates token ownership before sending notifications
