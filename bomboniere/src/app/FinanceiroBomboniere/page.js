"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import Link from "next/link";
import styles from "./page.module.css";

export default function FinanceiroLanchonete() {
  const [pedidos, setPedidos] = useState([]);
  const [resumo, setResumo] = useState({
    porDia: {},
    porMes: {},
    porAno: {},
  });

  useEffect(() => {
    async function carregarPedidos() {
      try {
        const q = query(collection(db, "pedidosLanchonete"), where("pago", "==", true));
        const querySnapshot = await getDocs(q);

        const dados = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.pago !== true) {
            return;
          }

          try {
            if (data.dataCompra?.toDate) {
              data.dataCompra = data.dataCompra.toDate();
            } else if (data.dataCompra && typeof data.dataCompra === "string") {
              data.dataCompra = new Date(data.dataCompra);
            }

            if (!Array.isArray(data.itens)) {
              // Não processa documentos sem array itens
              return;
            }

            dados.push(data);
          } catch {
            // Ignora erros individuais
          }
        });

        setPedidos(dados);
      } catch {
        // Ignora erro geral
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

      const dia = dt.toISOString().slice(0, 10);
      const mes = dia.slice(0, 7);
      const ano = dia.slice(0, 4);

      pedido.itens.forEach((item) => {
        const nomeProduto = item.item ?? "Produto desconhecido";
        const tamanho = item.tamanho ?? "tamanho desconhecido";
        const nomeComTamanho = `${nomeProduto} (tamanho: ${tamanho})`;
        const qtd = Number(item.quantidade ?? item.qtd ?? 1);

        if (!resumo.porDia[dia]) resumo.porDia[dia] = {};
        resumo.porDia[dia][nomeComTamanho] = (resumo.porDia[dia][nomeComTamanho] || 0) + qtd;

        if (!resumo.porMes[mes]) resumo.porMes[mes] = {};
        resumo.porMes[mes][nomeComTamanho] = (resumo.porMes[mes][nomeComTamanho] || 0) + qtd;

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
      <div key={categoria} className={styles.categoriaBloco}>
        <strong className={styles.categoriaTitulo}>{categoria}</strong>
        <ul className={styles.listaProdutos}>
          {Object.entries(produtos).map(([produto, qtd]) => (
            <li key={produto} className={styles.itemProduto}>
              {produto}: {qtd}
            </li>
          ))}
        </ul>
      </div>
    ));
  }

  return (
    <div className={styles.container}>
      <Link href="/Administrativo" className={styles.linkVoltar}>Voltar</Link>
      <h1 className={styles.titulo}>Relatório de Vendas - Lanchonete</h1>

      <h2 className={styles.subtitulo}>Resumo por Dia</h2>
      {Object.keys(resumo.porDia).length > 0 ? (
        renderResumoPorCategoria(resumo.porDia)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada.</p>
      )}

      <h2 className={styles.subtitulo}>Resumo por Mês</h2>
      {Object.keys(resumo.porMes).length > 0 ? (
        renderResumoPorCategoria(resumo.porMes)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada.</p>
      )}

      <h2 className={styles.subtitulo}>Resumo por Ano</h2>
      {Object.keys(resumo.porAno).length > 0 ? (
        renderResumoPorCategoria(resumo.porAno)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada.</p>
      )}

      <button onClick={exportarExcel} className={styles.botaoExportar}>
        Exportar para Excel
      </button>
    </div>
  );
}
