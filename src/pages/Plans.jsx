import React from 'react'

export default function Plans(){
  return (
    <div className="page plans">
      <h2>Planos</h2>
      <div className="plans-grid">
        <div className="plan">
          <h3>Free</h3>
          <p>Suporte básico, anúncios, qualidade padrão.</p>
        </div>
        <div className="plan">
          <h3>Premium</h3>
          <p>Sem anúncios, downloads, alta qualidade.</p>
        </div>
      </div>
    </div>
  )
}
