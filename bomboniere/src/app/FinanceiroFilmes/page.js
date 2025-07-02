"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function FinanceiroFilmes() {
  const [ingressos, setIngressos] = useState([]);
  const [dataEscolhida, setDataEscolhida] = useState("");
  const [resumo, setResumo] = useState({});

  useEffect(() => {
    async function carregarIngressos() {
      const querySnapshot = await getDocs(collection(db, "ingressos"));
      const dados = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Converte timestamp Firestore para Date, se necessário
        if (data.dataCompra?.toDate) {
          data.dataCompra = data.dataCompra.toDate();
        }
        if (data.usuarioDataNascimento?.toDate) {
          data.usuarioDataNascimento = data.usuarioDataNascimento.toDate();
        }
        dados.push(data);
      });
      setIngressos(dados);
    }
    carregarIngressos();
  }, []);

  // Calcula idade baseado na data
  function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = dataNascimento instanceof Date ? dataNascimento : new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  // Verifica se o ingresso tem direito a desconto
  function temDesconto(ingresso) {
    const idade = calcularIdade(ingresso.usuarioDataNascimento);
    const deficiente = ingresso.usuarioDeficiente === true;
    const estudante = ingresso.usuarioEstudante === true;

    if (idade !== null && (idade < 18 || idade > 65)) return true;
    if (deficiente) return true;
    if (estudante) return true;

    return false;
  }

  useEffect(() => {
    if (ingressos.length === 0) return;

    const resumo = {
      porData: {},
      porFilme: {},
      porSemana: {},
      porMes: {},
      porHorario: {},
      porUsuario: {},
    };

    ingressos.forEach((ing) => {
      if (!ing.dataCompra) return; // pula se não tem dataCompra

      const dataStr = ing.dataCompra.toISOString().split("T")[0];
      const semana = getSemana(ing.dataCompra);
      const mes = `${ing.dataCompra.getFullYear()}-${String(ing.dataCompra.getMonth() + 1).padStart(2, "0")}`;
      const hora = `${String(ing.dataCompra.getHours()).padStart(2, "0")}:00`;

      const inteira = ing.inteira || 0;
      const meia = ing.meia || 0;
      const qtd = inteira + meia;

      // Decide valor usado (com ou sem desconto)
      const precoUnitario = temDesconto(ing) && ing.precoDesconto ? ing.precoDesconto : ing.preco || 0;
      const valorTotal = precoUnitario * qtd;

      // Atualiza resumo por data (só para data escolhida)
      if (dataStr === dataEscolhida) {
        if (!resumo.porData[dataStr]) resumo.porData[dataStr] = { inteira: 0, meia: 0, montante: 0 };
        resumo.porData[dataStr].inteira += inteira;
        resumo.porData[dataStr].meia += meia;
        resumo.porData[dataStr].montante += valorTotal;
      }

      // Por Filme
      if (!resumo.porFilme[ing.filme]) resumo.porFilme[ing.filme] = { inteira: 0, meia: 0, montante: 0 };
      resumo.porFilme[ing.filme].inteira += inteira;
      resumo.porFilme[ing.filme].meia += meia;
      resumo.porFilme[ing.filme].montante += valorTotal;

      // Por Semana
      if (!resumo.porSemana[semana]) resumo.porSemana[semana] = { inteira: 0, meia: 0, montante: 0 };
      resumo.porSemana[semana].inteira += inteira;
      resumo.porSemana[semana].meia += meia;
      resumo.porSemana[semana].montante += valorTotal;

      // Por Mês
      if (!resumo.porMes[mes]) resumo.porMes[mes] = { inteira: 0, meia: 0, montante: 0 };
      resumo.porMes[mes].inteira += inteira;
      resumo.porMes[mes].meia += meia;
      resumo.porMes[mes].montante += valorTotal;

      // Por Horário
      if (!resumo.porHorario[hora]) resumo.porHorario[hora] = { inteira: 0, meia: 0, montante: 0 };
      resumo.porHorario[hora].inteira += inteira;
      resumo.porHorario[hora].meia += meia;
      resumo.porHorario[hora].montante += valorTotal;

      // Por Usuário
      if (ing.usuario) {
        if (!resumo.porUsuario[ing.usuario]) resumo.porUsuario[ing.usuario] = { qtd: 0 };
        resumo.porUsuario[ing.usuario].qtd += qtd;
      }
    });

    setResumo(resumo);
  }, [ingressos, dataEscolhida]);

  function getSemana(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = (date - start + 86400000) / 86400000;
    return `Semana ${Math.ceil(diff / 7)}-${date.getFullYear()}`;
  }

  function exportarExcel() {
    const sheets = [];

    for (const [titulo, dados] of Object.entries(resumo)) {
      const linhas = Object.entries(dados).map(([chave, val]) => ({
        Categoria: chave,
        Inteira: val.inteira || "",
        Meia: val.meia || "",
        Quantidade: val.qtd || (val.inteira ?? 0) + (val.meia ?? 0),
        Montante: val.montante?.toFixed(2) || "",
      }));
      sheets.push({ nome: titulo, dados: linhas });
    }

    const wb = XLSX.utils.book_new();
    sheets.forEach((sheet) => {
      const ws = XLSX.utils.json_to_sheet(sheet.dados);
      XLSX.utils.book_append_sheet(wb, ws, sheet.nome);
    });
    XLSX.writeFile(wb, "relatorio_ingressos.xlsx");
  }

  return (
    <div style={{ padding: 20 }}>
      <Link href="/Administrativo">Voltar</Link>
      <h1>Relatórios de Ingressos</h1>

      <label>Escolha uma data:</label>
      <input
        type="date"
        value={dataEscolhida}
        onChange={(e) => setDataEscolhida(e.target.value)}
      />

      <h2>Por Data</h2>
      {dataEscolhida && resumo.porData[dataEscolhida] ? (
        <p>
          Inteira: {resumo.porData[dataEscolhida].inteira} | Meia: {resumo.porData[dataEscolhida].meia} | Total:{" "}
          {resumo.porData[dataEscolhida].inteira + resumo.porData[dataEscolhida].meia} | Montante: R$ {resumo.porData[dataEscolhida].montante.toFixed(2)}
        </p>
      ) : (
        <p>Nenhuma venda na data selecionada.</p>
      )}

      <h2>Por Filme</h2>
      <ul>
        {Object.entries(resumo.porFilme || {}).map(([filme, val]) => (
          <li key={filme}>
            {filme} – Inteira: {val.inteira} | Meia: {val.meia} | Total: {val.inteira + val.meia} – R$ {val.montante.toFixed(2)}
          </li>
        ))}
      </ul>

      <h2>Por Semana</h2>
      <ul>
        {Object.entries(resumo.porSemana || {}).map(([semana, val]) => (
          <li key={semana}>
            {semana} – Inteira: {val.inteira} | Meia: {val.meia} | Total: {val.inteira + val.meia} – R$ {val.montante.toFixed(2)}
          </li>
        ))}
      </ul>

      <h2>Por Mês</h2>
      <ul>
        {Object.entries(resumo.porMes || {}).map(([mes, val]) => (
          <li key={mes}>
            {mes} – Inteira: {val.inteira} | Meia: {val.meia} | Total: {val.inteira + val.meia} – R$ {val.montante.toFixed(2)}
          </li>
        ))}
      </ul>

      <h2>Por Horário</h2>
      <ul>
        {Object.entries(resumo.porHorario || {}).map(([hora, val]) => (
          <li key={hora}>
            {hora} – Inteira: {val.inteira} | Meia: {val.meia} | Total: {val.inteira + val.meia} – R$ {val.montante.toFixed(2)}
          </li>
        ))}
      </ul>

      <h2>Média por Usuário</h2>
      <ul>
        {Object.entries(resumo.porUsuario || {}).map(([user, val]) => (
          <li key={user}>{user} – Média: {(val.qtd).toFixed(2)}</li>
        ))}
      </ul>

      <button onClick={exportarExcel}>Exportar para Excel</button>
    </div>
  );
}
