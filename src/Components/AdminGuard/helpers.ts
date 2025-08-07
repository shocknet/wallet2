import type { NostrKeyPair } from "@/Api/nostrHandler"

const ADMIN_SOURCE_STORAGE_KEY = "adminSourceStorageKey"
export type AdminSource = {
	nprofile: string
	keys: NostrKeyPair
}
export const getAdminSource = (): AdminSource | undefined => {
	const adminSource = localStorage.getItem(ADMIN_SOURCE_STORAGE_KEY)
	if (!adminSource) {
		return undefined
	}
	return JSON.parse(adminSource)
}
export const setAdminSource = (adminSource: AdminSource) => {
	localStorage.setItem(ADMIN_SOURCE_STORAGE_KEY, JSON.stringify(adminSource))
}
