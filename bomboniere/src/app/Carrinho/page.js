"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Carrinho() {
  const [pendencias, setPendencias] = useState([]); // ingressos pendentes
  const [lanchoneteCarrinho, setLanchoneteCarrinho] = useState([]); // produtos da lanchonete
  const [loading, setLoading] = useState(true);
  const [cartazes, setCartazes] = useState([]);
  const [ingressosSelecionados, setIngressosSelecionados] = useState(new Set());
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    carregarDadosUsuario();
    carregarCartazes();
  }, []);

  useEffect(() => {
    if (dadosUsuario) {
      buscarPendencias();
      carregarLanchoneteCarrinho();
    }
  }, [dadosUsuario]);

  function carregarDadosUsuario() {
    try {
      const dadosUsuarioLogado = localStorage.getItem("dadosUsuarioLogado");
      if (dadosUsuarioLogado) {
        const dados = JSON.parse(dadosUsuarioLogado);
        setDadosUsuario(dados);
        console.log("Dados usuário do localStorage:", dados);
      } else {
        const user = auth.currentUser;
        if (user) {
          const dados = {
            uid: user.uid,
            email: user.email,
            nome: user.email,
            estudante: false,
            deficiente: false,
            funcionario: false,
          };
          setDadosUsuario(dados);
          console.log("Dados usuário do Firebase Auth:", dados);
        } else {
          console.log("Usuário não está logado");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }

  async function carregarLanchoneteCarrinho() {
    try {
      if (!dadosUsuario?.uid) {
        console.log("carregarLanchoneteCarrinho: usuário sem uid");
        setLanchoneteCarrinho([]);
        return;
      }

      console.log("Carregando pedidos lanchonete do Firestore para usuário:", dadosUsuario.uid);

      const pedidosFirestore = [];
      const q = query(
        collection(db, "pedidosLanchonete"),
        where("pago", "==", false),
        where("usuarioId", "==", dadosUsuario.uid)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((docu) => {
        console.log("Pedido Firestore:", docu.id, docu.data());
        const pedidoData = docu.data();
        
        // Se o pedido tem array de itens, processa cada item individualmente
        if (pedidoData.itens && Array.isArray(pedidoData.itens)) {
          pedidoData.itens.forEach((item, index) => {
            pedidosFirestore.push({
              id: `${docu.id}-${index}`, // ID único para cada item
              pedidoId: docu.id, // ID do pedido original
              ...item,
              origem: "firestore",
              // Dados do pedido para contexto
              dataPedido: pedidoData.dataCompra,
              emailUsuario: pedidoData.email,
              nomeUsuario: pedidoData.nome
            });
          });
        } else {
          // Se não tem array de itens, trata como item único
          pedidosFirestore.push({ 
            id: docu.id, 
            ...pedidoData, 
            origem: "firestore" 
          });
        }
      });

      const dadosLocalStorageRaw = localStorage.getItem("cartData");
      console.log("Dados locais (raw):", dadosLocalStorageRaw);

      let pedidosLocal = [];
      if (dadosLocalStorageRaw) {
        const dadosLocalStorage = JSON.parse(dadosLocalStorageRaw);
        if (dadosLocalStorage && Array.isArray(dadosLocalStorage.cart)) {
          pedidosLocal = dadosLocalStorage.cart.map((item, index) => ({
            ...item,
            localIndex: index,
            origem: "local",
          }));
          console.log("Pedidos locais parseados:", pedidosLocal);
        } else {
          console.log("Não há array 'cart' no localStorage cartData.");
        }
      } else {
        console.log("Não existe cartData no localStorage.");
      }

      const carrinhoCompleto = [...pedidosFirestore, ...pedidosLocal];
      setLanchoneteCarrinho(carrinhoCompleto);
      console.log("Carrinho completo montado:", carrinhoCompleto);
    } catch (error) {
      console.error("Erro ao carregar pedidos da lanchonete:", error);
    }
  }

  async function buscarPendencias() {
    setLoading(true);
    try {
      let q;
      if (dadosUsuario?.uid) {
        q = query(
          collection(db, "ingressos"),
          where("pago", "==", false),
          where("usuarioId", "==", dadosUsuario.uid)
        );
      } else {
        q = query(collection(db, "ingressos"), where("pago", "==", false));
      }

      const querySnapshot = await getDocs(q);
      const dados = [];

      for (const docu of querySnapshot.docs) {
        const ingressoData = docu.data();

        let usuarioData = null;
        if (ingressoData.usuarioId) {
          const userDocRef = doc(db, "usuarios", ingressoData.usuarioId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            usuarioData = userDocSnap.data();
          }
        }

        dados.push({
          id: docu.id,
          ...ingressoData,
          usuarioData,
        });
      }

      setPendencias(dados);
    } catch (error) {
      console.error("Erro ao buscar pendências:", error);
      alert("Erro ao carregar pendências");
    }
    setLoading(false);
  }

  async function carregarCartazes() {
    try {
      const filmesCol = collection(db, "filmes");
      const filmesSnapshot = await getDocs(filmesCol);

      const cartazesData = [];

      filmesSnapshot.forEach((docu) => {
        const data = docu.data();
        cartazesData.push({
          filme: data.nome || data.titulo || "",
          cartaz: data.cartaz || "/placeholder.png",
        });
      });

      setCartazes(cartazesData);
    } catch (error) {
      console.error("Erro ao carregar cartazes do Firestore:", error);
    }
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

    return (
      dateObj.toLocaleDateString("pt-BR") +
      " " +
      dateObj.toLocaleTimeString("pt-BR")
    );
  }

  function getImagem(filmeNome) {
    const item = cartazes.find((c) => c.filme === filmeNome);
    if (item) return item.cartaz;
    return "/placeholder.png";
  }

  async function apagarPendencia(id) {
    if (!confirm("Deseja realmente apagar essa pendência?")) return;
    try {
      await deleteDoc(doc(db, "ingressos", id));
      alert("Pendência apagada.");

      const ultimaCompra = localStorage.getItem("ultimaCompra");
      if (ultimaCompra) {
        try {
          const compra = JSON.parse(ultimaCompra);
          if (compra.id === id) {
            localStorage.removeItem("ultimaCompra");
          }
        } catch (error) {
          console.error("Erro ao atualizar localStorage:", error);
        }
      }

      buscarPendencias();
    } catch (error) {
      console.error("Erro ao apagar pendência:", error);
      alert("Erro ao apagar pendência.");
    }
  }

  async function apagarItemLanchonete(idx) {
    if (!confirm("Deseja realmente excluir este item da lanchonete?")) return;

    const item = lanchoneteCarrinho[idx];
    const novoCarrinho = [...lanchoneteCarrinho];
    novoCarrinho.splice(idx, 1);
    setLanchoneteCarrinho(novoCarrinho);

    if (item.origem === "local") {
      try {
        const cartDataRaw = localStorage.getItem("cartData");
        if (cartDataRaw) {
          const cartData = JSON.parse(cartDataRaw);
          cartData.cart.splice(item.localIndex, 1);
          localStorage.setItem("cartData", JSON.stringify(cartData));
        }
      } catch (error) {
        console.error("Erro ao excluir item local:", error);
      }
    } else if (item.origem === "firestore") {
      try {
        // Se o item tem pedidoId, significa que é parte de um pedido com múltiplos itens
        if (item.pedidoId) {
          // Aqui você pode implementar lógica para remover apenas este item do pedido
          // Por enquanto, vamos apenas avisar que o item foi removido localmente
          console.log("Item removido localmente. Para remover permanentemente, implemente lógica específica.");
          alert("Item removido do carrinho. Para remover permanentemente do pedido, será necessário lógica adicional.");
        } else if (item.id) {
          // Se é um pedido individual, remove completamente
          await deleteDoc(doc(db, "pedidosLanchonete", item.id));
          console.log("Pedido excluído do Firestore:", item.id);
        }
      } catch (error) {
        console.error("Erro ao excluir item do Firestore:", error);
      }
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
      setIngressosSelecionados(new Set());
    } else {
      setIngressosSelecionados(new Set(pendencias.map((p) => p.id)));
    }
  }

  function calcularSubtotalIngressos(ids = null) {
    const itensParaCalcular = ids
      ? pendencias.filter((item) => ids.has(item.id))
      : pendencias;

    return itensParaCalcular.reduce((acc, item) => {
      const preco =
        parseFloat(
          item.precoTotal ??
            item.precoDesconto ??
            item.precoUnitario ??
            item.preco
        ) || 0;
      return acc + preco;
    }, 0);
  }

  function calcularSubtotalLanchonete() {
    return lanchoneteCarrinho.reduce((acc, item) => {
      const preco = parseFloat(item.precoTotal || item.price || item.preco || item.valor || 0);
      return acc + preco;
    }, 0);
  }

  function calcularTotalCompleto(idsSelecionados = null) {
    const ingressosTotal = calcularSubtotalIngressos(idsSelecionados);
    const lanchoneteTotal = calcularSubtotalLanchonete();
    return ingressosTotal + lanchoneteTotal;
  }

  function limparDadosLocais() {
    localStorage.removeItem("ultimaCompra");
    localStorage.removeItem("infoCompra");
    localStorage.removeItem("ingressoParaPagamento");
    localStorage.removeItem("ingressosParaPagamento");
    alert("Dados locais limpos!");
  }

  if (loading)
    return <p className={styles.loadingMessage}>Carregando pendências...</p>;

  return (
    <div className={styles.container}>
      <Link href="/EmCartaz">Voltar</Link>

      {dadosUsuario &&
        (dadosUsuario.estudante ||
          dadosUsuario.deficiente ||
          dadosUsuario.funcionario) && (
          <div className={styles.descontoInfo}>
            <p>✨ Você tem descontos especiais disponíveis!</p>
          </div>
        )}

      <h1>Ingressos Pendentes</h1>

      {pendencias.length === 0 && (
        <div>
          <p>Não há pendências no momento.</p>
          {dadosUsuario && (
            <p>
              Você pode continuar comprando ingressos e eles aparecerão aqui
              até serem pagos.
            </p>
          )}
        </div>
      )}

      {pendencias.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={selecionarTodos}
            className={
              ingressosSelecionados.size === pendencias.length
                ? styles.btnCancel
                : styles.btnPrimary
            }
          >
            {ingressosSelecionados.size === pendencias.length
              ? "Desmarcar Todos"
              : "Selecionar Todos"}
          </button>

          {ingressosSelecionados.size > 0 && (
            <span style={{ color: "#666", marginLeft: 10 }}>
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
                <strong>Preço Unitário:</strong>{" "}
                {`R$ ${(parseFloat(item.precoUnitario ?? item.preco) || 0).toFixed(
                  2
                )}`}{" "}
                <br />

                {item.precoTotal && (
                  <>
                    <strong>Preço Total:</strong>{" "}
                    {item.desconto && item.desconto > 0 ? (
                      <>
                        <span
                          style={{ textDecoration: "line-through", color: "gray" }}
                        >
                          {`R$ ${(
                            parseFloat(item.precoTotal) /
                            (1 - item.desconto / 100)
                          ).toFixed(2)}`}
                        </span>{" "}
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          {`R$ ${parseFloat(item.precoTotal).toFixed(2)}`}
                        </span>
                        <br />
                      </>
                    ) : (
                      <>
                        {`R$ ${parseFloat(item.precoTotal).toFixed(2)}`} <br />
                      </>
                    )}
                  </>
                )}

                <strong>Para a sessão em:</strong>{" "}
                {item.dataSessao
                  ? formatarDataTimestamp(item.dataSessao)
                  : item.dataCompra
                  ? formatarDataTimestamp(item.dataCompra)
                  : "Indefinido"}{" "}
                <br />
                <strong>Assentos:</strong> {item.assentos?.join(", ") || "Nenhum"}{" "}
                <br />
                <strong>Status:</strong> {item.pago ? "Pago" : "Pendente"}
              </p>

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    localStorage.setItem("ingressoParaPagamento", JSON.stringify(item));
                    router.push(`/Pagamento?id=${item.id}`);
                  }}
                  className={styles.btnConfirm}
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

      {lanchoneteCarrinho.length > 0 && (
        <>
          <h2>Produtos no Carrinho da Lanchonete</h2>
          <ul className={styles.lista}>
            {lanchoneteCarrinho.map((item, idx) => (
              <li key={item.id || idx} className={styles.pendenciaItem}>
                <div className={styles.descricao}>
                  <p>
                    <strong>Produto:</strong> {item.item || item.nome || item.produto || item.title || "Produto não identificado"} <br />
                    <strong>Tamanho:</strong> {item.tamanho || item.size || item.categoria || "Não especificado"} <br />
                    <strong>Quantidade:</strong> {item.quantidade || item.qtd || item.qty || 1} <br />
                    <strong>Preço Unitário:</strong> R$ {parseFloat(item.precoUnitario || item.preco || item.valor || 0).toFixed(2)} <br />
                    <strong>Preço Total:</strong> R$ {parseFloat(item.precoTotal || item.price || item.preco || item.valor || 0).toFixed(2)}
                    {item.dataPedido && (
                      <>
                        <br />
                        <strong>Data do Pedido:</strong> {formatarDataTimestamp(item.dataPedido)}
                      </>
                    )}
                  </p>

                  {/* Debug - Área de desenvolvimento para ver todos os campos */}
                  {process.env.NODE_ENV === "development" && (
                    <details style={{ marginTop: 10, fontSize: "12px", color: "#666" }}>
                      <summary>Debug - Dados do item</summary>
                      <pre>{JSON.stringify(item, null, 2)}</pre>
                    </details>
                  )}

                  <button
                    className={styles.botaoExcluir}
                    onClick={() => apagarItemLanchonete(idx)}
                    style={{ marginTop: 10 }}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {(pendencias.length > 0 || lanchoneteCarrinho.length > 0) && (
        <div className={styles.resumoCompra}>
          <h3>
            Subtotal Ingressos (Selecionados): R${" "}
            {calcularSubtotalIngressos(ingressosSelecionados).toFixed(2)}
          </h3>
          <h3>
            Total Produtos Lanchonete: R$ {calcularSubtotalLanchonete().toFixed(2)}
          </h3>
          <h2>
            <strong>
              Total a Pagar (Ingressos + Lanchonete): R${" "}
              {calcularTotalCompleto(ingressosSelecionados).toFixed(2)}
            </strong>
          </h2>
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0" }}>
          <p>
            <small>Área de desenvolvimento:</small>
          </p>
          <button onClick={limparDadosLocais} className={styles.btnCancel}>
            Limpar Dados Locais
          </button>
        </div>
      )}
    </div>
  );
}