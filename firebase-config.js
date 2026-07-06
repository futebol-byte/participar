// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// 1. Crie um projeto gratuito em https://console.firebase.google.com
// 2. Ative o "Firestore Database" (modo produção)
// 3. Em "Configurações do projeto" > "Seus apps" > "Web", registre um app
// 4. Copie os valores gerados e cole abaixo, substituindo os "SEU_..."
// ============================================================

const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
