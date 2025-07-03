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
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import styles from "./page.module.css";

export default function Carrinho() {
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartazes, setCartazes] = useState([]);
  const [ingressosSelecionados, setIngressosSelecionados] = useState(new Set());
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [infoCompra, setInfoCompra] = useState(null);
  const router = useRouter();

  useEffect(() => {
    carregarDadosUsuario();
    carregarInfoCompra();
    buscarPendencias();
    carregarCartazes();
  }, []);

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

  function carregarInfoCompra() {
    try {
      const info = localStorage.getItem("infoCompra");
      if (info) {
        const dados = JSON.parse(info);
        setInfoCompra(dados);
      }
    } catch (error) {
      console.error("Erro ao carregar informações da compra:", error);
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

  useEffect(() => {
    if (dadosUsuario) {
      buscarPendencias();
    }
  }, [dadosUsuario]);

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

  function calcularSubtotal(ids = null) {
    const itensParaCalcular = ids
      ? pendencias.filter((item) => ids.has(item.id))
      : pendencias;

    return itensParaCalcular.reduce((acc, item) => {
      const preco = parseFloat(item.precoTotal ?? item.precoDesconto ?? item.preco) || 30;
      return acc + preco;
    }, 0);
  }

  function getImagem(filmeNome) {
    const item = cartazes.find((c) => c.filme === filmeNome);
    if (item) return item.cartaz;
    return "/placeholder.png";
  }

  function handlePagamentoIndividual(ingressoId) {
    const ingresso = pendencias.find((p) => p.id === ingressoId);
    if (ingresso) {
      localStorage.setItem("ingressoParaPagamento", JSON.stringify(ingresso));
    }
    router.push(`/Pagamento?id=${ingressoId}`);
  }

  function handlePagamentoSelecionados() {
    if (ingressosSelecionados.size === 0) {
      alert("Selecione pelo menos um ingresso para pagar.");
      return;
    }

    if (ingressosSelecionados.size === 1) {
      const id = Array.from(ingressosSelecionados)[0];
      handlePagamentoIndividual(id);
    } else {
      const ids = Array.from(ingressosSelecionados).join(",");
      const ingressosSelecionadosData = pendencias.filter((p) =>
        ingressosSelecionados.has(p.id)
      );
      localStorage.setItem(
        "ingressosParaPagamento",
        JSON.stringify(ingressosSelecionadosData)
      );
      router.push(`/Pagamento?ids=${ids}`);
    }
  }

  function handlePagamentoTodos() {
    if (pendencias.length === 0) return;

    if (pendencias.length === 1) {
      handlePagamentoIndividual(pendencias[0].id);
    } else {
      const ids = pendencias.map((p) => p.id).join(",");
      localStorage.setItem("ingressosParaPagamento", JSON.stringify(pendencias));
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
      setIngressosSelecionados(new Set());
    } else {
      setIngressosSelecionados(new Set(pendencias.map((p) => p.id)));
    }
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

      {/* Mensagem de descontos especiais (SEM nome e badges) }*//*
      {dadosUsuario && (dadosUsuario.estudante || dadosUsuario.deficiente || dadosUsuario.funcionario) && (
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
        {pendencias.map((item) => {
          return (
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
                  {`R$ ${(parseFloat(item.precoUnitario || item.preco) || 30).toFixed(
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
                          <span
                            style={{ color: "green", fontWeight: "bold" }}
                          >
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
                    onClick={() => handlePagamentoIndividual(item.id)}
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
          );
        })}
      </ul>

      {pendencias.length > 0 && (
        <div className={styles.resumoCompra}>
          {ingressosSelecionados.size > 0 ? (
            <>
              <h3>
                Subtotal Selecionados: R${" "}
                {calcularSubtotal(ingressosSelecionados).toFixed(2)}
              </h3>
              <button
                onClick={handlePagamentoSelecionados}
                className={styles.btnPrimary}
              >
                PAGAR SELECIONADOS
              </button>
            </>
          ) : (
            <>
              <h3 className="Subtotal">Subtotal Total: R$ {calcularSubtotal().toFixed(2)}</h3>
              <button onClick={handlePagamentoTodos} className={styles.btnPrimary}>
                PAGAR TODOS
              </button>
            </>
          )}
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <div
          style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0" }}
        >
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
    carregarLanchoneteCarrinho();
    carregarCartazes();
  }, []);

  useEffect(() => {
    if (dadosUsuario) {
      buscarPendencias();
    }
  }, [dadosUsuario]);

  // Carrega dados do usuário do localStorage ou auth
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

  // Carrega produtos da lanchonete do localStorage
  function carregarLanchoneteCarrinho() {
    try {
      const dados = localStorage.getItem("cartData");
      if (dados) {
        const parsed = JSON.parse(dados);
        if (parsed.cart) {
          setLanchoneteCarrinho(parsed.cart);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho da lanchonete:", error);
    }
  }

  // Busca ingressos pendentes no Firestore para o usuário
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

  // Carrega cartazes do JSON
  async function carregarCartazes() {
    try {
      const res = await fetch("/Filmes/cartazes.json");
      const data = await res.json();
      setCartazes(data);
    } catch (error) {
      console.error("Erro ao carregar cartazes:", error);
    }
  }

  // Remove pendência Firestore e atualiza lista
  async function apagarPendencia(id) {
    if (!confirm("Deseja realmente apagar essa pendência?")) return;
    try {
      await deleteDoc(doc(db, "ingressos", id));
      alert("Pendência apagada.");

      // Limpa localStorage se for a pendência atual
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

  // Formata datas (timestamp Firestore ou string)
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

  // Busca imagem do cartaz pelo nome do filme
  function getImagem(filmeNome) {
    const item = cartazes.find((c) => c.filme === filmeNome);
    if (item) return item.cartaz;
    return "/placeholder.png";
  }

  // Abre página de pagamento para ingresso único
  function handlePagamentoIndividual(ingressoId) {
    const ingresso = pendencias.find((p) => p.id === ingressoId);
    if (ingresso) {
      localStorage.setItem("ingressoParaPagamento", JSON.stringify(ingresso));
    }
    router.push(`/Pagamento?id=${ingressoId}`);
  }

  // Abre página de pagamento para ingressos selecionados
  function handlePagamentoSelecionados() {
    if (ingressosSelecionados.size === 0) {
      alert("Selecione pelo menos um ingresso para pagar.");
      return;
    }

    if (ingressosSelecionados.size === 1) {
      const id = Array.from(ingressosSelecionados)[0];
      handlePagamentoIndividual(id);
    } else {
      const ingressosSelecionadosData = pendencias.filter((p) =>
        ingressosSelecionados.has(p.id)
      );
      localStorage.setItem(
        "ingressosParaPagamento",
        JSON.stringify(ingressosSelecionadosData)
      );
      const ids = Array.from(ingressosSelecionados).join(",");
      router.push(`/Pagamento?ids=${ids}`);
    }
  }

  // Abre página de pagamento para todos ingressos pendentes
  function handlePagamentoTodos() {
    if (pendencias.length === 0) return;

    if (pendencias.length === 1) {
      handlePagamentoIndividual(pendencias[0].id);
    } else {
      localStorage.setItem("ingressosParaPagamento", JSON.stringify(pendencias));
      const ids = pendencias.map((p) => p.id).join(",");
      router.push(`/Pagamento?ids=${ids}`);
    }
  }

  // Toggle checkbox seleção ingresso
  function toggleSelecaoIngresso(id) {
    const novaSelecao = new Set(ingressosSelecionados);
    if (novaSelecao.has(id)) {
      novaSelecao.delete(id);
    } else {
      novaSelecao.add(id);
    }
    setIngressosSelecionados(novaSelecao);
  }

  // Seleciona ou desmarca todos ingressos
  function selecionarTodos() {
    if (ingressosSelecionados.size === pendencias.length) {
      setIngressosSelecionados(new Set());
    } else {
      setIngressosSelecionados(new Set(pendencias.map((p) => p.id)));
    }
  }

  // Calcula subtotal ingressos (selecionados ou todos)
  function calcularSubtotalIngressos(ids = null) {
    const itensParaCalcular = ids
      ? pendencias.filter((item) => ids.has(item.id))
      : pendencias;

    return itensParaCalcular.reduce((acc, item) => {
      // Preço pode estar em precoTotal, precoDesconto, precoUnitario ou preco
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

  // Calcula total produtos da lanchonete
  function calcularSubtotalLanchonete() {
    return lanchoneteCarrinho.reduce(
      (acc, item) => acc + (parseFloat(item.price) || 0),
      0
    );
  }

  // Soma ingressos + lanchonete
  function calcularTotalCompleto(idsSelecionados = null) {
    const ingressosTotal = calcularSubtotalIngressos(idsSelecionados);
    const lanchoneteTotal = calcularSubtotalLanchonete();
    return ingressosTotal + lanchoneteTotal;
  }

  // Limpar dados locais de compra (dev)
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

      {/* Mensagem descontos especiais (sem nome e badges) */}
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
                  onClick={() => handlePagamentoIndividual(item.id)}
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

      {/* Lista do carrinho da lanchonete */}
      {lanchoneteCarrinho.length > 0 && (
        <>
          <h2>Produtos no Carrinho da Lanchonete</h2>
          <ul className={styles.lista}>
            {lanchoneteCarrinho.map((item, idx) => (
              <li key={idx} className={styles.pendenciaItem}>
                <div className={styles.descricao}>
                  <p>
                    <strong>Produto:</strong> {item.item} <br />
                    <strong>Tamanho:</strong> {item.size} <br />
                    <strong>Preço:</strong> R$ {parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {pendencias.length > 0 || lanchoneteCarrinho.length > 0 ? (
        <div className={styles.resumoCompra}>
          {ingressosSelecionados.size > 0 ? (
            <>
              <h3>
                Subtotal Ingressos Selecionados: R${" "}
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
              <button
                onClick={handlePagamentoSelecionados}
                className={styles.btnPrimary}
              >
                PAGAR SELECIONADOS (Ingressos)
              </button>
            </>
          ) : (
            <>
              <div className={styles.TextoBox}>
                <h3>
                  Subtotal Ingressos (Todos): R$ {calcularSubtotalIngressos().toFixed(2)}
                </h3>
                <h3>
                  Total Produtos Lanchonete: R$ {calcularSubtotalLanchonete().toFixed(2)}
                </h3>
                <h2>
                  <strong>
                    Total a Pagar (Ingressos + Lanchonete): R${" "}
                    {calcularTotalCompleto().toFixed(2)}
                  </strong>
                </h2>

              </div>

              <button onClick={handlePagamentoTodos} className={styles.btnPrimary}>
                Realizar Pagamento
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Seu carrinho está vazio.</p>
      )}

      {process.env.NODE_ENV === "development" && (
        <div
          style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0" }}
        >
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
