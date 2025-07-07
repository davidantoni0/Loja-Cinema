'use client';
import styles from './page.module.css';
import { useState, useEffect } from 'react';
import FilmeSelector from '../../../Components/Filmes-assentos/FilmeSelector';
import Assentos from '../../../Components/Filmes-assentos/Assentos';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Home() {
  const [filmes, setFilmes] = useState([]);
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [cpf, setCpf] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [idade, setIdade] = useState(null);
  const [desconto, setDesconto] = useState(0);
  const [precoFinal, setPrecoFinal] = useState(0);
  const [carregandoUsuario, setCarregandoUsuario] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(false);
  
  // ESTADO PARA DEBUG
  const [debugInfo, setDebugInfo] = useState({
    logs: [],
    calculoDesconto: {},
    calculoPreco: {}
  });

  // Função para adicionar log de debug
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, type }]
    }));
    console.log(`[${timestamp}] ${message}`);
  };

  // Carregar os filmes do arquivo JSON na pasta public
  useEffect(() => {
    const carregarFilmes = async () => {
      try {
        addDebugLog('🎬 Iniciando carregamento de filmes', 'info');
        const res = await fetch('/filme-assentos.json');
        const dados = await res.json();
        addDebugLog(`🎬 ${dados.length} filmes carregados com sucesso`, 'success');
        setFilmes(dados);
      } catch (err) {
        addDebugLog(`❌ Erro ao carregar filmes: ${err.message}`, 'error');
      }
    };
    carregarFilmes();
  }, []);

  // Função para buscar usuário no Firestore pelo CPF
  const buscarUsuario = async (cpfDigitado) => {
    addDebugLog(`🔍 Buscando usuário com CPF: ${cpfDigitado}`, 'info');
    setCarregandoUsuario(true);
    
    try {
      const q = query(collection(db, 'usuarios'), where('cpf', '==', cpfDigitado));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const dadosUsuario = querySnapshot.docs[0].data();
        addDebugLog(`✅ Usuário encontrado: ${dadosUsuario.nome}`, 'success');
        addDebugLog(`📋 Dados completos do usuário:`, 'info');
        addDebugLog(`📋 - Nome: ${dadosUsuario.nome}`, 'info');
        addDebugLog(`📋 - Data nascimento: ${dadosUsuario.data_nascimento}`, 'info');
        addDebugLog(`📋 - Estudante: ${dadosUsuario.estudante}`, 'info');
        addDebugLog(`📋 - Funcionário: ${dadosUsuario.funcionario}`, 'info');
        addDebugLog(`📋 - Deficiência: ${dadosUsuario.deficiencia}`, 'info');
        
        setUsuario(dadosUsuario);
        setUsuarioEncontrado(true);
        
        // Calcular idade
        const idadeCalculada = calcularIdade(dadosUsuario.data_nascimento);
        
        if (idadeCalculada !== null) {
          addDebugLog(`🎂 Idade calculada com sucesso: ${idadeCalculada} anos`, 'success');
          setIdade(idadeCalculada);
          
          // Calcular desconto
          const { desconto: descontoCalculado, motivo } = calcularDesconto(idadeCalculada, dadosUsuario);
          addDebugLog(`💰 Desconto final: ${(descontoCalculado * 100).toFixed(1)}% - ${motivo}`, 'success');
          
          setDesconto(descontoCalculado);
          
          // Atualizar debug info
          setDebugInfo(prev => ({
            ...prev,
            calculoDesconto: {
              idade: idadeCalculada,
              desconto: descontoCalculado,
              motivo,
              estudante: dadosUsuario.estudante,
              funcionario: dadosUsuario.funcionario,
              deficiencia: dadosUsuario.deficiencia
            }
          }));
        } else {
          addDebugLog(`❌ Falha ao calcular idade`, 'error');
          setIdade(null);
          setDesconto(0);
        }
        
      } else {
        addDebugLog('❌ CPF não encontrado no sistema', 'error');
        alert('CPF não encontrado no sistema!');
        setUsuario(null);
        setUsuarioEncontrado(false);
        setIdade(null);
        setDesconto(0);
      }
    } catch (error) {
      addDebugLog(`❌ Erro ao buscar usuário: ${error.message}`, 'error');
      alert('Erro ao buscar usuário. Tente novamente.');
    } finally {
      setCarregandoUsuario(false);
    }
  };

  // Função para calcular idade
  const calcularIdade = (dataNascimento) => {
    addDebugLog(`🎂 === CALCULANDO IDADE ===`, 'info');
    addDebugLog(`🎂 Data de nascimento recebida: ${dataNascimento}`, 'info');
    
    const hoje = new Date();
    let nascimento;
    
    // Tratamento mais robusto da data
    if (typeof dataNascimento === 'string') {
      // Se for string no formato YYYY-MM-DD
      if (dataNascimento.includes('-')) {
        nascimento = new Date(dataNascimento + 'T00:00:00');
      } else {
        // Se for string em outro formato
        nascimento = new Date(dataNascimento);
      }
    } else {
      nascimento = new Date(dataNascimento);
    }
    
    addDebugLog(`📅 Data de hoje: ${hoje.toISOString().split('T')[0]}`, 'info');
    addDebugLog(`📅 Data de nascimento processada: ${nascimento.toISOString().split('T')[0]}`, 'info');
    
    // Verificar se a data é válida
    if (isNaN(nascimento.getTime())) {
      addDebugLog(`❌ Data de nascimento inválida: ${dataNascimento}`, 'error');
      return null;
    }
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const diferencaMes = hoje.getMonth() - nascimento.getMonth();
    
    addDebugLog(`🎂 Diferença de anos: ${idade}`, 'info');
    addDebugLog(`🎂 Diferença de meses: ${diferencaMes}`, 'info');
    addDebugLog(`🎂 Dia hoje: ${hoje.getDate()}, Dia nascimento: ${nascimento.getDate()}`, 'info');
    
    // Ajustar se ainda não fez aniversário este ano
    if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
      addDebugLog(`🎂 Ainda não fez aniversário este ano, subtraindo 1`, 'info');
    }
    
    addDebugLog(`🎂 Idade final calculada: ${idade} anos`, 'success');
    return idade;
  };

  // Função para calcular desconto - COM DEBUG DETALHADO
  const calcularDesconto = (idade, dadosUsuario) => {
    addDebugLog('💰 === INICIANDO CÁLCULO DE DESCONTO ===', 'info');
    addDebugLog(`💰 Idade recebida: ${idade}`, 'info');
    addDebugLog(`💰 Dados do usuário:`, 'info');
    addDebugLog(`💰 - Estudante: ${dadosUsuario.estudante}`, 'info');
    addDebugLog(`💰 - Funcionário: ${dadosUsuario.funcionario}`, 'info');
    addDebugLog(`💰 - Deficiência: ${dadosUsuario.deficiencia}`, 'info');
    
    // Verificar se idade é válida
    if (idade === null || idade === undefined || isNaN(idade)) {
      addDebugLog(`❌ Idade inválida: ${idade}`, 'error');
      return { desconto: 0, motivo: 'Idade inválida' };
    }
    
    // Verificar desconto por idade (prioridade máxima)
    if (idade < 18) {
      addDebugLog('✅ DESCONTO APLICADO: 50% para menor de 18 anos', 'success');
      return { desconto: 0.5, motivo: 'Menor de 18 anos (50%)' };
    }
    
    if (idade >= 65) {
      addDebugLog(`✅ DESCONTO APLICADO: 50% para idoso (${idade} anos >= 65)`, 'success');
      return { desconto: 0.5, motivo: `Idoso - ${idade} anos (50%)` };
    }
    
    addDebugLog(`ℹ️ Sem desconto por idade (${idade} anos). Verificando outros critérios...`, 'info');
    
    // Verificar outros critérios (ordem de prioridade)
    if (dadosUsuario.deficiencia === true) {
      addDebugLog('✅ DESCONTO APLICADO: 30% para pessoa com deficiência', 'success');
      return { desconto: 0.3, motivo: 'Pessoa com deficiência (30%)' };
    }
    
    if (dadosUsuario.estudante === true) {
      addDebugLog('✅ DESCONTO APLICADO: 25% para estudante', 'success');
      return { desconto: 0.25, motivo: 'Estudante (25%)' };
    }
    
    if (dadosUsuario.funcionario === true) {
      addDebugLog('✅ DESCONTO APLICADO: 20% para funcionário', 'success');
      return { desconto: 0.2, motivo: 'Funcionário (20%)' };
    }
    
    addDebugLog('ℹ️ NENHUM DESCONTO APLICADO', 'info');
    return { desconto: 0, motivo: 'Nenhum desconto aplicável' };
  };

  // Calcular preço final - COM DEBUG
  useEffect(() => {
    if (filmeSelecionado) {
      addDebugLog('💵 === CALCULANDO PREÇO FINAL ===', 'info');
      
      const assentosSelecionados = filmeSelecionado.assentos.filter(assento => assento.selecionado);
      const numerosAssentos = assentosSelecionados.map(a => a.numero).join(', ');
      const quantidade = assentosSelecionados.length;
      const precoUnitario = filmeSelecionado.preco || 20;
      const precoTotal = quantidade * precoUnitario;
      const valorDesconto = precoTotal * desconto;
      const precoComDesconto = precoTotal - valorDesconto;
      
      addDebugLog(`💺 Assentos selecionados: [${numerosAssentos}] (${quantidade} assento${quantidade !== 1 ? 's' : ''})`, 'info');
      addDebugLog(`💵 Preço unitário: R$ ${precoUnitario.toFixed(2)}`, 'info');
      addDebugLog(`💵 Subtotal (${quantidade} × R$ ${precoUnitario.toFixed(2)}): R$ ${precoTotal.toFixed(2)}`, 'info');
      addDebugLog(`💵 Valor do desconto (${(desconto * 100).toFixed(1)}%): R$ ${valorDesconto.toFixed(2)}`, 'info');
      addDebugLog(`💵 Total final: R$ ${precoComDesconto.toFixed(2)}`, 'success');
      
      setPrecoFinal(precoComDesconto);
      
      // Atualizar debug info
      setDebugInfo(prev => ({
        ...prev,
        calculoPreco: {
          assentosSelecionados: quantidade,
          numerosAssentos,
          precoUnitario,
          precoTotal,
          valorDesconto,
          precoFinal: precoComDesconto
        }
      }));
    }
  }, [filmeSelecionado, desconto]);

  const handleSelectFilme = (filme) => {
    addDebugLog(`🎬 Filme selecionado: ${filme.titulo}`, 'info');
    setFilmeSelecionado(filme);
  };

  const handleToggleAssento = (numero) => {
    addDebugLog(`💺 Alternando assento: ${numero}`, 'info');
    const novoFilme = { ...filmeSelecionado };
    const assentosAtualizados = novoFilme.assentos.map(assento =>
      assento.numero === numero ? { ...assento, selecionado: !assento.selecionado } : assento
    );
    novoFilme.assentos = assentosAtualizados;
    setFilmeSelecionado(novoFilme);
  };

  const handleBuscarUsuario = () => {
    if (!cpf.trim()) {
      addDebugLog('❌ CPF não informado', 'error');
      alert('Por favor, digite o CPF.');
      return;
    }
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      addDebugLog(`❌ CPF inválido: ${cpfLimpo} (${cpfLimpo.length} dígitos)`, 'error');
      alert('CPF deve ter 11 dígitos.');
      return;
    }
    
    buscarUsuario(cpfLimpo);
  };

  const handleConfirmar = () => {
    const assentosSelecionados = filmeSelecionado.assentos.filter(assento => assento.selecionado);
    
    if (assentosSelecionados.length === 0) {
      addDebugLog('❌ Nenhum assento selecionado', 'error');
      alert('Por favor, selecione pelo menos um assento.');
      return;
    }

    if (!usuario) {
      addDebugLog('❌ Usuário não identificado', 'error');
      alert('Por favor, identifique-se com seu CPF.');
      return;
    }

    addDebugLog('🎫 Confirmando compra...', 'success');

    // Determinar motivo do desconto
    let motivoDesconto = '';
    if (desconto > 0) {
      if (idade < 18) {
        motivoDesconto = 'Menor de 18 anos (50%)';
      } else if (idade >= 65) {
        motivoDesconto = '65 anos ou mais (50%)';
      } else if (usuario.deficiencia) {
        motivoDesconto = 'Pessoa com deficiência (30%)';
      } else if (usuario.estudante) {
        motivoDesconto = 'Estudante (25%)';
      } else if (usuario.funcionario) {
        motivoDesconto = 'Funcionário (20%)';
      }
    }

    const precoOriginal = assentosSelecionados.length * (filmeSelecionado.preco || 20);
    const valorDesconto = precoOriginal * desconto;

    alert(`🎫 Compra confirmada!\n\n` +
          `Cliente: ${usuario.nome}\n` +
          `Idade: ${idade} anos\n` +
          `Preço original: R$ ${precoOriginal.toFixed(2)}\n` +
          `Desconto: ${(desconto * 100).toFixed(0)}%\n` +
          `${motivoDesconto ? 'Motivo: ' + motivoDesconto + '\n' : ''}` +
          `Valor do desconto: R$ ${valorDesconto.toFixed(2)}\n` +
          `Preço final: R$ ${precoFinal.toFixed(2)}`);
    
    // Reset
    setFilmeSelecionado(null);
    setCpf('');
    setUsuario(null);
    setUsuarioEncontrado(false);
    setIdade(null);
    setDesconto(0);
    setPrecoFinal(0);
    setDebugInfo({ logs: [], calculoDesconto: {}, calculoPreco: {} });
  };

  return (
    <div className={styles.container}>
      <h1>Seleção de Assentos</h1>
      
      {/* PAINEL DE DEBUG - SEMPRE VISÍVEL */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        padding: '15px',
        margin: '20px 0',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '300px',
        overflowY: 'auto',
        border: '2px solid #333'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, color: '#00ff00' }}>🔍 PAINEL DE DEBUG</h4>
          <button 
            onClick={() => setDebugInfo({ logs: [], calculoDesconto: {}, calculoPreco: {} })}
            style={{
              background: '#333',
              color: '#fff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpar
          </button>
        </div>
        
        {/* Logs em tempo real */}
        <div style={{ marginBottom: '15px' }}>
          <strong>📋 LOGS:</strong>
          <div style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: '#000', padding: '10px', borderRadius: '4px' }}>
            {debugInfo.logs.length === 0 ? (
              <div style={{ color: '#666' }}>Nenhum log ainda...</div>
            ) : (
              debugInfo.logs.map((log, index) => (
                <div key={index} style={{ 
                  color: log.type === 'error' ? '#ff4444' : 
                         log.type === 'success' ? '#44ff44' : '#00ff00',
                  marginBottom: '2px'
                }}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Informações de estado atual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>👤 USUÁRIO:</strong>
            <div style={{ backgroundColor: '#000', padding: '8px', borderRadius: '4px', marginTop: '5px' }}>
              {usuario ? (
                <>
                  <div>Nome: {usuario.nome}</div>
                  <div>Idade: {idade} anos</div>
                  <div>Estudante: {usuario.estudante ? 'Sim' : 'Não'}</div>
                  <div>Funcionário: {usuario.funcionario ? 'Sim' : 'Não'}</div>
                  <div>Deficiência: {usuario.deficiencia ? 'Sim' : 'Não'}</div>
                </>
              ) : (
                <div style={{ color: '#666' }}>Nenhum usuário</div>
              )}
            </div>
          </div>
          
          <div>
            <strong>💰 DESCONTO:</strong>
            <div style={{ backgroundColor: '#000', padding: '8px', borderRadius: '4px', marginTop: '5px' }}>
              {debugInfo.calculoDesconto.desconto !== undefined ? (
                <>
                  <div>Valor: {(debugInfo.calculoDesconto.desconto * 100).toFixed(1)}%</div>
                  <div>Motivo: {debugInfo.calculoDesconto.motivo}</div>
                </>
              ) : (
                <div style={{ color: '#666' }}>Nenhum cálculo</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Informações de preço */}
        {debugInfo.calculoPreco.precoFinal !== undefined && (
          <div style={{ marginTop: '15px' }}>
            <strong>💵 PREÇO:</strong>
            <div style={{ backgroundColor: '#000', padding: '8px', borderRadius: '4px', marginTop: '5px' }}>
              <div>Assentos: [{debugInfo.calculoPreco.numerosAssentos}]</div>
              <div>Quantidade: {debugInfo.calculoPreco.assentosSelecionados}</div>
              <div>Preço unit.: R$ {debugInfo.calculoPreco.precoUnitario.toFixed(2)}</div>
              <div>Subtotal: R$ {debugInfo.calculoPreco.precoTotal.toFixed(2)}</div>
              <div>Desconto: R$ {debugInfo.calculoPreco.valorDesconto.toFixed(2)}</div>
              <div style={{ color: '#44ff44' }}>Total: R$ {debugInfo.calculoPreco.precoFinal.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Campo para CPF */}
      <div className={styles.formGroup}>
        <label htmlFor="cpf">CPF:</label>
        <div className={styles.cpfContainer}>
          <input
            type="text"
            id="cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Digite seu CPF"
            className={styles.input}
            maxLength={14}
          />
          <button 
            onClick={handleBuscarUsuario}
            className={styles.buttonBuscar}
            disabled={carregandoUsuario}
          >
            {carregandoUsuario ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        
        {usuario && (
          <div className={styles.infoUsuario}>
            <h3>Dados do Cliente</h3>
            <p><strong>Nome:</strong> {usuario.nome}</p>
            <p><strong>Email:</strong> {usuario.email}</p>
            <p><strong>Idade:</strong> {idade} anos</p>
            <p><strong>Endereço:</strong> {usuario.endereco.rua}, {usuario.endereco.bairro}, {usuario.endereco.cidade}/{usuario.endereco.estado}</p>
            
            {/* Informações de desconto */}
            {desconto > 0 && (
              <div className={styles.infoDesconto}>
                <p className={styles.desconto}>
                  <strong>Desconto aplicado: {(desconto * 100).toFixed(0)}%</strong>
                </p>
                <ul className={styles.motivosDesconto}>
                  {idade < 18 && <li>Menor de 18 anos (50%)</li>}
                  {idade >= 65 && <li>65 anos ou mais (50%)</li>}
                  {usuario.deficiencia && desconto === 0.3 && <li>Pessoa com deficiência (30%)</li>}
                  {usuario.estudante && desconto === 0.25 && <li>Estudante (25%)</li>}
                  {usuario.funcionario && desconto === 0.2 && <li>Funcionário (20%)</li>}
                </ul>
              </div>
            )}
            
            {desconto === 0 && (
              <div className={styles.infoDesconto}>
                <p><strong>Nenhum desconto aplicado</strong></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Só mostrar seleção de filmes se usuário foi encontrado */}
      {usuarioEncontrado && (
        <>
          {!filmeSelecionado ? (
            <FilmeSelector filmes={filmes} onSelectFilme={handleSelectFilme} />
          ) : (
            <div>
              <Assentos 
                assentos={filmeSelecionado.assentos} 
                onToggleAssento={handleToggleAssento} 
                onConfirmar={handleConfirmar}
                onCancelar={() => setFilmeSelecionado(null)}
              />
              
              {/* Resumo do pedido */}
              <div className={styles.resumoPedido}>
                <h3>Resumo do Pedido</h3>
                <p><strong>Cliente:</strong> {usuario.nome}</p>
                <p><strong>Filme:</strong> {filmeSelecionado.titulo}</p>
                {(() => {
                  const assentosSelecionados = filmeSelecionado.assentos.filter(a => a.selecionado);
                  const quantidade = assentosSelecionados.length;
                  const precoUnitario = filmeSelecionado.preco || 20;
                  const precoTotal = quantidade * precoUnitario;
                  const numerosAssentos = assentosSelecionados.map(a => a.numero).join(', ');
                  
                  return (
                    <>
                      <p><strong>Assentos selecionados:</strong> {numerosAssentos} ({quantidade} assento{quantidade !== 1 ? 's' : ''})</p>
                      <p><strong>Quantidade:</strong> {quantidade}</p>
                      <p><strong>Preço unitário:</strong> R$ {precoUnitario.toFixed(2)}</p>
                      <p><strong>Subtotal:</strong> R$ {precoTotal.toFixed(2)}</p>
                      {desconto > 0 && (
                        <>
                          <p><strong>Desconto:</strong> {(desconto * 100).toFixed(0)}%</p>
                          <p><strong>Valor do desconto:</strong> R$ {(precoTotal * desconto).toFixed(2)}</p>
                        </>
                      )}
                      <p className={styles.precoFinal}><strong>Total final: R$ {precoFinal.toFixed(2)}</strong></p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
      
      <button className={styles.button}>
        <Link href="../MenuPrincipal">Menu Principal</Link>
      </button>
    </div>
  );
}