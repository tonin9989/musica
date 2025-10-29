import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

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
    // create a charge via backend to show PIX QR
    setLoading(true)
    try{
      const res = await fetch('/api/create-charge', {method:'POST', headers:{'Content-Type':'application/json','Authorization': 'Bearer ' + token}, body: JSON.stringify({plan})})
      const body = await res.json()
      if(!res.ok) return alert(body.error || 'Erro ao criar cobrança')
      const charge = body.charge
      // show QR modal
      openQrModal(charge)
    }catch(err){
      alert('Erro: ' + err)
    }finally{ setLoading(false) }
  }

  const [qrOpen, setQrOpen] = useState(false)
  const [qrSrc, setQrSrc] = useState('')
  const [currentCharge, setCurrentCharge] = useState(null)
  const pollRef = useRef(null)

  function openQrModal(charge){
    setCurrentCharge(charge)
    // generate QR image from payload
    QRCode.toDataURL(charge.pixPayload || ('PIX:'+charge.id))
      .then(url=> setQrSrc(url))
      .catch(()=> setQrSrc(''))
    setQrOpen(true)
    // start polling status
    startPolling(charge.id)
  }

  function closeQrModal(){
    setQrOpen(false)
    setQrSrc('')
    setCurrentCharge(null)
    if(pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  function startPolling(chargeId){
    if(pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async ()=>{
      try{
        const token = localStorage.getItem('token')
        const res = await fetch('/api/charges/' + chargeId, { headers: { Authorization: 'Bearer ' + token } })
        if(!res.ok) return
        const body = await res.json()
        const ch = body.charge
        setCurrentCharge(ch)
        if(ch.status === 'paid'){
          // update local user and close modal after a small success animation
          const u = JSON.parse(localStorage.getItem('user')||'null')
          if(u){ u.plan = ch.plan; localStorage.setItem('user', JSON.stringify(u)); setUser(u) }
          clearInterval(pollRef.current)
          pollRef.current = null
          setTimeout(()=> closeQrModal(), 900)
        }
      }catch(e){ /* ignore polling errors */ }
    }, 2000)
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

      {qrOpen && (
        <div className="qr-modal-backdrop" onClick={closeQrModal}>
          <div className="qr-modal animate-fade" onClick={(e)=>e.stopPropagation()}>
            {qrSrc ? <img src={qrSrc} alt="PIX QR" className={currentCharge && currentCharge.status==='paid' ? 'pulse' : ''} /> : <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center'}}>Gerando QR...</div>}
            <div className="qr-info">
              {currentCharge ? (
                <div>
                  {currentCharge.status === 'paid' ? <div className="qr-paid">Pagamento recebido — Obrigado!</div> : <div>Escaneie com seu app bancário para pagar R$ {Number(currentCharge.amount).toFixed(2)}</div>}
                  <div style={{marginTop:8,fontSize:12,color:'var(--muted)'}}>Cobrança: <code style={{color:'var(--muted)'}}>{currentCharge.id}</code></div>
                </div>
              ) : null}
            </div>
            <div style={{marginTop:12}}>
              <button className="plan-cta" onClick={closeQrModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
