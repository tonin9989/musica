import React, {useState} from 'react'

export default function Auth(){
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  function handle(){
    const users = JSON.parse(localStorage.getItem('users')||'[]')
    if(mode==='register'){
      users.push({email,pass})
      localStorage.setItem('users', JSON.stringify(users))
      alert('Registrado')
    } else {
      const ok = users.find(u=>u.email===email && u.pass===pass)
      if(ok) alert('Logado')
      else alert('Credenciais inválidas')
    }
  }

  return (
    <div className="page auth">
      <h2>{mode==='login' ? 'Entrar' : 'Registrar'}</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
      <button onClick={handle}>{mode==='login' ? 'Entrar' : 'Registrar'}</button>
      <p onClick={()=>setMode(mode==='login'?'register':'login')}>Mudar para {mode==='login'?'Registrar':'Entrar'}</p>
    </div>
  )
}
