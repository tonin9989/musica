export function apiBase(){
  // Vite exposes env vars prefixed with VITE_ via import.meta.env
  // If not set, default to empty which keeps previous relative-path behavior
  return import.meta.env.VITE_API_BASE || ''
}

export async function apiFetch(path, opts){
  const base = apiBase()
  const url = path.startsWith('http') ? path : `${base}${path}`
  const token = localStorage.getItem('token')
  const headers = Object.assign({}, (opts && opts.headers) || {})
  if(token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...(opts||{}), headers })
}

export function apiUrl(path){
  const base = apiBase()
  return path.startsWith('http') ? path : `${base}${path}`
}

// --- Auth helpers ---
export async function login(email, pass){
  const res = await apiFetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pass }) })
  const data = await res.json()
  if(!res.ok) throw new Error(data.error || 'Falha ao entrar')
  if(data.token) localStorage.setItem('token', data.token)
  if(data.user) localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function register(email, pass){
  const res = await apiFetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pass }) })
  const data = await res.json()
  if(!res.ok) throw new Error(data.error || 'Falha ao registrar')
  if(data.token) localStorage.setItem('token', data.token)
  if(data.user) localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function getMe(){
  const res = await apiFetch('/api/me', { method: 'GET' })
  const data = await res.json()
  if(!res.ok) throw new Error(data.error || 'Falha ao carregar usuário')
  if(data.user) localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}
