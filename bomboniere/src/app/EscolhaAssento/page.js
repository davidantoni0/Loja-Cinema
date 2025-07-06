"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./page.module.css";
import Assentos from "../../Components/Filmes-assentos/Assentos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import useUsuario from "../../hooks/useUsuario";

// Função melhorada para extrair ID do Google Drive
function extrairDriveId(url) {
  if (!url) return null;

  // Padrões mais abrangentes para URLs do Google Drive
  const padroes = [
    /\/d\/([a-zA-Z0-9_-]+)/,              // /d/ID
    /\/file\/d\/([a-zA-Z0-9_-]+)/,        // /file/d/ID
    /[?&]id=([a-zA-Z0-9_-]+)/,           // ?id=ID ou &id=ID
    /\/open\?id=([a-zA-Z0-9_-]+)/,       // /open?id=ID
    /\/uc\?id=([a-zA-Z0-9_-]+)/,         // /uc?id=ID
    /\/uc\?export=view&id=([a-zA-Z0-9_-]+)/, // /uc?export=view&id=ID
  ];

  for (const padrao of padroes) {
    const match = url.match(padrao);
    if (match) {
      return match[1];
    }
  }

  // Se parecer um ID direto (28+ caracteres alfanuméricos)
  if (/^[a-zA-Z0-9_-]{28,}$/.test(url)) {
    return url;
  }

  return null;
}

// Componente robusto para imagem com fallback do Google Drive
function ImagemComFallback({ src, alt, className = "" }) {
  const [urlAtual, setUrlAtual] = useState('');
  const [tentativaAtual, setTentativaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  
  // Gera todas as URLs possíveis para tentar
  const urlsPossiveis = useMemo(() => {
    if (!src) return [];
    
    const driveId = extrairDriveId(src);
    const urls = [src]; // URL original primeiro
    
    if (driveId) {
      urls.push(
        `https://drive.google.com/uc?export=view&id=${driveId}`,
        `https://drive.google.com/uc?id=${driveId}`,
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000-h1000`,
        `https://lh3.googleusercontent.com/d/${driveId}=w1000-h1000`,
        `https://lh3.googleusercontent.com/d/${driveId}`,
        `https://drive.google.com/file/d/${driveId}/preview`,
        `https://docs.google.com/uc?export=view&id=${driveId}`
      );
    }
    
    return [...new Set(urls)]; // Remove duplicatas
  }, [src]);
  
  const handleError = useCallback(() => {
    console.log(`Erro ao carregar URL ${tentativaAtual + 1}/${urlsPossiveis.length}: ${urlAtual}`);
    
    if (tentativaAtual < urlsPossiveis.length - 1) {
      const proximaTentativa = tentativaAtual + 1;
      setTentativaAtual(proximaTentativa);
      setUrlAtual(urlsPossiveis[proximaTentativa]);
      setCarregando(true);
    } else {
      setErro(true);
      setCarregando(false);
    }
  }, [tentativaAtual, urlsPossiveis, urlAtual]);

  const handleLoad = useCallback(() => {
    console.log(`Imagem carregada com sucesso: ${urlAtual}`);
    setCarregando(false);
    setErro(false);
  }, [urlAtual]);

  // Reset quando a URL source muda
  useEffect(() => {
    if (urlsPossiveis.length > 0) {
      setTentativaAtual(0);
      setUrlAtual(urlsPossiveis[0]);
      setCarregando(true);
      setErro(false);
    }
  }, [src, urlsPossiveis]);

  if (!src) {
    return null;
  }

  if (erro) {
    return (
      <div className={styles.cartazPlaceholder || className}>
        <p>❌ Imagem não disponível</p>
        <small>Tentativas esgotadas: {urlsPossiveis.length}</small>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {carregando && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1
        }}>
          <p>🔄 Carregando... ({tentativaAtual + 1}/{urlsPossiveis.length})</p>
        </div>
      )}
      
      <img
        src={urlAtual}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        style={{ 
          opacity: carregando ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
}

export default function EscolhaAssento() {
  const router = useRouter();

  const [filme, setFilme] = useState(null);
  const [faixas, setFaixas] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [dataSelecionada, setDataSelecionada] = useState(
    () => new Date().toISOString().substring(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [loadingFilme, setLoadingFilme] = useState(true);

  const { usuario, loadingUsuario } = useUsuario();
  const [infoCompra, setInfoCompra] = useState(null);
  const [precoBase] = useState(25.0);

  useEffect(() => {
    buscarFilmeCompleto();
    buscarFaixas();
  }, []);

  useEffect(() => {
    if (usuario?.uid) {
      contarPendentes();
    }
  }, [usuario]);

  useEffect(() => {
    if (filme && dataSelecionada) {
      buscarAssentosOcupados();
    }
  }, [filme, dataSelecionada]);

  // Função para buscar os dados completos do filme no Firestore, combinando dados do sessionStorage
  async function buscarFilmeCompleto() {
    if (typeof window !== "undefined") {
      const filmeStorage = sessionStorage.getItem("filmeSelecionado");
      if (filmeStorage) {
        const dadosStorage = JSON.parse(filmeStorage);

        try {
          if (dadosStorage.codigo1002) {
            const filmesRef = collection(db, "filmes");
            const q = query(filmesRef, where("codigo1002", "==", dadosStorage.codigo1002));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const filmeDoc = querySnapshot.docs[0];
              const dadosFirestore = filmeDoc.data();

              const filmeFinal = {
                ...dadosStorage,
                ...dadosFirestore,
                assentos: gerarAssentos(40),
              };

              setFilme(filmeFinal);
            } else {
              // Não encontrou no Firestore, usa dados do storage
              setFilme({
                ...dadosStorage,
                assentos: gerarAssentos(40),
              });
            }
          } else {
            // Sem código, usa dados do storage
            setFilme({
              ...dadosStorage,
              assentos: gerarAssentos(40),
            });
          }
        } catch (error) {
          console.error("Erro ao buscar filme no Firestore:", error);
          setFilme({
            ...dadosStorage,
            assentos: gerarAssentos(40),
          });
        }
      }

      const info = sessionStorage.getItem("infoCompra");
      if (info) {
        setInfoCompra(JSON.parse(info));
      }
    }

    setLoadingFilme(false);
  }

  async function buscarFaixas() {
    try {
      const res = await fetch("/FaixaEtaria/faixaetaria.json");
      const data = await res.json();
      setFaixas(data);
    } catch (err) {
      console.error("Erro ao carregar faixas etárias:", err);
    }
  }

  function calcularDesconto() {
    if (!usuario) return 0;
    let desconto = 0;
    if (usuario.estudante) desconto += 50;
    if (usuario.deficiente) desconto += 50;
    return Math.min(desconto, 50);
  }

  function calcularPreco(quantidade) {
    const desconto = calcularDesconto();
    const precoComDesconto = precoBase * (1 - desconto / 100);
    return {
      precoUnitario: precoComDesconto,
      precoTotal: precoComDesconto * quantidade,
      desconto: desconto,
      economizado: (precoBase - precoComDesconto) * quantidade,
      precoOriginal: precoBase,
    };
  }

  async function contarPendentes() {
    if (!usuario?.uid) {
      setPendentesCount(0);
      return;
    }

    try {
      const q = query(
        collection(db, "ingressos"),
        where("usuarioId", "==", usuario.uid),
        where("pago", "==", false)
      );
      const snapshot = await getDocs(q);
      setPendentesCount(snapshot.size);
    } catch (error) {
      console.error("Erro ao contar pendentes:", error);
      setPendentesCount(0);
    }
  }

  function buscarImagemFaixa(faixa) {
    const item = faixas.find((f) => f.faixa === faixa);
    return item ? item.imagem : "";
  }

  function gerarAssentos(qtd) {
    return Array.from({ length: qtd }, (_, i) => ({
      numero: i + 1,
      selecionado: false,
      disponivel: true,
    }));
  }

  async function buscarAssentosOcupados() {
    try {
      const dataInicio = new Date(dataSelecionada + "T00:00:00");
      const dataFim = new Date(dataSelecionada + "T23:59:59");

      const q = query(
        collection(db, "ingressos"),
        where("filme", "==", filme.nome),
        where("pago", "==", true),
        where("dataCompra", ">=", dataInicio),
        where("dataCompra", "<=", dataFim)
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
    } catch (error) {
      console.error("Erro ao buscar assentos ocupados:", error);
    }
  }

  function toggleAssento(numero) {
    const assento = filme.assentos.find((a) => a.numero === numero);
    if (!assento || !assento.disponivel) return;

    const novo = { ...filme };
    novo.assentos = novo.assentos.map((a) =>
      a.numero === numero ? { ...a, selecionado: !a.selecionado } : a
    );
    setFilme(novo);
  }

  async function confirmarIngresso() {
    if (loading) return;

    const assentosSelecionados = filme.assentos.filter((a) => a.selecionado);
    if (assentosSelecionados.length === 0) {
      alert("Selecione pelo menos um assento.");
      return;
    }

    if (!usuario?.uid || !usuario?.email) {
      alert("Você precisa fazer login para comprar ingressos.");
      router.push("/Login");
      return;
    }

    setLoading(true);

    const precoInfo = calcularPreco(assentosSelecionados.length);

    const dadosIngresso = {
      filme: filme.nome,
      dataCompra: serverTimestamp(),
      dataSessao: dataSelecionada,
      quantidade: assentosSelecionados.length,
      assentos: assentosSelecionados.map((a) => a.numero),
      pago: false,
      usuarioId: usuario.uid,
      usuarioEmail: usuario.email,
      usuarioNome: usuario.nome,
      precoUnitario: precoInfo.precoUnitario,
      precoTotal: precoInfo.precoTotal,
      desconto: precoInfo.desconto,
      valorEconomizado: precoInfo.economizado,
      usuarioEstudante: usuario.estudante || false,
      usuarioDeficiente: usuario.deficiente || false,
      usuarioFuncionario: usuario.funcionario || false,
      horarioExibicao: filme.horarioExibicao || filme.horario,
      codigoFilme: filme.codigo1002 || null,
    };

    try {
      await addDoc(collection(db, "ingressos"), dadosIngresso);

      const detalheCompra = {
        ...dadosIngresso,
        timestamp: new Date().toISOString(),
        assentosSelecionados: assentosSelecionados,
      };
      sessionStorage.setItem("ultimaCompra", JSON.stringify(detalheCompra));

      alert(
        `Ingresso reservado com sucesso!\nTotal: R$ ${precoInfo.precoTotal.toFixed(
          2
        )}\nDesconto aplicado: ${precoInfo.desconto}%\nEconomizado: R$ ${precoInfo.economizado.toFixed(
          2
        )}`
      );

      setFilme({ ...filme, assentos: gerarAssentos(40) });
      contarPendentes();
    } catch (error) {
      console.error("Erro ao salvar ingresso:", error);
      alert("Erro ao salvar ingresso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingUsuario || loadingFilme) {
    return (
      <div className={styles.container}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!filme) {
    return (
      <div className={styles.container}>
        <p>Filme não encontrado. Selecione um filme primeiro.</p>
        <Link href="/MenuPrincipal">
          <button className={styles.button}>Voltar ao Menu</button>
        </Link>
      </div>
    );
  }

  const faixaImg = buscarImagemFaixa(filme.faixaEtaria);
  const assentosSelecionados = filme.assentos.filter((a) => a.selecionado);
  const precoInfo = calcularPreco(assentosSelecionados.length);

  return (
    <div className={styles.container}>
      <h1>{filme.nome}</h1>

      {filme.cartaz && (
        <div className={styles.cartazContainer}>
          <ImagemComFallback
            src={filme.cartaz}
            alt={`Cartaz do filme ${filme.nome}`}
            className={styles.cartaz}
          />
        </div>
      )}

      <p>
        <strong>Sinopse:</strong> {filme.sinopse}
      </p>
      <p>
        <strong>Duração:</strong> {filme.duracao}
      </p>
      <p>
        <strong>Gênero:</strong> {filme.genero}
      </p>
      <p>
        <strong>Horário:</strong> {filme.horarioExibicao || filme.horario}
      </p>
      <p>
        <strong>Distribuidora:</strong> {filme.distribuidora}
      </p>
      <p>
        <strong>Elenco:</strong> {filme.elenco}
      </p>

      {faixaImg && (
        <img
          src={faixaImg}
          alt={`Classificação ${filme.faixaEtaria}`}
          className={styles.faixaEtaria}
        />
      )}

      <label htmlFor="dataSessao" style={{ marginTop: 20, display: "block" }}>
        Selecione a data da sessão:
      </label>
      <input
        type="date"
        id="dataSessao"
        value={dataSelecionada}
        min={new Date().toISOString().substring(0, 10)}
        onChange={(e) => setDataSelecionada(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {/* Informações de preço */}
      <div className={styles.precoInfo}>
        {precoInfo.desconto > 0 ? (
          <p className={styles.desconto}>
            <span style={{ textDecoration: "line-through", marginRight: 8 }}>
              R$ {precoInfo.precoOriginal.toFixed(2)}
            </span>
            <span>
              R$ {precoInfo.precoUnitario.toFixed(2)} ({precoInfo.desconto}% OFF)
            </span>
          </p>
        ) : (
          <p>
            <strong>Preço por ingresso:</strong> R${" "}
            {precoInfo.precoUnitario.toFixed(2)}
          </p>
        )}
      </div>

      <h2>Selecione seus assentos:</h2>
      <Assentos
        assentos={filme.assentos}
        onToggleAssento={toggleAssento}
        onConfirmar={confirmarIngresso}
        onCancelar={() => setFilme({ ...filme, assentos: gerarAssentos(40) })}
        loading={loading}
      />

      {/* Resumo da compra */}
      {assentosSelecionados.length > 0 && (
        <div className={styles.resumoCompra}>
          <h3>Resumo da Compra</h3>
          <p>
            <strong>Assentos selecionados:</strong>{" "}
            {assentosSelecionados.map((a) => a.numero).join(", ")}
          </p>
          <p>
            <strong>Quantidade:</strong> {assentosSelecionados.length}
          </p>
          <p>
            {precoInfo.desconto > 0 ? (
              <>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#888",
                    marginRight: 8,
                  }}
                >
                  Preço unitário: R$ {precoInfo.precoOriginal.toFixed(2)}
                </span>
                <span>
                  Preço unitário com desconto: R$ {precoInfo.precoUnitario.toFixed(2)} (
                  {precoInfo.desconto}% OFF)
                </span>
              </>
            ) : (
              <>Preço unitário: R$ {precoInfo.precoUnitario.toFixed(2)}</>
            )}
          </p>
          <p>
            <strong>Total:</strong> R$ {precoInfo.precoTotal.toFixed(2)}
          </p>
          {precoInfo.economizado > 0 && (
            <p className={styles.economia}>
              <strong>Você economizou:</strong> R$ {precoInfo.economizado.toFixed(2)}
            </p>
          )}
        </div>
      )}

      <Link href="/Carrinho" className={styles.carrinhoLink} aria-label="Ver carrinho">
        <div className={styles.carrinhoIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="32"
            height="32"
          >
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm0 2zm10-2c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zm0 2zm-9.83-4l.84-4h7.92l.86 4H7.17zM7 4h10v2H7V4zm-2 4h14l-1.25 6H6.8L5 8z" />
          </svg>
          {pendentesCount > 0 && <span className={styles.badge}>{pendentesCount}</span>}
        </div>
      </Link>

      <Link href="/MenuPrincipal">
        <button className={styles.button} disabled={loading}>
          {loading ? "Confirmando..." : "Menu Principal"}
        </button>
      </Link>
    </div>
  );
}