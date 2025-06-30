"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // 👈 Importa o roteador
import Link from "next/link";
import styles from "./page.module.css";
import usuarios from "../../../public/Dados/Usuarios.json";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const router = useRouter(); // 👈 Inicializa o roteador

  function handleLogin(event) {
    event.preventDefault();

    const usuario = usuarios.find(
      (user) => user.email === email && user.senha === senha
    );

    if (usuario) {
      setUsuarioLogado(usuario);
      localStorage.setItem("nomeUsuario", usuario.nome); // 👈 Salva o nome no localStorage
      alert(`Olá, ${usuario.nome}`);
      router.push("/MenuPrincipal"); // 👈 Redireciona
    } else {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      if (novasTentativas >= 3) {
        alert("Usuário bloqueado");
      } else {
        alert("Email ou senha incorretos");
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
              name="email"
              maxLength={100}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              maxLength={30}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={tentativas >= 3}>
            Entrar
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
