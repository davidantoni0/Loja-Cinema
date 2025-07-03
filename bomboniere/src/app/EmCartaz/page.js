"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import styles from "./page.module.css";
import Link from "next/link";
import useUsuario from "../../hooks/useUsuario";

export default function EmCartaz() {
  const [filmes, setFilmes] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [cartazes, setCartazes] = useState([]);
  const { usuario, loadingUsuario } = useUsuario();

  useEffect(() => {
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

  function calcularDesconto() {
    if (!usuario) return 0;

    let desconto = 0;
    if (usuario.estudante) desconto += 50;
    if (usuario.deficiente) desconto += 50;

    return Math.min(desconto, 50);
  }

  function handleComprarIngresso(filme) {
    localStorage.setItem("filmeSelecionado", JSON.stringify(filme));

    const infoCompra = {
      filme: filme,
      usuario: usuario,
      desconto: calcularDesconto(),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("infoCompra", JSON.stringify(infoCompra));
    console.log("Informações da compra salvas:", infoCompra);

    window.location.href = "/EscolhaAssento";
  }

  if (loadingUsuario) return <p>Carregando dados do usuário...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Filmes em Cartaz</h1>
        <button className={styles.button}>
          <Link href="../MenuPrincipal">Menu Principal</Link>
        </button>
        <button className={styles.button} style={{ marginLeft: "10px" }}>
          <Link href="../Carrinho">Meu Carrinho</Link>
        </button>
      </header>

      <div className={styles.listaFilmes}>
        {filmes
          .filter((filme) => filme.emCartaz === true)
          .map((filme) => (
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
    </div>
  );
}
