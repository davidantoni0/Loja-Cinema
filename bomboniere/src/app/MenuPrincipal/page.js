"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";

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
    <div>
      <header>
        <h2>Olá, {nome}</h2>
        <button onClick={handleLogout}>Sair</button>
      </header>

      <nav>
        <Link href="/filmes-assentos">Compre seu ingresso!</Link><br />
        <Link href="/lojaCinema">Conheça nossa Bomboniere!</Link><br />
        {funcionario && <><Link href="/Administrativo">Administrativo</Link><br /></>}
      </nav>

      <button
        onClick={handleExcluirConta}
        style={{
          marginTop: "1.5rem",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          cursor: "pointer",
        }}
      >
        Excluir minha conta
      </button>
 </div>
  );
}