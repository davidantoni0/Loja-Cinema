"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Carrinho() {
  const [ingressos, setIngressos] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [usuario, setUsuario] = useState(null); // dados do Firestore
  const [dadosUsuarioLocal, setDadosUsuarioLocal] = useState(null); // dados do localStorage
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchIngressos() {
      try {
        setLoading(true);
        setError(null);

        // Pega UID do localStorage
        const userId = localStorage.getItem("userUID");
        if (!userId) {
          setError("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
          return;
        }

        // Pega dados pessoais do localStorage
        const dadosUsuarioStr = localStorage.getItem("dadosUsuarioLogado");
        let dadosUsuarioLS = null;
        if (dadosUsuarioStr) {
          try {
            dadosUsuarioLS = JSON.parse(dadosUsuarioStr);
          } catch {
            dadosUsuarioLS = null;
          }
        }
        setDadosUsuarioLocal(dadosUsuarioLS);

        // Buscar dados completos do usuário no Firestore
        const usuarioDoc = await getDoc(doc(db, "usuarios", userId));
        if (usuarioDoc.exists()) {
          setUsuario(usuarioDoc.data());
        } else {
          setError("Dados do usuário não encontrados.");
          setLoading(false);
          return;
        }

        // Buscar ingressos pendentes do usuário
        const q = query(
          collection(db, "ingressos"),
          where("usuarioId", "==", userId),
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
          // dataNascimento vem, em ordem de prioridade, de:
          // 1) item.dataNascimento (do ingresso)
          // 2) dadosUsuarioLocal.dataNascimento (camelCase, do localStorage)
          // 3) usuarioDoc.data().data_nascimento (underscore, do Firestore)
          const dataNasc =
            item.dataNascimento ||
            dadosUsuarioLS?.dataNascimento ||
            usuarioDoc.data()?.data_nascimento ||
            null;

          // tipoMeia é boolean ou string, vindo de:
          // 1) item.tipoMeia (do ingresso)
          // 2) dadosUsuarioLocal.estudante ou deficiente (booleanos)
          // 3) usuarioDoc.data().estudante ou deficiencia (do Firestore)
          // Ajuste para booleano combinando os campos
          const tipoMeia =
            item.tipoMeia ||
            dadosUsuarioLS?.estudante === true ||
            dadosUsuarioLS?.deficiente === true ||
            usuarioDoc.data()?.estudante === true ||
            usuarioDoc.data()?.deficiencia === true ||
            false;

          // Função para calcular idade
          const idade = dataNasc ? calcularIdade(dataNasc) : null;

          // Regra meia-entrada (só para ingressos do tipo 'ingresso')
          const ehMeia =
            item.tipo === "ingresso" &&
            ((idade !== null && (idade < 18 || idade > 65)) || tipoMeia === true);

          // preço final (usar precoDesconto se existir, senão preco normal)
          const precoBase = item.precoDesconto || item.preco || 0;
          const precoFinal = ehMeia ? precoBase / 2 : precoBase;

          return {
            ...item,
            precoFinal,
            ehMeia,
            idade,
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
        dataPagamento: new Date().toISOString(),
      });

      setIngressos((prev) => prev.filter((ing) => ing.id !== id));

      const novosIngressos = ingressos.filter((ing) => ing.id !== id);
      const novoSubtotal = novosIngressos.reduce(
        (acc, curr) => acc + curr.precoFinal,
        0
      );
      setSubtotal(novoSubtotal);
    } catch (error) {
      console.error("Erro ao pagar ingresso:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    }
  }

  async function excluirIngresso(id) {
    try {
      await deleteDoc(doc(db, "ingressos", id));

      setIngressos((prev) => prev.filter((ing) => ing.id !== id));

      const novosIngressos = ingressos.filter((ing) => ing.id !== id);
      const novoSubtotal = novosIngressos.reduce(
        (acc, curr) => acc + curr.precoFinal,
        0
      );
      setSubtotal(novoSubtotal);
    } catch (error) {
      console.error("Erro ao excluir ingresso:", error);
      setError("Erro ao excluir ingresso. Tente novamente.");
    }
  }

  async function pagarTodos() {
    try {
      setLoading(true);

      await Promise.all(
        ingressos.map((ing) =>
          updateDoc(doc(db, "ingressos", ing.id), {
            status: "pago",
            dataPagamento: new Date().toISOString(),
          })
        )
      );

      setIngressos([]);
      setSubtotal(0);
    } catch (error) {
      console.error("Erro ao pagar todos os ingressos:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          background: "#000",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h2>Carregando...</h2>
      </div>
    );
  }

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
            style={{
              background: "#1976d2",
              color: "#fff",
              padding: "10px 20px",
            }}
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
          <p>
            Todos os seus ingressos foram pagos ou você ainda não fez nenhuma
            compra.
          </p>
        </div>
      ) : (
        <>
          {ingressos.map((ingresso) => (
            <div
              key={ingresso.id}
              style={{
                marginBottom: 30,
                border: "1px solid #333",
                padding: 15,
                borderRadius: 8,
              }}
            >
              {ingresso.cartaz && (
                <Image
                  src={ingresso.cartaz}
                  alt={ingresso.nome}
                  width={150}
                  height={220}
                  style={{ marginBottom: 10 }}
                />
              )}
              <p>
                <strong>Filme:</strong> {ingresso.nome}
              </p>
              <p>
                <strong>Quantidade:</strong> 1
              </p>

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
                    <span
                      style={{ textDecoration: "line-through", color: "gray" }}
                    >
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
                {ingresso.dataHora
                  ? new Date(ingresso.dataHora).toLocaleString("pt-BR")
                  : "Não informado"}
              </p>

              <p>
                <strong>Assentos:</strong>{" "}
                {ingresso.assentos?.join(", ") || "Não informado"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span style={{ color: "orange" }}>{ingresso.status}</span>
              </p>

              <div style={{ marginTop: 15 }}>
                <button
                  style={{
                    background: "green",
                    color: "#fff",
                    marginRight: 10,
                    padding: "8px 15px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
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
                    cursor: "pointer",
                  }}
                  onClick={() => excluirIngresso(ingresso.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          <div
            style={{
              background: "#fff",
              color: "#000",
              padding: 20,
              borderRadius: 10,
              maxWidth: 400,
              marginTop: 30,
            }}
          >
            <h3>Subtotal Total: R$ {subtotal.toFixed(2)}</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: 15 }}>
              {ingressos.length} ingresso{ingressos.length > 1 ? "s" : ""}{" "}
              pendente{ingressos.length > 1 ? "s" : ""}
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
                fontWeight: "bold",
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