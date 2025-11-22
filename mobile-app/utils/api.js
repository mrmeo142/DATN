import Constants from 'expo-constants'
import { Platform } from 'react-native'

const baseFromExtra = Constants?.expoConfig?.extra?.apiBaseUrl
const baseFromEnv = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
let base = baseFromExtra || baseFromEnv || 'http://localhost:8080'
if (Platform.OS === 'android' && base.includes('localhost')) {
  base = base.replace('localhost', '10.0.2.2')
}

export const apiBaseUrl = base

export const apiFetch = async (path, options = {}) => {
  const url = `${apiBaseUrl}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`
    throw new Error(message)
  }
  return data
}

export const apiPost = (path, body, options = {}) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options })

export const apiGet = (path, options = {}) => apiFetch(path, { method: 'GET', ...options })

export const apiPatch = (path, body, options = {}) =>
  apiFetch(path, { method: 'PATCH', body: JSON.stringify(body), ...options })

export const apiPut = (path, body, options = {}) =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options })

export const apiUpload = async (path, formData, options = {}) => {
  const url = `${apiBaseUrl}${path}`
  const res = await fetch(url, {
    method: options.method || 'POST',
    body: formData,
    headers: { ...(options.headers || {}) },
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`
    throw new Error(message)
  }
  return data
}