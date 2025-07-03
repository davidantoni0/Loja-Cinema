'use client';
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchFilmes() {
      setLoading(true);
      const debugMessages = [];
      
      try {
        // Primeiro, vamos verificar o que existe na coleção Indicacao
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

        // Mostrar todas as chaves disponíveis para debug
        debugMessages.push(`\nChaves disponíveis no Firestore: [${Object.keys(indicacaoMap).map(k => `"${k}"`).join(', ')}]`);

        debugMessages.push("=== BUSCANDO FILMES ===");
        const q = query(collection(db, "filmes"), where("emCartaz", "==", true));
        const querySnapshot = await getDocs(q);
        const filmesList = [];

        debugMessages.push(`Total de filmes em cartaz: ${querySnapshot.size}`);

        for (const docSnap of querySnapshot.docs) {
          const filme = { id: docSnap.id, ...docSnap.data() };
          
          debugMessages.push(`\n--- FILME: ${filme.nome} ---`);
          debugMessages.push(`Faixa Etária original: "${filme.faixaEtaria}" (tipo: ${typeof filme.faixaEtaria})`);

          if (filme.faixaEtaria) {
            // Primeiro, vamos verificar se existe exatamente como está
            debugMessages.push(`\nVerificando se existe documento com ID exato: "${filme.faixaEtaria}"`);
            debugMessages.push(`Resultado: ${indicacaoMap[filme.faixaEtaria] ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
            
            // Mostrar todas as tentativas de busca
            debugMessages.push(`\nTentativas de busca:`);
            Object.keys(indicacaoMap).forEach(chave => {
              debugMessages.push(`  - "${chave}" === "${filme.faixaEtaria}" ? ${chave === filme.faixaEtaria ? 'SIM' : 'NÃO'}`);
            });

            // Tentar diferentes variações da faixa etária
            const faixaEtariaVariacoes = [
              filme.faixaEtaria.toString().trim(),
              filme.faixaEtaria.toString().trim().toLowerCase(),
              filme.faixaEtaria.toString().trim().toUpperCase(),
              `classificacao-${filme.faixaEtaria}`,
              `idade-${filme.faixaEtaria}`,
              `${filme.faixaEtaria}-anos`
            ];

            debugMessages.push(`\nTentando variações: ${faixaEtariaVariacoes.join(', ')}`);

            let imagemEncontrada = false;
            
            for (const variacao of faixaEtariaVariacoes) {
              debugMessages.push(`  Testando variação: "${variacao}"`);
              if (indicacaoMap[variacao]) {
                debugMessages.push(`    ✓ Encontrado documento com ID: "${variacao}"`);
                
                const indicacaoData = indicacaoMap[variacao];
                
                // Tentar diferentes nomes de campo para a imagem
                const possiveisNomes = ['imagem', 'url', 'imageUrl', 'src', 'link', 'photo'];
                
                for (const nomeCampo of possiveisNomes) {
                  if (indicacaoData[nomeCampo]) {
                    let urlImagem = indicacaoData[nomeCampo];
                    
                    // Converter URL do Google Drive para formato direto
                    if (urlImagem.includes('drive.google.com') && urlImagem.includes('/file/d/')) {
                      const fileId = urlImagem.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                      if (fileId) {
                        urlImagem = `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
                        debugMessages.push(`    ✓ URL do Google Drive convertida: ${urlImagem}`);
                      }
                    }
                    
                    filme.classificacaoImg = urlImagem;
                    debugMessages.push(`    ✓ Imagem encontrada no campo "${nomeCampo}": ${filme.classificacaoImg}`);
                    imagemEncontrada = true;
                    break;
                  }
                }
                
                if (imagemEncontrada) break;
              } else {
                debugMessages.push(`    ✗ Não encontrado: "${variacao}"`);
              }
            }

            if (!imagemEncontrada) {
              debugMessages.push(`✗ Nenhuma imagem encontrada para faixa etária "${filme.faixaEtaria}"`);
              
              // Buscar por correspondência parcial
              const chaves = Object.keys(indicacaoMap);
              const correspondencias = chaves.filter(chave => 
                chave.includes(filme.faixaEtaria) || 
                filme.faixaEtaria.toString().includes(chave)
              );
              
              if (correspondencias.length > 0) {
                debugMessages.push(`Possíveis correspondências encontradas: ${correspondencias.join(', ')}`);
                
                // Usar a primeira correspondência encontrada
                const primeiraCorrespondencia = correspondencias[0];
                const dados = indicacaoMap[primeiraCorrespondencia];
                
                const possiveisNomes = ['imagem', 'url', 'imageUrl', 'src', 'link', 'photo'];
                for (const nomeCampo of possiveisNomes) {
                  if (dados[nomeCampo]) {
                    let urlImagem = dados[nomeCampo];
                    
                    // Converter URL do Google Drive para formato direto
                    if (urlImagem.includes('drive.google.com') && urlImagem.includes('/file/d/')) {
                      const fileId = urlImagem.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                      if (fileId) {
                        urlImagem = `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
                        debugMessages.push(`✓ URL do Google Drive convertida: ${urlImagem}`);
                      }
                    }
                    
                    filme.classificacaoImg = urlImagem;
                    debugMessages.push(`✓ Usando correspondência "${primeiraCorrespondencia}" com campo "${nomeCampo}": ${filme.classificacaoImg}`);
                    break;
                  }
                }
              }
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

        {/* Seção de Debug - Remover em produção */}
        <section style={{ backgroundColor: '#f0f0f0', padding: '20px', margin: '20px 0', fontSize: '12px' }}>
          <h3>Debug Info:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
            {debugInfo.join('\n')}
          </pre>
        </section>

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
                    onError={(e) => { e.target.src = "/Filmes/cartaz/placeholder.png"; }}
                  />
                )}
                <h3>{filme.nome}</h3>
                <p><strong>Horário:</strong> {filme.horarioExibicao}</p>
                <p><strong>Faixa Etária:</strong> {filme.faixaEtaria}</p>
                
                <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
                  <h4>Debug da Classificação:</h4>
                  <p><strong>URL da imagem:</strong> {filme.classificacaoImg || 'Não encontrada'}</p>
                  
                  {filme.classificacaoImg ? (
                    <div>
                      <p><strong>Testando carregamento da imagem:</strong></p>
                      <img
                        src={filme.classificacaoImg}
                        alt={`Classificação ${filme.faixaEtaria}`}
                        className={styles.imagemClassificacao}
                        style={{ maxWidth: '100px', border: '2px solid green' }}
                        onLoad={(e) => {
                          console.log(`✓ Imagem carregada com sucesso: ${filme.classificacaoImg}`);
                          e.target.style.border = '2px solid green';
                        }}
                        onError={(e) => { 
                          console.error(`✗ Erro ao carregar imagem: ${filme.classificacaoImg}`);
                          e.target.style.border = '2px solid red';
                          e.target.alt = 'Erro ao carregar imagem';
                        }}
                      />
                    </div>
                  ) : (
                    <p style={{ color: 'red' }}>❌ Imagem de classificação não disponível</p>
                  )}
                </div>
                
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