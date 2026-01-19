import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// Adicionei 'User' e removi imports não usados para evitar erros
import { ArrowLeft, Save, Sun, Calculator, CheckCircle, User } from 'lucide-react';
import { calcularViabilidade, type ResultadoViabilidade } from '../../utils/calculadoraSolar';

export default function NovoSimulador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [consumo, setConsumo] = useState('');
  const [valorKwh, setValorKwh] = useState('0.95');
  const [tipoTelhado, setTipoTelhado] = useState('Fibrocimento');
  const [resultado, setResultado] = useState<ResultadoViabilidade | null>(null);

  // Função Segura para formatar dinheiro (Evita erro se o valor for undefined)
  const formatarMoeda = (valor: any) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
  };

  useEffect(() => {
    if (id && id !== 'novo') {
      api.propostas.get(Number(id)).then(data => {
        if (data) {
          // Tenta ler os dados de forma segura
          let dados: any = data.dados_simulacao;
          
          // Se vier como texto (string), converte para objeto
          if (typeof dados === 'string') {
            try { dados = JSON.parse(dados); } catch (e) { dados = {}; }
          }
          if (!dados) dados = {};

          // Normaliza as chaves (Maiúscula/Minúscula)
          const tel = dados.telefone || dados.Telefone || '';
          const cons = dados.mediaConsumo || dados.MediaConsumo || 0;
          const tar = dados.valorTarifa || dados.ValorTarifa || 0.95;
          const telhado = dados.tipoTelhado || dados.TipoTelhado || 'Fibrocimento';
          const kit = dados.kitEscolhido || dados.KitEscolhido || null;
          const eco = dados.economiaMensal || dados.EconomiaMensal || 0;
          const pay = dados.payback || dados.Payback || 0;

          // Preenche o formulário
          setCliente(data.nome_cliente_prospect || '');
          setTelefone(tel);
          setConsumo(String(cons || ''));
          setValorKwh(String(tar));
          setTipoTelhado(telhado);
          
          // Lógica de Resgate:
          // 1. Se tem Kit salvo, usa ele (Snapshot)
          if (kit && eco > 0) {
             setResultado({
               economiaMensalEstimada: Number(eco),
               paybackAnos: Number(pay),
               kitSugestao: kit,
               economiaAnualEstimada: Number(eco) * 12,
               roi: 0 
             });
          } 
          // 2. Se não tem Kit mas tem consumo, RECALCULA AGORA
          else if (cons > 0) {
            const novoCalculo = calcularViabilidade(Number(cons), Number(tar));
            setResultado(novoCalculo);
          }
        }
      }).catch(err => {
        console.error("Erro ao carregar simulação:", err);
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
    if (!cliente || !resultado) return alert('Preencha o nome e calcule primeiro');
    
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
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULÁRIO */}
        <div className="lg:col-span-1 space-y-6">
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
        <div className="lg:col-span-2 h-full">
          {resultado ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col justify-between">
              <div>
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
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-500 text-sm mb-1 font-bold uppercase">Kit Sugerido</p>
                    <p className="text-3xl font-black text-gray-800">{resultado.kitSugestao.potencia} kWp</p>
                    <p className="text-sm text-gray-500 mt-1">{resultado.kitSugestao.modulos} painéis estimados</p>
                  </div>
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-green-700 text-sm mb-1 font-bold uppercase">Economia Mensal</p>
                    <p className="text-3xl font-black text-green-700">
                      {formatarMoeda(resultado.economiaMensalEstimada)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Estimativa média</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-600 font-medium">Investimento Estimado</span>
                    <span className="font-bold text-xl text-gray-900">
                      {formatarMoeda(resultado.kitSugestao.valorEstimado)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-medium">Payback (Retorno)</span>
                    <span className="font-bold text-xl text-blue-700">{resultado.paybackAnos} Anos</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={handleSalvar}
                  disabled={loading}
                  className="w-full py-4 bg-brand-DEFAULT text-white rounded-xl font-bold text-lg hover:bg-brand-dark shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                >
                  <Save className="w-6 h-6" />
                  {loading ? 'Salvando Proposta...' : 'Salvar Proposta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-gray-400 p-12 min-h-[400px]">
              <Sun className="w-20 h-20 mb-6 text-yellow-400 opacity-50" />
              <p className="text-xl font-bold text-gray-500">Aguardando Cálculo</p>
              <p className="text-sm mt-2 text-center max-w-xs">Preencha os dados de consumo ao lado e clique em calcular para ver a viabilidade.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}