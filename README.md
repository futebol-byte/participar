# Pelada de Sexta — Confirmação de Presença

Site estático (HTML + CSS + JS) com lista de participantes sincronizada em
tempo real via **Firebase Firestore**. Qualquer pessoa que confirmar presença
e clicar em **"Já fiz o pagamento"** aparece instantaneamente para todos os
outros visitantes, sem precisar dar F5.

## Arquivos

| Arquivo             | Função                                                   |
|---------------------|-----------------------------------------------------------|
| `index.html`        | Estrutura da página                                       |
| `style.css`         | Visual (tema "campo de futebol")                          |
| `script.js`         | Lógica: formulário, tempo real, distribuição dos times     |
| `firebase-config.js`| Onde você cola as credenciais do seu projeto Firebase      |
| `pix.png`           | **Você precisa adicionar** — imagem do seu QR Code do Pix  |
| `video-fundo.mp4`   | **Você precisa adicionar** — vídeo de fundo (opcional)      |

## Adicionar o vídeo de fundo

Coloque um arquivo chamado exatamente `video-fundo.mp4` na mesma pasta do
`index.html` (por exemplo, um vídeo de um jogador chutando a bola, em loop).
O vídeo toca automaticamente, mudo, em loop, cobrindo toda a tela atrás do
conteúdo, com uma leve escurecida por cima para o texto continuar legível.

Recomendações:
- Formato **MP4** (H.264), resolução **1280×720** já é suficiente para fundo
  (não precisa de 4K — deixa o carregamento mais pesado à toa)
- Prefira um clipe **curto (5–15s) e em loop suave**, já que ele repete
  continuamente
- Peso ideal: até uns 5–10 MB, para carregar rápido no celular
- Se quiser uma imagem estática enquanto o vídeo carrega, adicione também um
  `video-poster.jpg` (mesma pasta) — o `index.html` já está preparado para
  usá-la
- Onde encontrar vídeos gratuitos: bancos como Pexels ou Coverr têm clipes de
  futebol de uso livre — baixe o arquivo e renomeie para `video-fundo.mp4`

Se o arquivo não existir, o site simplesmente volta a mostrar o fundo verde
listrado (estilo campo) — nada quebra.

## Passo a passo — configurar o Firebase (gratuito)

1. Acesse **https://console.firebase.google.com** e crie um projeto novo.
2. No menu lateral, vá em **Build → Firestore Database** e clique em
   **Criar banco de dados**. Escolha o modo **produção** e a região mais
   próxima (ex: `southamerica-east1`).
3. Vá em **Configurações do projeto** (ícone de engrenagem) → aba **Geral** →
   role até **Seus apps** → clique no ícone **Web (`</>`)** → dê um nome
   qualquer e registre o app.
4. O Firebase vai mostrar um bloco `firebaseConfig = {...}`. Copie os valores
   (`apiKey`, `authDomain`, `projectId`, etc.) e cole em `firebase-config.js`,
   substituindo os campos `"SEU_..."`.
5. Ainda no console, vá em **Firestore Database → Regras** e cole as regras
   abaixo (permitem que qualquer pessoa **leia** a lista e **crie** uma nova
   confirmação, mas ninguém consegue **editar ou apagar** participantes pelo
   site — isso só pode ser feito por você, manualmente, no console):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participantes/{participanteId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasAll(['nome', 'posicao', 'timestamp']) &&
        request.resource.data.nome is string &&
        request.resource.data.nome.size() > 0 &&
        request.resource.data.nome.size() <= 60 &&
        request.resource.data.posicao in ['Goleiro', 'Linha'];
      allow update, delete: if false;
    }
  }
}
```

6. Clique em **Publicar**.

## Adicionar o QR Code do Pix

Coloque uma imagem chamada exatamente `pix.png` na mesma pasta do `index.html`
(o QR Code gerado pelo seu banco). Se o arquivo não existir, o site mostra um
aviso no lugar da imagem — nada quebra.

## Como publicar o site

Como é só HTML/CSS/JS estático, você pode hospedar gratuitamente em:

- **Firebase Hosting** (mesma conta que o Firestore): `firebase init hosting` → `firebase deploy`
- **Netlify** ou **Vercel**: arraste a pasta inteira no painel deles
- **GitHub Pages**: suba os arquivos num repositório e ative o Pages

Não precisa de servidor próprio nem back-end — os arquivos podem ficar em
qualquer host de arquivos estáticos, pois quem fala com o banco de dados é o
próprio navegador do visitante.

## Como funciona a divisão dos times

A cada nova confirmação, o `script.js` reprocessa **toda** a lista (ordenada
pela hora de confirmação) e distribui assim:

- O 1º goleiro confirmado vai para o **Time Azul**, o 2º para o **Time
  Vermelho**. Um 3º goleiro (se alguém confirmar por engano) cai na **fila de
  espera**.
- Jogadores de linha são distribuídos alternadamente entre os dois times até
  5 por time. Quem confirmar depois de os dois times completarem 5 jogadores
  de linha também cai na fila de espera.
- Essa lógica roda **no navegador de cada visitante**, mas como todos recebem
  os mesmos dados na mesma ordem do Firestore, o resultado é idêntico para
  todo mundo — não precisa de nenhum "servidor" adicional.

Quando as 12 vagas (2 goleiros + 10 jogadores de linha) estiverem preenchidas,
o formulário é desativado automaticamente e aparece o aviso **"Partida
Lotada"** para todos os visitantes.

## Sobre a confirmação de pagamento

O Pix é só uma imagem estática (`pix.png`). O site **não valida** o
pagamento automaticamente — cada pessoa confirma clicando em "Já fiz o
pagamento" depois de pagar, por confiança. Se alguém confirmar sem pagar,
você (organizador) pode apagar o registro manualmente direto no console do
Firestore (Firestore Database → coleção `participantes` → excluir o
documento), já que as regras acima bloqueiam exclusões vindas do próprio
site.
