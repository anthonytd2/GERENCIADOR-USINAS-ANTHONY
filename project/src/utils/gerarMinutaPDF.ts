import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export const gerarMinutaPDF = (form: any, resultado: any) => {
  const doc = new jsPDF();

  // Paleta de Cores Corporativa
  const corBase = "#0f172a";      // Preto chumbo escuro (Textos e Base)
  const corAzul = "#2563eb";      // Azul vibrante (Destaques e Títulos)
  const corCinzaEscuro = "#475569"; // Cinza profundo (Labels secundárias)
  const corCinzaMedio = "#94a3b8";  // Cinza médio (Linhas e textos auxiliares)
  const corCinzaClaro = "#f1f5f9";  // Cinza muito claro (Fundos de caixas)
  const corVerde = "#059669";     // Verde positivo (Valores de lucro)

  // Medidas Padrão
  const margemEsq = 20;
  const margemDir = 190;
  const larguraUtil = margemDir - margemEsq;
  let y = 0;

  // --- FUNÇÕES AUXILIARES DE DESENHO ---
  const formatMoney = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Linha horizontal suave
  const drawLine = (yPos: number, color = 226) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.line(margemEsq, yPos, margemDir, yPos);
  };

  // --- 1. CABEÇALHO (TOPO ESCURO) ---
  doc.setFillColor(corBase);
  doc.rect(0, 0, 210, 45, 'F'); // Barra superior

  // Título Principal
  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#ffffff");
  doc.text("MINUTA DE FATURAMENTO", margemEsq, y);

  // Subtítulo
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor("#94a3b8"); // Cinza claro
  doc.setFont("helvetica", "normal");
  // Texto corrigido
  doc.text("Documento auxiliar para emissão de Nota Fiscal de Serviço", margemEsq, y);

  // Box de Data no Topo Direita
  doc.setFillColor("#1e293b"); // Box ligeiramente mais claro que o fundo
  doc.roundedRect(margemDir - 45, 12, 45, 20, 2, 2, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor("#94a3b8");
  doc.setFont("helvetica", "bold");
  doc.text("DATA DE EMISSÃO", margemDir - 22.5, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor("#ffffff");
  doc.text(new Date(form.data_emissao).toLocaleDateString('pt-BR'), margemDir - 22.5, 26, { align: "center" });

  // --- 2. BLOCOS LADO A LADO: TOMADOR E PRESTADOR ---
  y = 55;
  const larguraBox = (larguraUtil - 5) / 2; // 5 é o espaçamento entre as caixas

  // CAIXA 1: TOMADOR (QUEM PAGA)
  doc.setFillColor(corCinzaClaro);
  doc.roundedRect(margemEsq, y, larguraBox, 45, 3, 3, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corAzul);
  doc.text("TOMADOR DO SERVIÇO (CLIENTE)", margemEsq + 5, y + 8);
  
  doc.setFontSize(11);
  doc.setTextColor(corBase);
  const nomeCliente = doc.splitTextToSize(form.consumidor_nome || "NOME NÃO INFORMADO", larguraBox - 10);
  doc.text(nomeCliente, margemEsq + 5, y + 16);
  
  doc.setFontSize(9);
  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ/CPF: ${form.consumidor_doc || '-'}`, margemEsq + 5, y + 25);
  doc.text(`IE: ${form.consumidor_inscricao || '-'}`, margemEsq + 5, y + 31);
  const endCliente = doc.splitTextToSize(`Endereço: ${form.consumidor_endereco || '-'}`, larguraBox - 10);
  doc.text(endCliente, margemEsq + 5, y + 37);

  // CAIXA 2: PRESTADOR (USINA)
  const margemEsqCaixa2 = margemEsq + larguraBox + 5;
  doc.setFillColor(corCinzaClaro);
  doc.roundedRect(margemEsqCaixa2, y, larguraBox, 45, 3, 3, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corAzul);
  doc.text("PRESTADOR DO SERVIÇO (USINA)", margemEsqCaixa2 + 5, y + 8);
  
  doc.setFontSize(11);
  doc.setTextColor(corBase);
  const nomeUsina = doc.splitTextToSize(form.gerador_nome || "NOME NÃO INFORMADO", larguraBox - 10);
  doc.text(nomeUsina, margemEsqCaixa2 + 5, y + 16);
  
  doc.setFontSize(9);
  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ/CPF: ${form.gerador_doc || '-'}`, margemEsqCaixa2 + 5, y + 25);

  // --- 3. TABELA DE DEMONSTRATIVO FINANCEIRO ---
  y += 60;
  
  // Título da Seção
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corBase);
  doc.text("DEMONSTRATIVO FINANCEIRO", margemEsq, y);
  drawLine(y + 3);

  y += 12;
  
  // LINHA 1: VALOR RECEBIDO
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaEscuro);
  doc.text("Valor Faturado (Recebido do Tomador)", margemEsq, y);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corBase);
  doc.text(formatMoney(form.valor_recebido), margemDir, y, { align: "right" });

  y += 8;
  doc.setDrawColor(240);
  doc.line(margemEsq, y, margemDir, y); // Linha fina divisória

  y += 8;
  // LINHA 2: VALOR REPASSADO
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaEscuro);
  doc.text("Custo Repassado (Pagamento à Usina)", margemEsq, y);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corBase);
  doc.text(formatMoney(form.valor_pago), margemDir, y, { align: "right" });

  y += 8;
  // Linha grossa antes do total
  doc.setDrawColor(200);
  doc.setLineWidth(1);
  doc.line(margemDir - 50, y, margemDir, y); 
  doc.setLineWidth(0.5); // volta ao normal

  y += 12;
  // LINHA 3: BASE DE CÁLCULO (SPREAD / LUCRO)
  doc.setFillColor("#f8fafc"); // Fundo cinza bem claro para destacar a linha inteira do total
  doc.rect(margemEsq, y - 8, larguraUtil, 16, 'F');

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corAzul);
  doc.text("BASE DE CÁLCULO (SPREAD)", margemEsq + 3, y + 2);
  
  doc.setFontSize(14);
  // Se for negativo, vermelho, se for positivo, verde corporativo
  doc.setTextColor(resultado.spread < 0 ? "#ef4444" : corVerde);
  doc.text(formatMoney(resultado.spread), margemDir - 3, y + 2, { align: "right" });

  y += 16;
  // LINHA 4: MARGEM
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaMedio);
  doc.text(`Margem de Lucro Bruto Operacional: ${resultado.margem.toFixed(2)}%`, margemDir, y, { align: "right" });

  // --- 4. ASSINATURAS (OPCIONAL, MAS DEIXA PROFISSIONAL) ---
  y += 60;
  
  // Linha de assinatura
  doc.setDrawColor(corCinzaMedio);
  doc.line(105 - 40, y, 105 + 40, y);
  
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corBase);
  doc.text("RESPONSÁVEL FINANCEIRO", 105, y, { align: "center" });

  // --- 5. RODAPÉ ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaMedio);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} via Sistema de Locação Solar.`, 105, 290, { align: "center" });
  
  // Linha colorida na base da página
  doc.setFillColor(corAzul);
  doc.rect(0, 295, 210, 2, 'F');

  // --- SALVAR PDF ---
  const nomeLimpo = (form.consumidor_nome || 'Documento').substring(0, 20).trim().replace(/[^a-zA-Z0-9]/g, "_");
  const nomeArquivo = `Faturamento_${nomeLimpo}_${form.data_emissao}.pdf`;
  
  doc.save(nomeArquivo);
  toast.success("Relatório gerado com sucesso!");
};