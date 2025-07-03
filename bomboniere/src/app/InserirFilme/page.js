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
  function ImagemComFallback({ src, alt, style = { width: "200px", marginTop: "10px" } }) {
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

    function handleLoad() {
      // imagem carregou com sucesso
    }

    useEffect(() => {
      setUrlAtual(src);
      setTentativa(0);
    }, [src]);

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


    return (
      <img
        src={urlAtual}
        alt={alt}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  // Menu de filmes em cartaz
function MenuFilmesEmCartaz() {
  const filmesEmCartaz = filmes.filter(filme => filme.emCartaz);

  if (filmesEmCartaz.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "30px",
        textAlign: "center",
        color: "#000"  // <- tudo herdará preto
      }}>
        <h3 style={{ color: "#000" }}>🎬 Filmes em Cartaz</h3>
        <p style={{ color: "#000" }}>Nenhum filme em cartaz no momento</p>
      </div>
    );
  }

    return (
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "30px" ,
        color:"black"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>🎬 Filmes em Cartaz ({filmesEmCartaz.length}/5)</h3>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "15px", 
          justifyContent: "center" 
        }}>
          {filmesEmCartaz.map((filme) => (
            <div key={filme.id} style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              textAlign: "center",
              minWidth: "150px",
              maxWidth: "180px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              {filme.cartaz && (
                <ImagemComFallback
                  src={filme.cartaz}
                  alt={filme.nome}
                  style={{ 
                    width: "120px", 
                    height: "160px", 
                    objectFit: "cover",
                    borderRadius: "4px",
                    marginBottom: "8px"
                  }}
                />
              )}
              <h4 style={{ 
                fontSize: "14px", 
                margin: "8px 0 4px 0",
                lineHeight: "1.2"
              }}>
                {filme.nome}
              </h4>
              <p style={{ 
                fontSize: "12px", 
                color: "#666", 
                margin: "0",
                fontWeight: "bold"
              }}>
                ⏰ {filme.horarioExibicao || "Horário não definido"}
              </p>
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
    <div style={{ padding: "20px" }}>
      <Link href="/Administrativo">Voltar</Link>
      <h1>Cadastro de Novo Filme</h1>
      {novoFilme && (
        <div
          style={{
            border: "1px solid #aaa",
            padding: "15px",
            marginBottom: "30px",
            borderRadius: "8px",
          }}
        >
          <p>
            <strong>Código gerado:</strong> {novoFilme.codigo}
          </p>

          <label>Nome: </label>
          <input
            value={novoFilme.nome}
            onChange={(e) => alterarNovo("nome", e.target.value)}
          />
          <br />

          <label>Sinopse: </label>
          <textarea
            value={novoFilme.sinopse}
            onChange={(e) => alterarNovo("sinopse", e.target.value)}
          />
          <br />

          <label>Duração: </label>
          <input
            value={novoFilme.duracao}
            onChange={(e) => alterarNovo("duracao", e.target.value)}
          />
          <br />

          <label>Gênero: </label>
          <input
            value={novoFilme.genero}
            onChange={(e) => alterarNovo("genero", e.target.value)}
          />
          <br />

          <label>Horário de Exibição: </label>
          <input
            type="time"
            value={novoFilme.horarioExibicao}
            onChange={(e) => alterarNovo("horarioExibicao", e.target.value)}
          />
          <br />

          <label>Faixa Etária:</label>
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
              style={{ width: "40px", marginLeft: 8 }}
            />
          )}
          <br />

          <label>Elenco: </label>
          <input
            value={novoFilme.elenco}
            onChange={(e) => alterarNovo("elenco", e.target.value)}
          />
          <br />

          <label>Distribuidora: </label>
          <input
            value={novoFilme.distribuidora}
            onChange={(e) => alterarNovo("distribuidora", e.target.value)}
          />
          <br />

          <label>Cartaz / Filme (Google Drive ou link direto):</label>
          <input
            value={novoFilme.cartaz}
            onChange={(e) => alterarNovo("cartaz", e.target.value)}
          />
          <br />
          {novoFilme.cartaz && (
            <ImagemComFallback src={novoFilme.cartaz} alt="Cartaz selecionado" />
          )}
          <br />
          <button onClick={adicionarFilme}>Adicionar Filme</button>
        </div>
      )}

      {/* Menu de Filmes em Cartaz */}
      <MenuFilmesEmCartaz />

      <h2>Filmes Cadastrados</h2>
      <label>Pesquisar por nome: </label>
      <input
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
        placeholder="Digite o nome do filme..."
      />
      <hr />

      {filmesFiltrados.map((filme) => (
        <div
          key={filme.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            margin: "10px 0",
            borderRadius: "8px",
          }}
        >
          {editandoId === filme.id ? (
            <div>
              <p>
                <strong>Código:</strong> {form.codigo}
              </p>

              <label>Nome: </label>
              <input
                value={form.nome}
                onChange={(e) => alterarForm("nome", e.target.value)}
              />
              <br />

              <label>Sinopse: </label>
              <textarea
                value={form.sinopse}
                onChange={(e) => alterarForm("sinopse", e.target.value)}
              />
              <br />

              <label>Duração: </label>
              <input
                value={form.duracao}
                onChange={(e) => alterarForm("duracao", e.target.value)}
              />
              <br />

              <label>Gênero: </label>
              <input
                value={form.genero}
                onChange={(e) => alterarForm("genero", e.target.value)}
              />
              <br />

              <label>Horário de Exibição: </label>
              <input
                type="time"
                value={form.horarioExibicao}
                onChange={(e) => alterarForm("horarioExibicao", e.target.value)}
              />
              <br />

              <label>Faixa Etária:</label>
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
                  style={{ width: "40px", marginLeft: 8 }}
                />
              )}
              <br />

              <label>Elenco: </label>
              <input
                value={form.elenco}
                onChange={(e) => alterarForm("elenco", e.target.value)}
              />
              <br />

              <label>Distribuidora: </label>
              <input
                value={form.distribuidora}
                onChange={(e) => alterarForm("distribuidora", e.target.value)}
              />
              <br />

              <label>Cartaz / Filme (Google Drive ou link direto):</label>
              <input
                value={form.cartaz}
                onChange={(e) => alterarForm("cartaz", e.target.value)}
              />
              <br />
              {form.cartaz && (
                <ImagemComFallback src={form.cartaz} alt="Cartaz selecionado" />
              )}
              <br />
              <button onClick={salvarEdicao}>Salvar</button>{" "}
              <button onClick={cancelarEdicao}>Cancelar</button>
            </div>
          ) : (
            <div>
              <h3>{filme.nome}</h3>
              <p>
                <strong>Código:</strong> {filme.codigo}
              </p>
              {filme.cartaz && (
                <ImagemComFallback
                  src={filme.cartaz}
                  alt={filme.nome}
                  style={{ width: "200px" }}
                />
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
                <strong>Horário:</strong> {filme.horarioExibicao}
              </p>
              <p>
                <strong>Faixa Etária:</strong>{" "}
                {filme.faixaEtaria && (
                  <img
                    src={faixas.find((f) => f.faixa === filme.faixaEtaria)?.imagem}
                    alt={filme.faixaEtaria}
                    style={{ width: "40px", marginLeft: 8 }}
                  />
                )}
              </p>
              <p>
                <strong>Elenco:</strong> {filme.elenco}
              </p>
              <p>
                <strong>Distribuidora:</strong> {filme.distribuidora}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {filme.emCartaz ? "🎬 Em cartaz" : "❌ Fora de cartaz"}
              </p>

              <button onClick={() => iniciarEdicao(filme)}>Editar</button>{" "}
              <button onClick={() => excluirFilme(filme.id)}>Excluir</button>{" "}
              <button
                onClick={() => alternarEmCartaz(filme.id, filme.emCartaz)}
              >
                {filme.emCartaz ? "Marcar Fora de Cartaz" : "Marcar Em Cartaz"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}