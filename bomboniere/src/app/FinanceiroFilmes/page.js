"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import Link from "next/link";
import styles from "./page.module.css";

export default function FinanceiroFilmes() {
  const [ingressos, setIngressos] = useState([]);
  const [dataEscolhida, setDataEscolhida] = useState("");
  const [resumo, setResumo] = useState({});
  const [mediaPorUsuario, setMediaPorUsuario] = useState(null);
  const [categoriasMeia, setCategoriasMeia] = useState({});
  const [usuariosData, setUsuariosData] = useState({}); // Novo estado para armazenar dados dos usuários

  const monthMap = {
    "janeiro": 0, "fevereiro": 1, "março": 2, "abril": 3, "maio": 4, "junho": 5,
    "julho": 6, "agosto": 7, "setembro": 8, "outubro": 9, "novembro": 10, "dezembro": 11,
    "jan": 0, "fev": 1, "mar": 2, "abr": 3, "mai": 4, "jun": 5,
    "jul": 6, "ago": 7, "set": 8, "out": 9, "nov": 10, "dez": 11
  };

  useEffect(() => {
    async function carregarDados() {
      console.log("Iniciando carregamento de ingressos e usuários...");
      try {
        // Carregar dados de usuários primeiro
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        const usuariosMap = {};
        usuariosSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email) {
            usuariosMap[userData.email] = userData;
          }
        });
        setUsuariosData(usuariosMap);

        // Carregar dados de ingressos
        const querySnapshot = await getDocs(collection(db, "ingressos"));
        const dados = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id;

          if (data.pago !== true) {
            return;
          }

          try {
            let parsedDataCompra;
            if (data.dataCompra?.toDate) {
              parsedDataCompra = data.dataCompra.toDate();
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
                  parsedDataCompra = new Date(year, month, day, hours, minutes, seconds);
                }
              }
              if (!parsedDataCompra || isNaN(parsedDataCompra.getTime())) {
                console.warn(`Documento ${docId}: dataCompra inválida e não pôde ser convertida: "${dateString}"`);
                return;
              }
            } else {
              console.warn(`Documento ${docId}: dataCompra ausente ou formato inesperado.`);
              return;
            }
            data.dataCompra = parsedDataCompra;

            // Atribuição de inteira/meia baseado no desconto de 50%
            if (data.desconto === 50) {
              data.meia = (data.quantidade || 1);
              data.inteira = 0;
            } else {
              data.inteira = (data.quantidade || 1);
              data.meia = 0;
            }

            if (data.precoUnitario) {
              data.preco = data.precoUnitario;
            } else if (!data.preco) {
              data.preco = 0;
            }

            if (!data.usuario && data.usuarioNome) {
              data.usuario = data.usuarioNome;
            }

            dados.push(data);
          } catch (error) {
            console.error(`Erro ao processar documento ${doc.id}: ${error.message}`);
          }
        });

        setIngressos(dados);
      } catch (error) {
        console.error("Erro geral ao carregar dados:", error);
      }
    }

    carregarDados();
  }, []);

  function calcularIdade(dataNascimento) {
    if (!dataNascimento || !(dataNascimento instanceof Date) || isNaN(dataNascimento.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const m = hoje.getMonth() - dataNascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  useEffect(() => {
    if (ingressos.length === 0) {
      setResumo({});
      setMediaPorUsuario(null);
      setCategoriasMeia({});
      return;
    }

    const resumoCalculado = {
      porData: {},
      porFilme: {},
      porSemana: {},
      porMes: {},
      porUsuario: {}
    };

    const categoriasMeiaCalculadas = {
      menorDeIdade: 0,
      maiorDe65Anos: 0,
      deficiencia: 0,
      estudante: 0
    };

    let totalIngressosVendidos = 0;
    const usuariosCompradoresUnicos = new Set();

    ingressos.forEach((ing) => {
      if (!ing.dataCompra || !(ing.dataCompra instanceof Date) || isNaN(ing.dataCompra.getTime())) return;

      const dataStr = ing.dataCompra.toISOString().split("T")[0];
      const semana = getSemana(ing.dataCompra);
      const mes = `${ing.dataCompra.getFullYear()}-${String(ing.dataCompra.getMonth() + 1).padStart(2, "0")}`;

      const inteira = Number(ing.inteira || 0);
      const meia = Number(ing.meia || 0);
      const qtd = inteira + meia;
      totalIngressosVendidos += qtd;

      if (ing.usuarioEmail) {
        usuariosCompradoresUnicos.add(ing.usuarioEmail);
      }

      const valorTotal = Number(ing.precoTotal || (ing.preco || 0) * qtd);

      // Resumo por Data (apenas para a data escolhida, se houver)
      if (dataEscolhida && dataStr === dataEscolhida) {
        if (!resumoCalculado.porData[dataStr]) resumoCalculado.porData[dataStr] = { inteira: 0, meia: 0, montante: 0 };
        resumoCalculado.porData[dataStr].inteira += inteira;
        resumoCalculado.porData[dataStr].meia += meia;
        resumoCalculado.porData[dataStr].montante += valorTotal;
      }

      // Resumo por Filme
      const filmeNome = ing.filme || "Filme Desconhecido";
      if (!resumoCalculado.porFilme[filmeNome]) resumoCalculado.porFilme[filmeNome] = { inteira: 0, meia: 0, montante: 0 };
      resumoCalculado.porFilme[filmeNome].inteira += inteira;
      resumoCalculado.porFilme[filmeNome].meia += meia;
      resumoCalculado.porFilme[filmeNome].montante += valorTotal;

      // Resumo por Semana
      if (!resumoCalculado.porSemana[semana]) resumoCalculado.porSemana[semana] = { inteira: 0, meia: 0, montante: 0 };
      resumoCalculado.porSemana[semana].inteira += inteira;
      resumoCalculado.porSemana[semana].meia += meia;
      resumoCalculado.porSemana[semana].montante += valorTotal;

      // Resumo por Mês
      if (!resumoCalculado.porMes[mes]) resumoCalculado.porMes[mes] = { inteira: 0, meia: 0, montante: 0 };
      resumoCalculado.porMes[mes].inteira += inteira;
      resumoCalculado.porMes[mes].meia += meia;
      resumoCalculado.porMes[mes].montante += valorTotal;

      // Resumo por Usuário (quantidade de ingressos por usuário)
      if (ing.usuario) {
        if (!resumoCalculado.porUsuario[ing.usuario]) resumoCalculado.porUsuario[ing.usuario] = { qtd: 0 };
        resumoCalculado.porUsuario[ing.usuario].qtd += qtd;
      }

      // 🧮 Contabilizar categorias de meia-entrada baseadas em desconto e dados do usuário
      if (ing.desconto === 50 && ing.usuarioEmail) {
        const usuarioInfo = usuariosData[ing.usuarioEmail];
        if (usuarioInfo) {
          if (usuarioInfo.menorDeIdade) categoriasMeiaCalculadas.menorDeIdade += meia;
          if (usuarioInfo.maiorDe65Anos) categoriasMeiaCalculadas.maiorDe65Anos += meia;
          if (usuarioInfo.deficiencia) categoriasMeiaCalculadas.deficiencia += meia;
          if (usuarioInfo.estudante) categoriasMeiaCalculadas.estudante += meia;
        }
      }
    });

    setResumo(resumoCalculado);

    const totalUsuariosCompradores = usuariosCompradoresUnicos.size;
    const media = totalUsuariosCompradores > 0 ? (totalIngressosVendidos / totalUsuariosCompradores) : 0;
    setMediaPorUsuario(media.toFixed(2));
    setCategoriasMeia(categoriasMeiaCalculadas);
  }, [ingressos, dataEscolhida, usuariosData]); // Adicionado usuariosData como dependência

  function getSemana(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = (date.getTime() - start.getTime() + 86400000) / 86400000;
    return `Semana ${Math.ceil(diff / 7)}-${date.getFullYear()}`;
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();

    const createSheet = (data, sheetName, totalColumn = false) => {
      const rows = [];
      const sortedKeys = Object.keys(data).sort();

      sortedKeys.forEach(key => {
        const item = data[key];
        rows.push({
          Categoria: key,
          Inteira: item.inteira,
          Meia: item.meia,
          Quantidade: item.inteira + item.meia,
          Montante: (typeof item.montante === 'number' && !isNaN(item.montante) ? item.montante.toFixed(2) : "0.00"),
        });
      });

      if (totalColumn) {
        const totalInteira = Object.values(data).reduce((sum, item) => sum + (item.inteira || 0), 0);
        const totalMeia = Object.values(data).reduce((sum, item) => sum + (item.meia || 0), 0);
        const totalMontante = Object.values(data).reduce((sum, item) => sum + (item.montante || 0), 0);
        rows.push({
          Categoria: "Total Geral",
          Inteira: totalInteira,
          Meia: totalMeia,
          Quantidade: totalInteira + totalMeia,
          Montante: totalMontante.toFixed(2),
        });
      }
      return XLSX.utils.json_to_sheet(rows);
    };

    if (Object.keys(resumo.porFilme).length > 0) {
      XLSX.utils.book_append_sheet(wb, createSheet(resumo.porFilme, "Vendas por Filme", true), "Vendas por Filme");
    }
    if (Object.keys(resumo.porSemana).length > 0) {
      XLSX.utils.book_append_sheet(wb, createSheet(resumo.porSemana, "Vendas por Semana", true), "Vendas por Semana");
    }
    if (Object.keys(resumo.porMes).length > 0) {
      XLSX.utils.book_append_sheet(wb, createSheet(resumo.porMes, "Vendas por Mês", true), "Vendas por Mês");
    }

    if (dataEscolhida && resumo.porData[dataEscolhida]) {
      const dataSheetData = [{
        Categoria: dataEscolhida,
        Inteira: resumo.porData[dataEscolhida].inteira,
        Meia: resumo.porData[dataEscolhida].meia,
        Quantidade: resumo.porData[dataEscolhida].inteira + resumo.porData[dataEscolhida].meia,
        Montante: (typeof resumo.porData[dataEscolhida].montante === 'number' && !isNaN(resumo.porData[dataEscolhida].montante) ? resumo.porData[dataEscolhida].montante.toFixed(2) : "0.00"),
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataSheetData), "Vendas por Data");
    }

    const meiaCategoriasArray = [
      { Categoria: "Menores de 18 anos", Quantidade: categoriasMeia.menorDeIdade || 0 },
      { Categoria: "Maiores de 65 anos", Quantidade: categoriasMeia.maiorDe65Anos || 0 },
      { Categoria: "Pessoas com deficiência", Quantidade: categoriasMeia.deficiencia || 0 },
      { Categoria: "Estudantes", Quantidade: categoriasMeia.estudante || 0 },
      {
        Categoria: "Total Geral Meia-Entrada", Quantidade: (categoriasMeia.menorDeIdade || 0) +
          (categoriasMeia.maiorDe65Anos || 0) + (categoriasMeia.deficiencia || 0) + (categoriasMeia.estudante || 0)
      }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meiaCategoriasArray), "Categorias Meia-Entrada");

    const mediaPorUsuarioArray = [
      { Metrica: "Média de Ingressos por Usuário", Valor: mediaPorUsuario !== null ? mediaPorUsuario : "0.00" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mediaPorUsuarioArray), "Media por Usuario");

    try {
      XLSX.writeFile(wb, "relatorio_ingressos.xlsx");
      console.log("Relatório de ingressos exportado para Excel com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      console.error("Não foi possível exportar o relatório para Excel. Verifique o console para mais detalhes.");
    }
  }

  const renderResumoTable = (data = {}, title, showTotalRow = true) => {
    if (Object.keys(data).length === 0) {
      return <p className={styles.paragrafo}>Nenhuma venda encontrada para {title.toLowerCase()}.</p>;
    }

    const sortedKeys = Object.keys(data).sort();
    let totalInteira = 0;
    let totalMeia = 0;
    let totalMontante = 0;

    return (
      <div className={styles.categoriaBloco}>
        <strong className={styles.categoriaTitulo}>{title}</strong>
        <table className={styles.tabelaResumo}>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Inteira</th>
              <th>Meia</th>
              <th>Total</th>
              <th>Montante (R$)</th>
            </tr>
          </thead>
          <tbody>
            {sortedKeys.map((key) => {
              const item = data[key];
              const inteira = item.inteira || 0;
              const meia = item.meia || 0;
              const montante = typeof item.montante === 'number' && !isNaN(item.montante) ? item.montante : 0;

              totalInteira += inteira;
              totalMeia += meia;
              totalMontante += montante;

              return (
                <tr key={key} className={styles.itemProduto}>
                  <td>{key}</td>
                  <td>{inteira}</td>
                  <td>{meia}</td>
                  <td>{inteira + meia}</td>
                  <td>{montante.toFixed(2)}</td>
                </tr>
              );
            })}
            {showTotalRow && (
              <tr className={styles.totalLinha}>
                <td>Total Geral</td>
                <td>{totalInteira}</td>
                <td>{totalMeia}</td>
                <td>{totalInteira + totalMeia}</td>
                <td>{totalMontante.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Link href="/Administrativo" className={styles.linkVoltar}>
        Voltar
      </Link>
      <h1 className={styles.titulo}>Relatórios de Ingressos</h1>

      <div className={styles.inputGroup}>
        <label htmlFor="dataEscolhida" className={styles.label}>Escolha uma data:</label>
        <input
          id="dataEscolhida"
          type="date"
          value={dataEscolhida}
          onChange={(e) => setDataEscolhida(e.target.value)}
          className={styles.inputData}
        />
      </div>

      <h2 className={styles.subtitulo}>Resumo por Data</h2>
      {dataEscolhida && resumo.porData && resumo.porData[dataEscolhida] ? (
        <div className={styles.categoriaBloco}>
          <strong className={styles.categoriaTitulo}>Vendas em {dataEscolhida}</strong>
          <table className={styles.tabelaResumo}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Montante (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.itemProduto}>
                <td>Inteira</td>
                <td>{resumo.porData[dataEscolhida].inteira}</td>
                <td>{(resumo.porData[dataEscolhida].montante / (resumo.porData[dataEscolhida].inteira + resumo.porData[dataEscolhida].meia) * resumo.porData[dataEscolhida].inteira || 0).toFixed(2)}</td> {/* Estimativa */}
              </tr>
              <tr className={styles.itemProduto}>
                <td>Meia</td>
                <td>{resumo.porData[dataEscolhida].meia}</td>
                <td>{(resumo.porData[dataEscolhida].montante / (resumo.porData[dataEscolhida].inteira + resumo.porData[dataEscolhida].meia) * resumo.porData[dataEscolhida].meia || 0).toFixed(2)}</td> {/* Estimativa */}
              </tr>
              <tr className={styles.totalLinha}>
                <td>Total</td>
                <td>{resumo.porData[dataEscolhida].inteira + resumo.porData[dataEscolhida].meia}</td>
                <td>{(typeof resumo.porData[dataEscolhida].montante === 'number' && !isNaN(resumo.porData[dataEscolhida].montante) ? resumo.porData[dataEscolhida].montante.toFixed(2) : "0.00")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.paragrafo}>Nenhuma venda encontrada na data selecionada.</p>
      )}

      <h2 className={styles.subtitulo}>Resumo por Filme</h2>
      {renderResumoTable(resumo.porFilme, "Vendas por Filme")}

      <h2 className={styles.subtitulo}>Resumo por Semana</h2>
      {renderResumoTable(resumo.porSemana, "Vendas por Semana")}

      <h2 className={styles.subtitulo}>Resumo por Mês</h2>
      {renderResumoTable(resumo.porMes, "Vendas por Mês")}

      <h2 className={styles.subtitulo}>Categorias de Meia-Entrada</h2>
      <div className={styles.categoriaBloco}>
        <strong className={styles.categoriaTitulo}>Detalhamento de Meia-Entrada</strong>
        <table className={styles.tabelaResumo}>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Quantidade de Meias</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.itemProduto}>
              <td>Menores de 18 anos</td>
              <td>{categoriasMeia.menorDeIdade || 0}</td>
            </tr>
            <tr className={styles.itemProduto}>
              <td>Maiores de 65 anos</td>
              <td>{categoriasMeia.maiorDe65Anos || 0}</td>
            </tr>
            <tr className={styles.itemProduto}>
              <td>Pessoas com deficiência</td>
              <td>{categoriasMeia.deficiencia || 0}</td>
            </tr>
            <tr className={styles.itemProduto}>
              <td>Estudantes</td>
              <td>{categoriasMeia.estudante || 0}</td>
            </tr>
            <tr className={styles.totalLinha}>
              <td>Total Geral de Meias</td>
              <td>
                {(categoriasMeia.menorDeIdade || 0) +
                  (categoriasMeia.maiorDe65Anos || 0) +
                  (categoriasMeia.deficiencia || 0) +
                  (categoriasMeia.estudante || 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className={styles.subtitulo}>Média por Usuário</h2>
      <div className={styles.categoriaBloco}>
        <strong className={styles.categoriaTitulo}>Média de Ingressos por Usuário</strong>
        <p className={styles.paragrafo}>
          <strong>Média geral por usuário:</strong> {mediaPorUsuario !== null ? mediaPorUsuario : "Calculando..."}
        </p>
      </div>

      <button onClick={exportarExcel} className={styles.botaoExportar}>Exportar para Excel</button>
    </div>
  );
}