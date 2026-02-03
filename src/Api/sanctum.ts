import { SANCTUM_ACCESS_TOKEN_STORAGE_KEY, SANCTUM_REFRESH_TOKEN_STORAGE_KEY } from "../constants"

export const getSanctumAccessToken = () => {
	return localStorage.getItem(SANCTUM_ACCESS_TOKEN_STORAGE_KEY)
}

export const setSanctumAccessToken = (accessToken: string) => {
	return localStorage.setItem(SANCTUM_ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

export const removeSanctumAccessToken = () => {
	return localStorage.removeItem(SANCTUM_ACCESS_TOKEN_STORAGE_KEY);
}

export const getSanctumRefreshToken = () => {
	return localStorage.getItem(SANCTUM_REFRESH_TOKEN_STORAGE_KEY)
}

export const setSanctumRefreshToken = (refreshToken: string) => {
	return localStorage.setItem(SANCTUM_REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export const removeSanctumRefreshToken = () => {
	return localStorage.removeItem(SANCTUM_REFRESH_TOKEN_STORAGE_KEY);
}
