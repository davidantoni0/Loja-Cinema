'use client';
import React, { useEffect, useState, useCallback } from 'react';
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
  const [menuState, setMenuState] = useState("mainMenu");
  const [filmesEmCartaz, setFilmesEmCartaz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);

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
      setDebugInfo(debugMessages);
      
    } catch (error) {
      debugMessages.push(`ERRO GERAL: ${error.message}`);
      console.error("Erro ao buscar filmes:", error);
      setDebugInfo(debugMessages);
    } finally {
      setLoading(false);
    }
  }, [convertGoogleDriveUrl]);

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

        {/* Seção de Debug - Comentada para não afetar layout */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
            <summary>Debug Info (clique para expandir)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', fontSize: '11px' }}>
              {debugInfo.join('\n')}
            </pre>
          </details>
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
                    onError={(e) => handleCartazError(e, filme)}
                    onLoad={() => {
                      console.log(`✓ Cartaz carregado para ${filme.nome}`);
                    }}
                  />
                )}
                <h3>{filme.nome}</h3>
                <p><strong>Horário:</strong> {filme.horarioExibicao}</p>
                <p><strong>Classificação:</strong> {filme.faixaEtaria === 0 ? 'Livre' : `${filme.faixaEtaria} anos`}</p>
                
                {filme.classificacaoImg && (
                  <div className={styles.classificacaoContainer}>
                    <img
                      src={filme.classificacaoImg}
                      alt={`Classificação ${filme.faixaEtaria === 0 ? 'Livre' : `${filme.faixaEtaria} anos`}`}
                      className={styles.imagemClassificacao}
                      style={{ 
                        maxWidth: '80px', 
                        height: 'auto',
                        display: 'block',
                        margin: '5px 0'
                      }}
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
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}