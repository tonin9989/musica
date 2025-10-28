import React, {useState} from 'react'

export default function Auth(){
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle(){
    setLoading(true)
    try{
      const url = mode==='login' ? '/api/login' : '/api/register'
      const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,pass})})
      const body = await res.json()
      if(!res.ok){
        alert(body.error || 'Erro')
      } else {
        // store token and user
        if(body.token){
          localStorage.setItem('token', body.token)
        }
        if(body.user) localStorage.setItem('user', JSON.stringify(body.user))
        alert(mode==='login' ? 'Logado' : 'Registrado e logado')
        window.location.href = '/'
      }
    }catch(err){
      alert('Erro: ' + err)
    }finally{ setLoading(false) }
  }

  return (
    <div className="page auth">
      <h2>{mode==='login' ? 'Entrar' : 'Registrar'}</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
      <button onClick={handle} disabled={loading}>{loading ? '...' : (mode==='login' ? 'Entrar' : 'Registrar')}</button>
      <p style={{cursor:'pointer',color:'var(--muted)'}} onClick={()=>setMode(mode==='login'?'register':'login')}>Mudar para {mode==='login'?'Registrar':'Entrar'}</p>
    </div>
  )
}
