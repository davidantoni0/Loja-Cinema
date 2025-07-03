"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import MenuButton from "@/Components/Bomboniere/menubutton";
import Link from "next/link";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export default function MenuLoja() {
  const [menuItems, setMenuItems] = useState([]);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const loadProdutos = async () => {
      try {
        const produtosRef = collection(db, "produtos");
        const q = query(produtosRef, where("emEstoque", "==", true));
        const snapshot = await getDocs(q);

        const items = [];
        const initialQuantities = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          const nomeCapitalizado = data.tamanho
            ? data.tamanho.charAt(0).toUpperCase() + data.tamanho.slice(1)
            : "";

          const nomeExibido =
            data.tamanho && data.tamanho.toLowerCase() !== "único"
              ? `${data.nome} ${nomeCapitalizado}`
              : data.nome;

          items.push({
            id: doc.id,
            nomeOriginal: data.nome,
            nomeExibido,
            tamanho: data.tamanho,
            imagem: data.imagem,
            preco: parseFloat(data.preco),
          });

          initialQuantities[nomeExibido] = 0;
        });

        setMenuItems(items);
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    loadProdutos();
  }, []);

  const totalGeral = menuItems.reduce((acc, item) => {
    const qtd = quantities[item.nomeExibido] || 0;
    return acc + qtd * item.preco;
  }, 0);

  const handleQuantityChange = (nomeExibido, delta) => {
    setQuantities((prev) => {
      const novaQtd = Math.max(0, (prev[nomeExibido] || 0) + delta);
      return { ...prev, [nomeExibido]: novaQtd };
    });
  };

  const handleFinalizarPedido = async () => {
    const userDataLocal = localStorage.getItem("dadosUsuarioLogado");
    const user = userDataLocal ? JSON.parse(userDataLocal) : null;

    const itensSelecionados = menuItems
      .map((item) => {
        const qtd = quantities[item.nomeExibido];
        if (qtd > 0) {
          return {
            item: item.nomeExibido,
            tamanho: item.tamanho,
            precoUnitario: item.preco,
            quantidade: qtd,
            precoTotal: item.preco * qtd,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um produto para finalizar o pedido.");
      return;
    }

    const pedido = {
      usuarioId: user?.uid || null,
      nome: user?.nome || "",
      email: user?.email || "",
      itens: itensSelecionados,
      total: totalGeral,
      pago: false,
      dataCompra: new Date(),
    };

    try {
      await addDoc(collection(db, "pedidosLanchonete"), pedido);
      alert("Pedido salvo com sucesso!");
      const zerarQuantidades = {};
      menuItems.forEach((item) => (zerarQuantidades[item.nomeExibido] = 0));
      setQuantities(zerarQuantidades);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao finalizar pedido.");
    }
  };

  if (menuItems.length === 0) {
    return <div>Carregando produtos...</div>;
  }

  return (
    <div className={styles.menuLoja}>
      <div className={styles.menuInicio}>Bomboniere</div>

      <div className={styles.row}>
        {menuItems.map((item, index) => {
          const qtd = quantities[item.nomeExibido] || 0;
          const total = (item.preco * qtd).toFixed(2);
          const unitario = item.preco.toFixed(2);
          return (
            <div key={index} className={styles.produto}>
              <MenuButton label={item.nomeExibido} imageSrc={item.imagem} />
              <div className={styles.controles}>
                <button onClick={() => handleQuantityChange(item.nomeExibido, -1)}>-</button>
                <span className={styles.qtd}>{qtd}</span>
                <button onClick={() => handleQuantityChange(item.nomeExibido, 1)}>+</button>
              </div>
              <div className={styles.preco}>
                R$ {unitario} x {qtd} = <strong>R$ {total}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <footer className={styles.footer}>
        <div className={styles.totalGeral}>
          Total Geral: <strong>R$ {totalGeral.toFixed(2)}</strong>
        </div>
        <button className={styles.button} onClick={handleFinalizarPedido}>
          Finalizar Pedido
        </button>
        <button className={styles.button}>
          <Link href="../MenuPrincipal">Menu Principal</Link>
        </button>
      </footer>
    </div>
  );
}
