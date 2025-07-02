"use client";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Carrinho() {
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartazes, setCartazes] = useState([]);
  const [ingressosSelecionados, setIngressosSelecionados] = useState(new Set());
  const router = useRouter();

  useEffect(() => {
    buscarPendencias();
    carregarCartazes();
  }, []);

  async function buscarPendencias() {
    setLoading(true);
    const q = query(collection(db, "ingressos"), where("pago", "==", false));
    const querySnapshot = await getDocs(q);
    const dados = [];
    querySnapshot.forEach((docu) => {
      dados.push({ id: docu.id, ...docu.data() });
    });
    setPendencias(dados);
    setLoading(false);
  }

  async function carregarCartazes() {
    try {
      const res = await fetch("/Filmes/cartazes.json");
      const data = await res.json();
      setCartazes(data);
    } catch (error) {
      console.error("Erro ao carregar cartazes:", error);
    }
  }

  async function apagarPendencia(id) {
    if (!confirm("Deseja realmente apagar essa pendência?")) return;
    await deleteDoc(doc(db, "ingressos", id));
    alert("Pendência apagada.");
    buscarPendencias();
  }

  function formatarDataTimestamp(timestamp) {
    if (!timestamp) return "Data inválida";
    let dateObj;

    if (timestamp.seconds !== undefined) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string" || timestamp instanceof String) {
      dateObj = new Date(timestamp);
    } else if (timestamp.toDate) {
      dateObj = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else {
      return "Data inválida";
    }

    return dateObj.toLocaleDateString("pt-BR") + " " + dateObj.toLocaleTimeString("pt-BR");
  }

  function calcularSubtotal(ids = null) {
    const itensParaCalcular = ids 
      ? pendencias.filter(item => ids.has(item.id))
      : pendencias;
      
    return itensParaCalcular.reduce((acc, item) => {
      const preco = parseFloat(item.preco) || 30;
      return acc + preco * (item.quantidade || 1);
    }, 0);
  }

  function getImagem(filmeNome) {
    const item = cartazes.find((c) => c.filme === filmeNome);
    if (item) return item.cartaz;
    return "/placeholder.png";
  }

  // Função para pagar um ingresso específico
  function handlePagamentoIndividual(ingressoId) {
    console.log("Redirecionando para pagamento do ingresso:", ingressoId);
    router.push(`/Pagamento?id=${ingressoId}`);
  }

  // Função para pagar múltiplos ingressos selecionados
  function handlePagamentoSelecionados() {
    if (ingressosSelecionados.size === 0) {
      alert("Selecione pelo menos um ingresso para pagar.");
      return;
    }
    
    if (ingressosSelecionados.size === 1) {
      // Se só tem um selecionado, vai direto para pagamento individual
      const id = Array.from(ingressosSelecionados)[0];
      handlePagamentoIndividual(id);
    } else {
      // Para múltiplos ingressos, você pode criar uma página de pagamento em lote
      // ou processar um por vez
      const ids = Array.from(ingressosSelecionados).join(',');
      router.push(`/Pagamento?ids=${ids}`);
    }
  }

  // Função para pagar todos os ingressos
  function handlePagamentoTodos() {
    if (pendencias.length === 0) return;
    
    if (pendencias.length === 1) {
      handlePagamentoIndividual(pendencias[0].id);
    } else {
      const ids = pendencias.map(p => p.id).join(',');
      router.push(`/Pagamento?ids=${ids}`);
    }
  }

  function toggleSelecaoIngresso(id) {
    const novaSelecao = new Set(ingressosSelecionados);
    if (novaSelecao.has(id)) {
      novaSelecao.delete(id);
    } else {
      novaSelecao.add(id);
    }
    setIngressosSelecionados(novaSelecao);
  }

  function selecionarTodos() {
    if (ingressosSelecionados.size === pendencias.length) {
      // Se todos estão selecionados, desmarca todos
      setIngressosSelecionados(new Set());
    } else {
      // Seleciona todos
      setIngressosSelecionados(new Set(pendencias.map(p => p.id)));
    }
  }

  if (loading) return <p>Carregando pendências...</p>;

  return (
    <div className={styles.container}>
      <Link href="/EmCartaz">Voltar</Link>
      <h1>Ingressos Pendentes</h1>

      {pendencias.length === 0 && <p>Não há pendências no momento.</p>}

      {pendencias.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <button 
            onClick={selecionarTodos}
            style={{
              padding: "8px 15px",
              backgroundColor: ingressosSelecionados.size === pendencias.length ? "#f44336" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginRight: 10
            }}
          >
            {ingressosSelecionados.size === pendencias.length ? "Desmarcar Todos" : "Selecionar Todos"}
          </button>
          
          {ingressosSelecionados.size > 0 && (
            <span style={{ color: "#666" }}>
              {ingressosSelecionados.size} de {pendencias.length} selecionados
            </span>
          )}
        </div>
      )}

      <ul className={styles.lista}>
        {pendencias.map((item) => (
          <li key={item.id} className={styles.pendenciaItem}>
            {pendencias.length > 1 && (
              <input
                type="checkbox"
                checked={ingressosSelecionados.has(item.id)}
                onChange={() => toggleSelecaoIngresso(item.id)}
                style={{ marginRight: 10 }}
              />
            )}
            
            <img
              src={getImagem(item.filme || item.nome)}
              alt={item.filme || item.nome || "Imagem"}
              className={styles.imagem}
            />
            
            <div className={styles.descricao}>
              <p>
                <strong>Filme:</strong> {item.filme || item.nome} <br />
                <strong>Quantidade:</strong> {item.quantidade || 1} <br />
                <strong>Preço:</strong> R$ {(parseFloat(item.preco) || 30).toFixed(2)} <br />
                <strong>Para a sessão em:</strong>{" "}
                {item.dataSessao
                  ? formatarDataTimestamp(item.dataSessao)
                  : item.dataCompra
                  ? formatarDataTimestamp(item.dataCompra)
                  : "Indefinido"}{" "}
                <br />
                <strong>Assentos:</strong> {item.assentos?.join(", ") || "Nenhum"} <br />
                <strong>Status:</strong> {item.pago ? "Pago" : "Pendente"}
              </p>
              
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handlePagamentoIndividual(item.id)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    marginRight: 10
                  }}
                >
                  Pagar Este
                </button>
                
                <button
                  className={styles.botaoExcluir}
                  onClick={() => apagarPendencia(item.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {pendencias.length > 0 && (
        <div style={{ marginTop: 20, padding: 20, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
          {ingressosSelecionados.size > 0 ? (
            <>
              <h3>Subtotal Selecionados: R$ {calcularSubtotal(ingressosSelecionados).toFixed(2)}</h3>
              <button 
                onClick={handlePagamentoSelecionados}
                style={{
                  padding: "12px 25px",
                  backgroundColor: "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "16px",
                  marginRight: 10
                }}
              >
                PAGAR SELECIONADOS
              </button>
            </>
          ) : (
            <>
              <h3>Subtotal Total: R$ {calcularSubtotal().toFixed(2)}</h3>
              <button 
                onClick={handlePagamentoTodos}
                style={{
                  padding: "12px 25px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                PAGAR TODOS
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && pendencias.length > 0 && (
        <details style={{ marginTop: 20, fontSize: "12px", color: "#666" }}>
          <summary>Debug - IDs dos Ingressos</summary>
          <ul>
            {pendencias.map(item => (
              <li key={item.id}>
                {item.filme}: {item.id}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}