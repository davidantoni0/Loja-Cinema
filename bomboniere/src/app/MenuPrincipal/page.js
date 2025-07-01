"use client";

import { useEffect, useState } from "react";
import { db, storage } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

export default function MudarFilmes() {
  const [filmes, setFilmes] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [statusFirebase, setStatusFirebase] = useState('verificando');

  // Função para testar conectividade do Firebase
  async function testarFirebase() {
    try {
      console.log('Testando Firebase...');
      console.log('DB:', db);
      console.log('Storage:', storage);
      
      if (!db) {
        throw new Error('Firestore não inicializado');
      }
      
      if (!storage) {
        throw new Error('Storage não inicializado');
      }
      
      // Tentar acessar a coleção
      await getDocs(collection(db, "filmes"));
      console.log('Firestore: OK');
      
      setStatusFirebase('conectado');
      return true;
    } catch (error) {
      console.error('Erro no Firebase:', error);
      setStatusFirebase('erro');
      return false;
    }
  }

  // Mapeamento das classificações etárias para imagens
  const classificacaoImagens = {
    "L": "🟢", // Ou URL da imagem para Livre
    "10": "🔵", // Ou URL da imagem para 10 anos
    "12": "🟡", // Ou URL da imagem para 12 anos
    "14": "🟠", // Ou URL da imagem para 14 anos
    "16": "🔴", // Ou URL da imagem para 16 anos
    "18": "⚫", // Ou URL da imagem para 18 anos
  };

  const opcoesClassificacao = [
    { valor: "", label: "Selecione a classificação" },
    { valor: "L", label: "L - Livre" },
    { valor: "10", label: "10 - 10 anos" },
    { valor: "12", label: "12 - 12 anos" },
    { valor: "14", label: "14 - 14 anos" },
    { valor: "16", label: "16 - 16 anos" },
    { valor: "18", label: "18 - 18 anos" },
  ];

  const opcoesGenero = [
    { valor: "", label: "Selecione o gênero" },
    { valor: "Ação", label: "Ação" },
    { valor: "Aventura", label: "Aventura" },
    { valor: "Comédia", label: "Comédia" },
    { valor: "Drama", label: "Drama" },
    { valor: "Terror", label: "Terror" },
    { valor: "Suspense", label: "Suspense" },
    { valor: "Romance", label: "Romance" },
    { valor: "Ficção Científica", label: "Ficção Científica" },
    { valor: "Fantasia", label: "Fantasia" },
    { valor: "Animação", label: "Animação" },
    { valor: "Documentário", label: "Documentário" },
    { valor: "Musical", label: "Musical" },
    { valor: "Guerra", label: "Guerra" },
    { valor: "Western", label: "Western" },
    { valor: "Crime", label: "Crime" },
    { valor: "Biografia", label: "Biografia" },
    { valor: "Família", label: "Família" },
    { valor: "Mistério", label: "Mistério" },
    { valor: "Thriller", label: "Thriller" },
  ];

  useEffect(() => {
    async function carregarFilmes() {
      try {
        // Verificar se db está inicializado
        if (!db) {
          throw new Error('Firebase Firestore não está configurado');
        }
        
        const querySnapshot = await getDocs(collection(db, "filmes"));
        const dados = [];
        querySnapshot.forEach((doc) => {
          dados.push({ id: doc.id, ...doc.data() });
        });
        while (dados.length < 5) {
          dados.push({
            id: `filme${dados.length + 1}`,
            nome: "",
            sinopse: "",
            duracao: "",
            faixaEtaria: "",
            elenco: "",
            distribuidora: "",
            imagemURL: "",
          });
        }
        setFilmes(dados);
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        alert('Erro ao carregar filmes. Verifique a configuração do Firebase.');
      }
    }
    carregarFilmes();
  }, []);

  async function salvarFilme(index) {
    try {
      const filme = filmes[index];
      if (!db) {
        throw new Error('Firebase Firestore não está configurado');
      }
      const refDoc = doc(db, "filmes", filme.id);
      await setDoc(refDoc, filme);
      setEditandoIndex(null);
      alert('Filme salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar filme:', error);
      alert('Erro ao salvar filme. Tente novamente.');
    }
  }

  async function salvarTodos() {
    try {
      if (!db) {
        throw new Error('Firebase Firestore não está configurado');
      }
      
      for (let i = 0; i < filmes.length; i++) {
        const filme = filmes[i];
        if (filme.nome) { // Só salva filmes que têm nome
          const refDoc = doc(db, "filmes", filme.id);
          await setDoc(refDoc, filme);
        }
      }
      setEditandoIndex(null);
      alert("Todos os filmes foram salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar filmes:", error);
      alert("Erro ao salvar filmes. Verifique a configuração do Firebase e tente novamente.");
    }
  }

  async function excluirFilme(index) {
    try {
      const filme = filmes[index];
      if (!db) {
        throw new Error('Firebase Firestore não está configurado');
      }
      await deleteDoc(doc(db, "filmes", filme.id));
      const novosFilmes = [...filmes];
      novosFilmes[index] = {
        id: filme.id,
        nome: "",
        sinopse: "",
        duracao: "",
        genero: "",
        faixaEtaria: "",
        elenco: "",
        distribuidora: "",
        imagemURL: "",
      };
      setFilmes(novosFilmes);
      setEditandoIndex(index);
      alert('Filme excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir filme:', error);
      alert('Erro ao excluir filme. Tente novamente.');
    }
  }

  async function handleImagemChange(e, index) {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Arquivo selecionado:', file.name, file.size, file.type);
    
    try {
      // Verificar se storage está inicializado
      if (!storage) {
        throw new Error('Firebase Storage não está configurado');
      }
      
      console.log('Iniciando upload para:', `cartazes/${filmes[index].id}`);
      
      // Criar referência com nome único para evitar conflitos
      const timestamp = Date.now();
      const fileName = `${filmes[index].id}_${timestamp}`;
      const imagemRef = ref(storage, `cartazes/${fileName}`);
      
      console.log('Fazendo upload...');
      const snapshot = await uploadBytes(imagemRef, file);
      console.log('Upload concluído:', snapshot);
      
      console.log('Obtendo URL de download...');
      const url = await getDownloadURL(imagemRef);
      console.log('URL obtida:', url);
      
      const novosFilmes = [...filmes];
      novosFilmes[index].imagemURL = url;
      setFilmes(novosFilmes);
      alert('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao fazer upload da imagem:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      
      let mensagemErro = 'Erro ao carregar imagem. ';
      
      if (error.code === 'storage/unauthorized') {
        mensagemErro += 'Permissões insuficientes. Verifique as regras do Firebase Storage.';
      } else if (error.code === 'storage/canceled') {
        mensagemErro += 'Upload cancelado.';
      } else if (error.code === 'storage/unknown') {
        mensagemErro += 'Erro desconhecido. Verifique a configuração do Firebase.';
      } else if (error.code === 'storage/invalid-format') {
        mensagemErro += 'Formato de arquivo inválido.';
      } else if (error.code === 'storage/invalid-argument') {
        mensagemErro += 'Argumento inválido fornecido.';
      } else {
        mensagemErro += `${error.message}`;
      }
      
      alert(mensagemErro);
    }
  }

  function atualizarCampo(index, campo, valor) {
    const novosFilmes = [...filmes];
    novosFilmes[index][campo] = valor;
    setFilmes(novosFilmes);
  }

  function obterImagemClassificacao(classificacao) {
    return classificacaoImagens[classificacao] || classificacao;
  }

  return (
    <div className="p-4">
      {/* Botão de Salvar Tudo */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={salvarTodos}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
        >
          💾 Salvar Todos os Filmes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filmes.map((filme, index) => (
          <div key={filme.id} className="border rounded-xl p-4 shadow">
            {editandoIndex === index ? (
              // Modo de edição - mostra preview da imagem + input de upload
              <div>
                {filme.imagemURL ? (
                  <img
                    src={filme.imagemURL}
                    alt="Cartaz"
                    className="w-full h-64 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-300 flex items-center justify-center mb-2 rounded">
                    Sem cartaz
                  </div>
                )}
              </div>
            ) : (
              // Modo de visualização - só mostra a imagem
              <div>
                {filme.imagemURL ? (
                  <img
                    src={filme.imagemURL}
                    alt="Cartaz"
                    className="w-full h-64 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-300 flex items-center justify-center mb-2 rounded">
                    Sem cartaz
                  </div>
                )}
              </div>
            )}
            {editandoIndex === index ? (
              <div className="mt-2 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagemChange(e, index)}
                  className="w-full p-2 border rounded"
                />
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Nome do filme"
                  value={filme.nome}
                  onChange={(e) => atualizarCampo(index, "nome", e.target.value)}
                />
                <textarea
                  className="w-full p-2 border rounded h-20"
                  placeholder="Sinopse do filme"
                  value={filme.sinopse}
                  onChange={(e) => atualizarCampo(index, "sinopse", e.target.value)}
                />
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Duração (ex: 120 min)"
                  value={filme.duracao}
                  onChange={(e) => atualizarCampo(index, "duracao", e.target.value)}
                />
                
                {/* Lista suspensa para gênero */}
                <select
                  className="w-full p-2 border rounded"
                  value={filme.genero}
                  onChange={(e) => atualizarCampo(index, "genero", e.target.value)}
                >
                  {opcoesGenero.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                
                {/* Lista suspensa para classificação etária */}
                <select
                  className="w-full p-2 border rounded"
                  value={filme.faixaEtaria}
                  onChange={(e) => atualizarCampo(index, "faixaEtaria", e.target.value)}
                >
                  {opcoesClassificacao.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Elenco principal"
                  value={filme.elenco}
                  onChange={(e) => atualizarCampo(index, "elenco", e.target.value)}
                />
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Distribuidora/Produtora"
                  value={filme.distribuidora}
                  onChange={(e) => atualizarCampo(index, "distribuidora", e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => salvarFilme(index)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoIndex(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <p><strong>Nome:</strong> {filme.nome || "vazio"}</p>
                <p><strong>Sinopse:</strong> {filme.sinopse || "vazio"}</p>
                <p><strong>Duração:</strong> {filme.duracao || "vazio"}</p>
                <p><strong>Gênero:</strong> {filme.genero || "vazio"}</p>
                <p>
                  <strong>Faixa Etária:</strong> 
                  {filme.faixaEtaria ? (
                    <span className="ml-2">
                      {obterImagemClassificacao(filme.faixaEtaria)} {filme.faixaEtaria}
                    </span>
                  ) : (
                    " vazio"
                  )}
                </p>
                <p><strong>Elenco:</strong> {filme.elenco || "vazio"}</p>
                <p><strong>Distribuidora:</strong> {filme.distribuidora || "vazio"}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditandoIndex(index)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    {filme.nome ? "Modificar" : "Adicionar Filme"}
                  </button>
                  {filme.nome && (
                    <button
                      onClick={() => excluirFilme(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}