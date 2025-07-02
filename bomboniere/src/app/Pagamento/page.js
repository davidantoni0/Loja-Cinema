"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Pagamento() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const singleId = searchParams.get("id");
  const multipleIds = searchParams.get("ids");

  const ingressoIds = singleId
    ? [singleId]
    : (multipleIds ? multipleIds.split(",").filter(id => id.trim()) : []);

  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function buscarIngressos() {
      if (ingressoIds.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ingressosData = [];
        for (const id of ingressoIds) {
          const docRef = doc(db, "ingressos", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Dados do ingresso carregado:", data);
            ingressosData.push({ id: docSnap.id, ...data });
          }
        }
        setIngressos(ingressosData);
        console.log("Todos os ingressos carregados:", ingressosData);
      } catch (error) {
        console.error("Erro ao carregar ingressos:", error);
        setMsg("Erro ao carregar ingressos: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    buscarIngressos();
  }, [singleId, multipleIds]);

  function formatarData(data) {
    if (!data) return "Data não disponível";
    
    console.log("Formatando data:", data);
    
    try {
      let dataFormatada;
      
      if (data.seconds !== undefined) {
        // Timestamp do Firestore
        dataFormatada = new Date(data.seconds * 1000);
      } else if (data.toDate && typeof data.toDate === 'function') {
        // Timestamp do Firestore (método alternativo)
        dataFormatada = data.toDate();
      } else if (typeof data === 'string') {
        // String de data
        dataFormatada = new Date(data);
      } else if (data instanceof Date) {
        // Já é um objeto Date
        dataFormatada = data;
      } else {
        console.log("Formato de data não reconhecido:", data);
        return "Formato inválido";
      }

      if (isNaN(dataFormatada.getTime())) {
        console.log("Data inválida após conversão:", dataFormatada);
        return "Data inválida";
      }

      const resultado = dataFormatada.toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log("Data formatada:", resultado);
      return resultado;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Erro na formatação";
    }
  }

  function calcularIdade(dataNascimento) {
    console.log("Calculando idade para:", dataNascimento);
    
    if (!dataNascimento) {
      console.log("Data de nascimento não fornecida");
      return null;
    }
    
    try {
      let nascimento;
      
      if (dataNascimento.seconds !== undefined) {
        nascimento = new Date(dataNascimento.seconds * 1000);
      } else if (dataNascimento.toDate && typeof dataNascimento.toDate === 'function') {
        nascimento = dataNascimento.toDate();
      } else if (typeof dataNascimento === 'string') {
        nascimento = new Date(dataNascimento);
      } else if (dataNascimento instanceof Date) {
        nascimento = dataNascimento;
      } else {
        console.log("Formato de data de nascimento não reconhecido:", dataNascimento);
        return null;
      }

      if (isNaN(nascimento.getTime())) {
        console.log("Data de nascimento inválida:", nascimento);
        return null;
      }

      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      const dia = hoje.getDate() - nascimento.getDate();
      
      if (mes < 0 || (mes === 0 && dia < 0)) {
        idade--;
      }
      
      console.log("Idade calculada:", idade, "para data:", nascimento);
      return idade;
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      return null;
    }
  }

  function temDireitoDesconto(ingresso) {
    console.log("=== VERIFICANDO DESCONTO ===");
    console.log("Ingresso completo:", ingresso);
    
    const idade = calcularIdade(ingresso.dataNascimento);
    const menorDe18 = (idade !== null && idade < 18);
    const maiorDe65 = (idade !== null && idade > 65);
    const estudante = (ingresso.tipoMeia === "estudante");
    const deficiente = (ingresso.tipoMeia === "deficiente");
    
    console.log("Análise de desconto:", {
      idade: idade,
      menorDe18: menorDe18,
      maiorDe65: maiorDe65,
      estudante: estudante,
      deficiente: deficiente,
      tipoMeia: ingresso.tipoMeia,
      dataNascimento: ingresso.dataNascimento
    });

    const temDesconto = menorDe18 || maiorDe65 || estudante || deficiente;
    console.log("TEM DIREITO A DESCONTO:", temDesconto);
    console.log("=============================");
    
    return temDesconto;
  }

  function calcularPrecoFinal(ingresso) {
    console.log("=== CALCULANDO PREÇO ===");
    const precoOriginal = parseFloat(ingresso.preco) || 30;
    console.log("Preço original:", precoOriginal);
    
    const temDesconto = temDireitoDesconto(ingresso);
    console.log("Tem desconto:", temDesconto);
    
    if (temDesconto) {
      // Se tem precoDesconto definido, usar ele. Senão, aplicar 50% de desconto
      let precoComDesconto;
      if (ingresso.precoDesconto && ingresso.precoDesconto > 0) {
        precoComDesconto = parseFloat(ingresso.precoDesconto);
        console.log("Usando precoDesconto predefinido:", precoComDesconto);
      } else {
        precoComDesconto = precoOriginal * 0.5;
        console.log("Aplicando desconto de 50%:", precoComDesconto);
      }
      console.log("PREÇO FINAL COM DESCONTO:", precoComDesconto);
      return precoComDesconto;
    }
    
    console.log("PREÇO FINAL SEM DESCONTO:", precoOriginal);
    return precoOriginal;
  }

  function calcularTotal() {
    const total = ingressos.reduce((total, ingresso) => {
      const precoFinal = calcularPrecoFinal(ingresso);
      const quantidade = parseInt(ingresso.quantidade) || 1;
      const subtotal = precoFinal * quantidade;
      console.log(`Ingresso ${ingresso.id}: R$ ${precoFinal} x ${quantidade} = R$ ${subtotal}`);
      return total + subtotal;
    }, 0);
    
    console.log("TOTAL GERAL:", total);
    return total;
  }

  async function confirmarPagamento() {
    if (!formaPagamento) {
      setMsg("Selecione uma forma de pagamento.");
      return;
    }

    if (ingressos.length === 0) {
      setMsg("Nenhum ingresso para processar.");
      return;
    }

    setProcessando(true);
    setMsg("");

    try {
      if (ingressos.length === 1) {
        const docRef = doc(db, "ingressos", ingressos[0].id);
        await updateDoc(docRef, {
          pago: true,
          formaPagamento,
          dataCompra: serverTimestamp(),
        });
        setMsg("Pagamento confirmado com sucesso!");
      } else {
        const batch = writeBatch(db);
        ingressos.forEach((ingresso) => {
          const docRef = doc(db, "ingressos", ingresso.id);
          batch.update(docRef, {
            pago: true,
            formaPagamento,
            dataCompra: serverTimestamp(),
          });
        });
        await batch.commit();
        setMsg(`Pagamento de ${ingressos.length} ingressos confirmado com sucesso!`);
      }
      setTimeout(() => router.push("/Carrinho"), 2000);
    } catch (error) {
      setMsg("Erro ao confirmar pagamento: " + error.message);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando ingresso(s)...</p>
      </div>
    );
  }

  if (ingressos.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Pagamento do Ingresso</h1>
        <p className={styles.errorMessage}>Nenhum ingresso encontrado.</p>
        <button
          onClick={() => router.push("/Carrinho")}
          className={styles.btnPrimary}
        >
          Voltar ao Carrinho
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>
        {ingressos.length > 1
          ? `Pagamento de ${ingressos.length} Ingressos`
          : "Pagamento do Ingresso"}
      </h1>

      <div className={styles.resumoCompra}>
        <h3>Resumo da Compra:</h3>
        {ingressos.map((ingresso) => {
          const quantidade = parseInt(ingresso.quantidade) || 1;
          const precoOriginal = parseFloat(ingresso.preco) || 30;
          const temDesconto = temDireitoDesconto(ingresso);
          const precoFinal = calcularPrecoFinal(ingresso);
          const idade = calcularIdade(ingresso.dataNascimento);

          return (
            <div
              key={ingresso.id}
              className={styles.resumoItem}
              style={{ border: "1px solid #ddd", padding: "15px", margin: "10px 0", borderRadius: "5px" }}
            >
              <p><strong>Filme:</strong> {ingresso.filme || ingresso.nome || "Desconhecido"}</p>
              <p><strong>Quantidade:</strong> {quantidade}</p>
              <p><strong>Sessão:</strong> {formatarData(ingresso.dataSessao)}</p>
              
              {/* Debug info */}
              <div style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                <p><strong>DEBUG:</strong></p>
                <p>• Idade: {idade !== null ? idade + " anos" : "Não calculada"}</p>
                <p>• Tipo Meia: {ingresso.tipoMeia || "Nenhum"}</p>
                <p>• Tem Desconto: {temDesconto ? "SIM" : "NÃO"}</p>
                <p>• Data Nascimento: {ingresso.dataNascimento ? "Presente" : "Ausente"}</p>
              </div>
              
              {ingresso.assentos && ingresso.assentos.length > 0 && (
                <p><strong>Assentos:</strong> {ingresso.assentos.join(", ")}</p>
              )}
              
              {temDesconto && (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  <strong>💰 Desconto aplicado:</strong> 
                  {idade !== null && idade < 18 && " Menor de 18 anos"}
                  {idade !== null && idade > 65 && " Maior de 65 anos"}
                  {ingresso.tipoMeia === "estudante" && " Estudante"}
                  {ingresso.tipoMeia === "deficiente" && " Deficiente"}
                </p>
              )}
              
              <p>
                <strong>Preço:</strong>{" "}
                {temDesconto ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "red", marginRight: "8px" }}>
                      R$ {(precoOriginal * quantidade).toFixed(2)}
                    </span>
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      R$ {(precoFinal * quantidade).toFixed(2)}
                    </span>
                    <span style={{ color: "green", fontSize: "12px", marginLeft: "5px" }}>
                      (Economia: R$ {((precoOriginal - precoFinal) * quantidade).toFixed(2)})
                    </span>
                  </>
                ) : (
                  <>R$ {(precoOriginal * quantidade).toFixed(2)}</>
                )}
              </p>
            </div>
          );
        })}

        <div className={styles.totalContainer}>
          <h3 className={styles.totalText}>
            Total: R$ {calcularTotal().toFixed(2)}
          </h3>
        </div>
      </div>

      <div className={styles.formaPagamentoContainer}>
        <label htmlFor="formaPagamento"><strong>Forma de Pagamento:</strong></label>
        <br />
        <select
          id="formaPagamento"
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
          disabled={processando}
          className={styles.formaPagamentoSelect}
        >
          <option value="">Selecione</option>
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="credito">Cartão de Crédito</option>
          <option value="debito">Cartão de Débito</option>
        </select>
      </div>

      <div className={styles.buttonsContainer}>
        <button
          onClick={confirmarPagamento}
          disabled={processando || !formaPagamento}
          className={`${styles.btnConfirm} ${(processando || !formaPagamento) ? styles.btnConfirmDisabled : ""}`}
        >
          {processando
            ? "Processando..."
            : ingressos.length > 1
              ? `Confirmar Pagamento (${ingressos.length} ingressos)`
              : "Confirmar Pagamento"
          }
        </button>

        <button
          onClick={() => router.push("/Carrinho")}
          disabled={processando}
          className={`${styles.btnCancel} ${processando ? styles.btnCancelDisabled : ""}`}
        >
          Cancelar
        </button>
      </div>

      {msg && (
        <div
          className={`${styles.feedbackMsg} ${
            msg.toLowerCase().includes("erro")
              ? styles.feedbackMsgError
              : styles.feedbackMsgSuccess
          }`}
          style={{ marginTop: "1rem" }}
        >
          <strong>{msg}</strong>
        </div>
      )}
    </div>
  );
}

