"use client";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";

export default function Filmes() {
  const [filmes, setFilmes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [pesquisa, setPesquisa] = useState("");
  const [novoFilme, setNovoFilme] = useState(null);
  const [cartazes, setCartazes] = useState([]);
  const [faixas, setFaixas] = useState([]);

  // Função para extrair ID do Google Drive
  function extrairDriveId(url) {
    if (!url) return null;

    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                  url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    return match ? match[1] : (/^[a-zA-Z0-9_-]{20,}$/.test(url) ? url : null);
  }

  // Função para formatar o link do Google Drive
  function formatarLinkDrive(input) {
    if (!input) return "";

    input = input.trim();

    const driveId = extrairDriveId(input);
    if (driveId) {
      return `https://drive.google.com/uc?export=view&id=${driveId}`;
    }

    return input;
  }

  // Componente para imagem com fallback no Google Drive
  function ImagemComFallback({ src, alt, className = "" }) {
    const [urlAtual, setUrlAtual] = useState(src);
    const [tentativa, setTentativa] = useState(0);

    const driveId = extrairDriveId(src);
    const urlsAlternativas = driveId
      ? [
          `https://drive.google.com/uc?export=view&id=${driveId}`,
          `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000-h1000`,
          `https://lh3.googleusercontent.com/d/${driveId}`,
        ]
      : [src];

    function handleError() {
      if (tentativa < urlsAlternativas.length - 1) {
        setTentativa(tentativa + 1);
        setUrlAtual(urlsAlternativas[tentativa + 1]);
      }
    }

    useEffect(() => {
      setUrlAtual(src);
      setTentativa(0);
    }, [src]);

    return (
      <img
        src={urlAtual}
        alt={alt}
        className={className}
        onError={handleError}
      />
    );
  }

  function faixaEtariaParaNumero(faixa) {
    const mapa = {
      "Livre": 0,
      "10 anos": 10,
      "12 anos": 12,
      "14 anos": 14,
      "16 anos": 16,
      "18 anos": 18,
    };
    return mapa[faixa] ?? faixa;
  }

  // Menu de filmes em cartaz
  function MenuFilmesEmCartaz() {
    const filmesEmCartaz = filmes.filter(filme => filme.emCartaz);

    if (filmesEmCartaz.length === 0) {
      return (
        <div className={styles.menuCartazVazio}>
          <h3 className={styles.menuCartazTitulo}>🎬 Filmes em Cartaz</h3>
          <p>Nenhum filme em cartaz no momento</p>
        </div>
      );
    }

    return (
      <div className={styles.menuCartaz}>
        <h3 className={styles.menuCartazTitulo}>🎬 Filmes em Cartaz ({filmesEmCartaz.length}/5)</h3>
        <div className={styles.filmesGrid}>
          {filmesEmCartaz.map((filme, index) => (
            <div key={filme.id} className={styles.filmeCard} style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
              {filme.cartaz && (
                <ImagemComFallback
                  src={filme.cartaz}
                  alt={filme.nome}
                  className={styles.filmeCardImagem}
                />
              )}
              <div className={styles.filmeCardNome}>
                {filme.nome}
              </div>
              <div className={styles.filmeCardHorario}>
                ⏰ {filme.horarioExibicao || "Horário não definido"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carregar filmes do Firestore
  useEffect(() => {
    buscarFilmes();
  }, []);

  // Carregar cartazes do JSON
  useEffect(() => {
    async function carregarCartazes() {
      const res = await fetch("/Filmes/cartazes.json");
      const dados = await res.json();
      setCartazes(dados);
    }
    carregarCartazes();
  }, []);

  // Carregar faixas etárias do JSON
  useEffect(() => {
    async function carregarFaixas() {
      const res = await fetch("/FaixaEtaria/faixaetaria.json");
      const dados = await res.json();
      setFaixas(dados);
    }
    carregarFaixas();
  }, []);

  async function buscarFilmes() {
    const snapshot = await getDocs(collection(db, "filmes"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFilmes(lista);

    // Gerar próximo código numérico para novo filme
    const codigos = lista.map((f) => Number(f.codigo)).filter((c) => !isNaN(c));
    const proximoCodigo = codigos.length > 0 ? Math.max(...codigos) + 1 : 1000;
    setNovoFilme({
      codigo: proximoCodigo,
      nome: "",
      sinopse: "",
      duracao: "",
      faixaEtaria: "",
      elenco: "",
      distribuidora: "",
      cartaz: "",
      genero: "",
      horarioExibicao: "",
      emCartaz: true,
    });
  }

  async function excluirFilme(id) {
    await deleteDoc(doc(db, "filmes", id));
    buscarFilmes();
  }

  async function alternarEmCartaz(id, estadoAtual) {
    // Verificar limite de 5 filmes em cartaz
    if (!estadoAtual) {
      const filmesEmCartaz = filmes.filter(f => f.emCartaz && f.id !== id);
      if (filmesEmCartaz.length >= 5) {
        alert("⚠️ Limite máximo de 5 filmes em cartaz atingido! Remova um filme do cartaz antes de adicionar outro.");
        return;
      }
    }

    await updateDoc(doc(db, "filmes", id), {
      emCartaz: !estadoAtual,
    });
    buscarFilmes();
  }

  function iniciarEdicao(filme) {
    setEditandoId(filme.id);
    setForm({ ...filme });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({});
  }

  function alterarForm(campo, valor) {
    if (campo === "cartaz") {
      valor = formatarLinkDrive(valor);
    }
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function alterarNovo(campo, valor) {
    if (campo === "cartaz") {
      valor = formatarLinkDrive(valor);
    }
    setNovoFilme((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEdicao() {
    await updateDoc(doc(db, "filmes", editandoId), {
      codigo: form.codigo,
      nome: form.nome,
      sinopse: form.sinopse,
      duracao: form.duracao,
      faixaEtaria: form.faixaEtaria,
      elenco: form.elenco,
      distribuidora: form.distribuidora,
      cartaz: form.cartaz,
      genero: form.genero,
      horarioExibicao: form.horarioExibicao,
    });
    setEditandoId(null);
    setForm({});
    buscarFilmes();
  }

  async function adicionarFilme() {
    // Verificar limite de 5 filmes em cartaz para novos filmes
    if (novoFilme.emCartaz) {
      const filmesEmCartaz = filmes.filter(f => f.emCartaz);
      if (filmesEmCartaz.length >= 5) {
        alert("⚠️ Limite máximo de 5 filmes em cartaz atingido! Este filme será adicionado como 'Fora de cartaz'.");
        novoFilme.emCartaz = false;
      }
    }

    const novo = {
      ...novoFilme,
      faixaEtaria: faixaEtariaParaNumero(novoFilme.faixaEtaria),
    };
    await addDoc(collection(db, "filmes"), novo);
    buscarFilmes();
  }

  const filmesFiltrados = filmes.filter((filme) =>
    filme.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className={styles.filmesContainer}>
      <div className={styles.header}>
        <h1 className={styles.tituloPrincipal}>Gestão de Filmes</h1>
        <Link href="/Administrativo" className={styles.voltarLink}>
          Voltar
        </Link>
      </div>

      {/* Formulário de Novo Filme */}
      {novoFilme && (
        <div className={styles.formularioNovoFilme}>
          <h2 className={styles.tituloSecao}>Cadastro de Novo Filme</h2>
          <div className={styles.codigoFilme}>
            <strong>Código gerado:</strong> {novoFilme.codigo}
          </div>

          <div className={styles.campoFormulario}>
            <label>Nome</label>
            <input
              value={novoFilme.nome}
              onChange={(e) => alterarNovo("nome", e.target.value)}
              placeholder="Digite o nome do filme"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Duração</label>
            <input
              value={novoFilme.duracao}
              onChange={(e) => alterarNovo("duracao", e.target.value)}
              placeholder="Ex: 120 min"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Gênero</label>
            <input
              value={novoFilme.genero}
              onChange={(e) => alterarNovo("genero", e.target.value)}
              placeholder="Ex: Ação, Drama, Comédia"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Horário de Exibição</label>
            <input
              type="time"
              value={novoFilme.horarioExibicao}
              onChange={(e) => alterarNovo("horarioExibicao", e.target.value)}
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Faixa Etária</label>
            <select
              value={novoFilme.faixaEtaria}
              onChange={(e) => alterarNovo("faixaEtaria", e.target.value)}
            >
              <option value="">Selecione...</option>
              {faixas.map((f) => (
                <option key={f.faixa} value={f.faixa}>
                  {f.faixa}
                </option>
              ))}
            </select>
            {novoFilme.faixaEtaria && (
              <img
                src={faixas.find((f) => f.faixa === novoFilme.faixaEtaria)?.imagem}
                alt={novoFilme.faixaEtaria}
                className={styles.imagemFaixaEtaria}
              />
            )}
          </div>

          <div className={styles.campoFormulario}>
            <label>Elenco</label>
            <input
              value={novoFilme.elenco}
              onChange={(e) => alterarNovo("elenco", e.target.value)}
              placeholder="Principais atores"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Distribuidora</label>
            <input
              value={novoFilme.distribuidora}
              onChange={(e) => alterarNovo("distribuidora", e.target.value)}
              placeholder="Nome da distribuidora"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Cartaz (Google Drive ou link direto)</label>
            <input
              value={novoFilme.cartaz}
              onChange={(e) => alterarNovo("cartaz", e.target.value)}
              placeholder="Cole o link do cartaz aqui"
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Sinopse</label>
            <textarea
              value={novoFilme.sinopse}
              onChange={(e) => alterarNovo("sinopse", e.target.value)}
              placeholder="Descreva a história do filme"
            />
          </div>

          {novoFilme.cartaz && (
            <ImagemComFallback 
              src={novoFilme.cartaz} 
              alt="Cartaz selecionado" 
              className={styles.imagemCartaz}
            />
          )}

          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={adicionarFilme}>
            Adicionar Filme
          </button>
        </div>
      )}

      {/* Menu de Filmes em Cartaz */}
      <MenuFilmesEmCartaz />

      {/* Seção de Pesquisa */}
      <div className={styles.campoPesquisa}>
        <h2 className={styles.tituloSecao}>Filmes Cadastrados</h2>
        <label>Pesquisar filmes:</label>
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome do filme..."
        />
      </div>

      {/* Lista de Filmes */}
      {filmesFiltrados.length === 0 ? (
        <div className={styles.menuCartazVazio}>
          <p>Nenhum filme encontrado</p>
        </div>
      ) : (
        filmesFiltrados.map((filme) => (
          <div key={filme.id} className={styles.filmeItem}>
            {editandoId === filme.id ? (
              <div className={styles.formularioEdicao}>
                <div className={styles.codigoFilme}>
                  <strong>Código:</strong> {form.codigo}
                </div>

                <div className={styles.campoFormulario}>
                  <label>Nome</label>
                  <input
                    value={form.nome}
                    onChange={(e) => alterarForm("nome", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Duração</label>
                  <input
                    value={form.duracao}
                    onChange={(e) => alterarForm("duracao", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Gênero</label>
                  <input
                    value={form.genero}
                    onChange={(e) => alterarForm("genero", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Horário de Exibição</label>
                  <input
                    type="time"
                    value={form.horarioExibicao}
                    onChange={(e) => alterarForm("horarioExibicao", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Faixa Etária</label>
                  <select
                    value={form.faixaEtaria}
                    onChange={(e) => alterarForm("faixaEtaria", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {faixas.map((f) => (
                      <option key={f.faixa} value={f.faixa}>
                        {f.faixa}
                      </option>
                    ))}
                  </select>
                  {form.faixaEtaria && (
                    <img
                      src={faixas.find((f) => f.faixa === form.faixaEtaria)?.imagem}
                      alt={form.faixaEtaria}
                      className={styles.imagemFaixaEtaria}
                    />
                  )}
                </div>

                <div className={styles.campoFormulario}>
                  <label>Elenco</label>
                  <input
                    value={form.elenco}
                    onChange={(e) => alterarForm("elenco", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Distribuidora</label>
                  <input
                    value={form.distribuidora}
                    onChange={(e) => alterarForm("distribuidora", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Cartaz</label>
                  <input
                    value={form.cartaz}
                    onChange={(e) => alterarForm("cartaz", e.target.value)}
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label>Sinopse</label>
                  <textarea
                    value={form.sinopse}
                    onChange={(e) => alterarForm("sinopse", e.target.value)}
                  />
                </div>

                {form.cartaz && (
                  <ImagemComFallback 
                    src={form.cartaz} 
                    alt="Cartaz selecionado" 
                    className={styles.imagemCartaz}
                  />
                )}

                <div>
                  <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={salvarEdicao}>
                    Salvar
                  </button>
                  <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={cancelarEdicao}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3>{filme.nome}</h3>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    {filme.cartaz && (
                      <ImagemComFallback
                        src={filme.cartaz}
                        alt={filme.nome}
                        className={styles.imagemCartaz}
                      />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p><strong>Código:</strong> <span className={styles.codigoFilme}>{filme.codigo}</span></p>
                    <p><strong>Duração:</strong> {filme.duracao}</p>
                    <p><strong>Gênero:</strong> {filme.genero}</p>
                    <p><strong>Horário:</strong> {filme.horarioExibicao}</p>
                    <p>
                      <strong>Faixa Etária:</strong>
                      {filme.faixaEtaria && faixas.find((f) => f.faixa === filme.faixaEtaria) && (
                        <img
                          src={faixas.find((f) => f.faixa === filme.faixaEtaria)?.imagem}
                          alt={filme.faixaEtaria}
                          className={styles.imagemFaixaEtaria}
                        />
                      )}
                    </p>
                    <p><strong>Elenco:</strong> {filme.elenco}</p>
                    <p><strong>Distribuidora:</strong> {filme.distribuidora}</p>
                    <p>
                      <strong>Status:</strong> 
                      <span className={filme.emCartaz ? styles.statusEmCartaz : styles.statusForaCartaz}>
                        {filme.emCartaz ? "🎬 Em cartaz" : "❌ Fora de cartaz"}
                      </span>
                    </p>
                    <p><strong>Sinopse:</strong> {filme.sinopse}</p>
                  </div>
                </div>

                <div>
                  <button className={`${styles.btn} ${styles.btnWarning}`} onClick={() => iniciarEdicao(filme)}>
                    Editar
                  </button>
                  <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => excluirFilme(filme.id)}>
                    Excluir
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={() => alternarEmCartaz(filme.id, filme.emCartaz)}
                  >
                    {filme.emCartaz ? "Marcar Fora de Cartaz" : "Marcar Em Cartaz"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}