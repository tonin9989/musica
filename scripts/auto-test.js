// Simple end-to-end smoke for auth + charge flow
// Usage: node scripts/auto-test.js

async function run(){
  try{
    const base = 'http://localhost:3000'
    const fetch = globalThis.fetch || (await import('node-fetch')).default

    console.log('Registering user...')
    let res = await fetch(base + '/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: 'auto@test.local', pass: 'senha1234' }) })
    let body = await res.json()
    console.log('/api/register', res.status, body)

    if(!res.ok && res.status===400){
      // maybe user exists, try login
      console.log('Register failed, trying login...')
    }

    res = await fetch(base + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: 'auto@test.local', pass: 'senha1234' }) })
    body = await res.json()
    console.log('/api/login', res.status, body)
    if(!res.ok) throw new Error('login failed')
    const token = body.token

    console.log('Creating charge...')
    res = await fetch(base + '/api/create-charge', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ plan: 'premium' }) })
    body = await res.json()
    console.log('/api/create-charge', res.status, body)
    if(!res.ok) throw new Error('create charge failed')
    const chargeId = body.charge.id

    console.log('Checking charge...')
    res = await fetch(base + '/api/charges/' + chargeId, { headers: { 'Authorization': 'Bearer ' + token } })
    body = await res.json()
    console.log('/api/charges/:id', res.status, body)

    console.log('Simulating payment...')
    res = await fetch(base + '/api/simulate-pay', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ chargeId }) })
    body = await res.json()
    console.log('/api/simulate-pay', res.status, body)

    console.log('Re-checking charge...')
    res = await fetch(base + '/api/charges/' + chargeId, { headers: { 'Authorization': 'Bearer ' + token } })
    body = await res.json()
    console.log('/api/charges/:id', res.status, body)

    console.log('Done')
  }catch(err){
    console.error('auto-test error', err)
    process.exit(1)
  }
}
run()
