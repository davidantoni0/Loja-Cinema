"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";

function handleLogout() {
    signOut(auth)
      .then(() => {
        localStorage.clear();
        window.location.href = "/Login";
      })
      .catch((error) => {
        alert("Erro ao sair: " + error.message);
      });
  }

export default function Administrativo() {
  return (
    <div>
        <header>
            <h1>Administrativo</h1>
            <Link href="/MenuPrincipal">Voltar</Link>
            <button onClick={handleLogout}>Sair</button>
        </header>

        <main>
            <Link href="/FinanceiroFilmes">Financeiro dos Filmes</Link>
            <br/>
            <Link href="/FinanceiroBomboniere">Financeiro da Bomboniere</Link>
            <br/>
            <Link href="/MudarFilmes">Mudar Filmes em Cartaz</Link>
        </main>


    </div>
  );
}
