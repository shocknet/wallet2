import { finalizeEvent } from "nostr-tools"
import { hexToBytes } from "@noble/hashes/utils"
import type { NostrKeyPair } from "@/Api/nostrHandler"

export const DEFAULT_BLOSSOM_SERVER = "https://cdn.nostrcheck.me"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const toBase64Url = (input: string) => {
	const bytes = new TextEncoder().encode(input)
	let binary = ""
	bytes.forEach((b) => {
		binary += String.fromCharCode(b)
	})
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const sha256Hex = async (file: File) => {
	const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
	return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

const blossomAuthHeader = (keys: NostrKeyPair, uploadUrl: string, sha256: string) => {
	const hostname = new URL(uploadUrl).hostname.toLowerCase()
	const signed = finalizeEvent({
		kind: 24242,
		created_at: Math.floor(Date.now() / 1000),
		tags: [
			["t", "upload"],
			["expiration", String(Math.floor(Date.now() / 1000) + 5 * 60)],
			["server", hostname],
			["x", sha256],
		],
		content: "Upload Blob",
	}, hexToBytes(keys.privateKey))
	return `Nostr ${toBase64Url(JSON.stringify(signed))}`
}

export const assertAvatarFile = (file: File) => {
	if (!ALLOWED_TYPES.has(file.type)) {
		throw new Error("Avatar must be a jpeg, png, webp, or gif")
	}
	if (file.size > MAX_AVATAR_BYTES) {
		throw new Error("Avatar must be under 2MB")
	}
}

export const uploadAvatarToBlossom = async (file: File, keys: NostrKeyPair): Promise<string> => {
	assertAvatarFile(file)
	const uploadUrl = `${DEFAULT_BLOSSOM_SERVER}/upload`
	const hash = await sha256Hex(file)
	const res = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			"Content-Type": file.type || "application/octet-stream",
			"X-SHA-256": hash,
			Authorization: blossomAuthHeader(keys, uploadUrl, hash),
		},
		body: file,
	})
	if (!res.ok) {
		throw new Error(`Avatar upload failed (${res.status})`)
	}
	const data = await res.json() as { url?: string }
	const url = data.url?.trim() || ""
	if (!url.startsWith("https://")) {
		throw new Error("Avatar upload did not return an https URL")
	}
	return url
}
