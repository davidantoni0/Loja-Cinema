"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export default function Cadastro() {
  const router = useRouter();
  const SENHA_ADMIN = "CineSenai2025";

  const dataAtual = useMemo(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const nome = form.nome.value.trim();
    const nascimento = form.nascimento.value;
    const cpf = form.cpf.value;
    const estudante = form.estudante.value === "true";
    const deficiencia = form.deficiencia.value === "true";
    const email = form.email.value.trim();
    const senha = form.senha.value;

    let funcionario = false;
    if (form.funcionario.value === "true") {
      if (form.senhaAdmin.value !== SENHA_ADMIN) {
        alert("Senha de administrador incorreta.");
        return;
      }
      funcionario = true;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        nome,
        cpf,
        data_nascimento: nascimento,
        estudante,
        deficiencia,
        funcionario,
        email,
        vezes_ingresso: 0,
        ultima_compra: null,
        data_insercao: new Date().toISOString().split("T")[0],
      });

      localStorage.setItem("nomeUsuario", nome);
      localStorage.setItem("usuarioFuncionario", funcionario ? "true" : "false");

      alert(funcionario ? "Usuário cadastrado como Funcionário!" : "Usuário cadastrado com sucesso!");
      router.push("/Login");

    } catch (erro) {
      if (erro.code === "auth/email-already-in-use") {
        alert("Este e-mail já está cadastrado.");
      } else {
        alert("Erro ao cadastrar: " + erro.message);
      }
    }
  }

  return (
    <section>
      <Link href="/Login">Voltar</Link>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Dados Pessoais</legend>
          <label>Nome completo <input type="text" name="nome" required /></label>
          <label>Data de nascimento <input type="date" name="nascimento" max={dataAtual} required /></label>
          <label>CPF <input type="text" name="cpf" pattern="[0-9]{11}" required /></label>
        </fieldset>

        <fieldset>
          <legend>Dados Sociais</legend>
          <p>É estudante?</p>
          <input type="radio" name="estudante" value="true" required /> Sim
          <input type="radio" name="estudante" value="false" /> Não

          <p>Possui alguma deficiência?</p>
          <input type="radio" name="deficiencia" value="true" required /> Sim
          <input type="radio" name="deficiencia" value="false" /> Não
        </fieldset>

        <fieldset>
          <legend>Funcionário</legend>
          <p>É novo funcionário?</p>
          <input type="radio" name="funcionario" value="true" required /> Sim
          <input type="radio" name="funcionario" value="false" defaultChecked /> Não

          <label>Senha do administrador <input type="password" name="senhaAdmin" /></label>
        </fieldset>

        <fieldset>
          <legend>Contato</legend>
          <label>E-mail <input type="email" name="email" required /></label>
          <label>Senha <input type="password" name="senha" required /></label>
        </fieldset>

        <button type="submit">Cadastrar</button>
        <button type="reset">Limpar</button>
      </form>
    </section>
  );
}
