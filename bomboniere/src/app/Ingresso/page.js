'use client';

import { useState, useEffect } from "react";
import s from "./page.module.css";

export default function Home() {
  const [dataMaxima, setDataMaxima] = useState('');
  const [desconto, setDesconto] = useState(false);

  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    setDataMaxima(`${ano}-${mes}-${dia}`);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const dataNascimento = form.idade.value;
    const escola = parseInt(form.escola.value);
    const deficiencia = parseInt(form.deficiencia.value);

    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if ((m < 0) || ((m === 0) && (hoje.getDate() < nascimento.getDate()))) {
      idade--;
    }

    const temDesconto = ((idade < 18) || (idade > 60) || (escola === 1) || (deficiencia === 1));
    setDesconto(temDesconto);

    console.log("Idade:", idade);
    console.log("Matriculado?:", escola);
    console.log("Deficiência?:", deficiencia);

    if (temDesconto) {
      alert("Desconto de 50%!");
    } else {
      alert("Ingresso normal!");
    }
  }

  return (
    <div className={s.pagina}>
      <header>
        <h1>CineSenai</h1>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>Questionário</legend>

            <section>
              <label htmlFor="idade">Selecione a data de nascimento: </label>
              <input type="date" id="idade" name="idade" max={dataMaxima} min="1900-01-01" required />
            </section>

            <section>
              <label>Está matriculado em uma instituição de ensino?</label>
              <div>
                <input type="radio" name="escola" id="escolaSIM" value="1" required />
                <label htmlFor="escolaSIM">Sim</label>
                <input type="radio" name="escola" id="escolaNAO" value="0" />
                <label htmlFor="escolaNAO">Não</label>
              </div>
            </section>

            <section>
              <label>Possui alguma deficiência?</label>
              <div>
                <input type="radio" name="deficiencia" id="defSIM" value="1" required />
                <label htmlFor="defSIM">Sim</label>
                <input type="radio" name="deficiencia" id="defNAO" value="0" />
                <label htmlFor="defNAO">Não</label>
              </div>
            </section>

            <input type="submit" value="Enviar" />
          </fieldset>
        </form>

        <div>
          {desconto ? (
            <p>
              Valor a pagar: <s>R$30,00</s> <strong>R$15,00</strong>
            </p>
          ) : (
            <p>Valor a pagar: R$30,00</p>
          )}
        </div>
      </main>
    </div>
  );
}
