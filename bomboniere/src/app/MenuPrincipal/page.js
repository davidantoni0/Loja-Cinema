"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  collection,
  listCollections,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import styles from "./page.module.css";

export default function MenuPrincipal() {
  const [nome, setNome] = useState("");
  const [funcionario, setFuncionario] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioAtual) => {
      if (usuarioAtual) {
        try {
          const uid = usuarioAtual.uid;
          const docRef = doc(db, "usuarios", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            const nomeUsuario = dados.nome || usuarioAtual.email;
            const isFuncionario = dados.funcionario === true;

            setNome(nomeUsuario);
            setFuncionario(isFuncionario);

            localStorage.setItem("nomeUsuario", nomeUsuario);
            localStorage.setItem("usuarioFuncionario", isFuncionario ? "true" : "false");
          } else {
            setNome(usuarioAtual.email);
            setFuncionario(false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setNome(usuarioAtual.email);
          setFuncionario(false);
        }
      } else {
        setNome("");
        setFuncionario(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  async function handleExcluirConta() {
    if (!auth.currentUser) return;

    const confirm = window.confirm("Tem certeza que deseja excluir sua conta?");
    if (!confirm) return;

    try {
      await deleteUser(auth.currentUser);
      alert("Conta excluída com sucesso!");
      localStorage.clear();
      window.location.href = "/Login";
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        alert("Você precisa fazer login novamente.");
      } else {
        alert("Erro ao excluir conta: " + error.message);
      }
    }
  }

  async function handleLimparBanco() {
    const confirm = window.confirm("Tem certeza que deseja apagar TODOS os dados do Firestore?");
    if (!confirm) return;

    try {
      const collections = await listCollections(db);

      for (const col of collections) {
        const snapshot = await getDocs(col);

        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, col.id, document.id));
        }
      }

      alert("Todos os dados foram apagados com sucesso!");
    } catch (error) {
      console.error("Erro ao limpar o banco:", error);
      alert("Erro ao limpar o banco de dados: " + error.message);
    }
  }

  if (loading) return <p>Carregando dados do usuário...</p>;

  if (!nome) {
    return (
      <div>
        <p>Usuário não autenticado.</p>
        <Link href="/Login">Ir para login</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Olá, {nome}</h2>
        <button onClick={handleLogout} className={styles.sair}>Sair</button>
      </header>

      <nav className={styles.nav}>
        <Link href="/EmCartaz" className={styles.link}>Compre seu ingresso!</Link>
        <br/>
        <Link href="/lojaCinema" className={styles.link}>Conheça nossa Bomboniere!</Link>
        <br/>
        {funcionario && (
          <Link href="/Administrativo" className={styles.link}>Administrativo</Link>
        )}
      </nav>

      <button onClick={handleExcluirConta} className={styles.excluirConta}>
        Excluir minha conta
      </button>

      {funcionario && (
        <button onClick={handleLimparBanco} className={styles.limparBanco}>
          Limpar Banco de Dados
        </button>
      )}
    </div>
  );
}
