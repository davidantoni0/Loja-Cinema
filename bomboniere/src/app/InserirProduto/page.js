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
import styles from "./page.module.css"; // Importe o CSS Module

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
  function ImagemComFallback({ src, alt, driveId, className = styles.imagemProduto }) {
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
        className={className}
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
    <div className={styles.lanchoneteContainer}>
      <Link href="/Administrativo" className={styles.voltarLink}>
        Voltar
      </Link>
      
      <h1 className={styles.tituloPrincipal}>Cadastro de Novo Produto</h1>

      {novoProduto && (
        <div className={styles.formularioNovoProduto}>
          <p className={styles.codigoGerado}>
            <strong>Código gerado:</strong> {novoProduto.codigo}
          </p>

          <div className={styles.campoFormulario}>
            <label>Nome: </label>
            <input
              value={novoProduto.nome || ""}
              onChange={(e) => alterarNovo("nome", e.target.value)}
              placeholder="Digite o nome do produto..."
            />
          </div>

          <div className={styles.campoFormulario}>
            <label>Preço (R$): </label>
            <input
              type="number"
              value={novoProduto.preco || ""}
              onChange={(e) => alterarNovo("preco", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className={styles.campoFormulario}>
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
          </div>

          <div className={styles.campoFormulario}>
            <label>Imagem (Google Drive ou link direto):</label>
            <input
              value={novoProduto.imagem || ""}
              onChange={(e) =>
                alterarNovo("imagem", formatarLinkImagem(e.target.value))
              }
              placeholder="Cole o link da imagem aqui..."
            />
          </div>

          {novoProduto.imagem && (
            <div className={styles.previewImagem}>
              <ImagemComFallback 
                src={novoProduto.imagem} 
                alt="Imagem do produto"
                driveId={extrairDriveId(novoProduto.imagem)}
              />
            </div>
          )}

          <button 
            className={`${styles.btn} ${styles.btnSuccess}`} 
            onClick={adicionarProduto}
          >
            Adicionar Produto
          </button>
        </div>
      )}

      <h2 className={styles.tituloSecao}>Produtos Cadastrados</h2>
      
      <div className={styles.campoPesquisa}>
        <label>Pesquisar por nome: </label>
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Digite o nome do produto..."
        />
      </div>

      <hr className={styles.separador} />

      {produtosFiltrados.length === 0 && (
        <div className={styles.nenhumProduto}>
          <p>Nenhum produto encontrado.</p>
        </div>
      )}

      {produtosFiltrados.map((produto) => (
        <div key={produto.id} className={styles.produtoItem}>
          {editandoId === produto.id ? (
            <div className={styles.formularioEdicao}>
              <p className={styles.codigoGerado}>
                <strong>Código:</strong> {form.codigo}
              </p>

              <div className={styles.campoFormulario}>
                <label>Nome: </label>
                <input
                  value={form.nome || ""}
                  onChange={(e) => alterarForm("nome", e.target.value)}
                />
              </div>

              <div className={styles.campoFormulario}>
                <label>Preço (R$): </label>
                <input
                  type="number"
                  value={form.preco || ""}
                  onChange={(e) => alterarForm("preco", e.target.value)}
                />
              </div>

              <div className={styles.campoFormulario}>
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
              </div>

              <div className={styles.campoFormulario}>
                <label>Imagem (Google Drive ou link direto):</label>
                <input
                  value={form.imagem || ""}
                  onChange={(e) =>
                    alterarForm("imagem", formatarLinkImagem(e.target.value))
                  }
                />
              </div>

              {form.imagem && (
                <div className={styles.previewImagem}>
                  <ImagemComFallback 
                    src={form.imagem} 
                    alt="Imagem do produto"
                    driveId={extrairDriveId(form.imagem)}
                  />
                </div>
              )}

              <button 
                className={`${styles.btn} ${styles.btnSuccess}`} 
                onClick={salvarEdicao}
              >
                Salvar
              </button>
              <button 
                className={`${styles.btn} ${styles.btnSecondary}`} 
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div>
              <h3>{produto.nome}</h3>
              
              {produto.imagem && (
                <div className={styles.previewImagem}>
                  <ImagemComFallback 
                    src={produto.imagem} 
                    alt={produto.nome}
                    driveId={extrairDriveId(produto.imagem)}
                  />
                </div>
              )}
              
              <p>
                <strong>Código:</strong> 
                <span className={styles.codigoProduto}>{produto.codigo}</span>
              </p>
              <p>
                <strong>Preço:</strong> 
                <span className={styles.precoProduto}>R$ {produto.preco}</span>
              </p>
              <p><strong>Tamanho:</strong> {produto.tamanho}</p>
              <p>
                <strong>Status:</strong> 
                <span className={produto.emEstoque ? styles.statusEmEstoque : styles.statusForaEstoque}>
                  {produto.emEstoque ? "Em estoque" : "Fora de estoque"}
                </span>
              </p>

              <button 
                className={`${styles.btn} ${styles.btnWarning}`} 
                onClick={() => iniciarEdicao(produto)}
              >
                Editar
              </button>
              <button 
                className={`${styles.btn} ${styles.btnDanger}`} 
                onClick={() => excluirProduto(produto.id)}
              >
                Excluir
              </button>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`} 
                onClick={() => alternarEstoque(produto.id, produto.emEstoque)}
              >
                {produto.emEstoque ? "Marcar Fora de Estoque" : "Marcar Em Estoque"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}