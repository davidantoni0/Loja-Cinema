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

export default function Lanchonete() {
  const [produtos, setProdutos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [pesquisa, setPesquisa] = useState("");
  const [novoProduto, setNovoProduto] = useState(null);

  useEffect(() => {
    buscarProdutos();
  }, []);

  function formatarLinkImagem(input) {
    if (!input) return "";
    
    // Remove espaços em branco
    input = input.trim();
    
    if (input.includes("drive.google.com")) {
      // Padrão 1: /d/ID/view ou /d/ID/edit
      let match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
      
      // Padrão 2: /file/d/ID/view
      if (!match) {
        match = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      }
      
      // Padrão 3: id= parameter
      if (!match) {
        match = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      }
      
      if (match && match[1]) {
        const driveId = match[1];
        // Tenta múltiplos formatos do Google Drive
        return `https://lh3.googleusercontent.com/d/${driveId}`;
      }
    }
    
    // Se já é apenas o ID (sem o link completo)
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) {
      return `https://lh3.googleusercontent.com/d/${input}`;
    }
    
    // Se não é do Google Drive, retorna como está
    return input;
  }

  // Função para extrair ID do Google Drive
  function extrairDriveId(url) {
    if (!url) return null;
    
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                  url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    return match ? match[1] : (/^[a-zA-Z0-9_-]{20,}$/.test(url) ? url : null);
  }

  // Componente para imagem com fallback
  function ImagemComFallback({ src, alt, driveId, style = { width: "200px", marginTop: "10px" } }) {
    const [urlAtual, setUrlAtual] = useState(src);
    const [tentativa, setTentativa] = useState(0);
    
    const urlsAlternativas = driveId ? [
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      `https://drive.google.com/uc?id=${driveId}`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000-h1000`
    ] : [src];

    const handleError = () => {
      console.log(`Erro ao carregar: ${urlAtual}`);
      if (tentativa < urlsAlternativas.length - 1) {
        const proximaTentativa = tentativa + 1;
        setTentativa(proximaTentativa);
        setUrlAtual(urlsAlternativas[proximaTentativa]);
        console.log(`Tentando URL alternativa: ${urlsAlternativas[proximaTentativa]}`);
      } else {
        console.log("Todas as URLs falharam");
      }
    };

    const handleLoad = () => {
      console.log(`Imagem carregada com sucesso: ${urlAtual}`);
    };

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

  async function buscarProdutos() {
    const snapshot = await getDocs(collection(db, "produtos"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProdutos(lista);

    const codigos = lista.map((p) => Number(p.codigo)).filter((c) => !isNaN(c));
    const proximoCodigo = codigos.length > 0 ? Math.max(...codigos) + 1 : 1000;
    setNovoProduto({
      codigo: proximoCodigo,
      nome: "",
      preco: "",
      tamanho: "único",
      imagem: "",
      emEstoque: true,
    });
  }

  async function excluirProduto(id) {
    await deleteDoc(doc(db, "produtos", id));
    buscarProdutos();
  }

  async function alternarEstoque(id, estadoAtual) {
    await updateDoc(doc(db, "produtos", id), {
      emEstoque: !estadoAtual,
    });
    buscarProdutos();
  }

  function iniciarEdicao(produto) {
    setEditandoId(produto.id);
    setForm({ ...produto });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({});
  }

  function alterarForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function alterarNovo(campo, valor) {
    setNovoProduto((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEdicao() {
    await updateDoc(doc(db, "produtos", editandoId), {
      codigo: form.codigo,
      nome: form.nome,
      preco: form.preco,
      tamanho: form.tamanho,
      imagem: form.imagem,
    });
    setEditandoId(null);
    setForm({});
    buscarProdutos();
  }

  async function adicionarProduto() {
    const novo = { ...novoProduto };
    await addDoc(collection(db, "produtos"), novo);
    buscarProdutos();
  }

  const produtosFiltrados = produtos.filter((produto) =>
    (produto.nome || "").toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <Link href="/Administrativo">Voltar</Link>
      <h1>Cadastro de Novo Produto</h1>

      {novoProduto && (
        <div style={{ border: "1px solid #aaa", padding: "15px", marginBottom: "30px", borderRadius: "8px" }}>
          <p><strong>Código gerado:</strong> {novoProduto.codigo}</p>

          <label>Nome: </label>
          <input
            value={novoProduto.nome || ""}
            onChange={(e) => alterarNovo("nome", e.target.value)}
          />
          <br />

          <label>Preço (R$): </label>
          <input
            type="number"
            value={novoProduto.preco || ""}
            onChange={(e) => alterarNovo("preco", e.target.value)}
          />
          <br />

          <label>Tamanho:</label>
          <select
            value={novoProduto.tamanho || "único"}
            onChange={(e) => alterarNovo("tamanho", e.target.value)}
          >
            <option value="único">Único</option>
            <option value="pequeno">Pequeno</option>
            <option value="médio">Médio</option>
            <option value="grande">Grande</option>
          </select>
          <br />

          <label>Imagem (Google Drive ou link direto):</label>
          <input
            value={novoProduto.imagem || ""}
            onChange={(e) =>
              alterarNovo("imagem", formatarLinkImagem(e.target.value))
            }
          />
          <br />
          {novoProduto.imagem && (
            <div>
              <ImagemComFallback 
                src={novoProduto.imagem} 
                alt="Imagem do produto"
                driveId={extrairDriveId(novoProduto.imagem)}
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                URL da imagem: {novoProduto.imagem}
              </p>
            </div>
          )}
          <br /><br />
          <button onClick={adicionarProduto}>Adicionar Produto</button>
        </div>
      )}

      <h2>Produtos Cadastrados</h2>
      <label>Pesquisar por nome: </label>
      <input
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
        placeholder="Digite o nome do produto..."
      />
      <hr />

      {produtosFiltrados.map((produto) => (
        <div key={produto.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", borderRadius: "8px" }}>
          {editandoId === produto.id ? (
            <div>
              <p><strong>Código:</strong> {form.codigo}</p>

              <label>Nome: </label>
              <input
                value={form.nome || ""}
                onChange={(e) => alterarForm("nome", e.target.value)}
              />
              <br />

              <label>Preço (R$): </label>
              <input
                type="number"
                value={form.preco || ""}
                onChange={(e) => alterarForm("preco", e.target.value)}
              />
              <br />

              <label>Tamanho:</label>
              <select
                value={form.tamanho || "único"}
                onChange={(e) => alterarForm("tamanho", e.target.value)}
              >
                <option value="único">Único</option>
                <option value="pequeno">Pequeno</option>
                <option value="médio">Médio</option>
                <option value="grande">Grande</option>
              </select>
              <br />

              <label>Imagem (Google Drive ou link direto):</label>
              <input
                value={form.imagem || ""}
                onChange={(e) =>
                  alterarForm("imagem", formatarLinkImagem(e.target.value))
                }
              />
              <br />
              {form.imagem && (
                <div>
                  <ImagemComFallback 
                    src={form.imagem} 
                    alt="Imagem do produto"
                    driveId={extrairDriveId(form.imagem)}
                  />
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    URL da imagem: {form.imagem}
                  </p>
                </div>
              )}
              <br /><br />
              <button onClick={salvarEdicao}>Salvar</button>{" "}
              <button onClick={cancelarEdicao}>Cancelar</button>
            </div>
          ) : (
            <div>
              <h3>{produto.nome}</h3>
              {produto.imagem && (
                <div>
                  <ImagemComFallback 
                    src={produto.imagem} 
                    alt={produto.nome}
                    driveId={extrairDriveId(produto.imagem)}
                    style={{ width: "200px" }}
                  />
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    URL da imagem: {produto.imagem}
                  </p>
                </div>
              )}
              <p><strong>Código:</strong> {produto.codigo}</p>
              <p><strong>Preço:</strong> R$ {produto.preco}</p>
              <p><strong>Tamanho:</strong> {produto.tamanho}</p>
              <p><strong>Status:</strong> {produto.emEstoque ? "🟢 Em estoque" : "🔴 Fora de estoque"}</p>

              <button onClick={() => iniciarEdicao(produto)}>Editar</button>{" "}
              <button onClick={() => excluirProduto(produto.id)}>Excluir</button>{" "}
              <button onClick={() => alternarEstoque(produto.id, produto.emEstoque)}>
                {produto.emEstoque ? "Marcar Fora de Estoque" : "Marcar Em Estoque"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}