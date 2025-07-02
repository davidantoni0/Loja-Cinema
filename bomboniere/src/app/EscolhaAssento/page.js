"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Assentos from "../../Components/Filmes-assentos/Assentos";
import Link from "next/link";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function EscolhaAssento() {
  const [filme, setFilme] = useState(null);
  const [faixas, setFaixas] = useState([]);
  const [cartaz, setCartaz] = useState("");
  const [pendentesCount, setPendentesCount] = useState(0);

  useEffect(() => {
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
      const res = await fetch("/FaixaEtaria/faixaetaria.json");
      const data = await res.json();
      setFaixas(data);
    }

    buscarFaixas();
    contarPendentes();
  }, []);

  useEffect(() => {
    if (filme) {
      buscarAssentosOcupados();
    }
  }, [filme]);

  async function contarPendentes() {
    const q = query(collection(db, "ingressos"), where("pago", "==", false));
    const snapshot = await getDocs(q);
    setPendentesCount(snapshot.size);
  }

  function buscarImagemFaixa(faixa) {
    const item = faixas.find((f) => f.faixa === faixa);
    return item ? item.imagem : "";
  }

  async function buscarCartaz(nome) {
    const res = await fetch("/Filmes/cartazes.json");
    const data = await res.json();
    const item = data.find((c) => c.filme === nome);
    setCartaz(item ? item.cartaz.replace("bomboniere/public", "") : "");
  }

  function gerarAssentos(qtd) {
    return Array.from({ length: qtd }, (_, i) => ({
      numero: i + 1,
      selecionado: false,
      disponivel: true,
    }));
  }

  async function buscarAssentosOcupados() {
    const q = query(
      collection(db, "ingressos"),
      where("filme", "==", filme.nome),
      where("pago", "==", true)
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
    const novo = { ...filme };
    novo.assentos = novo.assentos.map((a) =>
      a.numero === numero ? { ...a, selecionado: !a.selecionado } : a
    );
    setFilme(novo);
  }

  async function confirmarIngresso() {
    const assentosSelecionados = filme.assentos.filter((a) => a.selecionado);
    if (assentosSelecionados.length === 0) {
      alert("Selecione pelo menos um assento.");
      return;
    }

    const dadosIngresso = {
      filme: filme.nome,
      dataCompra: new Date().toLocaleString("pt-BR"),
      quantidade: assentosSelecionados.length,
      assentos: assentosSelecionados.map((a) => a.numero),
      pago: false,
    };

    try {
      await addDoc(collection(db, "ingressos"), dadosIngresso);
      alert("Ingresso reservado com sucesso!");
      setFilme({ ...filme, assentos: gerarAssentos(40) });
      contarPendentes(); // Atualiza o contador após reservar
    } catch (error) {
      console.error("Erro ao salvar ingresso:", error);
      alert("Erro ao salvar ingresso.");
    }
  }

  if (!filme) return <p>Carregando filme...</p>;

  const faixaImg = buscarImagemFaixa(filme.faixaEtaria);

  return (
    <div className={styles.container}>
      <h1>{filme.nome}</h1>
      {cartaz && <img src={cartaz} alt="Cartaz" className={styles.cartaz} />}

      <p><strong>Sinopse:</strong> {filme.sinopse}</p>
      <p><strong>Duração:</strong> {filme.duracao}</p>
      <p><strong>Gênero:</strong> {filme.genero}</p>
      <p><strong>Horário:</strong> {filme.horario}</p>
      <p><strong>Distribuidora:</strong> {filme.distribuidora}</p>
      <p><strong>Elenco:</strong> {filme.elenco}</p>

      {faixaImg && (
        <img
          src={faixaImg}
          alt={filme.faixaEtaria}
          className={styles.faixaEtaria}
        />
      )}

      <h2>Selecione seus assentos:</h2>
      <Assentos
        assentos={filme.assentos}
        onToggleAssento={toggleAssento}
        onConfirmar={confirmarIngresso}
        onCancelar={() => setFilme({ ...filme, assentos: gerarAssentos(40) })}
      />

      <Link href="/Carrinho" className={styles.carrinhoLink} aria-label="Ver carrinho">
        <div className={styles.carrinhoIcon}>
          {/* Ícone simples SVG de carrinho */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="32"
            height="32"
          >
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm0 2zm10-2c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zm0 2zm-9.83-4l.84-4h7.92l.86 4H7.17zM7 4h10v2H7V4zm-2 4h14l-1.25 6H6.8L5 8z"/>
          </svg>
          {pendentesCount > 0 && (
            <span className={styles.badge}>{pendentesCount}</span>
          )}
        </div>
      </Link>

      <Link href="/MenuPrincipal">
        <button className={styles.button}>Menu Principal</button>
      </Link>
    </div>
  );
}
