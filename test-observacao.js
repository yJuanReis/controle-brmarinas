// Script de teste para validar a funcionalidade de observação
// Este script pode ser executado no console do navegador

console.log('🧪 Testando funcionalidade de observação...');

// Teste 1: Verificar se o campo de observação existe no modal de entrada
function testarCampoObservacao() {
  console.log('🔍 Teste 1: Verificando campo de observação no modal de entrada');
  
  // Abrir modal de entrada
  const botaoEntrada = document.querySelector('button:contains("Registrar Entrada")');
  if (botaoEntrada) {
    botaoEntrada.click();
    console.log('✅ Modal de entrada aberto');
    
    // Verificar se o campo de observação existe
    setTimeout(() => {
      const campoObservacao = document.querySelector('textarea[placeholder*="observação"], textarea[placeholder*="observacao"], textarea[placeholder*="Observação"], textarea[placeholder*="Observacao"]');
      if (campoObservacao) {
        console.log('✅ Campo de observação encontrado');
        console.log('📝 Placeholder:', campoObservacao.placeholder);
      } else {
        console.log('❌ Campo de observação não encontrado');
      }
    }, 1000);
  } else {
    console.log('❌ Botão de entrada não encontrado');
  }
}

// Teste 2: Verificar se a observação é salva no banco
async function testarSalvamentoObservacao() {
  console.log('🔍 Teste 2: Verificando salvamento da observação');
  
  // Simular registro de entrada com observação
  const observacaoTeste = 'Teste de observação automática';
  
  try {
    // Verificar se o contexto está disponível
    const marinaContext = window.marinaContext || window.__MARINA_CONTEXT__;
    if (marinaContext) {
      console.log('✅ Contexto Marina disponível');
      
      // Testar registro de entrada
      const resultado = await marinaContext.registrarEntrada('test-pessoa-id', observacaoTeste);
      console.log('✅ Registro de entrada testado:', resultado);
    } else {
      console.log('⚠️ Contexto Marina não disponível no window');
      console.log('💡 Isso é normal, o contexto está no React');
    }
  } catch (error) {
    console.log('❌ Erro ao testar salvamento:', error.message);
  }
}

// Teste 3: Verificar exibição da observação no Dashboard
function testarExibicaoObservacao() {
  console.log('🔍 Teste 3: Verificando exibição da observação no Dashboard');
  
  // Verificar se há pessoas dentro com observação
  const observacoes = document.querySelectorAll('p.text-xs.text-muted-foreground.truncate.max-w-\\[200px\\]');
  if (observacoes.length > 0) {
    console.log('✅ Observações encontradas no Dashboard');
    observacoes.forEach((obs, index) => {
      console.log(`📝 Observação ${index + 1}:`, obs.textContent);
    });
  } else {
    console.log('ℹ️ Nenhuma observação encontrada (normal se não houver pessoas dentro)');
  }
}

// Executar testes
console.log('🚀 Iniciando testes...');
testarCampoObservacao();
setTimeout(testarExibicaoObservacao, 2000);
setTimeout(testarSalvamentoObservacao, 3000);

console.log('✅ Testes iniciados. Verifique os resultados no console.');