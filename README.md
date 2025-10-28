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

```powershell
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta\musica'
npm install --legacy-peer-deps
```

2. Rodar em desenvolvimento (frontend e backend separados):

```powershell
# terminal 1
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta\musica'
npm run dev

# terminal 2
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta\musica'
node server/index.js
```

3. Para servir a versão de produção (build Vite + servidor Express):

```powershell
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta\musica'
# opcional: set JWT_SECRET before start
$env:JWT_SECRET = 'minha_chave_secreta'
npm run build
npm start
```

Observações para deploy
- Defina a variável de ambiente `JWT_SECRET` em produção para uma chave segura.
- O servidor serve arquivos estáticos do diretório `dist` (após `npm run build`) e também expõe API em `/api/*`.
- Coloque arquivos de áudio em `media/` (o servidor cria a pasta automaticamente) ou use o upload pela UI.

Endpoints úteis
- GET `/api/media` — lista arquivos em `/media` com metadados (title, artist, src, cover (data URL), duration).
- POST `/upload` — aceita multipart/form-data (campo `files`) para salvar arquivos em `/media`.
- POST `/api/register` — body {email, pass} — cria usuário e retorna token.
- POST `/api/login` — body {email, pass} — retorna token.
- GET/POST/PUT/DELETE `/api/playlists` — playlists CRUD (autenticado para criar/editar/deletar).

Próximos passos sugeridos
- Melhorar extração das capas e thumbnails no backend (gerar imagens menores).
- Adicionar paginação/busca no frontend para grandes bibliotecas.
- Integrar um banco leve (SQLite) para escalabilidade em vez de JSON em arquivo.

Se quiser, continuo e implemento uma versão com thumbnails otimizadas e uma tela de playlists completa com CRUD no frontend.

Deploy (Docker)
---------------

Você pode empacotar a aplicação com Docker. Exemplo:

```powershell
cd 'c:\Users\antonio_leoni\Desktop\Nova pasta\musica'
docker build -t pro-spotify-clone:latest .
docker run -e JWT_SECRET='uma_chave_segura' -p 3000:3000 --name pro-spotify pro-spotify-clone:latest
```

Depois abra `http://localhost:3000`.

CI (GitHub Actions)
---------------------

Adicione o workflow em `.github/workflows/ci.yml`. Ele faz build e executa um pequeno smoke-test (endpoints `/api/media` e `/api/playlists`). Isso ajuda a manter o repositório pronto para deploy automático.

Checklist pré-deploy
- Definir `JWT_SECRET` em variáveis de ambiente do servidor.
- Executar `npm audit` e corrigir vulnerabilidades críticas antes do deploy.
- Preparar storage persistente para a pasta `media/` no servidor de produção (mount de volume ou bucket).

