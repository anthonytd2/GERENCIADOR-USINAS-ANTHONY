import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para formatar dinheiro (R$)
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export const gerarRelatorioPDF = (dados: any, nomeCliente: string, mesReferencia: string) => {
  const doc = new jsPDF();
  const larguraPagina = doc.internal.pageSize.width;

  // --- CÁLCULOS ---
  const consumoRede = Number(dados.consumo_rede) || 0;
  const energiaCompensada = Number(dados.energia_compensada) || 0;
  const tarifaImposto = Number(dados.tarifa_com_imposto) || 0;
  const ilumPublica = Number(dados.iluminacao_publica) || 0;
  const outrasTaxas = Number(dados.outras_taxas) || 0;
  const valorPagoFatura = Number(dados.valor_pago_fatura) || 0;
  
  const economiaGerada = Number(dados.economia_gerada) || 0;
  const valorBoleto = Number(dados.valor_recebido) || 0;
  
  // Desconto (Bônus do cliente)
  const valorDesconto = economiaGerada - valorBoleto;

  // Total que pagaria na Concessionária (Sem solar)
  const totalSemSolar = (consumoRede * tarifaImposto) + ilumPublica + outrasTaxas;

  // --- CABEÇALHO ---
  doc.setFillColor(30, 58, 138); // Azul Escuro Profissional
  doc.rect(0, 0, larguraPagina, 40, 'F'); 
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Relatório de Economia", 14, 20);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("DEMONSTRATIVO MENSAL", 14, 28);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SOLAR LOCAÇÕES", larguraPagina - 14, 25, { align: "right" });

  // --- DADOS DO CLIENTE (Quadro) ---
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245); // Fundo cinza bem claro
  doc.rect(14, 50, larguraPagina - 28, 22, 'FD'); // FD = Fill + Draw (Preencher e Contornar)
  
  // Cliente
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("CONSUMIDOR", 18, 56);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Preto
  doc.setFont("helvetica", "bold");
  doc.text(nomeCliente.toUpperCase(), 18, 64);

  // Mês Ref
  const dataFormatada = new Date(mesReferencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text("MÊS DE REFERÊNCIA", larguraPagina - 18, 56, { align: "right" });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(dataFormatada.toUpperCase(), larguraPagina - 18, 64, { align: "right" });

  // --- TABELA PRINCIPAL (Com Linhas) ---
  autoTable(doc, {
    startY: 80,
    head: [['DESCRIÇÃO', 'VALOR']],
    body: [
      // 1. DADOS TÉCNICOS
      [{ content: 'DETALHES DO CONSUMO', colSpan: 2, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', textColor: 0 } }],
      ['Energia Consumida da Rede', `${consumoRede} kWh`],
      ['Energia Compensada (Solar)', `${energiaCompensada} kWh`],
      ['Tarifa Aplicada (c/ Impostos)', `R$ ${tarifaImposto.toFixed(4)}`],

      // 2. CUSTOS COPEL
      [{ content: 'CUSTOS DA CONCESSIONÁRIA', colSpan: 2, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', textColor: 0 } }],
      ['(+) Iluminação Pública', formatarMoeda(ilumPublica)],
      ['(+) Outras Taxas', formatarMoeda(outrasTaxas)],
      
      // 3. ANÁLISE FINANCEIRA
      [{ content: 'RESUMO FINANCEIRO', colSpan: 2, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', textColor: 0 } }],
      
      // Linha Total Sem Usina
      ['Total que Pagaria', { content: formatarMoeda(totalSemSolar), styles: { fontStyle: 'bold' } }],
      
      // Linha Pago Fatura (Vermelho)
      ['(-) Valor Pago na Fatura de Energia', { content: formatarMoeda(valorPagoFatura), styles: { textColor: [180, 0, 0], fontStyle: 'bold' } }],
      
      // Linha Economia (Verde)
      ['(=) ECONOMIA TOTAL', { content: formatarMoeda(economiaGerada), styles: { textColor: [0, 100, 0], fontStyle: 'bold', fontSize: 11 } }],

      // Linha Desconto (Laranja/Azul)
      ['(-) SEU DESCONTO', { content: formatarMoeda(valorDesconto), styles: { textColor: [30, 58, 138], fontStyle: 'bold' } }],
    ],
    theme: 'grid', // AQUI ESTÁ A MUDANÇA: 'grid' traz as linhas de volta
    styles: { 
      fontSize: 10,
      textColor: 0, // Preto absoluto
      cellPadding: 3,
      lineColor: [200, 200, 200], // Cor da linha cinza
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [30, 58, 138], // Azul Escuro no cabeçalho
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 120 }, // Coluna Descrição
      1: { cellWidth: 'auto', halign: 'right' } // Coluna Valor (Alinhada a direita)
    }
  });

  // --- TOTAL A PAGAR (Caixa Final) ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setDrawColor(0, 0, 0); // Borda Preta
  doc.setLineWidth(0.2);
  doc.setFillColor(255, 255, 255); // Fundo Branco
  doc.roundedRect(14, finalY, larguraPagina - 28, 30, 2, 2, 'S'); // S = Stroke (Só Borda)

  // Título da caixa
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL A PAGAR", larguraPagina / 2, finalY + 8, { align: "center" });

  // Valor
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Azul para destacar o valor final
  doc.text(formatarMoeda(valorBoleto), larguraPagina / 2, finalY + 22, { align: "center" });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Relatório gerado em ${new Date().toLocaleDateString()}`, 14, 285);

  const nomeArquivo = `Relatorio_${nomeCliente.replace(/\s+/g, '_')}_${mesReferencia}.pdf`;
  doc.save(nomeArquivo);
};