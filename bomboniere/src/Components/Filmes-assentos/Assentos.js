import React, { useState, useEffect } from 'react';
import styles from './Assentos.module.css';
const Assentos = ({ assentos, onToggleAssento, onConfirmar, onCancelar }) => {
  const [assentosSelecionados, setAssentosSelecionados] = useState(assentos);

  useEffect(() => {
    // Carregar os assentos selecionados do localStorage ao carregar a página
    const assentosSalvos = JSON.parse(localStorage.getItem('assentosSelecionados'));
    if (assentosSalvos) {
      setAssentosSelecionados(assentosSalvos);
    }
  }, []);

  const handleToggleAssento = (numero) => {
    const novosAssentos = assentosSelecionados.map(assento =>
      assento.numero === numero ? { ...assento, selecionado: !assento.selecionado } : assento
    );
    setAssentosSelecionados(novosAssentos);
    onToggleAssento(numero);  // Passa a alteração para o componente pai
  };

  const handleConfirmar = () => {
    // Salva os assentos selecionados no localStorage
    localStorage.setItem('assentosSelecionados', JSON.stringify(assentosSelecionados));
    alert('Seleção de assentos confirmada!');
    onConfirmar();
  };

  const handleCancelar = () => {
    // Restaura os assentos para o estado original
    setAssentosSelecionados(assentos);
    onCancelar();
  };

  return (
    <div>
      <h2>Selecione os Assentos</h2>
      <div>
        {assentosSelecionados.map((assento) => (
          <button className={styles.assentosButton}
            key={assento.numero}
            style={{
              backgroundColor: assento.selecionado ? 'green' : assento.disponivel ? 'lightblue' : 'gray',
              cursor: assento.disponivel ? 'pointer' : 'not-allowed',
            }}
            onClick={() => assento.disponivel && handleToggleAssento(assento.numero)}
            disabled={!assento.disponivel}
          >
            {assento.numero}
          </button>
        ))}
      </div>
      <div>
        <button onClick={handleConfirmar}>Confirmar</button>
        <button onClick={handleCancelar}>Cancelar</button>
      </div>
    </div>
  );
};

export default Assentos;
