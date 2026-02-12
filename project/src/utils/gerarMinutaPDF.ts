import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export const gerarMinutaPDF = (form: any, resultado: any) => {
  const doc = new jsPDF();

  // Paleta de Cores Moderna
  const corPrimaria = "#0f172a";   // Slate 900
  const corSecundaria = "#3b82f6"; // Blue 500
  const corCinzaTexto = "#64748b"; // Slate 500
  const corFundoVerde = "#ecfdf5"; // Emerald 50
  const corTextoVerde = "#047857"; // Emerald 700
  const corFundoVermelho = "#fef2f2"; // Red 50
  const corTextoVermelho = "#b91c1c"; // Red 700

  // Variáveis de Layout
  let y = 0;
  const margemEsq = 20;
  const larguraUtil = 170;

  // --- 1. CABEÇALHO ---
  doc.setFillColor(corSecundaria);
  doc.rect(0, 0, 6, 297, 'F');

  y = 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(corPrimaria);
  doc.text("MINUTA DE FATURAMENTO", margemEsq, y);

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(corCinzaTexto);
  doc.setFont("helvetica", "normal");
  doc.text("cpf_cnpj auxiliar para emissão de Nota Fiscal de Serviço", margemEsq, y);

  // Box de Data
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(140, 20, 50, 20, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setTextColor(corCinzaTexto);
  doc.text("DATA DE EMISSÃO", 145, 26);
  doc.setFontSize(11);
  doc.setTextColor(corPrimaria);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(form.data_emissao).toLocaleDateString('pt-BR'), 145, 33);

  // Divisória
  y += 20;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margemEsq, y, 190, y);

  // --- 2. TOMADOR ---
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(corSecundaria);
  doc.setFont("helvetica", "bold");
  doc.text("TOMADOR DE SERVIÇO (QUEM PAGOU)", margemEsq, y);

  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(corPrimaria);
  doc.text(form.consumidor_nome || "Nome não informado", margemEsq, y);

  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(corCinzaTexto);
  doc.setFont("helvetica", "normal");
  const yDetalhes = y;
  doc.text(`CNPJ/CPF: ${form.consumidor_doc}`, margemEsq, yDetalhes);
  doc.text(`Insc. Estadual: ${form.consumidor_inscricao}`, margemEsq + 70, yDetalhes);
  y += 6;
  doc.text(`Endereço: ${form.consumidor_endereco}`, margemEsq, y);

  // --- 3. PRESTADOR ---
  y += 15;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margemEsq, y, larguraUtil, 35, 2, 2, 'F');
  
  const yBox = y + 10;
  doc.setFontSize(9);
  doc.setTextColor(corSecundaria);
  doc.setFont("helvetica", "bold");
  doc.text("PRESTADOR DO SERVIÇO (DONO DA USINA)", margemEsq + 5, yBox);

  doc.setFontSize(12);
  doc.setTextColor(corPrimaria);
  doc.text(form.gerador_nome || "Nome não informado", margemEsq + 5, yBox + 7);

  doc.setFontSize(10);
  doc.setTextColor(corCinzaTexto);
  doc.setFont("helvetica", "normal");
  doc.text(`CPF/CNPJ: ${form.gerador_doc}`, margemEsq + 5, yBox + 14);

  // --- 4. VALORES ---
  y += 50;
  doc.setFontSize(11);
  doc.setTextColor(corPrimaria);
  doc.setFont("helvetica", "bold");
  doc.text("DETALHAMENTO FINANCEIRO", margemEsq, y);

  y += 5;
  
  // Box Verde
  doc.setFillColor(corFundoVerde);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margemEsq, y, 80, 25, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(corTextoVerde);
  doc.text("VALOR RECEBIDO (FATURAMENTO)", margemEsq + 5, y + 8);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${Number(form.valor_recebido).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margemEsq + 5, y + 18);

  // Box Vermelho
  doc.setFillColor(corFundoVermelho);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(110, y, 80, 25, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(corTextoVermelho);
  doc.text("VALOR REPASSADO (CUSTO)", 115, y + 8);
  doc.setFontSize(14);
  doc.text(`R$ ${Number(form.valor_pago).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 115, y + 18);

  // --- 5. RESULTADO ---
  y += 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margemEsq, y, 190, y);
  doc.setLineDashPattern([], 0); 

  y += 15;
  doc.setFontSize(14);
  doc.setTextColor(corPrimaria);
  doc.setFont("helvetica", "bold");
  doc.text("BASE DE CÁLCULO (SPREAD)", margemEsq, y);

  doc.setFontSize(30);
  doc.setTextColor(corSecundaria);
  doc.text(`R$ ${resultado.spread.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(corCinzaTexto);
  doc.setFont("helvetica", "normal");
  doc.text(`Margem de Lucro Bruto: ${resultado.margem.toFixed(2)}%`, 190, y, { align: "right" });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} via Sistema de Solar Locações.`, 105, 290, { align: "center" });

  const nomeArquivo = `Minuta_${(form.consumidor_nome || 'Doc').substring(0, 15).trim()}_${form.data_emissao}.pdf`;
  doc.save(nomeArquivo);
  toast.success("PDF gerado com sucesso!");
};