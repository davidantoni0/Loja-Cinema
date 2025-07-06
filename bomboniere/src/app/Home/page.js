'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Login from "@/Components/Login/page";
import styles from './page.module.css';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from '../../firebase/firebaseConfig';




export default function Home() {
  const [filmesEmCartaz, setFilmesEmCartaz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filmesExtendidos, setFilmesExtendidos] = useState([]);
  const carrosselRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Configurações do carrossel - alterado para 3 filmes
  const itemsPerView = 3; // Número de filmes visíveis por vez (3 filmes)

  // Função para converter URLs do Google Drive para formato público
  const convertGoogleDriveUrl = useCallback((url) => {
    if (!url) return null;
    
    // Extrair ID do arquivo do Google Drive
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      // Usar o formato mais confiável do Google Drive
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  }, []);

  // Função para criar array infinito
  const createInfiniteArray = useCallback((filmes) => {
    if (filmes.length === 0) return [];
    
    // Se temos menos filmes que o número de itens visíveis, duplicamos até ter o suficiente
    let filmesParaUsar = [...filmes];
    while (filmesParaUsar.length < itemsPerView * 2) {
      filmesParaUsar = [...filmesParaUsar, ...filmes];
    }
    
    // Criamos um array com filmes extras no início e no fim para rolagem infinita
    const filmesExtras = itemsPerView;
    const filmesInicio = filmesParaUsar.slice(-filmesExtras);
    const filmesFim = filmesParaUsar.slice(0, filmesExtras);
    
    return [...filmesInicio, ...filmesParaUsar, ...filmesFim];
  }, [itemsPerView]);

  // Memoizar a função fetchFilmes para evitar execuções desnecessárias
  const fetchFilmes = useCallback(async () => {
    setLoading(true);
    const debugMessages = [];
    
    try {
      // Verificar o que existe na coleção Indicacao
      debugMessages.push("=== VERIFICANDO COLEÇÃO INDICACAO ===");
      const indicacaoQuery = query(collection(db, "Indicacao"));
      const indicacaoSnapshot = await getDocs(indicacaoQuery);
      
      debugMessages.push(`Total de documentos na coleção Indicacao: ${indicacaoSnapshot.size}`);
      
      const indicacaoMap = {};
      indicacaoSnapshot.forEach(doc => {
        const data = doc.data();
        indicacaoMap[doc.id] = data;
        debugMessages.push(`ID: "${doc.id}" | Dados: ${JSON.stringify(data)}`);
      });

      debugMessages.push("=== BUSCANDO FILMES ===");
      const q = query(collection(db, "filmes"), where("emCartaz", "==", true));
      const querySnapshot = await getDocs(q);
      const filmesList = [];

      debugMessages.push(`Total de filmes em cartaz: ${querySnapshot.size}`);

      for (const docSnap of querySnapshot.docs) {
        const filme = { id: docSnap.id, ...docSnap.data() };
        
        debugMessages.push(`\n--- FILME: ${filme.nome} ---`);
        debugMessages.push(`Faixa Etária: ${filme.faixaEtaria} (tipo: ${typeof filme.faixaEtaria})`);
        
        // Converter URL do cartaz se for do Google Drive
        if (filme.cartaz) {
          debugMessages.push(`Cartaz original: ${filme.cartaz}`);
          const cartazConvertido = convertGoogleDriveUrl(filme.cartaz);
          if (cartazConvertido !== filme.cartaz) {
            filme.cartaz = cartazConvertido;
            debugMessages.push(`Cartaz convertido: ${filme.cartaz}`);
          }
        }

        if (filme.faixaEtaria !== undefined && filme.faixaEtaria !== null) {
          // Converter faixaEtaria para string para buscar no Firestore
          const faixaEtariaId = filme.faixaEtaria.toString();
          
          debugMessages.push(`Buscando documento com ID: "${faixaEtariaId}"`);
          
          if (indicacaoMap[faixaEtariaId]) {
            debugMessages.push(`✓ Documento encontrado!`);
            
            const indicacaoData = indicacaoMap[faixaEtariaId];
            
            // Buscar URL da imagem (testando diferentes nomes de campo)
            const possiveisNomes = ['url', 'imagem', 'imageUrl', 'src', 'link', 'photo'];
            let urlEncontrada = false;
            
            for (const nomeCampo of possiveisNomes) {
              if (indicacaoData[nomeCampo]) {
                let urlImagem = indicacaoData[nomeCampo];
                
                debugMessages.push(`✓ URL encontrada no campo "${nomeCampo}": ${urlImagem}`);
                
                // Converter URL do Google Drive
                const urlConvertida = convertGoogleDriveUrl(urlImagem);
                if (urlConvertida) {
                  filme.classificacaoImg = urlConvertida;
                  debugMessages.push(`✓ URL convertida: ${urlConvertida}`);
                  urlEncontrada = true;
                  break;
                }
              }
            }
            
            if (!urlEncontrada) {
              debugMessages.push(`✗ Nenhuma URL encontrada nos campos: ${possiveisNomes.join(', ')}`);
            }
            
          } else {
            debugMessages.push(`✗ Documento não encontrado para ID: "${faixaEtariaId}"`);
            debugMessages.push(`IDs disponíveis: ${Object.keys(indicacaoMap).join(', ')}`);
          }

        } else {
          debugMessages.push(`✗ Filme "${filme.nome}" não possui faixaEtaria definida`);
        }

        filmesList.push(filme);
      }

      setFilmesEmCartaz(filmesList);
      
      // Criar array infinito para o carrossel
      const filmesInfinitos = createInfiniteArray(filmesList);
      setFilmesExtendidos(filmesInfinitos);
      
      // Definir posição inicial (começar no meio do array)
      setCurrentIndex(itemsPerView);
      
      setDebugInfo(debugMessages);
      
    } catch (error) {
      debugMessages.push(`ERRO GERAL: ${error.message}`);
      console.error("Erro ao buscar filmes:", error);
      setDebugInfo(debugMessages);
    } finally {
      setLoading(false);
    }
  }, [convertGoogleDriveUrl, createInfiniteArray, itemsPerView]);

  // useEffect que executa apenas uma vez
  useEffect(() => {
    fetchFilmes();
  }, [fetchFilmes]);

  // Função para lidar com erro de carregamento de cartaz
  const handleCartazError = useCallback((e, filme) => {
    console.error(`✗ Erro ao carregar cartaz para ${filme.nome}`);
    
    // Extrair ID do arquivo e tentar formatos alternativos
    const match = filme.cartaz?.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      const formatosAlternativos = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h600`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`
      ];
      
      // Tentar o primeiro formato alternativo que ainda não foi testado
      const proximoFormato = formatosAlternativos.find(url => url !== filme.cartaz);
      if (proximoFormato && !e.target.dataset.tentativasCartaz) {
        console.log(`Tentando formato alternativo para cartaz: ${proximoFormato}`);
        e.target.dataset.tentativasCartaz = '1';
        setTimeout(() => {
          e.target.src = proximoFormato;
        }, 1000);
      } else {
        // Se todas as tentativas falharam, usar placeholder
        e.target.src = "/Filmes/cartaz/placeholder.png";
      }
    } else {
      e.target.src = "/Filmes/cartaz/placeholder.png";
    }
  }, []);

  // Função para lidar com erro de carregamento de imagem
  const handleImageError = useCallback((e, filme) => {
    console.error(`✗ Erro ao carregar imagem de classificação para ${filme.nome}`);
    
    // Extrair ID do arquivo e tentar formatos alternativos
    const match = filme.classificacaoImg?.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      const formatosAlternativos = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w100`
      ];
      
      // Tentar o primeiro formato alternativo que ainda não foi testado
      const proximoFormato = formatosAlternativos.find(url => url !== filme.classificacaoImg);
      if (proximoFormato && !e.target.dataset.tentativas) {
        console.log(`Tentando formato alternativo: ${proximoFormato}`);
        e.target.dataset.tentativas = '1';
        setTimeout(() => {
          e.target.src = proximoFormato;
        }, 1000);
      } else {
        // Se todas as tentativas falharam, ocultar a imagem
        e.target.style.display = 'none';
      }
    } else {
      e.target.style.display = 'none';
    }
  }, []);

  // Função para resetar posição sem animação
  const resetPosition = useCallback(() => {
    if (!carrosselRef.current || filmesEmCartaz.length === 0) return;
    
    setIsTransitioning(false);
    
    // Remover transição temporariamente
    carrosselRef.current.style.transition = 'none';
    
    // Resetar para posição equivalente no meio do array
    const novoIndex = currentIndex % filmesEmCartaz.length + itemsPerView;
    setCurrentIndex(novoIndex);
    
    // Restaurar transição após um frame
    requestAnimationFrame(() => {
      if (carrosselRef.current) {
        carrosselRef.current.style.transition = 'transform 0.3s ease';
      }
    });
  }, [currentIndex, filmesEmCartaz.length, itemsPerView]);

  // Funções de navegação do carrossel
  const handlePrevious = useCallback(() => {
    if (isTransitioning || filmesEmCartaz.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    
    // Após a transição, verificar se precisa resetar
    setTimeout(() => {
      setIsTransitioning(false);
      if (currentIndex - 1 < 0) {
        resetPosition();
      }
    }, 300);
  }, [isTransitioning, filmesEmCartaz.length, currentIndex, resetPosition]);

  const handleNext = useCallback(() => {
    if (isTransitioning || filmesEmCartaz.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    
    // Após a transição, verificar se precisa resetar
    setTimeout(() => {
      setIsTransitioning(false);
      if (currentIndex + 1 >= filmesExtendidos.length - itemsPerView) {
        resetPosition();
      }
    }, 300);
  }, [isTransitioning, filmesEmCartaz.length, currentIndex, filmesExtendidos.length, itemsPerView, resetPosition]);

  // Efeito para atualizar a posição do carrossel
  useEffect(() => {
    if (carrosselRef.current && filmesExtendidos.length > 0) {
      const translateX = currentIndex * (100 / itemsPerView);
      carrosselRef.current.style.transform = `translateX(-${translateX}%)`;
    }
  }, [currentIndex, itemsPerView, filmesExtendidos.length]);

  return (
    <div className={styles.container}>

      <main className={styles.main}>
        {/* Seção de Login - Sempre visível */}
        <section className={styles.loginSection}>
          <div className={styles.loginContainer}>
            <Login />
          </div>
        </section>

        {/* Seção de Filmes em Cartaz */}
        <section className={styles.filmesSection}>
          <h2 className="titulo">Filmes em Cartaz</h2>
          
          {loading && <p className={styles.loadingMessage}>Carregando filmes...</p>}
          {!loading && filmesEmCartaz.length === 0 && (
            <p className={styles.noFilmsMessage}>Nenhum filme em cartaz no momento.</p>
          )}

          {!loading && filmesEmCartaz.length > 0 && (
            <div className={styles.carrosselContainer}>
              {/* Botão Anterior */}
              <button 
                className={`${styles.carrosselButton} ${styles.prevButton}`}
                onClick={handlePrevious}
                disabled={isTransitioning}
                aria-label="Filme anterior"
              >
                &#8249;
              </button>

              {/* Container do Carrossel */}
              <div className={styles.carrosselViewport}>
                <div 
                  ref={carrosselRef}
                  className={styles.carrosselTrack}
                  style={{ 
                    width: `${(filmesExtendidos.length / itemsPerView) * 100}%`,
                    transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                    transition: isTransitioning ? 'transform 0.3s ease' : 'none'
                  }}
                >
                  {filmesExtendidos.map((filme, index) => (
                    <div key={`${filme.id}-${index}`} className={styles.carrosselItem}>
                      <div className={styles.filmeCard}>
                        {filme.cartaz && (
                          <div className={styles.cartazContainer}>
                            <img 
                              src={filme.cartaz} 
                              alt={`Cartaz do filme ${filme.nome}`} 
                              className={styles.cartaz}
                              onError={(e) => handleCartazError(e, filme)}
                              onLoad={() => {
                                console.log(`✓ Cartaz carregado para ${filme.nome}`);
                              }}
                            />
                          </div>
                        )}
                        
                        <div className={styles.filmeInfo}>
                          <h3 className={styles.filmeNome}>{filme.nome}</h3>
                          <p className={styles.filmeHorario}>
                            <strong>Horário:&nbsp;</strong> {filme.horarioExibicao}
                          </p>
                          <p className={styles.filmeClassificacao}>
                            <strong>Classificação:</strong> 
                          </p>
                          
                          {filme.classificacaoImg && (
                            <div className={styles.classificacaoContainer}>
                              <img
                                src={filme.classificacaoImg}
                                alt={`Classificação ${filme.faixaEtaria === 0 ? 'Livre' : `${filme.faixaEtaria} anos`}`}
                                className={styles.imagemClassificacao}
                                onLoad={() => {
                                  console.log(`✓ Imagem de classificação carregada para ${filme.nome}`);
                                }}
                                onError={(e) => handleImageError(e, filme)}
                              />
                            </div>
                          )}
                          
                          {filme.sinopse && (
                            <p className={styles.sinopse}>{filme.sinopse}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Próximo */}
              <button 
                className={`${styles.carrosselButton} ${styles.nextButton}`}
                onClick={handleNext}
                disabled={isTransitioning}
                aria-label="Próximo filme"
              >
                &#8250;
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}