"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Assentos from "../../Components/Filmes-assentos/Assentos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, auth } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export default function EscolhaAssento() {
  const router = useRouter();

  const [filme, setFilme] = useState(null);
  const [faixas, setFaixas] = useState([]);
  const [cartaz, setCartaz] = useState("");
  const [pendentesCount, setPendentesCount] = useState(0);
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [loading, setLoading] = useState(false);

  // Dados do usuário vindo do localStorage
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [infoCompra, setInfoCompra] = useState(null);
  const [precoBase] = useState(25.0); // Preço base do ingresso

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    function carregarDadosUsuario() {
      try {
        const dadosUsuarioLogado = localStorage.getItem("dadosUsuarioLogado");
        if (dadosUsuarioLogado) {
          const dados = JSON.parse(dadosUsuarioLogado);
          setDadosUsuario(dados);
        } else {
          // Fallback para auth.currentUser caso não tenha no localStorage
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

    // Carregar informações da compra do localStorage
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

    // Buscar filme no localStorage
    const filmeStorage = localStorage.getItem("filmeSelecionado");
    if (filmeStorage) {
      const dados = JSON.parse(filmeStorage);
      setFilme({
        ...dados,
        assentos: gerarAssentos(40),
      });
      buscarCartaz(dados.nome);
    }

    async function buscarFaixas() {
      try {
        const res = await fetch("/FaixaEtaria/faixaetaria.json");
        const data = await res.json();
        setFaixas(data);
      } catch (err) {
        console.error("Erro ao carregar faixas etárias:", err);
      }
    }

    carregarDadosUsuario();
    carregarInfoCompra();
    buscarFaixas();
  }, []);

  useEffect(() => {
    if (dadosUsuario?.uid) {
      contarPendentes();
    }
  }, [dadosUsuario]);

  useEffect(() => {
    if (filme && dataSelecionada) {
      buscarAssentosOcupados();
    }
  }, [filme, dataSelecionada]);

  // Função para calcular desconto
  function calcularDesconto() {
    if (!dadosUsuario) return 0;

    let desconto = 0;
    if (dadosUsuario.estudante) desconto += 50;
    if (dadosUsuario.deficiente) desconto += 50;

    return Math.min(desconto, 50); // Máximo de 50% de desconto
  }

  // Função para calcular preço com desconto
  function calcularPreco(quantidade) {
    const desconto = calcularDesconto();
    const precoComDesconto = precoBase * (1 - desconto / 100);
    return {
      precoUnitario: precoComDesconto,
      precoTotal: precoComDesconto * quantidade,
      desconto: desconto,
      economizado: (precoBase - precoComDesconto) * quantidade,
    };
  }

  async function contarPendentes() {
    if (!dadosUsuario?.uid) {
      setPendentesCount(0);
      return;
    }

    // Contar ingressos pendentes do usuário logado
    const q = query(
      collection(db, "ingressos"),
      where("usuarioId", "==", dadosUsuario.uid),
      where("pago", "==", false)
    );
    const snapshot = await getDocs(q);
    setPendentesCount(snapshot.size);
  }

  function buscarImagemFaixa(faixa) {
    const item = faixas.find((f) => f.faixa === faixa);
    return item ? item.imagem : "";
  }

  async function buscarCartaz(nome) {
    try {
      const res = await fetch("/Filmes/cartazes.json");
      const data = await res.json();
      const item = data.find((c) => c.filme === nome);
      setCartaz(item ? item.cartaz.replace("bomboniere/public", "") : "");
    } catch (error) {
      console.error("Erro ao buscar cartaz:", error);
    }
  }

  function gerarAssentos(qtd) {
    return Array.from({ length: qtd }, (_, i) => ({
      numero: i + 1,
      selecionado: false,
      disponivel: true,
    }));
  }

  async function buscarAssentosOcupados() {
    const dataInicio = new Date(dataSelecionada + "T00:00:00");
    const dataFim = new Date(dataSelecionada + "T23:59:59");

    const q = query(
      collection(db, "ingressos"),
      where("filme", "==", filme.nome),
      where("pago", "==", true),
      where("dataCompra", ">=", dataInicio),
      where("dataCompra", "<=", dataFim)
    );

    const querySnapshot = await getDocs(q);

    const assentosOcupados = [];
    querySnapshot.forEach((docu) => {
      const data = docu.data();
      if (data.assentos && Array.isArray(data.assentos)) {
        assentosOcupados.push(...data.assentos);
      }
    });

    setFilme((antigo) => {
      if (!antigo) return antigo;

      const novosAssentos = antigo.assentos.map((a) => ({
        ...a,
        disponivel: !assentosOcupados.includes(a.numero),
        selecionado: a.selecionado && !assentosOcupados.includes(a.numero),
      }));

      return { ...antigo, assentos: novosAssentos };
    });
  }

  function toggleAssento(numero) {
    // Não permite selecionar assento indisponível
    const assento = filme.assentos.find((a) => a.numero === numero);
    if (!assento || !assento.disponivel) return;

    const novo = { ...filme };
    novo.assentos = novo.assentos.map((a) =>
      a.numero === numero ? { ...a, selecionado: !a.selecionado } : a
    );
    setFilme(novo);
  }

  async function confirmarIngresso() {
    if (loading) return; // evita clique múltiplo

    const assentosSelecionados = filme.assentos.filter((a) => a.selecionado);
    if (assentosSelecionados.length === 0) {
      alert("Selecione pelo menos um assento.");
      return;
    }

    if (!dadosUsuario?.uid || !dadosUsuario?.email) {
      alert("Você precisa fazer login para comprar ingressos.");
      router.push("/Login");
      return;
    }

    setLoading(true);

    const precoInfo = calcularPreco(assentosSelecionados.length);

    const dadosIngresso = {
      filme: filme.nome,
      dataCompra: serverTimestamp(),
      dataSessao: dataSelecionada,
      quantidade: assentosSelecionados.length,
      assentos: assentosSelecionados.map((a) => a.numero),
      pago: false,
      usuarioId: dadosUsuario.uid,
      usuarioEmail: dadosUsuario.email,
      usuarioNome: dadosUsuario.nome,
      // Informações de preço e desconto
      precoUnitario: precoInfo.precoUnitario,
      precoTotal: precoInfo.precoTotal,
      desconto: precoInfo.desconto,
      valorEconomizado: precoInfo.economizado,
      // Dados do perfil do usuário
      usuarioEstudante: dadosUsuario.estudante || false,
      usuarioDeficiente: dadosUsuario.deficiente || false,
      usuarioFuncionario: dadosUsuario.funcionario || false,
    };

    try {
      await addDoc(collection(db, "ingressos"), dadosIngresso);

      // Salvar detalhes da compra no localStorage para uso posterior
      const detalheCompra = {
        ...dadosIngresso,
        timestamp: new Date().toISOString(),
        assentosSelecionados: assentosSelecionados,
      };
      localStorage.setItem("ultimaCompra", JSON.stringify(detalheCompra));

      alert(
        `Ingresso reservado com sucesso!\nTotal: R$ ${precoInfo.precoTotal.toFixed(
          2
        )}\nDesconto aplicado: ${precoInfo.desconto}%\nEconomizado: R$ ${precoInfo.economizado.toFixed(
          2
        )}`
      );

      setFilme({ ...filme, assentos: gerarAssentos(40) });
      contarPendentes();
    } catch (error) {
      console.error("Erro ao salvar ingresso:", error);
      alert("Erro ao salvar ingresso.");
    } finally {
      setLoading(false);
    }
  }

  if (!filme) return <p>Carregando filme...</p>;

  const faixaImg = buscarImagemFaixa(filme.faixaEtaria);
  const assentosSelecionados = filme.assentos.filter((a) => a.selecionado);
  const precoInfo = calcularPreco(assentosSelecionados.length);

  return (
    <div className={styles.container}>
      {/* Informações do usuário - REMOVIDO O BLOCO COM A MENSAGEM */}
      {/* Apenas um espaço para usuário logado, se desejar você pode reativar mais tarde */}

      <h1>{filme.nome}</h1>

      {cartaz && <img src={cartaz} alt="Cartaz" className={styles.cartaz} />}

      <p>
        <strong>Sinopse:</strong> {filme.sinopse}
      </p>
      <p>
        <strong>Duração:</strong> {filme.duracao}
      </p>
      <p>
        <strong>Gênero:</strong> {filme.genero}
      </p>
      <p>
        <strong>Horário:</strong> {filme.horario}
      </p>
      <p>
        <strong>Distribuidora:</strong> {filme.distribuidora}
      </p>
      <p>
        <strong>Elenco:</strong> {filme.elenco}
      </p>

      {faixaImg && (
        <img src={faixaImg} alt={filme.faixaEtaria} className={styles.faixaEtaria} />
      )}

      <label htmlFor="dataSessao" style={{ marginTop: 20, display: "block" }}>
        Selecione a data da sessão:
      </label>
      <input
        type="date"
        id="dataSessao"
        value={dataSelecionada}
        min={new Date().toISOString().substring(0, 10)}
        onChange={(e) => setDataSelecionada(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {/* Informações de preço */}
      <div className={styles.precoInfo}>
        <p>
          <strong>Preço por ingresso:</strong> R$ {precoInfo.precoUnitario.toFixed(2)}
        </p>
        {precoInfo.desconto > 0 && (
          <p className={styles.desconto}>
            <span style={{ textDecoration: "line-through" }}>
              R$ {precoBase.toFixed(2)}
            </span>{" "}
            → R$ {precoInfo.precoUnitario.toFixed(2)} ({precoInfo.desconto}% OFF)
          </p>
        )}
      </div>

      <h2>Selecione seus assentos:</h2>
      <Assentos
        assentos={filme.assentos}
        onToggleAssento={toggleAssento}
        onConfirmar={confirmarIngresso}
        onCancelar={() => setFilme({ ...filme, assentos: gerarAssentos(40) })}
        loading={loading}
      />

      {/* Resumo da compra */}
      {assentosSelecionados.length > 0 && (
        <div className={styles.resumoCompra}>
          <h3>Resumo da Compra</h3>
          <p>
            <strong>Assentos selecionados:</strong>{" "}
            {assentosSelecionados.map((a) => a.numero).join(", ")}
          </p>
          <p>
            <strong>Quantidade:</strong> {assentosSelecionados.length}
          </p>
          <p>
            <strong>Preço unitário:</strong> R$ {precoInfo.precoUnitario.toFixed(2)}
          </p>
          <p>
            <strong>Total:</strong> R$ {precoInfo.precoTotal.toFixed(2)}
          </p>
          {precoInfo.economizado > 0 && (
            <p className={styles.economia}>
              <strong>Você economizou:</strong> R$ {precoInfo.economizado.toFixed(2)}
            </p>
          )}
        </div>
      )}

      <Link href="/Carrinho" className={styles.carrinhoLink} aria-label="Ver carrinho">
        <div className={styles.carrinhoIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="32"
            height="32"
          >
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm0 2zm10-2c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zm0 2zm-9.83-4l.84-4h7.92l.86 4H7.17zM7 4h10v2H7V4zm-2 4h14l-1.25 6H6.8L5 8z" />
          </svg>
          {pendentesCount > 0 && <span className={styles.badge}>{pendentesCount}</span>}
        </div>
      </Link>

      <Link href="/MenuPrincipal">
        <button className={styles.button} disabled={loading}>
          {loading ? "Confirmando..." : "Menu Principal"}
        </button>
      </Link>
    </div>
  );
}
