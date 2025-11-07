import React, {useState} from 'react'
import { login as apiLogin, register as apiRegister } from '../lib/api'

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
      const body = mode==='login' ? await apiLogin(email, pass) : await apiRegister(email, pass)
      setSuccess(mode==='login' ? 'Logado com sucesso' : 'Registrado e logado')
      setTimeout(()=> window.location.href = '/', 700)
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
