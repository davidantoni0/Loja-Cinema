"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Pagamento() {
  const searchParams = useSearchParams();
  const singleId = searchParams.get("id");
  const multipleIds = searchParams.get("ids");

  const ingressoIds = singleId 
    ? [singleId] 
    : (multipleIds ? multipleIds.split(',').filter(id => id.trim()) : []);

  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function buscarIngressos() {
      try {
        if (ingressoIds.length === 0) {
          setLoading(false);
          return;
        }

        if (!db) {
          setLoading(false);
          return;
        }

        setLoading(true);

        const ingressosData = [];

        for (const id of ingressoIds) {
          const docRef = doc(db, "ingressos", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            ingressosData.push({ id: docSnap.id, ...docSnap.data() });
          }
        }

        if (ingressosData.length === 0) {
          // Nenhum ingresso válido encontrado
        } else {
          setIngressos(ingressosData);
        }

      } catch (error) {
        setMsg(`Erro ao carregar ingressos: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    buscarIngressos();
  }, [singleId, multipleIds]);

  function formatarData(data) {
    if (!data) return "Indefinido";
    let dateObj;
    try {
      if (data.seconds !== undefined) {
        dateObj = new Date(data.seconds * 1000);
      } else {
        dateObj = new Date(data);
      }
      if (isNaN(dateObj)) return "Data inválida";
      return dateObj.toLocaleDateString("pt-BR") + " " + dateObj.toLocaleTimeString("pt-BR");
    } catch {
      return "Erro na data";
    }
  }

  function calcularTotal() {
    return ingressos.reduce((total, ingresso) => {
      const preco = ingresso.precoDesconto || ingresso.preco || 30;
      const quantidade = ingresso.quantidade || 1;
      return total + (preco * quantidade);
    }, 0);
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

      setTimeout(() => {
        window.location.href = "/Carrinho";
      }, 2000);

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
          onClick={() => window.location.href = "/Carrinho"}
          className={styles.btnPrimary}
        >
          Voltar ao Carrinho
        </button>
      </div>
    );
  }

  const total = calcularTotal();
  const ehPagamentoMultiplo = ingressos.length > 1;

  return (
    <div className={styles.container}>
      <h1>
        {ehPagamentoMultiplo
          ? `Pagamento de ${ingressos.length} Ingressos`
          : "Pagamento do Ingresso"
        }
      </h1>

      <div className={styles.resumoCompra}>
        <h3>Resumo da Compra:</h3>
        {ingressos.map((ingresso, index) => {
          const precoOriginal = ingresso.preco || 30;
          const precoDesconto = ingresso.precoDesconto || null;
          const quantidade = ingresso.quantidade || 1;

          return (
            <div
              key={ingresso.id}
              className={styles.resumoItem}
              style={index === ingressos.length - 1 ? { borderBottom: "none" } : {}}
            >
              <p><strong>Filme:</strong> {ingresso.filme}</p>
              <p><strong>Quantidade:</strong> {quantidade}</p>
              <p><strong>Sessão:</strong> {formatarData(ingresso.dataSessao)}</p>
              {ingresso.assentos && ingresso.assentos.length > 0 && (
                <p><strong>Assentos:</strong> {ingresso.assentos.join(", ")}</p>
              )}
              <p>
                <strong>Preço:</strong>{" "}
                {precoDesconto ? (
                  <>
                    <span className={styles.priceOriginal}>
                      R$ {(precoOriginal * quantidade).toFixed(2)}
                    </span>
                    <span className={styles.priceDiscount}>
                      R$ {(precoDesconto * quantidade).toFixed(2)}
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
            Total: R$ {total.toFixed(2)}
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
            : ehPagamentoMultiplo
              ? `Confirmar Pagamento (${ingressos.length} ingressos)`
              : "Confirmar Pagamento"
          }
        </button>

        <button
          onClick={() => window.location.href = "/Carrinho"}
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
        >
          <strong>{msg}</strong>
        </div>
      )}

      <button
        onClick={() => window.location.href = "/Carrinho"}
        className={styles.btnPrimary}
        style={{ marginTop: 20 }}
      >
        Voltar ao Carrinho
      </button>
    </div>
  );
}
