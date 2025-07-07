"use client";

import { useEffect, useState } from "react";
// Certifique-se de que o caminho para o seu firebaseConfig está correto
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
    totaisPorDia: {},
    totaisPorMes: {},
    totaisPorAno: {},
  });

  // Mapeamento de nomes de meses em português para números (0-11)
  const monthMap = {
    "janeiro": 0, "fevereiro": 1, "março": 2, "abril": 3, "maio": 4, "junho": 5,
    "julho": 6, "agosto": 7, "setembro": 8, "outubro": 9, "novembro": 10, "dezembro": 11,
    "jan": 0, "fev": 1, "mar": 2, "abr": 3, "mai": 4, "jun": 5,
    "jul": 6, "ago": 7, "set": 8, "out": 9, "nov": 10, "dez": 11
  };

  useEffect(() => {
    async function carregarPedidos() {
      console.log("Iniciando carregamento de pedidos...");
      try {
        const q = query(
          collection(db, "pedidosLanchonete"),
          where("pago", "==", true)
        );
        console.log("Query Firestore construída:", q);

        const querySnapshot = await getDocs(q);
        console.log(`Query Snapshot recebido. Documentos encontrados: ${querySnapshot.size}`);

        const dados = [];

        if (querySnapshot.empty) {
          console.warn("Nenhum documento encontrado na coleção 'pedidosLanchonete' com 'pago == true'.");
          setPedidos([]);
          return;
        }

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id;

          console.log(`Processando documento ${docId}:`, data);

          // Verificação adicional de segurança
          if (data.pago !== true) {
            console.warn(`Documento ${docId} ignorado: 'pago' não é true.`);
            return;
          }

          try {
            let parsedDate;
            
            // Conversão de data: Firebase Timestamp para Date ou string para Date
            if (data.dataCompra?.toDate) {
              parsedDate = data.dataCompra.toDate();
              console.log(`Documento ${docId}: dataCompra convertida de Timestamp para Date:`, parsedDate);
            } else if (data.dataCompra && typeof data.dataCompra === "string") {
              const dateString = data.dataCompra;
              const match = dateString.match(/(\d+) de ([a-zç]+) de (\d+) às (\d+):(\d+):(\d+)(?: UTC[+-]?\d+)?/i);

              if (match) {
                const day = parseInt(match[1]);
                const monthName = match[2].toLowerCase();
                const year = parseInt(match[3]);
                const hours = parseInt(match[4]);
                const minutes = parseInt(match[5]);
                const seconds = parseInt(match[6]);

                const month = monthMap[monthName];

                if (month !== undefined) {
                  parsedDate = new Date(year, month, day, hours, minutes, seconds);
                  console.log(`Documento ${docId}: dataCompra parseada manualmente de string para Date:`, parsedDate);
                } else {
                  console.error(`Documento ${docId}: Nome do mês '${monthName}' não reconhecido. String original: "${dateString}"`);
                  return;
                }
              } else {
                console.error(`Documento ${docId}: dataCompra com formato inesperado: "${dateString}"`);
                return;
              }

              if (!parsedDate || isNaN(parsedDate.getTime())) {
                console.error(`Documento ${docId}: dataCompra inválida: "${dateString}"`);
                return;
              }
            } else if (!data.dataCompra) {
              console.warn(`Documento ${docId}: dataCompra está ausente. Documento ignorado.`);
              return;
            } else {
              console.warn(`Documento ${docId}: dataCompra tem formato inesperado (${typeof data.dataCompra}). Documento ignorado.`, data.dataCompra);
              return;
            }

            // Atualizar o objeto data com a data parseada
            data.dataCompra = parsedDate;

            // Verificar se itens existe e é um array
            if (!Array.isArray(data.itens)) {
              console.warn(`Documento ${docId} ignorado: 'itens' não é um array. Conteúdo:`, data.itens);
              return;
            }

            // Verificar se há itens no array
            if (data.itens.length === 0) {
              console.warn(`Documento ${docId} ignorado: array 'itens' está vazio.`);
              return;
            }

            dados.push(data);
            console.log(`Documento ${docId} adicionado aos dados para resumo.`);
          } catch (individualDocError) {
            console.error(`Erro ao processar documento ${docId}:`, individualDocError);
            // Continua para o próximo documento
          }
        });

        setPedidos(dados);
        console.log(`Total de pedidos carregados: ${dados.length}`);
      } catch (mainFetchError) {
        console.error("Erro geral ao carregar pedidos do Firestore:", mainFetchError);
        if (mainFetchError.code === 'permission-denied') {
          console.error("Erro de Permissão: Verifique suas Regras de Segurança do Firebase para a coleção 'pedidosLanchonete'.");
        }
        // Garantir que o estado seja resetado em caso de erro
        setPedidos([]);
      }
    }

    carregarPedidos();
  }, []);

  useEffect(() => {
    console.log("Iniciando cálculo do resumo de vendas...");
    console.log("Pedidos para processar:", pedidos.length);
    
    if (pedidos.length === 0) {
      const resumoVazio = {
        porDia: {},
        porMes: {},
        porAno: {},
        totaisPorDia: {},
        totaisPorMes: {},
        totaisPorAno: {},
      };
      setResumo(resumoVazio);
      console.log("Nenhum pedido para resumir. Resumo resetado.");
      return;
    }

    const resumoCalculado = {
      porDia: {},
      porMes: {},
      porAno: {},
      totaisPorDia: {},
      totaisPorMes: {},
      totaisPorAno: {},
    };

    pedidos.forEach((pedido, index) => {
      const dt = pedido.dataCompra;
      
      if (!(dt instanceof Date) || isNaN(dt.getTime())) {
        console.warn(`Pedido ${index + 1} ignorado no resumo: dataCompra não é um objeto Date válido.`, dt);
        return;
      }

      const dia = dt.toISOString().slice(0, 10);
      const mes = dia.slice(0, 7);
      const ano = dia.slice(0, 4);

      // Inicializar totais se não existirem
      if (!resumoCalculado.totaisPorDia[dia]) resumoCalculado.totaisPorDia[dia] = 0;
      if (!resumoCalculado.totaisPorMes[mes]) resumoCalculado.totaisPorMes[mes] = 0;
      if (!resumoCalculado.totaisPorAno[ano]) resumoCalculado.totaisPorAno[ano] = 0;

      // Verificar se itens existe e é um array
      if (!pedido.itens || !Array.isArray(pedido.itens)) {
        console.warn(`Pedido ${index + 1} ignorado no resumo: 'itens' está ausente ou não é um array.`, pedido.itens);
        return;
      }

      pedido.itens.forEach((item, itemIndex) => {
        const nomeProduto = item.item ?? item.nome ?? "Produto desconhecido";
        const tamanho = item.tamanho ?? "tamanho desconhecido";
        const nomeComTamanho = `${nomeProduto} (${tamanho})`;

        const qtd = Number(item.quantidade ?? item.qtd ?? 1);
        const precoUnitario = Number(item.precoUnitario ?? item.preco ?? 0);
        const precoTotalItemOriginal = Number(item.precoTotal ?? 0);

        // Calcular valor total do item
        const valorTotalCalculado = qtd * precoUnitario;

        // Logs de debug
        if (isNaN(qtd) || qtd <= 0) {
          console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): quantidade inválida (${item.quantidade ?? item.qtd}). Usando 1.`);
        }
        if (isNaN(precoUnitario) || precoUnitario <= 0) {
          console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): precoUnitario inválido (${item.precoUnitario ?? item.preco}). Usando 0.`);
        }
        if (Math.abs(valorTotalCalculado - precoTotalItemOriginal) > 0.01 && precoTotalItemOriginal !== 0) {
          console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): precoTotal calculado (${valorTotalCalculado.toFixed(2)}) difere do original (${precoTotalItemOriginal.toFixed(2)}). Usando o calculado.`);
        }

        // Inicializar categorias se necessário
        if (!resumoCalculado.porDia[dia]) resumoCalculado.porDia[dia] = {};
        if (!resumoCalculado.porMes[mes]) resumoCalculado.porMes[mes] = {};
        if (!resumoCalculado.porAno[ano]) resumoCalculado.porAno[ano] = {};

        // Inicializar produto específico se necessário
        if (!resumoCalculado.porDia[dia][nomeComTamanho]) {
          resumoCalculado.porDia[dia][nomeComTamanho] = { qtd: 0, valor: 0 };
        }
        if (!resumoCalculado.porMes[mes][nomeComTamanho]) {
          resumoCalculado.porMes[mes][nomeComTamanho] = { qtd: 0, valor: 0 };
        }
        if (!resumoCalculado.porAno[ano][nomeComTamanho]) {
          resumoCalculado.porAno[ano][nomeComTamanho] = { qtd: 0, valor: 0 };
        }

        // Somar valores
        resumoCalculado.porDia[dia][nomeComTamanho].qtd += qtd;
        resumoCalculado.porDia[dia][nomeComTamanho].valor += valorTotalCalculado;

        resumoCalculado.porMes[mes][nomeComTamanho].qtd += qtd;
        resumoCalculado.porMes[mes][nomeComTamanho].valor += valorTotalCalculado;

        resumoCalculado.porAno[ano][nomeComTamanho].qtd += qtd;
        resumoCalculado.porAno[ano][nomeComTamanho].valor += valorTotalCalculado;

        // Somar totais gerais
        resumoCalculado.totaisPorDia[dia] += valorTotalCalculado;
        resumoCalculado.totaisPorMes[mes] += valorTotalCalculado;
        resumoCalculado.totaisPorAno[ano] += valorTotalCalculado;
      });
    });

    setResumo(resumoCalculado);
    console.log("Resumo de vendas calculado e atualizado:", resumoCalculado);
  }, [pedidos]);

  function exportarExcel() {
    const wb = XLSX.utils.book_new();

    function resumoParaArray(resumoTipo, totais) {
      const linhas = [];
      const categoriasOrdenadas = Object.keys(resumoTipo).sort();

      categoriasOrdenadas.forEach(categoria => {
        const produtos = resumoTipo[categoria];
        const produtosOrdenados = Object.keys(produtos).sort();

        produtosOrdenados.forEach(produto => {
          const dados = produtos[produto];
          linhas.push({
            Categoria: categoria,
            Produto: produto,
            Quantidade: dados.qtd,
            "Valor Total": (typeof dados.valor === 'number' && !isNaN(dados.valor) ? dados.valor.toFixed(2) : "0.00"),
          });
        });
        
        // Linha de total da categoria
        linhas.push({
          Categoria: categoria,
          Produto: "Total da Categoria",
          Quantidade: "",
          "Valor Total": (typeof totais[categoria] === 'number' && !isNaN(totais[categoria]) ? totais[categoria].toFixed(2) : "0.00"),
        });
      });
      return linhas;
    }

    // Verificar se há dados para exportar
    if (Object.keys(resumo.porDia).length === 0 && Object.keys(resumo.porMes).length === 0 && Object.keys(resumo.porAno).length === 0) {
      console.warn("Nenhum dado para exportar.");
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    // Criar planilhas apenas se houver dados
    if (Object.keys(resumo.porDia).length > 0) {
      const porDiaArray = resumoParaArray(resumo.porDia, resumo.totaisPorDia);
      const wsDia = XLSX.utils.json_to_sheet(porDiaArray);
      XLSX.utils.book_append_sheet(wb, wsDia, "Vendas por Dia");
    }

    if (Object.keys(resumo.porMes).length > 0) {
      const porMesArray = resumoParaArray(resumo.porMes, resumo.totaisPorMes);
      const wsMes = XLSX.utils.json_to_sheet(porMesArray);
      XLSX.utils.book_append_sheet(wb, wsMes, "Vendas por Mês");
    }

    if (Object.keys(resumo.porAno).length > 0) {
      const porAnoArray = resumoParaArray(resumo.porAno, resumo.totaisPorAno);
      const wsAno = XLSX.utils.json_to_sheet(porAnoArray);
      XLSX.utils.book_append_sheet(wb, wsAno, "Vendas por Ano");
    }

    try {
      XLSX.writeFile(wb, "relatorio_pedidos_lanchonete.xlsx");
      console.log("Relatório exportado para Excel com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Erro ao exportar para Excel. Verifique o console para mais detalhes.");
    }
  }

  function renderResumoPorCategoria(resumoTipo, totais) {
    const categoriasOrdenadas = Object.keys(resumoTipo).sort();

    if (categoriasOrdenadas.length === 0) {
      return <p className={styles.paragrafo}>Nenhuma venda encontrada.</p>;
    }

    return categoriasOrdenadas.map((categoria) => (
      <div key={categoria} className={styles.categoriaBloco}>
        <strong className={styles.categoriaTitulo}>{categoria}</strong>
        <table className={styles.tabelaResumo}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Valor Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(resumoTipo[categoria])
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([produto, dados]) => (
                <tr key={produto} className={styles.itemProduto}>
                  <td>{produto}</td>
                  <td>{dados.qtd}</td>
                  <td>{typeof dados.valor === 'number' && !isNaN(dados.valor) ? dados.valor.toFixed(2) : "0.00"}</td>
                </tr>
              ))}
            <tr className={styles.totalLinha}>
              <td><strong>Total</strong></td>
              <td></td>
              <td><strong>{typeof totais[categoria] === 'number' && !isNaN(totais[categoria]) ? totais[categoria].toFixed(2) : "0.00"}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    ));
  }

  return (
    <div className={styles.container}>
      <Link href="/Administrativo" className={styles.linkVoltar}>
        Voltar
      </Link>
      <h1 className={styles.titulo}>Relatório de Vendas - Lanchonete</h1>

      <h2 className={styles.subtitulo}>Resumo por Dia</h2>
      {renderResumoPorCategoria(resumo.porDia, resumo.totaisPorDia)}

      <h2 className={styles.subtitulo}>Resumo por Mês</h2>
      {renderResumoPorCategoria(resumo.porMes, resumo.totaisPorMes)}

      <h2 className={styles.subtitulo}>Resumo por Ano</h2>
      {renderResumoPorCategoria(resumo.porAno, resumo.totaisPorAno)}

      <button onClick={exportarExcel} className={styles.botaoExportar}>
        Exportar para Excel
      </button>
    </div>
  );
}