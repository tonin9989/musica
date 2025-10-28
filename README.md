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

