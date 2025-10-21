export function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}
export function set<T>(key: string, value: T){
  localStorage.setItem(key, JSON.stringify(value))
}
export function uid(){ return crypto.randomUUID() }
export const today = () => new Date().toISOString().slice(0,10)
