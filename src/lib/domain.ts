import { get } from "psl"
export function extractDomainFromUrl(url: string): string | null {
	try {
		const { hostname } = new URL(url);

		// Handle IP addresses
		if (isIpAddress(hostname)) {
			return hostname.replace(/^\[|\]$/g, ''); // Remove IPv6 brackets if present
		}


		// Use public suffix list for accurate TLD detection
		const publicSuffix = get(hostname);

		if (!publicSuffix) {
			return hostname; // Fallback if PSL lookup fails
		}

		// Get eTLD+1 (registered domain)
		const registeredDomain = get(hostname);
		return registeredDomain || hostname;
	} catch (error) {
		console.error(`Failed to extract domain from URL: ${url}`, error);
		return null;
	}
}

// Helper function to detect IP addresses
function isIpAddress(hostname: string): boolean {
	// IPv6 (in brackets)
	if (/^\[[0-9a-fA-F:]+\]$/.test(hostname)) return true;

	// IPv4
	const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	return ipv4Pattern.test(hostname);
}