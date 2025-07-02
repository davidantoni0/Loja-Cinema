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
} from "firebase/firestore";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import styles from "./page.module.css";

export default function MenuPrincipal() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [estudante, setEstudante] = useState(false);
  const [deficiente, setDeficiente] = useState(false);
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

            setDataNascimento(dados.data_nascimento || "");
            setEstudante(dados.estudante === true);
            setDeficiente(dados.deficiencia === true);

            // Salvar dados pessoais no localStorage
            localStorage.setItem(
              "dadosUsuarioLogado",
              JSON.stringify({
                nome: nomeUsuario,
                dataNascimento: dados.data_nascimento || "",
                estudante: dados.estudante === true,
                deficiente: dados.deficiencia === true,
                funcionario: isFuncionario,
                email: usuarioAtual.email,
                uid: uid,
              })
            );

            localStorage.setItem("nomeUsuario", nomeUsuario);
            localStorage.setItem("usuarioFuncionario", isFuncionario ? "true" : "false");
          } else {
            setNome(usuarioAtual.email);
            setFuncionario(false);
            setDataNascimento("");
            setEstudante(false);
            setDeficiente(false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setNome(usuarioAtual.email);
          setFuncionario(false);
          setDataNascimento("");
          setEstudante(false);
          setDeficiente(false);
        }
      } else {
        setNome("");
        setFuncionario(false);
        setDataNascimento("");
        setEstudante(false);
        setDeficiente(false);
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
      const uid = auth.currentUser.uid;

      try {
        await deleteDoc(doc(db, "usuarios", uid));
        console.log("Dados do usuário removidos do Firestore");
      } catch (firestoreError) {
        console.error("Erro ao remover dados do Firestore:", firestoreError);
      }

      await deleteUser(auth.currentUser);
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
        try {
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
        } catch (error) {
          console.error(`Erro ao limpar coleção ${collectionName}:`, error);
        }
      }

      alert(`Banco de dados limpo com sucesso! ${totalDeleted} documentos foram removidos.`);
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
        <button onClick={handleLogout} className={styles.sair}>
          Sair
        </button>
      </header>

      <section style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Data de Nascimento:</strong> {dataNascimento || "Não informado"}
        </p>
        <p>
          <strong>Estudante:</strong> {estudante ? "Sim" : "Não"}
        </p>
        <p>
          <strong>Deficiente:</strong> {deficiente ? "Sim" : "Não"}
        </p>
      </section>

      <nav className={styles.nav}>
        <Link href="/EmCartaz" className={styles.link}>
          Compre seu ingresso!
        </Link>
        <br />
        <Link href="/lojaCinema" className={styles.link}>
          Conheça nossa Bomboniere!
        </Link>
        <br />
        {funcionario && (
          <Link href="/Administrativo" className={styles.link}>
            Administrativo
          </Link>
        )}
      </nav>

      <button onClick={handleExcluirConta} className={styles.excluirConta}>
        Excluir minha conta
      </button>

      {funcionario && (
        <button onClick={handleLimparBanco} className={styles.limparBanco}>
          Limpar Banco de Dados (CUIDADO!)
        </button>
      )}
    </div>
  );
}
