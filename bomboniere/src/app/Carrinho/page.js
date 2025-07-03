"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../../firebase/firebaseConfig";
import useUsuario from "../../hooks/useUsuario";

export default function Carrinho() {
  const { usuario, loadingUsuario } = useUsuario();
  const [itens, setItens] = useState([]);
  const [erroAuth, setErroAuth] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario || loadingUsuario) return;

    if (!usuario.uid) {
      setErroAuth(true);
      setCarregando(false);
      return;
    }

    setErroAuth(false);

    const ref = collection(db, "usuarios", usuario.uid, "carrinho");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const agrupados = {};
      dados.forEach((item) => {
        const chave = item.item + (item.tamanho || "");
        if (!agrupados[chave]) {
          agrupados[chave] = { ...item };
        } else {
          agrupados[chave].quantidade += item.quantidade;
          agrupados[chave].precoTotal += item.precoTotal;
        }
      });

      setItens(Object.values(agrupados));
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario, loadingUsuario]);

  const alterarQuantidade = async (id, novaQuantidade, precoUnitario) => {
    if (!usuario || novaQuantidade < 1) return;

    const ref = doc(db, "usuarios", usuario.uid, "carrinho", id);
    await updateDoc(ref, {
      quantidade: novaQuantidade,
      precoTotal: novaQuantidade * precoUnitario,
    });
  };

  const excluirItem = async (id) => {
    if (!usuario) return;
    const ref = doc(db, "usuarios", usuario.uid, "carrinho", id);
    await deleteDoc(ref);
  };

  const somarTotal = () => {
    return itens.reduce((soma, item) => soma + item.precoTotal, 0);
  };

  if (loadingUsuario || carregando) return <p>Carregando...</p>;

  if (erroAuth)
    return (
      <div className={styles.erroContainer}>
        <p>Erro<br />Usuário não encontrado. Faça login novamente.</p>
        <button onClick={() => window.location.reload()}>Tentar Novamente</button>
      </div>
    );

  return (
    <div className={styles.container}>
      <h1>Carrinho</h1>
      {itens.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item, index) => (
            <li key={index} className={styles.item}>
              {item.imagem && (
                <Image
                  src={item.imagem}
                  alt={item.item}
                  width={80}
                  height={80}
                  className={styles.imagem}
                />
              )}
              <div className={styles.info}>
                <h3>
                  {item.item} {item.tamanho ? `(${item.tamanho})` : ""}
                </h3>
                <p>Preço unitário: R$ {item.precoUnitario.toFixed(2)}</p>
                <div className={styles.controle}>
                  <button
                    onClick={() =>
                      alterarQuantidade(item.id, item.quantidade - 1, item.precoUnitario)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantidade}</span>
                  <button
                    onClick={() =>
                      alterarQuantidade(item.id, item.quantidade + 1, item.precoUnitario)
                    }
                  >
                    +
                  </button>
                </div>
                <p>Total: R$ {item.precoTotal.toFixed(2)}</p>
                <button className={styles.excluir} onClick={() => excluirItem(item.id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {itens.length > 0 && (
        <div className={styles.total}>
          <h2>Total da compra: R$ {somarTotal().toFixed(2)}</h2>
          <Link href="/Pagamento" className={styles.botaoPagar}>
            Pagar Tudo
          </Link>
        </div>
      )}
    </div>
  );
}
