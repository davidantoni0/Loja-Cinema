"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig"; // Certifique-se que 'db' é exportado de firebaseConfig
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Importe doc, getDoc e updateDoc
import styles from "./page.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  // Função para calcular a idade
  const calcularIdade = (dataNascimentoString) => {
    // Garante que a dataNascimentoString seja válida
    if (!dataNascimentoString || typeof dataNascimentoString !== 'string') {
        return 0; // Retorna 0 ou lança um erro se a data for inválida
    }
    const [ano, mes, dia] = dataNascimentoString.split('-').map(Number);
    const dataNascimento = new Date(ano, mes - 1, dia); // Mês é base 0

    // Verifica se a data de nascimento é uma data válida
    if (isNaN(dataNascimento.getTime())) {
        console.error("Data de nascimento inválida:", dataNascimentoString);
        return 0;
    }

    const dataAtual = new Date();

    let idade = dataAtual.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = dataAtual.getMonth();
    const diaAtual = dataAtual.getDate();

    const mesNascimento = dataNascimento.getMonth();
    const diaNascimento = dataNascimento.getDate();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
      idade--;
    }
    return idade;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const credenciais = await signInWithEmailAndPassword(auth, email, senha);
      const user = credenciais.user;

      console.log("✅ Login realizado com sucesso:", user.email);

      // --- Início da lógica para Firestore ---
      // Assume que o ID do documento do usuário no Firestore é o UID do Firebase Auth
      const userDocRef = doc(db, "usuarios", user.uid);

      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const dataNascimento = userData.data_nascimento; // Pegar a data de nascimento do Firestore

        if (dataNascimento) {
          const idade = calcularIdade(dataNascimento);
          const menorDeIdade = idade < 18;
          const maiorDe65Anos = idade >= 65; // Alterado para maior ou igual a 65

          console.log(`Idade de ${userData.nome}: ${idade} anos.`);
          console.log(`Menor de idade: ${menorDeIdade}`);
          console.log(`Maior de 65 anos: ${maiorDe65Anos}`);

          // Atualiza o documento no Firestore com os novos campos
          await updateDoc(userDocRef, {
            menorDeIdade: menorDeIdade,
            maiorDe65Anos: maiorDe65Anos,
            // Opcional: Você pode querer atualizar 'ultima_compra' aqui também
            // ultima_compra: new Date().toISOString().split('T')[0],
          });
          console.log("Firestore atualizado com sucesso!");
        } else {
          console.warn("Data de nascimento não encontrada para este usuário no Firestore.");
        }
      } else {
        console.warn("Documento do usuário não encontrado no Firestore para o UID:", user.uid);
        // Em um cenário real, você pode querer criar um novo documento para o usuário aqui
        // Por exemplo, addDoc(collection(db, "usuarios"), { uid: user.uid, email: user.email, ... })
      }
      // --- Fim da lógica para Firestore ---

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
      <form onSubmit={handleLogin} className={styles.form}>
        <h2 className={styles.titulo}>Login</h2>
        <div className="styles.centro">
          <input
            className={styles.campo}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.campo}
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <div className={styles.esqueci}>
            <button
              type="button"
              onClick={handleEsqueciSenha}
              className={styles.linkButton}
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        <div className={styles.botoes}>
          <button className={styles.entrar} type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <Link href="/Cadastro" className={styles.criar}>
            Criar nova conta
          </Link>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}
      </form>
    </div>
  );
}