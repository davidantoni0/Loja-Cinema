// Importa os módulos que você vai usar
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração gerada no console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDscqWqHk_Atx7lHsAwvSQUKkmThXOEB6s",
  authDomain: "cine-senai.firebaseapp.com",
  projectId: "cine-senai",
  storageBucket: "cine-senai.firebasestorage.app",
  messagingSenderId: "507213086330",
  appId: "1:507213086330:web:00b2d42ce40bb519e545c3"
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Exporta os serviços que for usar
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
