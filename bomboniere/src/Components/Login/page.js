"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const router = useRouter();

  useEffect(() => {
    const tentativasSalvas = localStorage.getItem("tentativasLogin");
    if (tentativasSalvas) {
      setTentativas(parseInt(tentativasSalvas));
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const usuario = await signInWithEmailAndPassword(auth, email, senha);
      const nome = usuario.user.displayName || "Usuário";
      localStorage.setItem("nomeUsuario", nome);
      localStorage.removeItem("tentativasLogin");
      router.push("/MenuPrincipal");
    } catch (erro) {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      localStorage.setItem("tentativasLogin", novasTentativas);

      if (novasTentativas >= 3) {
        setMensagem("⚠️ Usuário bloqueado após 3 tentativas.");
      } else {
        setMensagem("❌ Email ou senha incorretos.");
      }
    }
  }

  async function handleRedefinirSenha() {
    if (!email) {
      setMensagem("Digite seu e-mail para redefinir a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMensagem("📧 E-mail de redefinição enviado. Verifique sua caixa de entrada.");
    } catch (erro) {
      if (erro.code === "auth/user-not-found") {
        setMensagem("❌ E-mail não cadastrado.");
      } else {
        setMensagem("❌ Erro ao enviar redefinição de senha.");
      }
    }
  }

  return (
    <div>
      <header className={styles.header}>
</header>
<main className={styles.mainContainer}>
  <form onSubmit={handleLogin}>
    <div className={styles.formGroup}>
      <label htmlFor="email">E-mail</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
    <div className={styles.formGroup}>
      <label htmlFor="senha">Senha</label>
      <input
        type="password"
        id="senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />
    </div>

    {mensagem && <p style={{ color: "red" }}>{mensagem}</p>}

    <button type="submit" disabled={tentativas >= 3}>Entrar</button>
    <button type="button" onClick={handleRedefinirSenha}>Esqueci minha senha</button>
    <nav className={styles.navLinks}>
    <p>não possui uma conta?</p>
    <Link href="/Cadastro">Cadastre-se</Link>
  </nav>
  </form>
</main>

    </div>
  );
}
