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
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function alterarNovo(campo, valor) {
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
    const novo = { ...novoFilme };
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

          <label>Cartaz / Filme:</label>
          <select
            value={novoFilme.cartaz}
            onChange={(e) => alterarNovo("cartaz", e.target.value)}
          >
            <option value="">Selecione...</option>
            {cartazes.map((c) => (
              <option key={c.cartaz} value={c.cartaz}>
                {c.filme}
              </option>
            ))}
          </select>
          <br />
          {novoFilme.cartaz && (
            <img
              src={novoFilme.cartaz}
              alt="Cartaz selecionado"
              style={{ width: "200px", marginTop: "10px" }}
            />
          )}
          <br />
          <button onClick={adicionarFilme}>Adicionar Filme</button>
        </div>
      )}

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

              <label>Cartaz / Filme:</label>
              <select
                value={form.cartaz}
                onChange={(e) => alterarForm("cartaz", e.target.value)}
              >
                <option value="">Selecione...</option>
                {cartazes.map((c) => (
                  <option key={c.cartaz} value={c.cartaz}>
                    {c.filme}
                  </option>
                ))}
              </select>
              <br />
              {form.cartaz && (
                <img
                  src={form.cartaz}
                  alt="Cartaz selecionado"
                  style={{ width: "200px", marginTop: "10px" }}
                />
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
                <img
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
