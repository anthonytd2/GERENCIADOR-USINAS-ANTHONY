import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatarMoeda = (valor: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
const formatarNumero = (valor: any) => (Number(valor) || 0).toLocaleString('pt-BR');

export const gerarRelatorioPDF = (dados: any, vinculo: any) => {
  const doc = new jsPDF();
  const larguraPagina = doc.internal.pageSize.width;
  
  const dataReferencia = new Date(dados.mes_referencia);
  const mesFormatado = isNaN(dataReferencia.getTime()) 
    ? (dados.mes_referencia || 'Mês/Ano') 
    : dataReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  // --- INTELIGÊNCIA DE NOMES E UCs ---
  const isConsumoTradicional = dados.tipo_relatorio === 'consumo';
  const isInjetadoUsina = dados.tipo_relatorio === 'injetado';
  const isUsinaConsumo = dados.tipo_relatorio === 'usina_consumo';
  const isConsumoComGeracao = dados.tipo_relatorio === 'consumo_com_geracao';

  // Se for qualquer tipo de Consumo, o titular é o CONSUMIDOR
  const isParaConsumidor = isConsumoTradicional || isConsumoComGeracao;

  const nomeTitular = isParaConsumidor
    ? (vinculo?.consumidores?.nome || 'Consumidor Não Informado')
    : (vinculo?.usinas?.nome || 'Usina Não Informada');
  
  const infoUnidade = isParaConsumidor
    ? `UC: ${dados.unidades_consumidoras?.codigo_uc || 'Não vinculada'}`
    : `UNIDADE GERADORA: ${dados.unidade_geradora || 'Não informada'}`;

  // Configurações visuais por tipo
  let tituloPrincipal = "Relatório de Economia";
  let subTitulo = "DEMONSTRATIVO MENSAL (CLIENTE)";
  let corRGB: [number, number, number] = [30, 58, 138]; // Azul
  let corFundoCaixaRGB: [number, number, number] = [245, 248, 252]; // Fundo Azul

  if (isInjetadoUsina) {
    tituloPrincipal = "Relatório de Injeção";
    subTitulo = "DEMONSTRATIVO DE GERAÇÃO (USINA)";
    corRGB = [234, 88, 12]; // Laranja
    corFundoCaixaRGB = [250, 245, 240]; 
  } else if (isUsinaConsumo) {
    tituloPrincipal = "Relatório de Repasse";
    subTitulo = "DEMONSTRATIVO FINANCEIRO (USINA)";
    corRGB = [21, 128, 61]; // Verde
    corFundoCaixaRGB = [240, 253, 244];
  } else if (isConsumoComGeracao) {
    tituloPrincipal = "Relatório Consumo com Geração";
    subTitulo = "DEMONSTRATIVO FINANCEIRO (CLIENTE)";
    corRGB = [30, 58, 138]; // Azul mantido para cliente
    corFundoCaixaRGB = [245, 248, 252];
  }

  // --- CABEÇALHO ---
  doc.setFillColor(corRGB[0], corRGB[1], corRGB[2]); 
  doc.rect(0, 0, larguraPagina, 40, 'F'); 
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
  doc.text(tituloPrincipal, 14, 20); 
  
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(subTitulo, 14, 28);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("SOLAR LOCAÇÕES", larguraPagina - 14, 25, { align: "right" });

  // --- CAIXA DE IDENTIFICAÇÃO ---
  doc.setDrawColor(200, 200, 200); doc.setFillColor(corFundoCaixaRGB[0], corFundoCaixaRGB[1], corFundoCaixaRGB[2]); 
  doc.rect(14, 46, larguraPagina - 28, 28, 'FD'); 
  
  doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
  doc.text("TITULAR", 18, 53);
  doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(nomeTitular.toUpperCase(), 18, 60);

  doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("MÊS DE REFERÊNCIA", larguraPagina - 18, 53, { align: "right" });
  doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(mesFormatado.toUpperCase(), larguraPagina - 18, 60, { align: "right" });

  doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
  doc.text(infoUnidade, 18, 69);

  // --- TABELAS DE DADOS ---
  let headTable = [['DESCRIÇÃO TÉCNICA E FINANCEIRA', 'QTD / VALOR']];
  let bodyTable: any[] = [];

  // MODELO 1: INJETADO (LARANJA)
  if (isInjetadoUsina) {
    bodyTable = [
      [{ content: 'BALANÇO ENERGÉTICO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Leitura Anterior da Medição', `${formatarNumero(dados.leitura_anterior)} kWh`],
      ['Leitura Atual da Medição', `${formatarNumero(dados.leitura_atual)} kWh`],
      ['Quantidade Injetada', `${formatarNumero(dados.qtd_injetada)} kWh`],
      ['(-) Compensada na UC Geradora', `${formatarNumero(dados.qtd_compensada_geradora)} kWh`],
      ['(=) SALDO TRANSFERIDO', { content: `${formatarNumero(dados.saldo_transferido)} kWh`, styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }],

      [{ content: 'PRECIFICAÇÃO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Valor kWh Combinado Bruto', formatarMoeda(dados.valor_kwh_bruto)],
      ['(-) Valor kWh Fio B Competência', formatarMoeda(dados.valor_kwh_fio_b)],
      ['(=) VALOR kWh LÍQUIDO', { content: formatarMoeda(dados.valor_kwh_liquido), styles: { fontStyle: 'bold' } }],

      [{ content: 'REPASSE FINANCEIRO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Valor a Pagar (Total Locação)', formatarMoeda(dados.valor_pagar)],
      ['(-) Valor da Fatura Geradora (Copel)', { content: formatarMoeda(dados.valor_fatura_geradora), styles: { textColor: [200, 0, 0] } }],
    ];
  } 
  // MODELO 2: USINA CONSUMO (VERDE)
  else if (isUsinaConsumo) {
    bodyTable = [
      [{ content: 'DADOS TÉCNICOS', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Energia Consumida da Rede', `${formatarNumero(dados.energia_consumida)} kWh`],
      ['Energia Compensada', `${formatarNumero(dados.energia_compensada)} kWh`],
      ['Valor kW Aplicado', formatarMoeda(dados.valor_tarifa)],
      
      [{ content: 'APURAÇÃO FINANCEIRA', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Total Bruto', formatarMoeda(dados.total_bruto)],
      ['(-) Fio B', formatarMoeda(dados.valor_kwh_fio_b)],
      ['(-) DIF TUSD Sem Imposto (Fio B)', formatarMoeda(dados.dif_tusd_fio_b)],
      ['(-) Valor Fatura UC Geradora', { content: formatarMoeda(dados.valor_fatura_geradora), styles: { textColor: [200, 0, 0] } }],
    ];
  } 
  // MODELO 3: CONSUMO COM GERAÇÃO (🟢 AZUL)
  else if (isConsumoComGeracao) {
    headTable = [['DESCRIÇÃO FINANCEIRA', 'VALOR EM R$']];
    bodyTable = [
      [{ content: 'DADOS TÉCNICOS E CUSTOS FIXOS', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Energia TE', formatarMoeda(dados.energia_te)],
      ['Energia TUSD', formatarMoeda(dados.energia_tusd)],
      ['Iluminação Pública', formatarMoeda(dados.iluminacao_publica)],
      ['Energia Injeção Própria', formatarMoeda(dados.injecao_propria)],
      ['Outras Taxas', formatarMoeda(dados.outras_taxas)],
      ['(-) Desconto Bandeira Própria', { content: formatarMoeda(dados.desconto_bandeira_injecao), styles: { textColor: [200, 0, 0] } }],

      [{ content: 'APURAÇÃO E ECONOMIA', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Quanto Pagaria', { content: formatarMoeda(dados.quanto_pagaria), styles: { fontStyle: 'bold' } }],
      ['(-) Quanto Pagou', { content: formatarMoeda(dados.valor_pago_fatura), styles: { textColor: [200, 0, 0] } }],
      ['(=) Economia', { content: formatarMoeda(dados.economia_fatura), styles: { textColor: [0, 120, 0], fontStyle: 'bold' } }],
    ];
  }
  // MODELO 4: CONSUMO TRADICIONAL (AZUL)
  else {
    bodyTable = [
      [{ content: 'DADOS TÉCNICOS', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Energia Consumida', `${formatarNumero(dados.energia_consumida)} kWh`],
      ['Energia Compensada (Solar)', `${formatarNumero(dados.energia_compensada)} kWh`],
      ['Tarifa Aplicada', formatarMoeda(dados.valor_tarifa)],
      ['Injeção Própria', `${formatarNumero(dados.injecao_propria)} kWh`],

      [{ content: 'CUSTOS DA CONCESSIONÁRIA', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['(+) Iluminação Pública', formatarMoeda(dados.iluminacao_publica)],
      ['(+) Outras Taxas', formatarMoeda(dados.outras_taxas)],
      ['(-) Desconto Bandeira Vermelha / Inj. Própria', { content: formatarMoeda(dados.desconto_bandeira_injecao), styles: { textColor: [200, 0, 0] } }],
      ['(=) Valor Pago na Fatura de Energia', { content: formatarMoeda(dados.valor_pago_fatura), styles: { fontStyle: 'bold' } }],

      [{ content: 'RESUMO FINANCEIRO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Economia Bruta na Fatura', formatarMoeda(dados.economia_fatura)],
      ['(-) Desconto Sobre a Economia', { content: formatarMoeda(dados.desconto_economia), styles: { textColor: [200, 0, 0] } }],
      ['(=) VALOR LÍQUIDO ECONOMIZADO', { content: formatarMoeda(dados.valor_economizado_solar), styles: { textColor: [0, 120, 0], fontStyle: 'bold' } }],
      
      [{ content: 'SALDO ENERGÉTICO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
      ['Energia Acumulada para os Próximos Meses', { content: `${formatarNumero(dados.energia_acumulada)} kWh`, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } }],
    ];
  }

  autoTable(doc, {
    startY: 80, 
    head: headTable,
    body: bodyTable,
    theme: 'grid', 
    styles: { fontSize: 10, textColor: 50, cellPadding: isConsumoComGeracao ? 3.5 : 4, lineColor: [220, 220, 220], lineWidth: 0.1, font: "helvetica" },
    headStyles: { fillColor: corRGB, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 11 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: 0 } }
  });

  // --- CAIXAS DE RESUMO FINAIS ---
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setDrawColor(corRGB[0], corRGB[1], corRGB[2]); doc.setLineWidth(0.5); doc.setFillColor(corFundoCaixaRGB[0], corFundoCaixaRGB[1], corFundoCaixaRGB[2]); 
  
  if (isInjetadoUsina || isUsinaConsumo) {
    doc.roundedRect(14, finalY, larguraPagina - 28, 28, 2, 2, 'FD'); 
    doc.setFontSize(11); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    doc.text(isUsinaConsumo ? "TOTAL LÍQUIDO A PAGAR" : "VALOR LÍQUIDO A PAGAR", larguraPagina / 2, finalY + 9, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(corRGB[0], corRGB[1], corRGB[2]); 
    doc.text(formatarMoeda(dados.valor_liquido_pagar), larguraPagina / 2, finalY + 20, { align: "center" });
  } 
  else if (isConsumoComGeracao) {
    doc.roundedRect(14, finalY, larguraPagina - 28, 40, 2, 2, 'FD'); 
    
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
    doc.text("ECONOMIA REAL CLIENTE", larguraPagina / 2, finalY + 10, { align: "center" });
    doc.setFontSize(16); doc.setTextColor(0, 150, 0); 
    doc.text(formatarMoeda(dados.economia_real_cliente), larguraPagina / 2, finalY + 18, { align: "center" });

    doc.setFontSize(11); doc.setTextColor(50, 50, 50);
    doc.text("VALOR A PAGAR", larguraPagina / 2, finalY + 28, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(corRGB[0], corRGB[1], corRGB[2]); 
    doc.text(formatarMoeda(dados.valor_pagar), larguraPagina / 2, finalY + 36, { align: "center" });
  } 
  else {
    doc.roundedRect(14, finalY, larguraPagina - 28, 24, 2, 2, 'FD'); 
    doc.setFontSize(10); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    doc.text("TOTAL A RECEBER DO CLIENTE", larguraPagina / 2, finalY + 8, { align: "center" });
    doc.setFontSize(20); doc.setTextColor(corRGB[0], corRGB[1], corRGB[2]);
    doc.text(formatarMoeda(dados.total_receber), larguraPagina / 2, finalY + 17, { align: "center" });
  }

  // --- RODAPÉ UNIVERSAL ---
  
  // 🟢 NOVA REGRA: Exibir dados do PIX apenas para os Consumidores
  if (isParaConsumidor) {
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138); // Azul da empresa
    doc.setFont("helvetica", "bold");
    doc.text("DADOS PARA PAGAMENTO VIA PIX", 14, 272);
    
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text("Chave (CNPJ): 52.577.862/0001-85   |   Nome: SOLAR LOCAÇÕES LTDA", 14, 277);
  }

  doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
  doc.text(`Documento gerado digitalmente em ${new Date().toLocaleDateString('pt-BR')}`, 14, 285);

  const mesArquivo = dados.mes_referencia ? dados.mes_referencia.replace('-', '_') : 'Mes';
  let prefixo = 'Relatorio_Consumo';
  if (isInjetadoUsina) prefixo = 'Relatorio_Injecao';
  if (isUsinaConsumo) prefixo = 'Relatorio_Usina_Consumo';
  if (isConsumoComGeracao) prefixo = 'Relatorio_Consumo_Geracao';
  
  doc.save(`${prefixo}_${nomeTitular.replace(/\s+/g, '_')}_${mesArquivo}.pdf`);
};