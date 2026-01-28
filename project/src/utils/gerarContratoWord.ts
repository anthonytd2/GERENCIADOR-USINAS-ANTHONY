import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// FUNÇÃO 1: CONTRATO USINA (COMODATO)
export const gerarContratoComodato = async (usina: any) => {
  try {
    const response = await fetch('/modelo_comodato.docx');
    if (!response.ok) throw new Error('Modelo não encontrado na pasta public');

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const dados = {
      nome_proprietario: usina.nome_proprietario?.toUpperCase() || "__________________________",
      cpf_cnpj: usina.cpf_cnpj || "__________________",

      // --- AQUI ESTÁ A CORREÇÃO ---
      rg: usina.rg || "__________________",
      // ----------------------------

      endereco: usina.endereco_proprietario || usina.endereco || "__________________________________________________",

      dia: hoje.getDate(),
      mes: meses[hoje.getMonth()],
      ano: hoje.getFullYear(),

      profissao: usina.profissao || "__________________________",
      descricao_imovel: "______________________________________________________________________"
    };

    doc.render(dados);

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const nomeArquivo = `Contrato_Comodato_${usina.nome_proprietario?.replace(/\s+/g, '_') || 'Cliente'}.docx`;
    saveAs(blob, nomeArquivo);

  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    alert('Erro ao gerar o contrato.');
  }
};

// FUNÇÃO 2: CONTRATO CONSUMIDOR
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

      // --- AQUI ESTÁ A CORREÇÃO ---
      rg: usina.rg || "__________________",
      // ----------------------------

      endereco: usina.endereco_proprietario || usina.endereco || "__________________________________________________",
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

// FUNÇÃO 4: CONTRATO DE GESTÃO (FINANCEIRO CONSUMIDOR)
export const gerarContratoGestaoConsumidor = async (vinculo: any) => {
  try {
    const response = await fetch('/modelo_gestao_consumidor.docx');
    if (!response.ok) throw new Error('Modelo não encontrado na pasta public');

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // 1. Dados Básicos
    const consumidor = vinculo.consumidores || {};
    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    // 2. Lógica Inteligente: Calcula quanto sobra para a Solar Locações
    // Se o desconto é 24%, então cobramos 76%. Se não tiver desconto cadastrado, deixamos em branco.
    let percentualCobranca = "____";
    if (consumidor.percentual_desconto) {
      const desconto = Number(consumidor.percentual_desconto);
      if (!isNaN(desconto)) {
        percentualCobranca = (100 - desconto).toString(); // Ex: 100 - 24 = 76
      }
    }

    // 3. Lógica Inteligente: Lista as UCs
    let listaUcs = "____________________";
    if (vinculo.unidades_vinculadas && vinculo.unidades_vinculadas.length > 0) {
      // Pega os códigos das UCs e junta com vírgula
      listaUcs = vinculo.unidades_vinculadas
        .map((u: any) => `UC ${u.unidades_consumidoras.codigo_uc}`)
        .join(', ');
    }

    const dados = {
      nome_consumidor: consumidor.nome?.toUpperCase() || "__________________________",
      documento_consumidor: consumidor.documento || "__________________",

      endereco_consumidor: consumidor.endereco
        ? `${consumidor.endereco}, ${consumidor.bairro || ''}`
        : "__________________________________________",

      cidade_uf: consumidor.cidade && consumidor.uf ? `${consumidor.cidade}/${consumidor.uf}` : "__________",

      // Variáveis Calculadas
      percentual_cobranca: percentualCobranca,
      lista_ucs: listaUcs,

      dia: hoje.getDate(),
      mes: meses[hoje.getMonth()],
      ano: hoje.getFullYear()
    };

    doc.render(dados);

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const nomeArquivo = `Contrato_Gestao_${consumidor.nome?.replace(/\s+/g, '_') || 'Cliente'}.docx`;
    saveAs(blob, nomeArquivo);

  } catch (error) {
    console.error(error);
    alert('Erro: Verifique se "modelo_gestao_consumidor.docx" está na pasta public.');
  }
};