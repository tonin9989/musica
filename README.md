# ProSpotify - Clone

Projeto scaffold de um player estilo Spotify, pronto para customizar e fazer deploy.

Como usar:

1. Instalar dependências: npm install
2. Rodar em dev: npm run dev
3. Colocar músicas e imagens em `/media`. Depois crie em `localStorage` uma chave `mediaList` com array de objetos: `{ title, artist, src, image }`, onde `src` e `image` são caminhos relativos começando com `/media/`.

Exemplo no console do navegador:

localStorage.setItem('mediaList', JSON.stringify([{ title:'Minha Musica', artist:'Eu', src:'/media/musica.mp3', image:'/media/capa.jpg' }]))

Depois abra a página Biblioteca e clique em Play.

Upload via app (opcional)

1. Inicie o servidor (após build) ou o dev server que proxie o backend. Para testar o endpoint de upload localmente com o servidor Express incluído:

	npm install
	npm run build
	npm start

2. Abra a rota Playlists e use o formulário de upload para enviar arquivos — eles serão salvos em `/media` e poderão ser referenciados em `mediaList`.

Nota: o projeto inclui um endpoint `/upload` que aceita múltiplos arquivos (campo `files`).
