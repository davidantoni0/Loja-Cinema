"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import styles from "./page.module.css";
import Link from "next/link";
import useUsuario from "../../hooks/useUsuario";

export default function EmCartaz() {
  const [filmes, setFilmes] = useState([]);
  const [indicacaoData, setIndicacaoData] = useState({});
  const [loading, setLoading] = useState(true);
  const { usuario, loadingUsuario } = useUsuario();

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

  // Função para buscar dados do Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Buscar filmes em cartaz
      const filmesQuery = query(collection(db, "filmes"), where("emCartaz", "==", true));
      const filmesSnapshot = await getDocs(filmesQuery);
      const filmesList = filmesSnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        // Converter URL do cartaz se for do Google Drive
        cartaz: doc.data().cartaz ? convertGoogleDriveUrl(doc.data().cartaz) : null
      }));

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

      setFilmes(filmesList);
      setIndicacaoData(indicacaoMap);
      
      console.log("Dados carregados:", { filmes: filmesList.length, indicacoes: Object.keys(indicacaoMap).length });
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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

  // Função para lidar com compra de ingresso (sem localStorage)
  const handleComprarIngresso = useCallback((filme) => {
    const infoCompra = {
      filme: filme,
      usuario: usuario,
      desconto: calcularDesconto(),
      timestamp: new Date().toISOString(),
    };

    // Em vez de localStorage, você pode usar state management ou Context API
    // Para fins de demonstração, vou usar sessionStorage que funciona no ambiente de desenvolvimento
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("filmeSelecionado", JSON.stringify(filme));
      sessionStorage.setItem("infoCompra", JSON.stringify(infoCompra));
    }
    
    console.log("Informações da compra salvas:", infoCompra);
    
    // Usar router do Next.js em vez de window.location
    window.location.href = "/EscolhaAssento";
  }, [usuario, calcularDesconto]);

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

  // Função para lidar com erro de carregamento de classificação
  const handleClassificacaoError = useCallback((e, filme) => {
    console.error(`✗ Erro ao carregar classificação para ${filme.nome}`);
    
    const faixaImg = buscarFaixaEtaria(filme.faixaEtaria);
    const match = faixaImg?.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      const formatosAlternativos = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w100`
      ];
      
      // Tentar o primeiro formato alternativo que ainda não foi testado
      const proximoFormato = formatosAlternativos.find(url => url !== faixaImg);
      if (proximoFormato && !e.target.dataset.tentativasClassificacao) {
        console.log(`Tentando formato alternativo para classificação: ${proximoFormato}`);
        e.target.dataset.tentativasClassificacao = '1';
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
  }, [buscarFaixaEtaria]);

  if (loadingUsuario || loading) return <p>Carregando dados...</p>;

  return (
    <div className={styles.container}>
      <Link className="voltar" href="../MenuPrincipal">Menu Principal</Link>
      <header className={styles.header}>
        <h1 className="titulo">Filmes em Cartaz</h1>
        <button className={styles.carrinho} onClick={() => window.location.href = "/Carrinho"}>
          Meu Carrinho
        </button>
      </header>

      <div className={styles.listaFilmes}>
        {filmes.map((filme) => (
          <div key={filme.id} className={styles.card}>
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
            <h2>{filme.nome}</h2>
            <p>
              <strong>Duração:</strong> {filme.duracao}
            </p>
            <p>
              <strong>Gênero:</strong> {filme.genero}
            </p>
            <p>
              <strong>Horário:</strong> {filme.horario || filme.horarioExibicao}
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
            
            {buscarFaixaEtaria(filme.faixaEtaria) && (
              <img
                src={buscarFaixaEtaria(filme.faixaEtaria)}
                alt={`Classificação ${filme.faixaEtaria === 0 ? 'Livre' : `${filme.faixaEtaria} anos`}`}
                className={styles.faixaEtaria}
                style={{ maxWidth: '80px', height: 'auto' }}
                onError={(e) => handleClassificacaoError(e, filme)}
                onLoad={() => {
                  console.log(`✓ Classificação carregada para ${filme.nome}`);
                }}
              />
            )}
            
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