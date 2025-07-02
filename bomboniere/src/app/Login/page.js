"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

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
      
      // Buscar dados pessoais no Firestore
      const docRef = doc(db, "usuarios", usuario.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dadosUsuario = docSnap.data();

        // Salvar dados pessoais no localStorage
        localStorage.setItem(
          "dadosUsuarioLogado",
          JSON.stringify({
            nome: dadosUsuario.nome || usuario.user.email,
            dataNascimento: dadosUsuario.dataNascimento || null,
            estudante: dadosUsuario.estudante || false,
            deficiente: dadosUsuario.deficiente || false,
            email: usuario.user.email,
            uid: usuario.user.uid,
          })
        );
      } else {
        // Caso não existam dados pessoais no Firestore
        localStorage.setItem(
          "dadosUsuarioLogado",
          JSON.stringify({
            nome: usuario.user.email,
            dataNascimento: null,
            estudante: false,
            deficiente: false,
            email: usuario.user.email,
            uid: usuario.user.uid,
          })
        );
      }

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
      <header>
        <h1>Cine Senai</h1>
        <Link href="/">Voltar</Link>
      </header>
      <main>
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {mensagem && <p style={{ color: "red" }}>{mensagem}</p>}

          <button type="submit" disabled={tentativas >= 3}>
            Entrar
          </button>

          <button type="button" onClick={handleRedefinirSenha}>
            Esqueci minha senha
          </button>

          <div>
            <p>Não possui conta?</p>
            <Link href="/Cadastro">Faça sua conta!</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
