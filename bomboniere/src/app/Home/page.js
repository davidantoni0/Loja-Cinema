'use client';
import React, { useEffect, useState } from 'react';
import Login from "@/Components/Login/page";
import styles from './page.module.css';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../firebase/firebaseConfig'; // ajuste o caminho conforme sua estrutura

function Home() {
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
                {/* Cartaz */}
                {filme.cartaz && (
                  <img 
                    src={filme.cartaz} 
                    alt={`Cartaz do filme ${filme.nome}`} 
                    className={styles.cartaz} 
                  />
                )}
                {/* Nome */}
                <h3>{filme.nome}</h3>
                {/* Horário */}
                <p><strong>Horário:</strong> {filme.horarioExibicao}</p>
                {/* Imagem da classificação */}
                {filme.classificacaoImg && (
                  <img
                    src={filme.classificacaoImg}
                    alt={`Classificação ${filme.faixaEtaria || ''}`}
                    className={styles.imagemClassificacao}
                  />
                )}
                {/* Sinopse completa */}
                {filme.sinopse && (
                  <p className={styles.sinopse}>{filme.sinopse}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <h1>CineSenai</h1>
      <p>This is the home page of the Bomboniere application.</p>
      <ol>
        <li>Explore our features.</li>
        <li>Check out the latest updates.</li>
      </ol>

      <footer>
        <p>&copy; 2023 Bomboniere. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
