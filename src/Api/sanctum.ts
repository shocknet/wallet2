import { SANCTUM_ACCESS_TOKEN_STORAGE_KEY } from "../constants"

export const getSanctumAccessToken = () => {
    return localStorage.getItem(SANCTUM_ACCESS_TOKEN_STORAGE_KEY)
}

export const setSanctumAccessToken = (accessToken: string) => {
    return localStorage.setItem(SANCTUM_ACCESS_TOKEN_STORAGE_KEY, accessToken)
}