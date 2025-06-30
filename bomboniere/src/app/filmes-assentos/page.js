'use client';
import styles from './page.module.css';
import { useState, useEffect } from 'react';
import FilmeSelector from '../../Components/Filmes-assentos/FilmeSelector';
import Assentos from '../../Components/Filmes-assentos/Assentos';

export default function Home() {
  const [filmes, setFilmes] = useState([]);
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);

  // Carregar os filmes do arquivo JSON na pasta public
  useEffect(() => {
    const carregarFilmes = async () => {
      try {
        const res = await fetch('/filme-assentos.json');  // Certifique-se que filmes.json está na pasta public
        const dados = await res.json();
        console.log('Filmes carregados:', dados); // Log para verificar se está funcionando
        setFilmes(dados); // Atualiza o estado com os filmes
      } catch (err) {
        console.error('Erro ao carregar filmes:', err); // Em caso de erro no carregamento
      }
    };
    carregarFilmes();
  }, []);

  const handleSelectFilme = (filme) => {
    console.log('Filme selecionado:', filme); // Verifica se o filme está sendo selecionado corretamente
    setFilmeSelecionado(filme);  // Atualiza o estado com o filme selecionado
  };

  const handleToggleAssento = (numero) => {
    const novoFilme = { ...filmeSelecionado };
    const assentosAtualizados = novoFilme.assentos.map(assento =>
      assento.numero === numero ? { ...assento, selecionado: !assento.selecionado } : assento
    );
    novoFilme.assentos = assentosAtualizados;
    setFilmeSelecionado(novoFilme);  // Atualiza o estado com os assentos modificados
  };

  return (
    <div>
      <h1>Seleção de Assentos</h1>
      {!filmeSelecionado ? (
        <FilmeSelector filmes={filmes} onSelectFilme={handleSelectFilme} />
      ) : (
        <Assentos assentos={filmeSelecionado.assentos} onToggleAssento={handleToggleAssento} onConfirmar={() => setFilmeSelecionado(null)} onCancelar={() => setFilmeSelecionado(null)}
/>

      )}
    </div>
  );
}
