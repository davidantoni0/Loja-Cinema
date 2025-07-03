"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function FinanceiroLanchonete() {
  const [pedidos, setPedidos] = useState([]);
  const [resumo, setResumo] = useState({
    porDia: {},
    porMes: {},
    porAno: {},
  });
  const [debugInfo, setDebugInfo] = useState({
    totalDocumentos: 0,
    documentosPagos: 0,
    documentosNaoPagos: 0,
    errosProcessamento: [],
    ultimaAtualizacao: null,
  });

  useEffect(() => {
    async function carregarPedidos() {
      try {
        const q = query(collection(db, "pedidosLanchonete"), where("pago", "==", true));
        const querySnapshot = await getDocs(q);

        const dados = [];
        let totalDocs = 0;
        let docsPagos = 0;
        let docsNaoPagos = 0;
        const erros = [];

        querySnapshot.forEach((doc) => {
          totalDocs++;
          const data = doc.data();

          if (data.pago !== true) {
            docsNaoPagos++;
            return;
          }
          docsPagos++;

          try {
            // converter dataCompra
            if (data.dataCompra?.toDate) {
              data.dataCompra = data.dataCompra.toDate();
            } else if (data.dataCompra && typeof data.dataCompra === "string") {
              data.dataCompra = new Date(data.dataCompra);
            }

            if (!Array.isArray(data.itens)) {
              erros.push(`Documento ${doc.id} não tem campo 'itens' como array.`);
              return;
            }

            dados.push(data);
          } catch (error) {
            erros.push(`Erro ao processar documento ${doc.id}: ${error.message}`);
          }
        });

        setPedidos(dados);
        setDebugInfo({
          totalDocumentos: totalDocs,
          documentosPagos: docsPagos,
          documentosNaoPagos: docsNaoPagos,
          errosProcessamento: erros,
          ultimaAtualizacao: new Date().toLocaleString(),
        });
      } catch (error) {
        setDebugInfo((prev) => ({
          ...prev,
          errosProcessamento: [...prev.errosProcessamento, `Erro geral: ${error.message}`],
          ultimaAtualizacao: new Date().toLocaleString(),
        }));
      }
    }

    carregarPedidos();
  }, []);

  useEffect(() => {
    if (pedidos.length === 0) {
      setResumo({ porDia: {}, porMes: {}, porAno: {} });
      return;
    }

    const resumo = {
      porDia: {},
      porMes: {},
      porAno: {},
    };

    pedidos.forEach((pedido) => {
      const dt = pedido.dataCompra;
      if (!(dt instanceof Date) || isNaN(dt)) return;

      const dia = dt.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const mes = dia.slice(0, 7); // "YYYY-MM"
      const ano = dia.slice(0, 4); // "YYYY"

      pedido.itens.forEach((item) => {
        const nomeProduto = item.item ?? "Produto desconhecido";
        const tamanho = item.tamanho ?? "tamanho desconhecido";
        const nomeComTamanho = `${nomeProduto} (tamanho: ${tamanho})`;
        const qtd = Number(item.quantidade ?? item.qtd ?? 1);

        // Por Dia
        if (!resumo.porDia[dia]) resumo.porDia[dia] = {};
        resumo.porDia[dia][nomeComTamanho] = (resumo.porDia[dia][nomeComTamanho] || 0) + qtd;

        // Por Mês
        if (!resumo.porMes[mes]) resumo.porMes[mes] = {};
        resumo.porMes[mes][nomeComTamanho] = (resumo.porMes[mes][nomeComTamanho] || 0) + qtd;

        // Por Ano
        if (!resumo.porAno[ano]) resumo.porAno[ano] = {};
        resumo.porAno[ano][nomeComTamanho] = (resumo.porAno[ano][nomeComTamanho] || 0) + qtd;
      });
    });

    setResumo(resumo);
  }, [pedidos]);

  function exportarExcel() {
    const wb = XLSX.utils.book_new();

    function resumoParaArray(resumoTipo) {
      const linhas = [];
      for (const [categoria, produtos] of Object.entries(resumoTipo)) {
        for (const [produto, qtd] of Object.entries(produtos)) {
          linhas.push({
            Categoria: categoria,
            Produto: produto,
            Quantidade: qtd,
          });
        }
      }
      return linhas;
    }

    const porDiaArray = resumoParaArray(resumo.porDia);
    const porMesArray = resumoParaArray(resumo.porMes);
    const porAnoArray = resumoParaArray(resumo.porAno);

    const wsDia = XLSX.utils.json_to_sheet(porDiaArray);
    const wsMes = XLSX.utils.json_to_sheet(porMesArray);
    const wsAno = XLSX.utils.json_to_sheet(porAnoArray);

    XLSX.utils.book_append_sheet(wb, wsDia, "Vendas por Dia");
    XLSX.utils.book_append_sheet(wb, wsMes, "Vendas por Mês");
    XLSX.utils.book_append_sheet(wb, wsAno, "Vendas por Ano");

    XLSX.writeFile(wb, "relatorio_pedidos_lanchonete.xlsx");
  }

  function renderResumoPorCategoria(resumoTipo) {
    return Object.entries(resumoTipo).map(([categoria, produtos]) => (
      <div key={categoria} style={{ marginBottom: 12 }}>
        <strong>{categoria}</strong>
        <ul>
          {Object.entries(produtos).map(([produto, qtd]) => (
            <li key={produto}>
              {produto}: {qtd}
            </li>
          ))}
        </ul>
      </div>
    ));
  }

  return (
    <div style={{ padding: 20 }}>
      <Link href="/Administrativo">Voltar</Link>
      <h1>Relatório de Vendas - Lanchonete</h1>

      <h2>Resumo por Dia</h2>
      {Object.keys(resumo.porDia).length > 0 ? (
        renderResumoPorCategoria(resumo.porDia)
      ) : (
        <p>Nenhuma venda encontrada.</p>
      )}

      <h2>Resumo por Mês</h2>
      {Object.keys(resumo.porMes).length > 0 ? (
        renderResumoPorCategoria(resumo.porMes)
      ) : (
        <p>Nenhuma venda encontrada.</p>
      )}

      <h2>Resumo por Ano</h2>
      {Object.keys(resumo.porAno).length > 0 ? (
        renderResumoPorCategoria(resumo.porAno)
      ) : (
        <p>Nenhuma venda encontrada.</p>
      )}

      <button onClick={exportarExcel} style={{ marginTop: 20 }}>
        Exportar para Excel
      </button>

      <div style={{ marginTop: 30, fontSize: 12, color: "#666" }}>
        <p>Total documentos: {debugInfo.totalDocumentos}</p>
        <p>Documentos pagos: {debugInfo.documentosPagos}</p>
        <p>Documentos não pagos (filtrados): {debugInfo.documentosNaoPagos}</p>
        <p>Última atualização: {debugInfo.ultimaAtualizacao}</p>
        {debugInfo.errosProcessamento.length > 0 && (
          <div>
            <strong>Erros no processamento:</strong>
            <ul>
              {debugInfo.errosProcessamento.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
