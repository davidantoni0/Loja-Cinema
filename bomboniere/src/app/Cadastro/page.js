"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation"; // importação do roteador
import Link from "next/link";
import styles from "./page.module.css";

export default function Login() {
  const router = useRouter(); // inicializa o roteador

  const dataAtual = useMemo(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    alert("Cadastro enviado com sucesso!");
    router.push("/Login"); // redireciona para a página de login
  }

  return (
    <section>
      <Link href="/Login">Voltar</Link>

      <form name="cadastro_clientes" method="POST" id="form_cadastro" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Dados Pessoais</legend>

          <div>
            <label htmlFor="nome">Nome completo</label>
            <input
              type="text"
              id="nome"
              maxLength={255}
              minLength={5}
              placeholder="Digite seu nome"
              pattern="[A-Za-zÀ-ÿ\s]{3,}"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="nascimento">Data de nascimento</label>
            <input
              type="date"
              id="nascimento"
              name="nascimento"
              min="1900-01-01"
              max={dataAtual}
              required
            />
          </div>

          <div>
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              minLength={11}
              maxLength={11}
              pattern="[0-9]{11}"
              required
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Dados sociais</legend>
          <div>
            <p>É estudante?</p>
            <div>
              <input type="radio" name="estudante" id="estudante_sim" value="true" />
              <label htmlFor="estudante_sim">Sim</label>

              <input type="radio" name="estudante" id="estudante_nao" value="false" />
              <label htmlFor="estudante_nao">Não</label>
            </div>
          </div>

          <div>
            <p>Possui alguma deficiência?</p>
            <div>
              <input type="radio" name="deficiencia" id="deficiencia_sim" value="true" />
              <label htmlFor="deficiencia_sim">Sim</label>

              <input type="radio" name="deficiencia" id="deficiencia_nao" value="false" />
              <label htmlFor="deficiencia_nao">Não</label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Contato</legend>
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              maxLength={255}
              minLength={5}
              required
            />
          </div>
          <div>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              maxLength={255}
              minLength={5}
              required
            />
          </div>
        </fieldset>

        <div>
          <input type="submit" value="Cadastrar" />
          <input type="reset" value="Limpar Cadastro" />
        </div>
      </form>
    </section>
  );
}
