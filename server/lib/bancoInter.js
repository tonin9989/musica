// Adaptador mínimo para integrar com Banco Inter PIX
// Este arquivo tem um stub com a forma e comentários para implementar a integração real.
// Ele expõe duas funções principais:
// - createPixCharge({amount, reference, description}) -> { chargeId, pixPayload, raw }
// - verifyWebhook(reqBody, reqHeaders) -> { valid, chargeId, status }
//
// SECURITY: Não coloque chaves no repositório. Use variáveis de ambiente:
// INTER_CLIENT_ID, INTER_CLIENT_SECRET, INTER_SANDBOX (true/false) e INTER_WEBHOOK_SECRET

export async function createPixCharge({ amount, reference, description }){
  // Placeholder implementation: in production, faça request à API do Banco Inter para criar cobrança
  const clientId = process.env.INTER_CLIENT_ID || ''
  const clientSecret = process.env.INTER_CLIENT_SECRET || ''
  if(!clientId || !clientSecret) throw new Error('Banco Inter credentials not configured (INTER_CLIENT_ID/INTER_CLIENT_SECRET)')

  // Exemplo: troque isso por chamada real para obter payload/txid/qrcode
  const fakeId = 'inter_' + Date.now()
  const fakePayload = `BRCODE|inter:${fakeId}|amount:${amount}`
  return { chargeId: fakeId, pixPayload: fakePayload, raw: { note: 'stub - replace with real Banco Inter response' } }
}

export function verifyWebhook(body, headers){
  // Verifique assinatura/headers conforme documentação do Banco Inter
  const expected = process.env.INTER_WEBHOOK_SECRET || ''
  if(expected){
    const sent = headers['x-inter-signature'] || headers['x-webhook-signature'] || ''
    // placeholder na verificação
    if(!sent) return { valid:false }
    // TODO: implementar verificação HMAC/RSA conforme Inter
  }
  // retornar objeto com chargeId e status quando válido
  return { valid:true, chargeId: body.chargeId || body.txid || null, status: body.status || 'paid' }
}
