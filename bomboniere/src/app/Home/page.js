'use client';
import React, { useEffect, useState } from 'react';
import Login from "@/Components/Login/page";
import styles from './page.module.css';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../firebase/firebaseConfig';

export default function Home({ Component, pageProps }) {
  const [menuState, setMenuState] = React.useState("mainMenu");
  const [filmesEmCartaz, setFilmesEmCartaz] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFilmes() {
      setLoading(true);
      try {
        const q = query(collection(db, "filmes"), where("emCartaz", "==", true));
        const querySnapshot = await getDocs(q);
        const filmesList = [];
        querySnapshot.forEach((doc) => {
          filmesList.push({ id: doc.id, ...doc.data() });
        });
        setFilmesEmCartaz(filmesList);
      } catch (error) {
        console.error("Erro ao buscar filmes:", error);
      }
      setLoading(false);
    }
    fetchFilmes();
  }, []);

  return (
    <div>
      <header className={styles.header}>
        <button className={styles.loginButton} onClick={() => setMenuState("login")}>
          Login
        </button>
      </header>

      <main>
        {menuState === "login" && (
          <div className={styles.loginContainer}>
            <Login />
          </div>
        )}

        <section className={styles.mostruario}>
          <h2>Filmes em Cartaz</h2>
          {loading && <p>Carregando filmes...</p>}
          {!loading && filmesEmCartaz.length === 0 && <p>Nenhum filme em cartaz no momento.</p>}

          <ul className={styles.listaFilmes}>
            {filmesEmCartaz.map((filme) => (
              <li key={filme.id} className={styles.itemFilme}>
                {filme.cartaz && (
                  <img 
                    src={filme.cartaz} 
                    alt={`Cartaz do filme ${filme.nome}`} 
                    className={styles.cartaz} 
                  />
                )}
                <h3>{filme.nome}</h3>
                <p><strong>Horário:</strong> {filme.horarioExibicao}</p>
                {filme.classificacaoImg && (
                  <img
                    src={filme.classificacaoImg}
                    alt={`Classificação ${filme.faixaEtaria || ''}`}
                    className={styles.imagemClassificacao}
                  />
                )}
                {filme.sinopse && (
                  <p className={styles.sinopse}>{filme.sinopse}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 Bomboniere. All rights reserved.</p>
      </footer>
    </div>
  );
}
