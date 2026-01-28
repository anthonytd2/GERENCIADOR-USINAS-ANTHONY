import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// FUNÇÃO 1: CONTRATO USINA (BIONOVA <-> PROPRIETÁRIO)
export const gerarContratoComodato = async (usina: any) => {
  try {
    const response = await fetch('/modelo_comodato.docx');
    if (!response.ok) {
      throw new Error('Erro ao carregar o modelo de contrato. Verifique se o arquivo está na pasta public.');
    }

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const hoje = new Date();
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const dados = {
      nome_proprietario: usina.nome_proprietario?.toUpperCase() || "__________________________",
      cpf_cnpj: usina.cpf_cnpj || "__________________",
      endereco: usina.endereco_proprietario || usina.endereco || "__________________________________________________",
      
      dia: hoje.getDate(),
      mes: meses[hoje.getMonth()],
      ano: hoje.getFullYear(),
      
      profissao: "__________________________",
      descricao_imovel: "______________________________________________________________________" 
    };

    doc.render(dados);

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const nomeArquivo = `Contrato_Comodato_${usina.nome_proprietario?.replace(/\s+/g, '_') || 'Cliente'}.docx`;
    saveAs(blob, nomeArquivo);

  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    alert('Erro ao gerar o contrato. Verifique se o modelo "modelo_comodato.docx" está na pasta public.');
  }
};

// FUNÇÃO 2: CONTRATO CONSUMIDOR (BIONOVA <-> CONSUMIDOR)
export const gerarContratoComodatoConsumidor = async (vinculo: any) => {
  try {
    const response = await fetch('/modelo_comodato_consumidor.docx');
    if (!response.ok) throw new Error('Modelo não encontrado na pasta public');

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const consumidor = vinculo.consumidores || {};
    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const dados = {
      nome_consumidor: consumidor.nome?.toUpperCase() || "__________________________",
      documento_consumidor: consumidor.documento || "__________________",
      endereco_consumidor: consumidor.endereco 
        ? `${consumidor.endereco}, ${consumidor.bairro || ''}, ${consumidor.cidade || ''}-${consumidor.uf || ''}`
        : "______________________________________________________________________",
      
      dia: hoje.getDate(),
      mes: meses[hoje.getMonth()],
      ano: hoje.getFullYear()
    };

    doc.render(dados);

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const nomeArquivo = `Comodato_Bionova_${consumidor.nome?.replace(/\s+/g, '_') || 'Consumidor'}.docx`;
    saveAs(blob, nomeArquivo);

  } catch (error) {
    console.error(error);
    alert('Erro: Verifique se "modelo_comodato_consumidor.docx" está na pasta public.');
  }
  
};

// FUNÇÃO 3: CONTRATO DE GESTÃO (FINANCEIRO USINA)
export const gerarContratoGestaoUsina = async (usina: any) => {
  try {
    const response = await fetch('/modelo_gestao_usina.docx');
    if (!response.ok) throw new Error('Modelo não encontrado na pasta public');

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const dados = {
      nome_proprietario: usina.nome_proprietario?.toUpperCase() || "__________________________",
      cpf_cnpj: usina.cpf_cnpj || "__________________",
      endereco: usina.endereco_proprietario || usina.endereco || "__________________________________________________",
      // Formata o valor trocando ponto por vírgula (Ex: 0.44 vira 0,44)
      valor_kw: usina.valor_kw_bruto ? Number(usina.valor_kw_bruto).toFixed(2).replace('.', ',') : "____",
      
      dia: hoje.getDate(),
      mes: meses[hoje.getMonth()],
      ano: hoje.getFullYear()
    };

    doc.render(dados);

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const nomeArquivo = `Contrato_Gestao_${usina.nome_proprietario?.replace(/\s+/g, '_') || 'Usina'}.docx`;
    saveAs(blob, nomeArquivo);

  } catch (error) {
    console.error(error);
    alert('Erro: Verifique se "modelo_gestao_usina.docx" está na pasta public.');
  }
};