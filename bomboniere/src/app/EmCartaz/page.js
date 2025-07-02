"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import styles from "./page.module.css";
import Link from "next/link";

export default function EmCartaz() {
  const [filmes, setFilmes] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [cartazes, setCartazes] = useState([]);
  const [dadosUsuario, setDadosUsuario] = useState(null);

  useEffect(() => {
    // Buscar dados do usuário do localStorage
    function carregarDadosUsuario() {
      try {
        const dadosUsuarioLogado = localStorage.getItem("dadosUsuarioLogado");
        if (dadosUsuarioLogado) {
          const dados = JSON.parse(dadosUsuarioLogado);
          setDadosUsuario(dados);
          console.log("Dados do usuário carregados:", dados);
        } else {
          console.log("Nenhum dado de usuário encontrado no localStorage");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
      }
    }

    async function fetchFilmes() {
      const snapshot = await getDocs(collection(db, "filmes"));
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFilmes(lista);
    }

    async function fetchCartazes() {
      const res = await fetch("/Filmes/cartazes.json");
      const data = await res.json();
      setCartazes(data);
    }

    async function fetchFaixas() {
      const res = await fetch("/FaixaEtaria/faixaetaria.json");
      const data = await res.json();
      setFaixas(data);
    }

    carregarDadosUsuario();
    fetchFilmes();
    fetchCartazes();
    fetchFaixas();
  }, []);

  function buscarCartaz(filme) {
    const item = cartazes.find((c) => c.filme === filme);
    return item ? item.cartaz.replace("bomboniere/public", "") : "";
  }

  function buscarFaixaEtaria(faixa) {
    const item = faixas.find((f) => f.faixa === faixa);
    return item ? item.imagem : "";
  }

  // Mantive a função, pois pode ser útil futuramente, mas não é usada para exibir nada
  function calcularDesconto() {
    if (!dadosUsuario) return 0;

    let desconto = 0;
    if (dadosUsuario.estudante) desconto += 50; // 50% desconto para estudantes
    if (dadosUsuario.deficiente) desconto += 50; // 50% desconto para deficientes

    return Math.min(desconto, 50); // Máximo de 50% de desconto
  }

  function handleComprarIngresso(filme) {
    localStorage.setItem("filmeSelecionado", JSON.stringify(filme));

    const infoCompra = {
      filme: filme,
      usuario: dadosUsuario,
      desconto: calcularDesconto(),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("infoCompra", JSON.stringify(infoCompra));
    console.log("Informações da compra salvas:", infoCompra);

    window.location.href = "/EscolhaAssento";
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Filmes em Cartaz</h1>
        {/* Removido o bloco que mostrava o texto de boas-vindas e desconto */}
      </header>

      <div className={styles.listaFilmes}>
        {filmes.map((filme) => (
          <div key={filme.id} className={styles.card}>
            <img
              src={buscarCartaz(filme.nome)}
              alt="Cartaz"
              className={styles.cartaz}
            />
            <h2>{filme.nome}</h2>
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
            <p>
              <strong>Sinopse:</strong> {filme.sinopse}
            </p>
            <img
              src={buscarFaixaEtaria(filme.faixaEtaria)}
              alt={filme.faixaEtaria}
              className={styles.faixaEtaria}
            />

            <button
              className={styles.button}
              onClick={() => handleComprarIngresso(filme)}
            >
              Comprar Ingresso
            </button>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <button className={styles.button}>
          <Link href="../MenuPrincipal">Menu Principal</Link>
        </button>
      </footer>
    </div>
  );
}
