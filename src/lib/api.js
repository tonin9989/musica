export function apiBase(){
  // Vite exposes env vars prefixed with VITE_ via import.meta.env
  // If not set, default to empty which keeps previous relative-path behavior
  return import.meta.env.VITE_API_BASE || ''
}

export async function apiFetch(path, opts){
  const base = apiBase()
  const url = path.startsWith('http') ? path : `${base}${path}`
  return fetch(url, opts)
}

export function apiUrl(path){
  const base = apiBase()
  return path.startsWith('http') ? path : `${base}${path}`
}
