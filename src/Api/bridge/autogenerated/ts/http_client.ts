// This file was autogenerated from a .proto file, DO NOT EDIT!
import axios from 'axios'
import * as Types from './types.js'
export type ResultError = { status: 'ERROR', reason: string }

export type ClientParams = {
    baseUrl: string
    retrieveGuestAuth: () => Promise<string | null>
    encryptCallback: (plain: any) => Promise<any>
    decryptCallback: (encrypted: any) => Promise<any>
    deviceId: string
    checkResult?: true
}
export default (params: ClientParams) => ({
    GetOrCreateVanityName: async (request: Types.GetOrCreateVanityNameRequest): Promise<ResultError | ({ status: 'OK' }& Types.GetOrCreateVanityNameResponse)> => {
        const auth = await params.retrieveGuestAuth()
        if (auth === null) throw new Error('retrieveGuestAuth() returned null')
        let finalRoute = '/api/v1/vanity'
        const { data } = await axios.post(params.baseUrl + finalRoute, request, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.GetOrCreateVanityNameResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
})
