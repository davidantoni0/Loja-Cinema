"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import styles from "./page.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credenciais = await signInWithEmailAndPassword(auth, email, senha);
      const usuarioDoc = await getDoc(doc(db, "usuarios", credenciais.user.uid));
      if (!usuarioDoc.exists()) {
        setErro("Usuário não encontrado.");
        return;
      }
      router.push("/Home");
    } catch (error) {
      setErro("Email ou senha inválidos.");
    }
  };

  const handleEsqueciSenha = async () => {
    if (!email) {
      setErro("Informe seu email para redefinir a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de redefinição enviado.");
    } catch (error) {
      setErro("Erro ao enviar email de redefinição.");
    }
  };

  return (
    <div className={styles.container}>
      <header>
        <h1>Cine Senai</h1>
        <Link href="/">Voltar</Link>
      </header>

      <form onSubmit={handleLogin} className={styles.form}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button type="submit">Entrar</button>
        <button type="button" onClick={handleEsqueciSenha}>
          Esqueci minha senha
        </button>
        {erro && <p className={styles.erro}>{erro}</p>}
        <p>
          Não tem conta? <Link href="/Cadastro">Cadastre-se</Link>

        </p>
      </form>
    </div>
  );
}
