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

  // 🟢 INTELIGÊNCIA DE NOMES E UCs
  const isConsumo = dados.tipo_relatorio === 'consumo';
  const nomeTitular = isConsumo 
    ? (vinculo?.consumidores?.nome || 'Consumidor Não Informado')
    : (vinculo?.usinas?.nome || 'Usina Não Informada');
  
  const infoUnidade = isConsumo
    ? (dados.unidades_consumidoras?.codigo_uc || 'Não vinculada')
    : (dados.unidade_geradora || 'Não informada');

  // =========================================================================
  // MODELO 1: RELATÓRIO DE INJEÇÃO (USINA INJETADO - LARANJA)
  // =========================================================================
  if (dados.tipo_relatorio === 'injetado') {
    doc.setFillColor(234, 88, 12); 
    doc.rect(0, 0, larguraPagina, 40, 'F'); 
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text("Relatório de Injeção", 14, 20); 
    
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("DEMONSTRATIVO DE GERAÇÃO (USINA)", 14, 28);
    doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("SOLAR LOCAÇÕES", larguraPagina - 14, 25, { align: "right" });

    // --- CAIXA DE IDENTIFICAÇÃO COM A UC GERADORA ---
    doc.setDrawColor(200, 200, 200); doc.setFillColor(250, 245, 240); 
    doc.rect(14, 46, larguraPagina - 28, 28, 'FD'); 
    
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
    doc.text("PROPRIETÁRIO DA USINA", 18, 53);
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(nomeTitular.toUpperCase(), 18, 60); 

    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("MÊS DE REFERÊNCIA", larguraPagina - 18, 53, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(mesFormatado.toUpperCase(), larguraPagina - 18, 60, { align: "right" });

    // Exibição da Unidade Geradora
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
    doc.text("UNIDADE GERADORA:", 18, 69);
    doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
    doc.text(infoUnidade, 49, 69);

    autoTable(doc, {
      startY: 80,
      head: [['DESCRIÇÃO TÉCNICA E FINANCEIRA', 'QTD / VALOR']],
      body: [
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
      ],
      theme: 'grid', 
      styles: { fontSize: 10, textColor: 50, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.1, font: "helvetica" },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 11 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: 0 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.5); doc.setFillColor(255, 250, 245); 
    doc.roundedRect(14, finalY, larguraPagina - 28, 28, 2, 2, 'FD'); 
    doc.setFontSize(11); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    doc.text("VALOR LÍQUIDO A PAGAR", larguraPagina / 2, finalY + 9, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(234, 88, 12); 
    doc.text(formatarMoeda(dados.valor_liquido_pagar), larguraPagina / 2, finalY + 20, { align: "center" });

  } 
  // =========================================================================
  // MODELO 3: RELATÓRIO USINA CONSUMO (VERDE)
  // =========================================================================
  else if (dados.tipo_relatorio === 'usina_consumo') {
    doc.setFillColor(21, 128, 61); // Verde Solar Locações Usina Consumo
    doc.rect(0, 0, larguraPagina, 40, 'F'); 
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text("Relatório de Repasse", 14, 20); 
    
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("DEMONSTRATIVO FINANCEIRO (USINA)", 14, 28);
    doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("SOLAR LOCAÇÕES", larguraPagina - 14, 25, { align: "right" });

    // CAIXA DE IDENTIFICAÇÃO COM A UC GERADORA
    doc.setDrawColor(200, 200, 200); doc.setFillColor(240, 253, 244); 
    doc.rect(14, 46, larguraPagina - 28, 28, 'FD'); 
    
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
    doc.text("PROPRIETÁRIO DA USINA (GERADOR)", 18, 53);
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(nomeTitular.toUpperCase(), 18, 60); 

    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("MÊS DE REFERÊNCIA", larguraPagina - 18, 53, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(mesFormatado.toUpperCase(), larguraPagina - 18, 60, { align: "right" });

    // Exibição da Unidade Geradora
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
    doc.text("UNIDADE GERADORA:", 18, 69);
    doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
    doc.text(infoUnidade, 49, 69);

    autoTable(doc, {
      startY: 80,
      head: [['DESCRIÇÃO', 'QTD / VALOR']],
      body: [
        [{ content: 'DADOS TÉCNICOS', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
        ['Energia Consumida da Rede', `${formatarNumero(dados.energia_consumida)} kWh`],
        ['Energia Compensada', `${formatarNumero(dados.energia_compensada)} kWh`],
        ['Valor kW Aplicado', formatarMoeda(dados.valor_tarifa)],
        
        [{ content: 'APURAÇÃO FINANCEIRA', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }],
        ['Total Bruto', formatarMoeda(dados.total_bruto)],
        ['(-) Fio B', formatarMoeda(dados.valor_kwh_fio_b)],
        ['(-) DIF TUSD Sem Imposto (Fio B)', formatarMoeda(dados.dif_tusd_fio_b)],
        ['(-) Valor Fatura UC Geradora', { content: formatarMoeda(dados.valor_fatura_geradora), styles: { textColor: [200, 0, 0] } }],
      ],
      theme: 'grid', 
      styles: { fontSize: 10, textColor: 50, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.1, font: "helvetica" },
      headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 11 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: 0 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setDrawColor(21, 128, 61); doc.setLineWidth(0.5); doc.setFillColor(240, 253, 244); 
    doc.roundedRect(14, finalY, larguraPagina - 28, 28, 2, 2, 'FD'); 
    doc.setFontSize(11); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    doc.text("TOTAL LÍQUIDO A PAGAR", larguraPagina / 2, finalY + 9, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(21, 128, 61); 
    doc.text(formatarMoeda(dados.valor_liquido_pagar), larguraPagina / 2, finalY + 20, { align: "center" });

  } 
  // =========================================================================
  // MODELO 2: RELATÓRIO DE ECONOMIA (CONSUMO CLIENTE FINAL - AZUL)
  // =========================================================================
  else {
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, larguraPagina, 40, 'F'); 
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text("Relatório de Economia", 14, 20); 
    
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("DEMONSTRATIVO MENSAL (CLIENTE)", 14, 28);
    doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("SOLAR LOCAÇÕES", larguraPagina - 14, 25, { align: "right" });

    // CAIXA DE IDENTIFICAÇÃO COM A UC CONSUMIDORA
    doc.setDrawColor(200, 200, 200); doc.setFillColor(245, 248, 252); 
    doc.rect(14, 46, larguraPagina - 28, 28, 'FD'); 
    
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
    doc.text("CONSUMIDOR FINAL", 18, 53);
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(nomeTitular.toUpperCase(), 18, 60);

    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("MÊS DE REFERÊNCIA", larguraPagina - 18, 53, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(mesFormatado.toUpperCase(), larguraPagina - 18, 60, { align: "right" });

    // Exibição da UC
    doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
    doc.text("UNIDADE CONSUMIDORA (UC):", 18, 69);
    doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
    doc.text(infoUnidade, 62, 69);

    autoTable(doc, {
      startY: 80, 
      head: [['DESCRIÇÃO TÉCNICA E FINANCEIRA', 'QTD / VALOR']],
      body: [
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
      ],
      theme: 'grid', 
      styles: { fontSize: 9, textColor: 50, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1, font: "helvetica" },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: 0 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.5); doc.setFillColor(245, 248, 252); 
    doc.roundedRect(14, finalY, larguraPagina - 28, 24, 2, 2, 'FD'); 
    doc.setFontSize(10); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    doc.text("TOTAL A RECEBER DO CLIENTE", larguraPagina / 2, finalY + 8, { align: "center" });
    doc.setFontSize(20); doc.setTextColor(30, 58, 138);
    doc.text(formatarMoeda(dados.total_receber), larguraPagina / 2, finalY + 17, { align: "center" });
  }

  // --- RODAPÉ UNIVERSAL ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(`Documento gerado digitalmente em ${new Date().toLocaleDateString('pt-BR')}`, 14, 285);

  const mesArquivo = dados.mes_referencia ? dados.mes_referencia.replace('-', '_') : 'Mes';
  let prefixo = 'Relatorio_Consumo';
  if (dados.tipo_relatorio === 'injetado') prefixo = 'Relatorio_Injecao';
  if (dados.tipo_relatorio === 'usina_consumo') prefixo = 'Relatorio_Usina_Consumo';
  
  doc.save(`${prefixo}_${nomeTitular.replace(/\s+/g, '_')}_${mesArquivo}.pdf`);
};