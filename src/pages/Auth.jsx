import React, {useState} from 'react'

export default function Auth(){
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function validate(){
    if(!email || !pass) return 'Email e senha são obrigatórios.'
    // simple email check
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Email inválido.'
    if(pass.length < 4) return 'Senha deve ter ao menos 4 caracteres.'
    return ''
  }

  async function handle(){
    setError('')
    setSuccess('')
    const v = validate()
    if(v){ setError(v); return }
    setLoading(true)
    try{
      const url = mode==='login' ? '/api/login' : '/api/register'
      const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,pass})})
      const body = await res.json()
      if(!res.ok){
        setError(body.error || 'Erro ao processar a requisição')
      } else {
        // store token and user
        if(body.token){
          localStorage.setItem('token', body.token)
        }
        if(body.user) localStorage.setItem('user', JSON.stringify(body.user))
        setSuccess(mode==='login' ? 'Logado com sucesso' : 'Registrado e logado')
        // small delay to show message then redirect
        setTimeout(()=> window.location.href = '/', 900)
      }
    }catch(err){
      setError('Erro: ' + (err && err.message ? err.message : String(err)))
    }finally{ setLoading(false) }
  }

  return (
    <div className="page auth">
      <div className="auth-card card animate-fade">
        <h2 className="auth-title">{mode==='login' ? 'Entrar' : 'Criar conta'}</h2>
        <p className="auth-sub">{mode==='login' ? 'Entre com sua conta' : 'Crie uma conta para aproveitar tudo'}</p>

        <label className="auth-label">Email
          <input className="auth-input" placeholder="exemplo@dominio.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>

        <label className="auth-label">Senha
          <input className="auth-input" placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </label>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div style={{display:'flex',gap:10,marginTop:10}}>
          <button className="auth-cta" onClick={handle} disabled={loading}>{loading ? 'Aguarde...' : (mode==='login' ? 'Entrar' : 'Registrar')}</button>
          <button className="auth-toggle" onClick={()=>{ setMode(mode==='login'?'register':'login'); setError(''); setSuccess('') }}>
            {mode==='login' ? 'Criar conta' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
