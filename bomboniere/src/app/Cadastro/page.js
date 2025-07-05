"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import axios from "axios";
import styles from "./page.module.css";

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

  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  const [bloquearEndereco, setBloquearEndereco] = useState(false);
  const [isFuncionario, setIsFuncionario] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const nome = form.nome.value.trim();
    const nascimento = form.nascimento.value;
    const cpf = form.cpf.value.trim();
    const cep = form.cep.value.trim();
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
        endereco: { ...endereco, cep },
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
      router.push("/MenuPrincipal");
    } catch (erro) {
      if (erro.code === "auth/email-already-in-use") {
        alert("Este e-mail já está cadastrado.");
      } else {
        alert("Erro ao cadastrar: " + erro.message);
      }
    }
  }

  async function handleBuscarEndereco(event) {
    const cep = event.target.value.replace(/\D/g, "");
    if (cep.length !== 8) {
      setBloquearEndereco(false);
      return;
    }

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;

      if (!data.erro) {
        setEndereco({
          cep: data.cep,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        });
        setBloquearEndereco(true);
      } else {
        alert("CEP não encontrado.");
      }
    } catch (error) {
      alert("Erro ao buscar o endereço.");
    }
  }

  return (
    <section style={{ maxWidth: "500px", margin: "auto" }}>
      <Link className={styles.voltar} href="/Home">Voltar</Link>

      <h1 className={styles.titulo}>Cadastro</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legenda}>Dados Pessoais</legend>
          <label className={styles.labelcadastro}>
            <div>Nome completo</div>
            <input className={styles.campo} type="text" name="nome" required />
          </label>
          <label className={styles.labelcadastro}>
            <div>Data de nascimento</div>
            <input className={styles.campo} type="date" name="nascimento" max={dataAtual} required />
          </label>
          <label className={styles.labelcadastro}>
            <div>C.P.F.</div>
            <input className={styles.campo} type="text" name="cpf" pattern="\d{11}" title="11 números" required />
          </label>
          <label className={styles.labelcadastro}>
            <div>C.E.P.</div>
            <input className={styles.campo} type="text" name="cep" pattern="\d{8}" required onBlur={handleBuscarEndereco} />
          </label>
          <label className={styles.labelcadastro}>
            <div>Logradouro</div>
            <input
              className={styles.campo}
              type="text"
              name="rua"
              value={endereco.rua}
              readOnly={bloquearEndereco}
              onChange={e => setEndereco(prev => ({ ...prev, rua: e.target.value }))}
            />
          </label>
          <label className={styles.labelcadastro}>
            <div>Bairro</div>
            <input
              className={styles.campo}
              type="text"
              name="bairro"
              value={endereco.bairro}
              readOnly={bloquearEndereco}
              onChange={e => setEndereco(prev => ({ ...prev, bairro: e.target.value }))}
            />
          </label>
          <label className={styles.labelcadastro}>
            <div>Cidade</div>
            <input
              className={styles.campo}
              type="text"
              name="cidade"
              value={endereco.cidade}
              readOnly={bloquearEndereco}
              onChange={e => setEndereco(prev => ({ ...prev, cidade: e.target.value }))}
            />
          </label>
          <label className={styles.labelcadastro}>
            <div>Estado</div>
            <input
              className={styles.campo}
              type="text"
              name="estado"
              value={endereco.estado}
              readOnly={bloquearEndereco}
              onChange={e => setEndereco(prev => ({ ...prev, estado: e.target.value }))}
            />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legenda}>Dados Sociais</legend>
          <p>É estudante?</p>
          <label>
            <input type="radio" name="estudante" value="true" required />
            Sim
          </label>
          <label>
            <input type="radio" name="estudante" value="false" />
            Não
          </label>

          <p>Possui alguma deficiência?</p>
          <label>
            <input type="radio" name="deficiencia" value="true" required />
            Sim
          </label>
          <label>
            <input type="radio" name="deficiencia" value="false" />
            Não
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legenda}>Funcionário</legend>
          <p>É novo funcionário?</p>
          <label>
            <input
              type="radio"
              name="funcionario"
              value="true"
              required
              onChange={() => setIsFuncionario(true)}
            />
            Sim
          </label>
          <label>
            <input
              type="radio"
              name="funcionario"
              value="false"
              defaultChecked
              onChange={() => setIsFuncionario(false)}
            />
            Não
          </label>

          <label className={styles.labelcadastro}>
            Senha do administrador
            <input
              className={styles.campo}
              type="password"
              name="senhaAdmin"
              disabled={!isFuncionario}
              required={isFuncionario}
            />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legenda}>Contato</legend>
          <label className={styles.labelcadastro}>
            E-mail
            <input className={styles.campo} type="email" name="email" required />
          </label>
          <label className={styles.labelcadastro}>
            Senha
            <input className={styles.campo} type="password" name="senha" required />
          </label>
        </fieldset>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button className={styles.cadastrar} type="submit" style={{ flex: 1 }}>
            Cadastrar
          </button>
          <button className={styles.limpar} type="reset" style={{ flex: 1 }}>
            Limpar
          </button>
        </div>
      </form>
    </section>
  );
}
