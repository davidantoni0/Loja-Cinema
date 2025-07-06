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
        }

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id; // Para logs mais específicos

          console.log(`Processando documento ${docId}:`, data);

          if (data.pago !== true) {
            console.warn(`Documento ${docId} ignorado: 'pago' não é true. (Isso não deveria acontecer com a cláusula where, mas é uma verificação extra)`);
            return; // só pega pedidos pagos
          }

          try {
            let parsedDate;
            // Conversão de data: Firebase Timestamp para Date ou string para Date
            if (data.dataCompra?.toDate) {
              parsedDate = data.dataCompra.toDate();
              console.log(`Documento ${docId}: dataCompra convertida de Timestamp para Date:`, parsedDate);
            } else if (data.dataCompra && typeof data.dataCompra === "string") {
              // Tenta parsear o formato específico "DD de MMMM deYYYY às HH:mm:ss UTC-X"
              // A regex foi ajustada para incluir o "UTC-X" opcionalmente no final
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
                  // Cria a data no fuso horário local, pois a string original já contém o offset UTC-3
                  parsedDate = new Date(year, month, day, hours, minutes, seconds);
                  console.log(`Documento ${docId}: dataCompra parseada manualmente de string para Date:`, parsedDate);
                } else {
                  console.error(`Documento ${docId}: Nome do mês '${monthName}' não reconhecido no mapeamento. String original: "${dateString}"`);
                }
              } else {
                console.error(`Documento ${docId}: dataCompra é uma string com formato inesperado e não pôde ser parseada:`, dateString);
              }

              if (!parsedDate || isNaN(parsedDate.getTime())) {
                console.error(`Documento ${docId}: dataCompra é uma string inválida e não pôde ser convertida para Date:`, dateString);
                return; // Pula se a string da data for inválida ou o parse falhar
              }
              data.dataCompra = parsedDate; // Atribui a data parseada de volta ao objeto
            } else if (!data.dataCompra) {
                console.warn(`Documento ${docId}: dataCompra está ausente. Documento ignorado.`);
                return;
            } else {
                console.warn(`Documento ${docId}: dataCompra tem um formato inesperado (${typeof data.dataCompra}). Documento ignorado.`, data.dataCompra);
                return;
            }


            if (!Array.isArray(data.itens)) {
              console.warn(`Documento ${docId} ignorado: 'itens' não é um array. Conteúdo de 'itens':`, data.itens);
              return; // pula se não tem array de itens
            }

            dados.push(data);
            console.log(`Documento ${docId} adicionado aos dados para resumo.`);
          } catch (individualDocError) {
            console.error(`Erro ao processar documento ${docId}:`, individualDocError);
            // Continua para o próximo documento
          }
        });

        setPedidos(dados);
        console.log(`Total de pedidos carregados para o estado: ${dados.length}`);
      } catch (mainFetchError) {
        // Captura e exibe qualquer erro que ocorra durante a busca no Firestore
        console.error("Erro geral ao carregar pedidos do Firestore:", mainFetchError);
        // Exemplo de como verificar se é um erro de permissão
        if (mainFetchError.code === 'permission-denied') {
          console.error("Erro de Permissão: Verifique suas Regras de Segurança do Firebase para a coleção 'pedidosLanchonete'.");
        }
      }
    }

    carregarPedidos();
  }, []);

  useEffect(() => {
    console.log("Iniciando cálculo do resumo de vendas...");
    if (pedidos.length === 0) {
      setResumo({
        porDia: {},
        porMes: {},
        porAno: {},
        totaisPorDia: {},
        totaisPorMes: {},
        totaisPorAno: {},
      });
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
      // console.log(`Processando pedido ${index + 1} para resumo:`, pedido); // Descomente para log de pedido individual

      if (!(dt instanceof Date) || isNaN(dt.getTime())) {
        console.warn(`Pedido ${index + 1} ignorado no resumo: dataCompra não é um objeto Date válido.`, dt);
        return;
      }

      const dia = dt.toISOString().slice(0, 10);
      const mes = dia.slice(0, 7);
      const ano = dia.slice(0, 4);

      // Inicializa totais para esta data/mês/ano se ainda não existirem
      if (!resumoCalculado.totaisPorDia[dia]) resumoCalculado.totaisPorDia[dia] = 0;
      if (!resumoCalculado.totaisPorMes[mes]) resumoCalculado.totaisPorMes[mes] = 0;
      if (!resumoCalculado.totaisPorAno[ano]) resumoCalculado.totaisPorAno[ano] = 0;

      if (!pedido.itens || !Array.isArray(pedido.itens)) {
        console.warn(`Pedido ${index + 1} ignorado no resumo: 'itens' está ausente ou não é um array.`, pedido.itens);
        return;
      }

      pedido.itens.forEach((item, itemIndex) => {
        // console.log(`  Processando item ${itemIndex + 1} do pedido ${index + 1}:`, item); // Descomente para log de item individual

        const nomeProduto = item.item ?? item.nome ?? "Produto desconhecido";
        const tamanho = item.tamanho ?? "tamanho desconhecido";
        const nomeComTamanho = `${nomeProduto} (tamanho: ${tamanho})`;

        const qtd = Number(item.quantidade ?? item.qtd ?? 1);
        // Preço unitário, tenta pegar dos dados (ou zero)
        const precoUnitario = Number(item.precoUnitario ?? item.preco ?? 0);
        const precoTotalItemOriginal = Number(item.precoTotal ?? 0); // O preço total do item no documento

        // Calcula o valor total do item com base na quantidade e preço unitário
        const valorTotalCalculado = qtd * precoUnitario;

        if (isNaN(qtd)) {
          console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): quantidade inválida (${item.quantidade ?? item.qtd}). Usando 1.`);
        }
        if (isNaN(precoUnitario)) {
            console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): precoUnitario inválido (${item.precoUnitario ?? item.preco}). Usando 0.`);
        }
        if (valorTotalCalculado !== precoTotalItemOriginal && precoTotalItemOriginal !== 0) {
            console.warn(`  Item ${itemIndex + 1} do pedido ${index + 1} (${nomeComTamanho}): precoTotal calculado (${valorTotalCalculado.toFixed(2)}) difere do original (${precoTotalItemOriginal.toFixed(2)}). Usando o calculado.`);
        }


        // Inicializa o produto nas categorias se necessário
        if (!resumoCalculado.porDia[dia]) resumoCalculado.porDia[dia] = {};
        if (!resumoCalculado.porDia[dia][nomeComTamanho])
          resumoCalculado.porDia[dia][nomeComTamanho] = { qtd: 0, valor: 0 };
        resumoCalculado.porDia[dia][nomeComTamanho].qtd += qtd;
        resumoCalculado.porDia[dia][nomeComTamanho].valor += valorTotalCalculado;

        if (!resumoCalculado.porMes[mes]) resumoCalculado.porMes[mes] = {};
        if (!resumoCalculado.porMes[mes][nomeComTamanho])
          resumoCalculado.porMes[mes][nomeComTamanho] = { qtd: 0, valor: 0 };
        resumoCalculado.porMes[mes][nomeComTamanho].qtd += qtd;
        resumoCalculado.porMes[mes][nomeComTamanho].valor += valorTotalCalculado;

        if (!resumoCalculado.porAno[ano]) resumoCalculado.porAno[ano] = {};
        if (!resumoCalculado.porAno[ano][nomeComTamanho])
          resumoCalculado.porAno[ano][nomeComTamanho] = { qtd: 0, valor: 0 };
        resumoCalculado.porAno[ano][nomeComTamanho].qtd += qtd;
        resumoCalculado.porAno[ano][nomeComTamanho].valor += valorTotalCalculado;

        // Soma totais gerais
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
      // Ordenar as categorias (dias, meses, anos) para uma saída consistente
      const categoriasOrdenadas = Object.keys(resumoTipo).sort();

      categoriasOrdenadas.forEach(categoria => {
        const produtos = resumoTipo[categoria];
        // Ordenar os produtos dentro de cada categoria
        const produtosOrdenados = Object.keys(produtos).sort();

        produtosOrdenados.forEach(produto => {
          const dados = produtos[produto];
          linhas.push({
            Categoria: categoria,
            Produto: produto,
            Quantidade: dados.qtd,
            // Garante que dados.valor seja um número antes de toFixed
            "Valor Total": (typeof dados.valor === 'number' && !isNaN(dados.valor) ? dados.valor.toFixed(2) : "0.00"),
          });
        });
        // Linha de total da categoria
        linhas.push({
          Categoria: categoria,
          Produto: "Total da Categoria", // Mais descritivo
          Quantidade: "",
          // Garante que totais[categoria] seja um número antes de toFixed
          "Valor Total": (typeof totais[categoria] === 'number' && !isNaN(totais[categoria]) ? totais[categoria].toFixed(2) : "0.00"),
        });
      });
      return linhas;
    }

    const porDiaArray = resumoParaArray(resumo.porDia, resumo.totaisPorDia);
    const porMesArray = resumoParaArray(resumo.porMes, resumo.totaisPorMes);
    const porAnoArray = resumoParaArray(resumo.porAno, resumo.totaisPorAno);

    const wsDia = XLSX.utils.json_to_sheet(porDiaArray);
    const wsMes = XLSX.utils.json_to_sheet(porMesArray);
    const wsAno = XLSX.utils.json_to_sheet(porAnoArray);

    XLSX.utils.book_append_sheet(wb, wsDia, "Vendas por Dia");
    XLSX.utils.book_append_sheet(wb, wsMes, "Vendas por Mês");
    XLSX.utils.book_append_sheet(wb, wsAno, "Vendas por Ano");

    try {
      XLSX.writeFile(wb, "relatorio_pedidos_lanchonete.xlsx");
      console.log("Relatório exportado para Excel com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      // Substituindo alert por uma mensagem no console, conforme as instruções
      console.error("Não foi possível exportar o relatório para Excel. Verifique o console para mais detalhes.");
    }
  }

  function renderResumoPorCategoria(resumoTipo, totais) {
    // Ordenar as categorias (dias, meses, anos) para uma exibição consistente
    const categoriasOrdenadas = Object.keys(resumoTipo).sort();

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
            {/* Ordenar os produtos dentro de cada categoria */}
            {Object.entries(resumoTipo[categoria]).sort(([a], [b]) => a.localeCompare(b)).map(([produto, dados]) => (
              <tr key={produto} className={styles.itemProduto}>
                <td>{produto}</td>
                <td>{dados.qtd}</td>
                {/* Garante que dados.valor seja um número antes de toFixed */}
                <td>{typeof dados.valor === 'number' && !isNaN(dados.valor) ? dados.valor.toFixed(2) : "0.00"}</td>
              </tr>
            ))}
            <tr className={styles.totalLinha}>
              <td>Total</td>
              <td></td>
              {/* Garante que totais[categoria] seja um número antes de toFixed */}
              <td>{typeof totais[categoria] === 'number' && !isNaN(totais[categoria]) ? totais[categoria].toFixed(2) : "0.00"}</td>
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
      {Object.keys(resumo.porDia).length > 0 ? (
        renderResumoPorCategoria(resumo.porDia, resumo.totaisPorDia)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada para o resumo diário.</p>
      )}

      <h2 className={styles.subtitulo}>Resumo por Mês</h2>
      {Object.keys(resumo.porMes).length > 0 ? (
        renderResumoPorCategoria(resumo.porMes, resumo.totaisPorMes)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada para o resumo mensal.</p>
      )}

      <h2 className={styles.subtitulo}>Resumo por Ano</h2>
      {Object.keys(resumo.porAno).length > 0 ? (
        renderResumoPorCategoria(resumo.porAno, resumo.totaisPorAno)
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada para o resumo anual.</p>
      )}

      <button onClick={exportarExcel} className={styles.botaoExportar}>
        Exportar para Excel
      </button>
    </div>
  );
}
