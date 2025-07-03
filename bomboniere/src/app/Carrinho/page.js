/*"use client";

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
  updateDoc,
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
      } else {
        const user = auth.currentUser;
        if (user) {
          setDadosUsuario({
            uid: user.uid,
            email: user.email,
            nome: user.email,
            estudante: false,
            deficiente: false,
            funcionario: false,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }

  async function carregarLanchoneteCarrinho() {
    try {
      if (!dadosUsuario?.uid) {
        setLanchoneteCarrinho([]);
        return;
      }

      const pedidosFirestore = [];
      const q = query(
        collection(db, "pedidosLanchonete"),
        where("pago", "==", false),
        where("usuarioId", "==", dadosUsuario.uid)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((docu) => {
        const pedidoData = docu.data();

        if (pedidoData.itens && Array.isArray(pedidoData.itens)) {
          pedidoData.itens.forEach((item, index) => {
            pedidosFirestore.push({
              id: `${docu.id}-${index}`,
              pedidoId: docu.id,
              ...item,
              origem: "firestore",
              dataPedido: pedidoData.dataCompra,
            });
          });
        } else {
          pedidosFirestore.push({
            id: docu.id,
            ...pedidoData,
            origem: "firestore",
          });
        }
      });

      const dadosLocalStorageRaw = localStorage.getItem("cartData");
      let pedidosLocal = [];
      if (dadosLocalStorageRaw) {
        const dadosLocalStorage = JSON.parse(dadosLocalStorageRaw);
        if (dadosLocalStorage && Array.isArray(dadosLocalStorage.cart)) {
          pedidosLocal = dadosLocalStorage.cart.map((item, index) => ({
            ...item,
            localIndex: index,
            origem: "local",
          }));
        }
      }

      const carrinhoCompleto = [...pedidosFirestore, ...pedidosLocal];
      setLanchoneteCarrinho(carrinhoCompleto);
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
        if (item.pedidoId) {
          alert("Remoção parcial de itens do pedido ainda não implementada.");
        } else if (item.id) {
          await deleteDoc(doc(db, "pedidosLanchonete", item.id));
        }
      } catch (error) {
        console.error("Erro ao excluir item do Firestore:", error);
      }
    }
  }

  // Função para alterar quantidade de item da lanchonete
  function alterarQuantidadeLanchonete(idx, delta) {
    const novoCarrinho = [...lanchoneteCarrinho];
    const item = novoCarrinho[idx];
    if (!item) return;

    const qtdAtual = item.quantidade ?? item.qtd ?? item.qty ?? 1;
    const novaQtd = qtdAtual + delta;

    if (novaQtd < 1) return; // evita quantidade menor que 1

    // Atualiza quantidade e recalcula preçoTotal se possível
    item.quantidade = novaQtd;

    // Se tiver precoUnitario ou preco, atualiza precoTotal
    const precoUnitario = parseFloat(item.precoUnitario || item.preco || item.valor || item.price || 0);
    if (!isNaN(precoUnitario)) {
      item.precoTotal = precoUnitario * novaQtd;
    }

    setLanchoneteCarrinho(novoCarrinho);

    // Atualiza localStorage se item for local
    if (item.origem === "local") {
      try {
        const cartDataRaw = localStorage.getItem("cartData");
        if (cartDataRaw) {
          const cartData = JSON.parse(cartDataRaw);
          if (cartData.cart && Array.isArray(cartData.cart)) {
            const localIndex = item.localIndex ?? idx;
            cartData.cart[localIndex].quantidade = novaQtd;
            cartData.cart[localIndex].precoTotal = item.precoTotal;
            localStorage.setItem("cartData", JSON.stringify(cartData));
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar quantidade local:", error);
      }
    } else if (item.origem === "firestore") {
      // Opcional: pode atualizar no Firestore aqui, mas cuidado para não dar muitos writes
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
          item.precoTotal ?? item.precoDesconto ?? item.precoUnitario ?? item.preco
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

  function handlePagamento() {
    // Envia todos os ingressos pendentes + itens da lanchonete para pagamento
    const ingressosParaPagamento = pendencias;
    localStorage.setItem("ingressosParaPagamento", JSON.stringify(ingressosParaPagamento));
    localStorage.setItem("lanchoneteParaPagamento", JSON.stringify(lanchoneteCarrinho));
    router.push("/Pagamento");
  }

  if (loading) return <p className={styles.loadingMessage}>Carregando pendências...</p>;

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
              Você pode continuar comprando ingressos e eles aparecerão aqui até
              serem pagos.
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
                {`R$ ${(parseFloat(item.precoUnitario ?? item.preco) || 0).toFixed(2)}`}{" "}
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
                    localStorage.setItem(
                      "ingressoParaPagamento",
                      JSON.stringify(item)
                    );
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
                    <strong>Produto:</strong>{" "}
                    {item.item || item.nome || item.produto || item.title || "Produto não identificado"}{" "}
                    <br />
                    <strong>Tamanho:</strong> {item.tamanho || item.size || item.categoria || "Não especificado"}{" "}
                    <br />
                    <strong>Quantidade:</strong>{" "}
                    <button
                      onClick={() => alterarQuantidadeLanchonete(idx, -1)}
                      className={styles.btnQuantidade}
                      aria-label="Diminuir quantidade"
                    >
                      –
                    </button>
                    {" "}
                    {item.quantidade || item.qtd || item.qty || 1}{" "}
                    <button
                      onClick={() => alterarQuantidadeLanchonete(idx, 1)}
                      className={styles.btnQuantidade}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                    <br />
                    <strong>Preço Unitário:</strong> R${" "}
                    {parseFloat(item.precoUnitario || item.preco || item.valor || 0).toFixed(2)}{" "}
                    <br />
                    <strong>Preço Total:</strong> R${" "}
                    {parseFloat(item.precoTotal || item.price || item.preco || item.valor || 0).toFixed(2)}
                    {item.dataPedido && (
                      <>
                        <br />
                        <strong>Data do Pedido:</strong>{" "}
                        {formatarDataTimestamp(item.dataPedido)}
                      </>
                    )}
                  </p>

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
            Total Produtos Lanchonete: R${calcularSubtotalLanchonete().toFixed(2)}
          </h3>
          <h2>
            <strong>
              Total a Pagar (Ingressos + Lanchonete): R${" "}
              {calcularTotalCompleto(ingressosSelecionados).toFixed(2)}
            </strong>
          </h2>

          <button onClick={handlePagamento} className={styles.btnConfirm}>
            Realizar Pagamento
          </button>
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
*/


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
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Carrinho() {
  const [pendencias, setPendencias] = useState([]);
  const [lanchoneteCarrinho, setLanchoneteCarrinho] = useState([]);
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
        setDadosUsuario(JSON.parse(dadosUsuarioLogado));
      } else {
        const user = auth.currentUser;
        if (user) {
          setDadosUsuario({
            uid: user.uid,
            email: user.email,
            nome: user.email,
            estudante: false,
            deficiente: false,
            funcionario: false,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }

  async function carregarCartazes() {
    try {
      const snapshot = await getDocs(collection(db, "filmes"));
      const cartazesData = snapshot.docs.map((docu) => {
        const data = docu.data();
        return {
          filme: data.nome || data.titulo || "",
          cartaz: data.cartaz || "/placeholder.png",
        };
      });
      setCartazes(cartazesData);
    } catch (error) {
      console.error("Erro ao carregar cartazes:", error);
    }
  }

  async function buscarPendencias() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "ingressos"),
        where("pago", "==", false),
        where("usuarioId", "==", dadosUsuario.uid)
      );
      const snapshot = await getDocs(q);
      const dados = [];

      for (const docu of snapshot.docs) {
        const ingresso = docu.data();
        let usuarioData = null;
        if (ingresso.usuarioId) {
          const userDocSnap = await getDoc(doc(db, "usuarios", ingresso.usuarioId));
          if (userDocSnap.exists()) usuarioData = userDocSnap.data();
        }

        dados.push({
          id: docu.id,
          ...ingresso,
          usuarioData,
        });
      }

      setPendencias(dados);
    } catch (error) {
      console.error("Erro ao buscar pendências:", error);
    }
    setLoading(false);
  }

  async function carregarLanchoneteCarrinho() {
    try {
      if (!dadosUsuario?.uid) return;

      const q = query(
        collection(db, "pedidosLanchonete"),
        where("pago", "==", false),
        where("usuarioId", "==", dadosUsuario.uid)
      );
      const snapshot = await getDocs(q);
      const pedidos = [];

      snapshot.forEach((docu) => {
        const pedidoData = docu.data();
        if (pedidoData.itens) {
          pedidoData.itens.forEach((item, index) => {
            pedidos.push({
              id: `${docu.id}-${index}`,
              pedidoId: docu.id,
              ...item,
              origem: "firestore",
              dataPedido: pedidoData.dataCompra,
            });
          });
        } else {
          pedidos.push({
            id: docu.id,
            ...pedidoData,
            origem: "firestore",
          });
        }
      });

      const localRaw = localStorage.getItem("cartData");
      const pedidosLocal = localRaw
        ? JSON.parse(localRaw).cart.map((item, index) => ({
            ...item,
            localIndex: index,
            origem: "local",
          }))
        : [];

      setLanchoneteCarrinho([...pedidos, ...pedidosLocal]);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
    }
  }

  function formatarDataTimestamp(timestamp) {
    try {
      if (!timestamp) return "Data inválida";
      const dateObj = timestamp?.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return dateObj.toLocaleDateString("pt-BR") + " " + dateObj.toLocaleTimeString("pt-BR");
    } catch {
      return "Data inválida";
    }
  }

  function getImagem(nome) {
    const c = cartazes.find((c) => c.filme === nome);
    return c ? c.cartaz : "/placeholder.png";
  }

  function alterarQuantidadeLanchonete(idx, delta) {
    const novo = [...lanchoneteCarrinho];
    const item = novo[idx];
    const qtd = (item.quantidade || 1) + delta;
    if (qtd < 1) return;
    item.quantidade = qtd;
    const unit = parseFloat(item.precoUnitario || item.preco || item.valor || 0);
    item.precoTotal = unit * qtd;
    setLanchoneteCarrinho(novo);

    if (item.origem === "local") {
      const cartDataRaw = localStorage.getItem("cartData");
      if (cartDataRaw) {
        const cartData = JSON.parse(cartDataRaw);
        cartData.cart[item.localIndex] = item;
        localStorage.setItem("cartData", JSON.stringify(cartData));
      }
    }
  }

  function calcularSubtotalIngressos() {
    return pendencias.reduce((acc, item) => {
      const preco = parseFloat(item.precoTotal || item.precoDesconto || item.precoUnitario || item.preco || 0);
      return acc + preco;
    }, 0);
  }

  function calcularSubtotalLanchonete() {
    return lanchoneteCarrinho.reduce((acc, item) => {
      const preco = parseFloat(item.precoTotal || item.preco || item.valor || 0);
      return acc + preco;
    }, 0);
  }

  async function realizarPagamentoCompleto() {
    const metodo = prompt("Escolha a forma de pagamento:\n1. Dinheiro\n2. Pix\n3. Débito\n4. Crédito");

    if (!["1", "2", "3", "4"].includes(metodo)) {
      alert("Forma de pagamento inválida.");
      return;
    }

    try {
      for (const ingresso of pendencias) {
        await updateDoc(doc(db, "ingressos", ingresso.id), {
          pago: true,
          formaPagamento: metodo,
        });
      }

      const pedidos = {};
      for (const item of lanchoneteCarrinho) {
        if (item.origem === "firestore" && item.pedidoId) {
          pedidos[item.pedidoId] = true;
        }
      }

      for (const pedidoId of Object.keys(pedidos)) {
        await updateDoc(doc(db, "pedidosLanchonete", pedidoId), {
          pago: true,
          formaPagamento: metodo,
        });
      }

      localStorage.removeItem("cartData");
      localStorage.removeItem("ingressosParaPagamento");
      localStorage.removeItem("lanchoneteParaPagamento");

      setPendencias([]);
      setLanchoneteCarrinho([]);

      alert("Pagamento confirmado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento.");
    }
  }

  if (loading) return <p>Carregando pendências...</p>;

  return (
    <div className={styles.container}>
      <Link href="/EmCartaz">Voltar</Link>
      <h1>Resumo do Carrinho</h1>

      {pendencias.map((item) => (
        <div key={item.id} className={styles.pendenciaItem}>
          <img src={getImagem(item.filme)} className={styles.imagem} />
          <div className={styles.descricao}>
            <p>
              <strong>Filme:</strong> {item.filme} <br />
              <strong>Assentos:</strong> {item.assentos?.join(", ") || "Nenhum"} <br />
              <strong>Preço:</strong> R$ {parseFloat(item.precoTotal || 0).toFixed(2)} <br />
              <strong>Data:</strong> {formatarDataTimestamp(item.dataSessao)}
            </p>
          </div>
        </div>
      ))}

      {lanchoneteCarrinho.map((item, idx) => (
        <div key={item.id || idx} className={styles.pendenciaItem}>
          <div className={styles.descricao}>
            <p>
              <strong>Produto:</strong> {item.item || item.nome} <br />
              <strong>Tamanho:</strong> {item.tamanho || "Único"} <br />
              <strong>Quantidade:</strong>{" "}
              <button onClick={() => alterarQuantidadeLanchonete(idx, -1)}>–</button>{" "}
              {item.quantidade || 1}{" "}
              <button onClick={() => alterarQuantidadeLanchonete(idx, 1)}>+</button> <br />
              <strong>Total:</strong> R$ {parseFloat(item.precoTotal || 0).toFixed(2)}
            </p>
          </div>
        </div>
      ))}

      <div className={styles.resumoCompra}>
        <h3>Subtotal Ingressos: R$ {calcularSubtotalIngressos().toFixed(2)}</h3>
        <h3>Subtotal Lanchonete: R$ {calcularSubtotalLanchonete().toFixed(2)}</h3>
        <h2>
          Total: R$ {(calcularSubtotalIngressos() + calcularSubtotalLanchonete()).toFixed(2)}
        </h2>
        <button onClick={realizarPagamentoCompleto} className={styles.btnConfirm}>
          Realizar Pagamento
        </button>
      </div>
    </div>
  );
}
