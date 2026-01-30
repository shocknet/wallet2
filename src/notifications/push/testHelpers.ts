/**
 * Test helpers for push notifications
 * Use these in browser console to test notification flows
 */

import { setIntent, PushClickIntent } from "./intentBus";

/**
 * Simulate a payment received notification
 * Usage in console:
 *   import { simulatePaymentReceivedNotification } from '@/notifications/push/testHelpers'
 *   simulatePaymentReceivedNotification('npub123...', 'op_abc123')
 */
export function simulatePaymentReceivedNotification(identityHint: string, operationId: string) {
	const intent: PushClickIntent = {
		type: "push_click",
		platform: "web",
		identityHint,
		actionData: {
			action_type: "payment-received",
			notif_op_id: operationId
		}
	};
	
	console.log("[Test] Simulating payment received notification:", intent);
	setIntent(intent);
	
	// Reload to trigger the flow
	window.location.reload();
}

/**
 * Simulate a payment sent notification
 */
export function simulatePaymentSentNotification(identityHint: string, operationId: string) {
	const intent: PushClickIntent = {
		type: "push_click",
		platform: "web",
		identityHint,
		actionData: {
			action_type: "payment-sent",
			notif_op_id: operationId
		}
	};
	
	console.log("[Test] Simulating payment sent notification:", intent);
	setIntent(intent);
	window.location.reload();
}

/**
 * Simulate a notification without action data (just opens to home)
 */
export function simulateBasicNotification(identityHint: string) {
	const intent: PushClickIntent = {
		type: "push_click",
		platform: "web",
		identityHint
	};
	
	console.log("[Test] Simulating basic notification:", intent);
	setIntent(intent);
	window.location.reload();
}

/**
 * Check if there's a pending intent
 */
export function checkPendingIntent() {
	const stored = sessionStorage.getItem("PUSH_CLICK_INTENT");
	if (stored) {
		const intent = JSON.parse(stored);
		console.log("[Test] Pending intent found:", intent);
		return intent;
	}
	console.log("[Test] No pending intent");
	return null;
}

/**
 * Clear any pending intent
 */
export function clearTestIntent() {
	sessionStorage.removeItem("PUSH_CLICK_INTENT");
	console.log("[Test] Cleared pending intent");
}

// Make available globally for easy console access
if (typeof window !== "undefined") {
	(window as any).pushTestHelpers = {
		simulatePaymentReceivedNotification,
		simulatePaymentSentNotification,
		simulateBasicNotification,
		checkPendingIntent,
		clearTestIntent
	};
	console.log("[Push] Test helpers loaded. Access via window.pushTestHelpers");
}
