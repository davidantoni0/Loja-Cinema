import { useState } from 'react';

const FilmeSelector = ({ filmes, onSelectFilme }) => {
  return (
    <div>
      <h2>Selecione um Filme</h2>
      <div>
        {filmes.map(filme => (
          <button key={filme.id} onClick={() => onSelectFilme(filme)}>
            {filme.nome}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilmeSelector;
