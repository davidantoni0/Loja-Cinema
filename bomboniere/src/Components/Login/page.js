"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const credenciais = await signInWithEmailAndPassword(auth, email, senha);

      console.log("✅ Login realizado com sucesso:", credenciais.user);

      setTimeout(() => {
        router.push("/MenuPrincipal");
      }, 500);
    } catch (error) {
      console.error("❌ Erro no login:", error.code, error.message);
      setErro("Email ou senha inválidos.");
    } finally {
      setCarregando(false);
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
      console.error("❌ Erro ao enviar email de redefinição:", error);
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
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

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
