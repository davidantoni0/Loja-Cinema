"use client";

import Link from "next/link";
import { auth } from "../../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import styles from "./page.module.css"; // importa como objeto

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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Administrativo</h1>
        <Link href="/MenuPrincipal" className={styles.linkVoltar}>Voltar</Link>
        <button onClick={handleLogout} className={styles.btnSair}>Sair</button>
      </header>

      <main className={styles.mainLinks}>
        <Link href="/FinanceiroFilmes">Financeiro dos Filmes</Link>
        <Link href="/FinanceiroBomboniere">Financeiro da Bomboniere</Link>
        <Link href="/InserirFilme">Inserir Filme</Link>
        <Link href="/InserirProduto">Inserir Produto</Link>
      </main>
    </div>
  );
}
