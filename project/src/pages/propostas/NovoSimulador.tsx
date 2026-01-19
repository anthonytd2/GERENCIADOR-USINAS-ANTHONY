import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// CORREÇÃO: Adicionado 'User' na importação
import { ArrowLeft, Save, Sun, Calculator, CheckCircle, User } from 'lucide-react';
import { calcularViabilidade, type ResultadoViabilidade } from '../../utils/calculadoraSolar';

export default function NovoSimulador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [consumo, setConsumo] = useState('');
  const [valorKwh, setValorKwh] = useState('0.95');
  const [tipoTelhado, setTipoTelhado] = useState('Fibrocimento');
  const [resultado, setResultado] = useState<ResultadoViabilidade | null>(null);

  // Carregar dados se for edição
  useEffect(() => {
    if (id && id !== 'novo') {
      api.propostas.get(Number(id)).then(data => {
        if (data && data.dados_simulacao) {
          const dados = data.dados_simulacao;
          
          // 1. Preencher os Inputs (O que foi digitado)
          setCliente(data.nome_cliente_prospect || '');
          setTelefone(dados.telefone || '');
          setConsumo(String(dados.mediaConsumo || ''));
          setValorKwh(String(dados.valorTarifa || '0.95'));
          setTipoTelhado(dados.tipoTelhado || 'Fibrocimento');
          
          // 2. LÓGICA DE RECUPERAÇÃO INTELIGENTE
          // Se já existe um kit salvo (proposta fechada), recuperamos ele (Snapshot)
          if (dados.kitEscolhido) {
             setResultado({
               economiaMensalEstimada: dados.economiaMensal || 0,
               paybackAnos: dados.payback || 0,
               kitSugestao: dados.kitEscolhido,
               // Derivados simples (caso não tenham sido salvos)
               economiaAnualEstimada: (dados.economiaMensal || 0) * 12,
               roi: 0 
             });
          } 
          // Se não tiver kit salvo (é um rascunho antigo), recalculamos com base no consumo
          else if (dados.mediaConsumo) {
            const calc = calcularViabilidade(
              Number(dados.mediaConsumo), 
              Number(dados.valorTarifa || 0.95)
            );
            setResultado(calc);
          }
        }
      });
    }
  }, [id]);

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumo) return;
    const calc = calcularViabilidade(Number(consumo), Number(valorKwh));
    setResultado(calc);
  };

  const handleSalvar = async () => {
    if (!cliente || !resultado) return alert('Preencha o nome e faça a simulação');
    
    setLoading(true);
    try {
      const payload = {
        nome_cliente_prospect: cliente,
        status: 'rascunho',
        dados_simulacao: {
          telefone,
          mediaConsumo: Number(consumo),
          valorTarifa: Number(valorKwh),
          tipoTelhado,
          // Salvamos os RESULTADOS também para servirem de "Snapshot"
          economiaMensal: resultado.economiaMensalEstimada,
          payback: resultado.paybackAnos,
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
      alert('Erro ao salvar proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/propostas"
            className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm bg-gray-50 border border-gray-200"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id && id !== 'novo' ? 'Editar Simulação' : 'Nova Simulação'}
            </h1>
            <p className="text-sm text-gray-500">Crie propostas personalizadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FORMULÁRIO */}
        <div className="md:col-span-1 space-y-6">
          <form onSubmit={handleSimular} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Dados do Cliente
            </h3>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
              <input 
                value={cliente} 
                onChange={e => setCliente(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Telefone (WhatsApp)</label>
              <input 
                value={telefone} 
                onChange={e => setTelefone(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-500" /> Dados de Energia
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Consumo Médio (kWh)</label>
                  <input 
                    type="number"
                    value={consumo} 
                    onChange={e => setConsumo(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-gray-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Valor Tarifa (R$)</label>
                  <input 
                    type="number" step="0.01"
                    value={valorKwh} 
                    onChange={e => setValorKwh(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
              <Calculator className="w-5 h-5" /> Calcular
            </button>
          </form>
        </div>

        {/* RESULTADOS */}
        <div className="md:col-span-2">
          {resultado ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full animate-fade-in-down">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-3 bg-green-100 text-green-700 rounded-xl">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Viabilidade Positiva!</h2>
                  <p className="text-green-600 font-medium">Sistema recomendado encontrado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Kit Sugerido</p>
                  <p className="text-xl font-bold text-gray-900">{resultado.kitSugestao.potencia} kWp</p>
                  <p className="text-xs text-gray-400">{resultado.kitSugestao.modulos} painéis estimados</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-green-700 text-sm mb-1 font-bold">Economia Mensal</p>
                  <p className="text-2xl font-black text-green-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.economiaMensalEstimada)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-gray-100 rounded-lg">
                  <span className="text-gray-600">Investimento Estimado</span>
                  <span className="font-bold text-xl text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.kitSugestao.valorEstimado)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border border-gray-100 rounded-lg">
                  <span className="text-gray-600">Payback (Retorno)</span>
                  <span className="font-bold text-xl text-blue-600">{resultado.paybackAnos} Anos</span>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={handleSalvar}
                  disabled={loading}
                  className="flex-1 py-4 bg-brand-DEFAULT text-white rounded-xl font-bold text-lg hover:bg-brand-dark shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Salvando...' : 'Salvar Proposta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 h-full flex flex-col items-center justify-center text-gray-400 p-12">
              <Sun className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Preencha os dados e clique em Calcular</p>
              <p className="text-sm">Os resultados aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}