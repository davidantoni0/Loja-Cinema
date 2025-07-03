"use client";

import React from "react";
import useUsuario from "../../hooks/useUsuario";
import Link from "next/link";
import { auth } from "../../firebase/firebaseConfig";
import { deleteDoc, doc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function MenuPrincipal() {
  const { usuario, loadingUsuario } = useUsuario();

  async function handleLogout() {
    try {
      await auth.signOut();
      localStorage.clear();
      window.location.href = "/Login";
    } catch (error) {
      alert("Erro ao sair: " + error.message);
    }
  }

  async function handleExcluirConta() {
    if (!auth.currentUser) return;

    const confirm = window.confirm("Tem certeza que deseja excluir sua conta?");
    if (!confirm) return;

    try {
      const uid = auth.currentUser.uid;

      try {
        await deleteDoc(doc(db, "usuarios", uid));
        console.log("Dados do usuário removidos do Firestore");
      } catch (firestoreError) {
        console.error("Erro ao remover dados do Firestore:", firestoreError);
      }

      await auth.currentUser.delete();
      alert("Conta excluída com sucesso!");
      localStorage.clear();
      window.location.href = "/Login";
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        alert("Você precisa fazer login novamente para excluir sua conta.");
      } else {
        alert("Erro ao excluir conta: " + error.message);
      }
    }
  }

  async function handleLimparBanco() {
    const confirm = window.confirm("Tem certeza que deseja apagar TODOS os dados do Firestore?");
    if (!confirm) return;

    const secondConfirm = window.confirm(
      "ATENÇÃO: Esta ação irá apagar TODOS os dados incluindo usuários e funcionários! Confirma?"
    );
    if (!secondConfirm) return;

    try {
      const collectionsToDelete = [
        "usuarios",
        "funcionarios",
        "filmes",
        "sessoes",
        "ingressos",
        "produtos",
        "vendas",
        "reservas",
        "salas",
        "horarios",
      ];

      let totalDeleted = 0;

      for (const collectionName of collectionsToDelete) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
          console.log(`Coleção ${collectionName} já está vazia`);
          continue;
        }

        const deletePromises = snapshot.docs.map((document) =>
          deleteDoc(doc(db, collectionName, document.id))
        );

        await Promise.all(deletePromises);
        totalDeleted += snapshot.docs.length;
        console.log(`Coleção ${collectionName} limpa: ${snapshot.docs.length} documentos removidos`);
      }

      alert(`Banco de dados limpo com sucesso! ${totalDeleted} documentos foram removidos.`);
    } catch (error) {
      console.error("Erro ao limpar o banco:", error);
      alert("Erro ao limpar o banco de dados: " + error.message);
    }
  }

  if (loadingUsuario) return <p>Carregando dados do usuário...</p>;

  if (!usuario || !usuario.nome) {
    return (
      <div>
        <p>Usuário não autenticado.</p>
        <Link href="/Home">Ir para login</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Olá, {usuario.nome}</h2>
        <button onClick={handleLogout} className={styles.sair}>
          Sair
        </button>
      </header>

      <nav className={styles.nav}>
        <Link href="/EmCartaz" className={styles.link}>
          Compre seu ingresso!
        </Link>
        <br />
        <Link href="/lojaCinema" className={styles.link}>
          Conheça nossa Bomboniere!
        </Link>
        <br />
        {usuario.funcionario && (
          <Link href="/Administrativo" className={styles.link}>
            Administrativo
          </Link>
        )}
      </nav>

      <button onClick={handleExcluirConta} className={styles.excluirConta}>
        Excluir minha conta
      </button>

      {usuario.funcionario && (
        <button onClick={handleLimparBanco} className={styles.limparBanco}>
          Limpar Banco de Dados (CUIDADO!)
        </button>
      )}
    </div>
  );
}
