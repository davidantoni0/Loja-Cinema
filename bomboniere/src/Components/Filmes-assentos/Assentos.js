"use client";
import React from "react";
import styles from "./Assentos.module.css";

export default function Assentos({ assentos, onToggleAssento, onConfirmar, onCancelar }) {
  return (
    <div className={styles.container}>
      <div className={styles.cinemaScreen}></div>
      <div className={styles.assentosGrid}>
        {assentos.map((assento) => {
          // Define a classe com base no estado do assento
          let classeBotao = styles.assento;
          if (!assento.disponivel) {
            classeBotao = styles.assentoIndisponivel;
          } else if (assento.selecionado) {
            classeBotao = styles.assentoSelecionado;
          }

          return (
            <button
              key={assento.numero}
              className={classeBotao}
              onClick={() => assento.disponivel && onToggleAssento(assento.numero)}
              disabled={!assento.disponivel}
            >
              {assento.numero}
            </button>
          );
        })}
      </div>
      <div className={styles.botoes}>
        <button onClick={onConfirmar} className={styles.confirm}>Confirmar</button>
        <button onClick={onCancelar} className={styles.cancel}>Cancelar</button>
      </div>
    </div>
  );
}
