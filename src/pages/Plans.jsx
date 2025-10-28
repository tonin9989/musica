import React, { useState, useEffect } from 'react'

export default function Plans(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    try{
      const u = JSON.parse(localStorage.getItem('user')||'null')
      setUser(u)
    }catch(e){ setUser(null) }
  },[])

  async function subscribe(plan){
    const token = localStorage.getItem('token')
    if(!token){
      alert('Você precisa entrar para assinar um plano.')
      window.location.href = '/auth'
      return
    }
    setLoading(true)
    try{
      const res = await fetch('/api/subscribe', {method:'POST', headers:{'Content-Type':'application/json','Authorization': 'Bearer ' + token}, body: JSON.stringify({plan})})
      const body = await res.json()
      if(!res.ok){
        alert(body.error || 'Erro ao assinar')
      } else {
        if(body.user) {
          localStorage.setItem('user', JSON.stringify(body.user))
          setUser(body.user)
        }
        alert('Assinatura aplicada: ' + plan)
      }
    }catch(err){
      alert('Erro: ' + err)
    }finally{ setLoading(false) }
  }

  const plans = [
    { id: 'free', name: 'Free', price: 'Grátis', features: ['Qualidade padrão', 'Anúncios', 'Acesso limitado'] },
    { id: 'premium', name: 'Premium', price: 'R$ 19,90/mês', features: ['Sem anúncios', 'Downloads', 'Alta qualidade'] },
    { id: 'family', name: 'Family', price: 'R$ 29,90/mês', features: ['Até 6 contas', 'Perfis separados', 'Desconto familiar'] }
  ]

  return (
    <div className="page plans">
      <h2>Planos</h2>
      <p style={{color:'var(--muted)'}}>Escolha um plano que combine com você. Você pode mudar a qualquer momento.</p>

      <div className="plans-grid">
        {plans.map(p => (
          <div key={p.id} className="plan-card card animate-fade">
            <div className="plan-tier">{p.name}</div>
            <div className="plan-price">{p.price}</div>
            <ul className="plan-features">
              {p.features.map((f,i)=>(<li key={i}>{f}</li>))}
            </ul>
            <div style={{marginTop:12}}>
              <button className="plan-cta" onClick={()=>subscribe(p.id)} disabled={loading || (user && user.plan===p.id)}>
                {user && user.plan===p.id ? 'Assinado' : (loading ? '...' : 'Assinar')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:18}}>
        {user ? <div style={{color:'var(--muted)'}}>Conta: <strong>{user.email}</strong> · Plano atual: <strong>{user.plan||'Free'}</strong></div> : <div style={{color:'var(--muted)'}}>Você não está logado.</div>}
      </div>
    </div>
  )
}
