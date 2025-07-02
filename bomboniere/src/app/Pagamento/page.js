"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Carrinho() {
  const [ingressos, setIngressos] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchIngressos() {
      try {
        setLoading(true);
        setError(null);

        const userId = localStorage.getItem("userUID");
        if (!userId) {
          setError("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
          return;
        }

        // Buscar dados do usuário
        const usuarioDoc = await getDoc(doc(db, "usuarios", userId));
        if (usuarioDoc.exists()) {
          setUsuario(usuarioDoc.data());
        } else {
          setError("Dados do usuário não encontrados.");
          setLoading(false);
          return;
        }

        // Buscar ingressos pendentes do usuário usando query (mais eficiente)
        const q = query(
          collection(db, "ingressos"),
          where("userId", "==", userId),
          where("status", "==", "pendente")
        );
        
        const snapshot = await getDocs(q);
        const pendentes = [];

        snapshot.forEach((docu) => {
          const dados = docu.data();
          pendentes.push({ id: docu.id, ...dados });
        });

        // Calcular preços com lógica de meia-entrada
        const comPreco = pendentes.map((item) => {
          const dataNasc = item.dataNascimento || usuarioDoc.data()?.dataNascimento;
          const tipoMeia = item.tipoMeia || usuarioDoc.data()?.tipoMeia;
          const idade = dataNasc ? calcularIdade(dataNasc) : null;
          
          const ehMeia =
            item.tipo === "ingresso" &&
            ((idade !== null && ((idade < 18) || (idade > 65))) ||
              tipoMeia === "estudante" ||
              tipoMeia === "deficiente");

          const precoBase = item.precoDesconto || item.preco || 0;
          const precoFinal = ehMeia ? precoBase / 2 : precoBase;

          return {
            ...item,
            precoFinal,
            ehMeia,
            idade
          };
        });

        setIngressos(comPreco);

        // Calcular subtotal
        const soma = comPreco.reduce((acc, curr) => acc + curr.precoFinal, 0);
        setSubtotal(soma);

      } catch (error) {
        console.error("Erro ao buscar ingressos:", error);
        setError("Erro ao carregar os ingressos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    fetchIngressos();
  }, []);

  function calcularIdade(dataNascimentoStr) {
    try {
      const hoje = new Date();
      const [ano, mes, dia] = dataNascimentoStr.split("-").map(Number);
      const nascimento = new Date(ano, mes - 1, dia);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      return idade;
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      return null;
    }
  }

  async function pagarIngresso(id) {
    try {
      await updateDoc(doc(db, "ingressos", id), {
        status: "pago",
        dataPagamento: new Date().toISOString()
      });
      
      // Atualizar lista local ao invés de refresh da página
      setIngressos(prev => prev.filter(ing => ing.id !== id));
      
      // Recalcular subtotal
      const novosIngressos = ingressos.filter(ing => ing.id !== id);
      const novoSubtotal = novosIngressos.reduce((acc, curr) => acc + curr.precoFinal, 0);
      setSubtotal(novoSubtotal);
      
    } catch (error) {
      console.error("Erro ao pagar ingresso:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    }
  }

  async function excluirIngresso(id) {
    try {
      await deleteDoc(doc(db, "ingressos", id));
      
      // Atualizar lista local
      setIngressos(prev => prev.filter(ing => ing.id !== id));
      
      // Recalcular subtotal
      const novosIngressos = ingressos.filter(ing => ing.id !== id);
      const novoSubtotal = novosIngressos.reduce((acc, curr) => acc + curr.precoFinal, 0);
      setSubtotal(novoSubtotal);
      
    } catch (error) {
      console.error("Erro ao excluir ingresso:", error);
      setError("Erro ao excluir ingresso. Tente novamente.");
    }
  }

  async function pagarTodos() {
    try {
      setLoading(true);
      
      // Usar Promise.all para pagar todos simultaneamente
      await Promise.all(
        ingressos.map(ing => 
          updateDoc(doc(db, "ingressos", ing.id), {
            status: "pago",
            dataPagamento: new Date().toISOString()
          })
        )
      );
      
      // Limpar lista local
      setIngressos([]);
      setSubtotal(0);
      
    } catch (error) {
      console.error("Erro ao pagar todos os ingressos:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: 20, background: "#000", color: "#fff", textAlign: "center" }}>
        <h2>Carregando...</h2>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: 20, background: "#000", color: "#fff" }}>
        <button onClick={() => router.back()} style={{ marginBottom: 10 }}>
          Voltar
        </button>
        <div style={{ color: "red", textAlign: "center" }}>
          <h3>Erro</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: "#1976d2", color: "#fff", padding: "10px 20px" }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: "#000", color: "#fff" }}>
      <button onClick={() => router.back()} style={{ marginBottom: 10 }}>
        Voltar
      </button>
      
      <h1>Ingressos Pendentes</h1>
      
      {ingressos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <h3>Nenhum ingresso pendente encontrado</h3>
          <p>Todos os seus ingressos foram pagos ou você ainda não fez nenhuma compra.</p>
        </div>
      ) : (
        <>
          {ingressos.map((ingresso) => (
            <div key={ingresso.id} style={{ 
              marginBottom: 30, 
              border: "1px solid #333", 
              padding: 15, 
              borderRadius: 8 
            }}>
              {ingresso.cartaz && (
                <Image
                  src={ingresso.cartaz}
                  alt={ingresso.nome}
                  width={150}
                  height={220}
                  style={{ marginBottom: 10 }}
                />
              )}
              <p><strong>Filme:</strong> {ingresso.nome}</p>
              <p><strong>Quantidade:</strong> 1</p>
              
              {/* Mostrar se é meia-entrada */}
              {ingresso.ehMeia && (
                <p style={{ color: "lightgreen" }}>
                  <strong>🎫 Meia-entrada aplicada</strong>
                  {ingresso.idade && ` (${ingresso.idade} anos)`}
                </p>
              )}
              
              <p>
                <strong>Preço:</strong>{" "}
                {ingresso.precoDesconto ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "gray" }}>
                      R$ {ingresso.preco.toFixed(2)}
                    </span>{" "}
                    <span style={{ color: "lightgreen" }}>
                      R$ {ingresso.precoFinal.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>R$ {ingresso.precoFinal.toFixed(2)}</>
                )}
              </p>
              
              <p>
                <strong>Para a sessão em:</strong>{" "}
                {new Date(ingresso.dataHora).toLocaleString('pt-BR')}
              </p>
              
              <p><strong>Assentos:</strong> {ingresso.assentos?.join(", ") || "Não informado"}</p>
              <p><strong>Status:</strong> <span style={{ color: "orange" }}>{ingresso.status}</span></p>
              
              <div style={{ marginTop: 15 }}>
                <button
                  style={{ 
                    background: "green", 
                    color: "#fff", 
                    marginRight: 10,
                    padding: "8px 15px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                  onClick={() => pagarIngresso(ingresso.id)}
                >
                  Pagar Este
                </button>
                <button
                  style={{ 
                    background: "#444", 
                    color: "#fff",
                    padding: "8px 15px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                  onClick={() => excluirIngresso(ingresso.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          <div style={{
            background: "#fff",
            color: "#000",
            padding: 20,
            borderRadius: 10,
            maxWidth: 400,
            marginTop: 30
          }}>
            <h3>Subtotal Total: R$ {subtotal.toFixed(2)}</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: 15 }}>
              {ingressos.length} ingresso{ingressos.length > 1 ? 's' : ''} pendente{ingressos.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={pagarTodos}
              disabled={loading}
              style={{
                background: loading ? "#ccc" : "#1976d2",
                color: "#fff",
                border: "none",
                padding: "12px 25px",
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: 6,
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              {loading ? "PROCESSANDO..." : "PAGAR TODOS"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}