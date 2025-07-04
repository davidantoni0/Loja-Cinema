"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useUsuario from "../../hooks/useUsuario";

export default function EmCartaz() {
  const [filmes, setFilmes] = useState([]);
  const [indicacaoData, setIndicacaoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { usuario, loadingUsuario } = useUsuario();
  const router = useRouter();

  // Função para converter URLs do Google Drive para formato público
  const convertGoogleDriveUrl = useCallback((url) => {
    if (!url) return null;
    
    // Se já está no formato correto, retorna como está
    if (url.includes("uc?export=view") || url.includes("uc?id=")) {
      return url;
    }
    
    // Extrair ID do arquivo do Google Drive
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Se não conseguir extrair ID, tenta outros formatos
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
    
    return url;
  }, []);

  // Função para buscar dados do Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Iniciando busca de dados...");
      
      // Buscar filmes em cartaz
      const filmesQuery = query(
        collection(db, "filmes"), 
        where("emCartaz", "==", true)
      );
      const filmesSnapshot = await getDocs(filmesQuery);
      
      if (filmesSnapshot.empty) {
        console.log("Nenhum filme encontrado em cartaz");
        setError("Nenhum filme encontrado em cartaz no momento.");
        setFilmes([]);
      } else {
        const filmesList = filmesSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Filme encontrado:", data.nome, "Cartaz:", data.cartaz);
          
          return { 
            id: doc.id, 
            ...data,
            // Converter URL do cartaz se for do Google Drive
            cartaz: data.cartaz ? convertGoogleDriveUrl(data.cartaz) : null
          };
        });
        
        setFilmes(filmesList);
        console.log("Filmes carregados:", filmesList);
      }

      // Buscar dados de indicação/classificação
      const indicacaoSnapshot = await getDocs(collection(db, "Indicacao"));
      const indicacaoMap = {};
      
      indicacaoSnapshot.forEach(doc => {
        const data = doc.data();
        // Converter URL da imagem de classificação
        if (data.url) {
          data.url = convertGoogleDriveUrl(data.url);
        }
        indicacaoMap[doc.id] = data;
      });

      setIndicacaoData(indicacaoMap);
      console.log("Dados de indicação carregados:", indicacaoMap);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, [convertGoogleDriveUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para buscar imagem de classificação
  const buscarFaixaEtaria = useCallback((faixa) => {
    const faixaId = faixa?.toString();
    const item = indicacaoData[faixaId];
    return item?.url || "";
  }, [indicacaoData]);

  // Função para calcular desconto
  const calcularDesconto = useCallback(() => {
    if (!usuario) return 0;

    let desconto = 0;
    if (usuario.estudante) desconto += 50;
    if (usuario.deficiente) desconto += 50;

    return Math.min(desconto, 50);
  }, [usuario]);

  // Função para lidar com compra de ingresso
  const handleComprarIngresso = useCallback((filme) => {
    if (!usuario) {
      alert("Você precisa estar logado para comprar ingressos.");
      router.push("/Login");
      return;
    }

    const infoCompra = {
      filme: filme,
      usuario: usuario,
      desconto: calcularDesconto(),
      timestamp: new Date().toISOString(),
    };

    // Salvar dados no sessionStorage
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("filmeSelecionado", JSON.stringify(filme));
        sessionStorage.setItem("infoCompra", JSON.stringify(infoCompra));
        
        console.log("Dados salvos no sessionStorage:", {
          filme: filme.nome,
          desconto: calcularDesconto()
        });
        
        // Navegar para a página de escolha de assento
        router.push("/EscolhaAssento");
      }
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao processar compra. Tente novamente.");
    }
  }, [usuario, calcularDesconto, router]);

  // Função para lidar com erro de carregamento de cartaz
  const handleCartazError = useCallback((e, filme) => {
    console.error(`Erro ao carregar cartaz para ${filme.nome}:`, e.target.src);
    
    // Tentar formatos alternativos do Google Drive
    const originalUrl = filme.cartaz;
    const match = originalUrl?.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    if (match && !e.target.dataset.tentativa) {
      const fileId = match[1];
      const formatosAlternativos = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h600`
      ];
      
      e.target.dataset.tentativa = '1';
      const proximoFormato = formatosAlternativos[0];
      
      console.log(`Tentando formato alternativo: ${proximoFormato}`);
      setTimeout(() => {
        e.target.src = proximoFormato;
      }, 1000);
    } else {
      // Usar placeholder se todas as tentativas falharam
      e.target.src = "/placeholder-movie.jpg";
      e.target.alt = "Cartaz não disponível";
    }
  }, []);

  // Função para lidar com erro de carregamento de classificação
  const handleClassificacaoError = useCallback((e, filme) => {
    console.error(`Erro ao carregar classificação para ${filme.nome}`);
    e.target.style.display = 'none';
  }, []);

  if (loadingUsuario) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados do usuário...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando filmes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.erro}>{error}</div>
        <button className={styles.button} onClick={fetchData}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link className={styles.voltar} href="/MenuPrincipal">
          ← Menu Principal
        </Link>
        <h1 className={styles.titulo}>Filmes em Cartaz</h1>
        <button 
          className={styles.carrinho} 
          onClick={() => router.push("/Carrinho")}
        >
          Meu Carrinho
        </button>
      </header>

      {filmes.length === 0 ? (
        <div className={styles.mensagem}>
          <p>Nenhum filme em cartaz no momento.</p>
        </div>
      ) : (
        <div className={styles.listaFilmes}>
          {filmes.map((filme) => (
            <div key={filme.id} className={styles.card}>
              <div className={styles.cartazContainer}>
                {filme.cartaz ? (
                  <img
                    src={filme.cartaz}
                    alt={`Cartaz do filme ${filme.nome}`}
                    className={styles.cartaz}
                    onError={(e) => handleCartazError(e, filme)}
                    onLoad={() => {
                      console.log(`✓ Cartaz carregado para ${filme.nome}`);
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.cartazPlaceholder}>
                    <span>Cartaz não disponível</span>
                  </div>
                )}
              </div>

              <div className={styles.infoFilme}>
                <h2 className={styles.nomeFilme}>{filme.nome}</h2>
                
                <div className={styles.detalhes}>
                  <p><strong>Duração:</strong> {filme.duracao}</p>
                  <p><strong>Gênero:</strong> {filme.genero}</p>
                  <p><strong>Horário:</strong> {filme.horario || filme.horarioExibicao}</p>
                  <p><strong>Distribuidora:</strong> {filme.distribuidora}</p>
                  <p><strong>Elenco:</strong> {filme.elenco}</p>
                </div>

                <div className={styles.sinopse}>
                  <p><strong>Sinopse:</strong> {filme.sinopse}</p>
                </div>
                
                <div className={styles.rodapeCard}>
                  {buscarFaixaEtaria(filme.faixaEtaria) && (
                    <img
                      src={buscarFaixaEtaria(filme.faixaEtaria)}
                      alt={`Classificação ${filme.faixaEtaria === 0 ? 'Livre' : `${filme.faixaEtaria} anos`}`}
                      className={styles.faixaEtaria}
                      onError={(e) => handleClassificacaoError(e, filme)}
                      onLoad={() => {
                        console.log(`✓ Classificação carregada para ${filme.nome}`);
                      }}
                    />
                  )}
                  
                  <button
                    className={styles.botaoComprar}
                    onClick={() => handleComprarIngresso(filme)}
                  >
                    Comprar Ingresso
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}