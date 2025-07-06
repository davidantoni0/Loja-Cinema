// bomboniere/src/firebase/firebaseConfig.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDscqWqHk_Atx7lHsAwvSQUKkmThXOEB6s",
  authDomain: "cine-senai.firebaseapp.com",
  projectId: "cine-senai",
  storageBucket: "cine-senai.firebasestorage.app",
  messagingSenderId: "507213086330",
  appId: "1:507213086330:web:00b2d42ce40bb519e545c3"
};

// Verifica se o app já foi inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
