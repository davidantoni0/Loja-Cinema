"use client";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import styles from "./page.module.css";
import Link from "next/link";

export default function Carrinho() {
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);

  async function buscarPendencias() {
    setLoading(true);
    const q = query(collection(db, "ingressos"), where("pago", "==", false));
    const querySnapshot = await getDocs(q);
    const dados = [];
    querySnapshot.forEach((docu) => {
      dados.push({ id: docu.id, ...docu.data() });
    });
    setPendencias(dados);
    setLoading(false);
  }

  useEffect(() => {
    buscarPendencias();
  }, []);

  async function apagarPendencia(id) {
    if (!confirm("Deseja realmente apagar essa pendência?")) return;
    await deleteDoc(doc(db, "ingressos", id));
    alert("Pendência apagada.");
    buscarPendencias();
  }

  async function marcarPago(id) {
    await updateDoc(doc(db, "ingressos", id), { pago: true });
    alert("Pagamento marcado como efetuado.");
    buscarPendencias();
  }

  if (loading) return <p>Carregando pendências...</p>;

  return (
    <div className={styles.container}>
      <h1>Ingressos Pendentes</h1>

      {pendencias.length === 0 && <p>Não há pendências no momento.</p>}

      <ul>
        {pendencias.map((item) => (
          <li key={item.id} className={styles.pendenciaItem}>
            <p>
              <strong>Filme:</strong> {item.filme} <br />
              <strong>Data da Compra:</strong> {item.dataCompra} <br />
              <strong>Quantidade:</strong> {item.quantidade} <br />
              <strong>Assentos:</strong> {item.assentos.join(", ")} <br />
              <strong>Status:</strong> {item.pago ? "Pago" : "Pendente"}
            </p>
            <div className={styles.buttons}>
              <button onClick={() => marcarPago(item.id)}>Marcar Pago</button>
              <button onClick={() => apagarPendencia(item.id)}>Apagar</button>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/MenuPrincipal">
        <button className={styles.button}>Voltar ao Menu</button>
      </Link>
    </div>
  );
}
