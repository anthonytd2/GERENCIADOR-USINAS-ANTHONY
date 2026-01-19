import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save, Sun, Calculator, CheckCircle, User, Zap, DollarSign } from 'lucide-react';
import { calcularViabilidade, type ResultadoViabilidade } from '../../utils/calculadoraSolar';

export default function NovoSimulador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // ESTADOS DO FORMULÁRIO
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [consumo, setConsumo] = useState('');
  const [valorKwh, setValorKwh] = useState('0.95');
  const [tipoTelhado, setTipoTelhado] = useState('Fibrocimento');
  const [resultado, setResultado] = useState<ResultadoViabilidade | null>(null);

  // --- FUNÇÃO DE RESGATE DE DADOS (Padroniza tudo para evitar undefined) ---
  const resgatarDados = (dados: any) => {
    if (!dados) return {};
    return {
      telefone: dados.telefone || dados.Telefone || '',
      mediaConsumo: Number(dados.mediaConsumo || dados.MediaConsumo || dados.consumo || 0),
      valorTarifa: Number(dados.valorTarifa || dados.ValorTarifa || dados.tarifa || 0.95),
      tipoTelhado: dados.tipoTelhado || dados.TipoTelhado || 'Fibrocimento',
      kitEscolhido: dados.kitEscolhido || dados.KitEscolhido || null,
      economiaMensal: Number(dados.economiaMensal || dados.EconomiaMensal || 0),
      payback: Number(dados.payback || dados.Payback || 0)
    };
  };

  // --- CARREGAR DADOS ---
  useEffect(() => {
    if (id && id !== 'novo') {
      console.log("Carregando proposta ID:", id);
      api.propostas.get(Number(id))
        .then(data => {
          if (data) {
            let rawDados = data.dados_simulacao;
            if (typeof rawDados === 'string') {
              try { rawDados = JSON.parse(rawDados); } catch (e) { rawDados = {}; }
            }
            
            const dados = resgatarDados(rawDados);
            
            // Variáveis Tipadas e Seguras (Obrigatório ser Number)
            const consumoSeguro = Number(dados.mediaConsumo) || 0;
            const tarifaSegura = Number(dados.valorTarifa) || 0.95;
            const economiaSegura = Number(dados.economiaMensal) || 0;
            const paybackSeguro = Number(dados.payback) || 0;

            // 3. Preenche os Inputs Visuais
            setCliente(data.nome_cliente_prospect || '');
            setTelefone(dados.telefone || '');
            setConsumo(consumoSeguro > 0 ? String(consumoSeguro) : '');
            setValorKwh(String(tarifaSegura));
            setTipoTelhado(dados.tipoTelhado || 'Fibrocimento');

            // 4. Restaura o Resultado na Tela
            if (dados.kitEscolhido) {
              setResultado({
                economiaMensalEstimada: economiaSegura,
                paybackAnos: paybackSeguro,
                kitSugestao: dados.kitEscolhido,
                economiaAnualEstimada: economiaSegura * 12,
                roi: 0
              });
            } else if (consumoSeguro > 0) {
              const novoCalc = calcularViabilidade(consumoSeguro, tarifaSegura);
              setResultado(novoCalc);
            }
          }
        })
        .catch(err => {
          console.error("Erro fatal ao carregar:", err);
        });
    }
  }, [id]);

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumo) return alert("Digite o consumo médio");
    
    // Conversão segura antes de chamar o cálculo
    const cons = Number(consumo) || 0;
    const tar = Number(valorKwh) || 0.95;
    
    const calc = calcularViabilidade(cons, tar);
    setResultado(calc);
  };

  const handleSalvar = async () => {
    if (!cliente || !resultado) return alert('Preencha o nome do cliente antes de salvar.');
    
    setLoading(true);
    try {
      const payload = {
        nome_cliente_prospect: cliente,
        status: 'rascunho',
        dados_simulacao: {
          telefone,
          mediaConsumo: Number(consumo) || 0,
          valorTarifa: Number(valorKwh) || 0.95,
          tipoTelhado,
          // Salva números garantidos
          economiaMensal: Number(resultado.economiaMensalEstimada) || 0,
          payback: Number(resultado.paybackAnos) || 0,
          kitEscolhido: resultado.kitSugestao
        }
      };

      if (id && id !== 'novo') {
        await api.propostas.update(Number(id), payload);
      } else {
        await api.propostas.create(payload);
      }
      navigate('/propostas');
    } catch (error) {
      alert('Erro ao salvar proposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const BRL = (valor: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/propostas" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id && id !== 'novo' ? 'Editar Simulação' : 'Nova Simulação'}
            </h1>
            <p className="text-sm text-gray-500">Preencha os dados abaixo para gerar a proposta</p>
          </div>
        </div>
        {resultado && (
          <button 
            onClick={handleSalvar}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Proposta'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b">
              <User className="w-5 h-5 text-blue-600" /> Dados do Cliente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                <input 
                  value={cliente} 
                  onChange={e => setCliente(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone / WhatsApp</label>
                <input 
                  value={telefone} 
                  onChange={e => setTelefone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSimular} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b">
              <Sun className="w-5 h-5 text-yellow-500" /> Dados de Energia
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Consumo Médio (kWh)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={consumo} 
                    onChange={e => setConsumo(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-gray-800"
                    placeholder="0"
                  />
                  <Zap className="w-5 h-5 text-yellow-500 absolute left-3 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor da Tarifa (R$)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01"
                    value={valorKwh} 
                    onChange={e => setValorKwh(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-brand-DEFAULT text-white rounded-xl font-bold hover:bg-brand-dark transition-all flex justify-center items-center gap-2 shadow-md mt-6">
                <Calculator className="w-5 h-5" /> Calcular Viabilidade
              </button>
            </div>
          </form>
        </div>

        {/* COLUNA DIREITA: RESULTADOS (8 colunas) */}
        <div className="lg:col-span-8">
          {resultado ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full animate-fade-in-down">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Projeto Viável!</h2>
                  <p className="text-gray-500">Sistema dimensionado com sucesso para este perfil.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* CARD KIT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 font-bold text-sm uppercase mb-2">Potência do Kit</p>
                  <p className="text-4xl font-black text-slate-800">{resultado.kitSugestao.potencia} <span className="text-xl text-slate-500 font-medium">kWp</span></p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <Sun className="w-4 h-4" />
                    <span>{resultado.kitSugestao.modulos} painéis estimados</span>
                  </div>
                </div>

                {/* CARD ECONOMIA */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                  <p className="text-green-600 font-bold text-sm uppercase mb-2">Economia Mensal</p>
                  <p className="text-4xl font-black text-green-700">{BRL(resultado.economiaMensalEstimada)}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Até {BRL(resultado.economiaAnualEstimada)} por ano</span>
                  </div>
                </div>
              </div>

              {/* DETALHES FINANCEIROS */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl">
                  <span className="text-gray-600 font-medium">Investimento Estimado</span>
                  <span className="font-bold text-xl text-gray-900">{BRL(resultado.kitSugestao.valorEstimado)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl">
                  <span className="text-gray-600 font-medium">Payback (Retorno)</span>
                  <span className="font-bold text-xl text-blue-600">{resultado.paybackAnos} Anos</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Calculator className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-slate-500">Aguardando Dados</h3>
              <p className="max-w-xs mt-2">Preencha o consumo e a tarifa ao lado e clique em "Calcular" para ver o resultado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}