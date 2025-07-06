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
  const [produtos, setProdutos] = useState([]); // Novo estado para produtos
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    carregarDadosUsuario();
    carregarCartazes();
    carregarProdutos(); // Carregar produtos do Firestore
  }, []);

  useEffect(() => {
    if (dadosUsuario) {
      buscarPendencias();
      carregarLanchoneteCarrinho();
    }
  }, [dadosUsuario]);

  function convertGoogleDriveUrl(url) {
    if (!url) return null;
    if (url.includes("uc?export=view") || url.includes("uc?id=")) return url;
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    return url;
  }

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
          cartaz: convertGoogleDriveUrl(data.cartaz || "/placeholder.png"),
        };
      });
      setCartazes(cartazesData);
    } catch (error) {
      console.error("Erro ao carregar cartazes:", error);
    }
  }

  // Nova função para carregar produtos do Firestore
  async function carregarProdutos() {
    try {
      const snapshot = await getDocs(collection(db, "produtos"));
      const produtosData = snapshot.docs.map((docu) => {
        const data = docu.data();
        return {
          id: docu.id,
          nome: data.nome || "",
          imagem: convertGoogleDriveUrl(data.imagem || "/placeholder.png"),
          preco: data.preco || "0",
          tamanho: data.tamanho || "",
          codigo: data.codigo || "",
          emEstoque: data.emEstoque || false,
        };
      });
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }

  // Função para buscar imagem do produto
  function getImagemProduto(nomeProduto, tamanhoProduto) {
    const produto = produtos.find(p => {
      const nomeMatch = p.nome.toLowerCase().includes(nomeProduto.toLowerCase()) || 
                       nomeProduto.toLowerCase().includes(p.nome.toLowerCase());
      const tamanhoMatch = !tamanhoProduto || !p.tamanho || 
                          p.tamanho.toLowerCase() === tamanhoProduto.toLowerCase();
      return nomeMatch && tamanhoMatch;
    });
    
    return produto ? produto.imagem : "/placeholder.png";
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

  // Nova função para remover ingresso
  async function removerIngresso(ingressoId) {
    if (!confirm("Tem certeza que deseja remover este ingresso do carrinho?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "ingressos", ingressoId));
      
      // Atualizar estado removendo o ingresso
      setPendencias(pendencias.filter(item => item.id !== ingressoId));
      
      alert("Ingresso removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover ingresso:", error);
      alert("Erro ao remover ingresso. Tente novamente.");
    }
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
      <Link href="/MenuPrincipal">Voltar</Link>
      <h1>Resumo do Carrinho</h1>

      {pendencias.map((item) => (
        <div key={item.id} className={styles.pendenciaItem}>
          <img
            src={getImagem(item.filme)}
            className={styles.imagem}
            alt={`Cartaz do filme ${item.filme}`}
            onError={(e) => {
              const originalUrl = e.target.src;
              const match = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              if (match && !e.target.dataset.tentativa) {
                const fileId = match[1];
                const formatosAlternativos = [
                  `https://lh3.googleusercontent.com/d/${fileId}`,
                  `https://drive.google.com/uc?export=download&id=${fileId}`,
                  `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h600`
                ];
                e.target.dataset.tentativa = '1';
                e.target.src = formatosAlternativos[0];
              } else {
                e.target.src = "/placeholder.png";
                e.target.alt = "Cartaz não disponível";
              }
            }}
          />
          <div className={styles.descricao}>
            <p>
              <strong>Filme:</strong> {item.filme} <br />
              <strong>Assento:</strong> {item.assentos?.join(", ") || "Nenhum"} <br />
              <strong>Preço:</strong> R$ {parseFloat(item.precoTotal || 0).toFixed(2)} <br />
              <strong>Data:</strong> {formatarDataTimestamp(item.dataSessao)}
            </p>
          </div>
          <div className={styles.acoes}>
            <button 
              onClick={() => removerIngresso(item.id)}
              className={styles.btnRemover}
              title="Remover ingresso"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {lanchoneteCarrinho.map((item, idx) => (
        <div key={item.id || idx} className={styles.pendenciaItem}>
          <img
            src={getImagemProduto(item.item || item.nome || "", item.tamanho || "")}
            className={styles.imagem}
            alt={`Imagem do produto ${item.item || item.nome}`}
            onError={(e) => {
              const originalUrl = e.target.src;
              const match = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              if (match && !e.target.dataset.tentativa) {
                const fileId = match[1];
                const formatosAlternativos = [
                  `https://lh3.googleusercontent.com/d/${fileId}`,
                  `https://drive.google.com/uc?export=download&id=${fileId}`,
                  `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h600`
                ];
                e.target.dataset.tentativa = '1';
                e.target.src = formatosAlternativos[0];
              } else {
                e.target.src = "/placeholder.png";
                e.target.alt = "Imagem do produto não disponível";
              }
            }}
          />
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