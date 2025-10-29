# ProSpotify - Clone

Projeto scaffold de um player estilo Spotify, pronto para customizar e fazer deploy.

# ProSpotify - Clone

Projeto mínimo de player de música (estilo Spotify) com backend Express para servir mídias, upload, autenticação simples (JWT) e playlists persistidas em arquivo JSON.

Funcionalidades principais implementadas
- Upload de arquivos para a pasta `/media` via endpoint `/upload`.
- Listagem de mídias com leitura de metadados (ID3): título, artista, duração e capa (quando disponível) via `/api/media`.
- Autenticação simples: `/api/register` e `/api/login` retornam um token JWT. Tokens são usados para proteger rotas de playlists.
- Playlists persistidas em `server/data/playlists.json` com endpoints CRUD (`/api/playlists`).

Como rodar localmente

1. Instale dependências (no Windows PowerShell):
# ProSpotify - Clone

Projeto scaffold de um player estilo Spotify, pronto para customizar e fazer deploy.

Visão geral
-----------
Aplicação React (Vite) com um backend Express mínimo que expõe APIs para autenticação, gestão de playlists e upload/serving de arquivos de áudio. O frontend pode reproduzir arquivos locais e também embutir vídeos do YouTube (Player usa a IFrame API para vídeos).

Principais funcionalidades
- Upload de arquivos para a pasta `/media` via endpoint `/upload`.
- Listagem de mídias com leitura de metadados (ID3) via `/api/media`.
- Autenticação simples: `/api/register` e `/api/login` retornam token JWT. Tokens protegem rotas de playlists.
- Playlists persistidas em `server/data/playlists.json` (ou SQLite quando disponível).
- Player com suporte a arquivos locais e vídeos do YouTube (IFrame API) com auto-advance.

Como rodar localmente (Windows PowerShell)
----------------------------------------
1) Instale dependências (se ainda não):

```powershell
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta (2)\musica'
npm install --legacy-peer-deps
```

2) Rodar backend (API + serve estático `dist` após build):

```powershell
# em um terminal
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta (2)\musica'
node server/index.js
# servidor por padrão no http://localhost:3000
```

3) Rodar frontend em dev (Vite):

```powershell
# em outro terminal
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta (2)\musica'
npm run dev
# Vite mostrará a URL (ex.: http://localhost:5173)
```

4) Testar fluxo básico:
- Registrar/login em `/auth` (retorna token)
- Ir para `/plans` e assinar um plano (endpoint `/api/subscribe` salvo no backend)
- Na página inicial, testar as faixas de demonstração (YouTube embutido)

Build para produção
--------------------
O frontend usa Vite. O comando de build já existe em `package.json`:

```powershell
npm run build
```

Isso gera a pasta `dist` com os arquivos estáticos. O backend (`server/index.js`) serve `dist` em produção, então o fluxo de deploy clássico para um servidor Node.js é:

```powershell
# build
npm run build
# definir variável JWT_SECRET no ambiente
$env:JWT_SECRET = 'uma_chave_secreta'
# start
npm start
```

Deploy do frontend no Netlify (recomendado para frontend)
--------------------------------------------------------
Recomendo hospedar apenas o frontend no Netlify e o backend em outro serviço compatível com Node (Render, Fly.io, DigitalOcean App Platform, VPS, etc.). Netlify não executa um servidor Node persistente exceto via Functions (que exigiriam reescrever seu backend como funções serverless).

Passos rápidos para Netlify:
1) Conecte o repositório no Netlify (Sites -> New site -> Import from Git).
2) Na seção Build & deploy, configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
3) Em Site settings -> Environment, adicione `VITE_API_BASE` apontando para a URL do seu backend (ex.: `https://api.exemplo.com`). Ex.:
   - VITE_API_BASE = https://seu-backend.example.com
4) O `netlify.toml` já presente no repositório define o publish `dist` e um redirect para SPA. Netlify fará o build e publicará o `dist`.

Hospedar o backend (opções)
--------------------------
Você precisa de um servidor Node para rodar `server/index.js` se quiser a API disponível publicamente. Opções simples:
- Render.com — fácil deploy a partir do GitHub; suporta variáveis de ambiente (coloque `JWT_SECRET`).
- Fly.io / DigitalOcean App Platform — ambos suportam Node.js e volumes (se quiser persistir `media/`).
- VPS / Docker — empacote com Docker e rode em um host com volume para `media/`.

Variáveis de ambiente importantes (no servidor backend)
- JWT_SECRET — string secreta para assinar tokens JWT. Ex: `uma_chave_secreta`. DEFINA EM PRODUÇÃO.

Configurar o frontend para usar o backend
---------------------------------------
No Netlify (ou localmente com `.env`), defina `VITE_API_BASE` para a URL pública do backend. O frontend usa essa variável para construir URLs da API.

Exemplo local (PowerShell) para rodar com VITE_API_BASE apontando para um backend local:

```powershell
$env:VITE_API_BASE = 'http://localhost:3000'
npm run dev
```

Endpoints úteis
- GET `/api/media` — lista arquivos em `/media` com metadados (title, artist, src, cover, duration).
- POST `/upload` — aceita multipart/form-data (campo `files`) para enviar arquivos.
- POST `/api/register` — body {email, pass} — cria usuário e retorna token.
- POST `/api/login` — body {email, pass} — retorna token.
- POST `/api/subscribe` — body {plan} — protege com JWT, salva plano (JSON fallback) e retorna usuário atualizado.

Smoke test (básico)
-------------------
Depois de instalar dependências, você pode executar o script de smoke-test incluído:

```powershell
npm run smoke
```

Isso executa um pequeno script (`scripts/smoke-test.js`) que checa endpoints básicos. Se falhar, verifique logs do backend.

Dicas finais antes do deploy
----------------------------
- Garanta que `JWT_SECRET` esteja configurado no ambiente do backend.
- Prepare armazenamento persistente para `media/` (mount de volume ou bucket) para que uploads não se percam entre reinícios.
- Se pretende apenas hospedar o frontend no Netlify, configure `VITE_API_BASE` para apontar ao backend e verifique CORS no backend (o servidor já permite CORS por padrão).
- Para HMR/local development do frontend e backend ao mesmo tempo, rode `npm run dev` (Vite) e `node server/index.js` em terminais separados.

Se quiser, eu posso:
- Rodar o `npm run build` aqui e verificar se o `dist` é gerado sem erros; ou
- Gerar um pequeno passo a passo com prints/links especificamente para conectar no Netlify (incluindo onde adicionar `VITE_API_BASE` no painel); ou
- Ajudar a reescrever endpoints do backend como Netlify Functions (se preferir ter backend serverless na mesma hospedagem).

Escolha o próximo passo que prefere e eu executo (por exemplo: executar build e smoke-test agora). 

PIX / Assinaturas (simulado)
---------------------------------
Este projeto agora inclui um fluxo de cobrança PIX simulado pronto para testes locais e para conectar a um PSP (provedor de pagamento) real.

Novos endpoints:
- POST `/api/create-charge` (autenticado) — cria uma cobrança pendente. Body: `{ plan }`. Retorna o objeto `charge` que contém `pixPayload` (string) para gerar o QR.
- GET `/api/charges/:id` (autenticado) — obtém o status da cobrança.
- POST `/api/webhook/pix` — endpoint que seu PSP pode chamar para notificar pagamento. Se a variável de ambiente `WEBHOOK_SECRET` estiver definida, envie o header `x-webhook-secret`.
- POST `/api/simulate-pay` (autenticado) — para testes locais: marca uma cobrança como paga.

Fluxo de teste local:
1) Faça login em `/auth` e obtenha um `token` salvo no `localStorage`.
2) Na página `/plans`, clique em um plano; o frontend chamará `/api/create-charge` e exibirá um QR code gerado localmente a partir do campo `pixPayload`.
3) Para simular pagamento, envie POST `/api/simulate-pay` com body `{ chargeId }` (autenticado). O backend marcará a cobrança como `paid` e atualizará o `user.plan` no arquivo `server/data/users.json`.
4) Em produção, substitua o `/api/create-charge` por integração do PSP e aponte o PSP para `/api/webhook/pix`.

Segurança e produção
- Nunca armazene chaves PIX/Reais em repositórios públicos. Use variáveis de ambiente: `PIX_KEY` (opcional placeholder), `WEBHOOK_SECRET` (para validar callbacks do PSP) e `JWT_SECRET`.

PowerShell: erro ao executar npm
--------------------------------
Se você recebeu um erro do PowerShell dizendo que scripts estão desabilitados (ex.: "execução de scripts foi desabilitada neste sistema"), execute o seguinte no PowerShell como Administrador para permitir execução temporária:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois feche o terminal e abra um novo. Em seguida rode `npm install` normalmente.

Próximo passo sugerido
- Quer que eu conecte o fluxo a um PSP real? Diga qual (Gerencianet, Pagar.me, Mercado Pago etc.) e eu preparo a integração (endpoints e scripts) sem expor chaves.
 - Se quiser integração com Banco Inter, este repositório já contém um adaptador stub em `server/lib/bancoInter.js`.

Banco Inter - integração (guia rápido)
-------------------------------------------------
1) Cadastro e credenciais
   - Crie conta empresarial no Banco Inter e habilite a API de cobranças/Pix.
   - Peça credenciais (client_id / client_secret) para o ambiente de sandbox/produção.

2) Variáveis de ambiente
   - Defina no servidor:
     - `PSP_PROVIDER=banco_inter`
     - `INTER_CLIENT_ID` — seu client id
     - `INTER_CLIENT_SECRET` — seu client secret
     - `INTER_WEBHOOK_SECRET` — segredo opcional para validar callbacks
     - `JWT_SECRET` — segredo para tokens JWT do app

3) Implementar produção
   - O arquivo `server/lib/bancoInter.js` é um stub. Substitua as chamadas em `createPixCharge` por requisições HTTP à API do Banco Inter (OAuth, criação de cobrança, obtenção de payload/QR).
   - Implemente `verifyWebhook` conforme o mecanismo de assinatura do Inter (HMAC/RSA conforme doc).

4) Testando localmente
   - Defina as variáveis acima (use valores de sandbox do Inter). Em seguida, crie charges pelo frontend `/plans` e confirme pagamentos via webhook (ou use `/api/simulate-pay` para marcar manualmente).

Se quiser, eu implemento a integração completa com Banco Inter (chamada real das APIs, tratamento de tokens OAuth e verificação de webhook). Para isso, diga se prefere que eu:
1) Implemente usando apenas as chamadas HTTP (vou precisar das credenciais no ambiente para testes, não no chat). 
2) Gerei patch com a lógica completa mas com placeholders para as credenciais (você provisiona e testa), ou
3) Forneça um script seguro para você executar localmente que troca as placeholders por suas credenciais e testa tudo.

