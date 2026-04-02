import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// --- ESTILOS DO PDF (Como se fosse o CSS da folha A4) ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #3b82f6', paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  
  // Caixas de Identificação
  infoBox: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 15 },
  infoColumn: { flex: 1 },
  infoLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  infoValue: { fontSize: 12, color: '#0f172a', marginTop: 3 },

  // Resumo Financeiro (Cards)
  resumoContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  resumoCard: { flex: 1, padding: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 },
  resumoLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' },
  resumoValueGeracao: { fontSize: 16, color: '#2563eb', fontWeight: 'bold', marginTop: 4 },
  resumoValueConsumo: { fontSize: 16, color: '#ea580c', fontWeight: 'bold', marginTop: 4 },
  resumoValueSaldoPos: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginTop: 4 },
  resumoValueSaldoNeg: { fontSize: 16, color: '#dc2626', fontWeight: 'bold', marginTop: 4 },

  // Tabela
  table: { width: '100%', marginBottom: 20 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0' },
  tableColBase: { padding: 6, fontSize: 9 },
  colMes: { width: '20%', fontWeight: 'bold', color: '#334155' },
  colNum: { width: '20%', textAlign: 'right' },
  
  // Veredito
  veredictoBox: { padding: 15, borderRadius: 4, marginTop: 10 },
  veredictoPositivo: { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' },
  veredictoNegativo: { backgroundColor: '#fef2f2', border: '1px solid #fecaca' },
  veredictoTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  veredictoText: { fontSize: 10 },
  textVerde: { color: '#059669' },
  textVermelho: { color: '#dc2626' }
});

interface Props {
  titulo: string;
  consumidorNome: string;
  usinaNome: string;
  dadosCalculados: {
    detalhado: any[];
    totalGerado: number;
    totalConsumido: number;
    saldoAcumulado: number;
  };
}

export const RelatorioSimulacaoPDF = ({ titulo, consumidorNome, usinaNome, dadosCalculados }: Props) => {
  const isPositivo = dadosCalculados.saldoAcumulado >= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <Text style={styles.title}>Estudo de Viabilidade Comercial</Text>
          <Text style={styles.subtitle}>{titulo} • Emitido em {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>

        {/* IDENTIFICAÇÃO */}
        <View style={styles.infoBox}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Consumidor (Alvo)</Text>
            <Text style={styles.infoValue}>{consumidorNome || 'Não Informado'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Usina (Geração)</Text>
            <Text style={styles.infoValue}>{usinaNome || 'Não Informada'}</Text>
          </View>
        </View>

        {/* CARTÕES DE RESUMO */}
        <Text style={styles.sectionTitle}>Resumo do Período Projetado</Text>
        <View style={styles.resumoContainer}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Geração Total</Text>
            <Text style={styles.resumoValueGeracao}>{dadosCalculados.totalGerado.toLocaleString('pt-BR')} kWh</Text>
          </View>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Consumo Total</Text>
            <Text style={styles.resumoValueConsumo}>{dadosCalculados.totalConsumido.toLocaleString('pt-BR')} kWh</Text>
          </View>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Saldo Final Acumulado</Text>
            <Text style={isPositivo ? styles.resumoValueSaldoPos : styles.resumoValueSaldoNeg}>
              {isPositivo ? '+' : ''}{dadosCalculados.saldoAcumulado.toLocaleString('pt-BR')} kWh
            </Text>
          </View>
        </View>

        {/* TABELA PASSO A PASSO */}
        <Text style={styles.sectionTitle}>Jornada do Banco de Créditos (Mês a Mês)</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableColBase, styles.colMes]}>Mês</Text>
            <Text style={[styles.tableColBase, styles.colNum]}>Geração</Text>
            <Text style={[styles.tableColBase, styles.colNum]}>Consumo</Text>
            <Text style={[styles.tableColBase, styles.colNum]}>Balanço</Text>
            <Text style={[styles.tableColBase, styles.colNum, { fontWeight: 'bold' }]}>Acumulado</Text>
          </View>

          {dadosCalculados.detalhado.map((linha, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tableColBase, styles.colMes]}>{linha.mesGrafico !== '?' ? linha.mesGrafico : `Mês ${i+1}`}</Text>
              <Text style={[styles.tableColBase, styles.colNum, { color: '#2563eb' }]}>{linha.geracaoNum.toLocaleString('pt-BR')}</Text>
              <Text style={[styles.tableColBase, styles.colNum, { color: '#ea580c' }]}>{linha.consumoNum.toLocaleString('pt-BR')}</Text>
              <Text style={[styles.tableColBase, styles.colNum, linha.balancoMes >= 0 ? styles.textVerde : styles.textVermelho]}>
                {linha.balancoMes > 0 ? '+' : ''}{linha.balancoMes.toLocaleString('pt-BR')}
              </Text>
              <Text style={[styles.tableColBase, styles.colNum, { fontWeight: 'bold' }, linha.saldoAcumulado >= 0 ? styles.textVerde : styles.textVermelho]}>
                {linha.saldoAcumulado.toLocaleString('pt-BR')}
              </Text>
            </View>
          ))}
        </View>

        {/* VEREDITO FINAL */}
        <View style={[styles.veredictoBox, isPositivo ? styles.veredictoPositivo : styles.veredictoNegativo]}>
          <Text style={[styles.veredictoTitle, isPositivo ? styles.textVerde : styles.textVermelho]}>
            Veredito: {isPositivo ? 'SISTEMA AUTOSSUFICIENTE' : 'DÉFICIT DE GERAÇÃO'}
          </Text>
          <Text style={[styles.veredictoText, isPositivo ? styles.textVerde : styles.textVermelho]}>
            {isPositivo 
              ? `A usina dimensionada cobriu 100% da necessidade do cliente. Houve uma sobra final de ${dadosCalculados.saldoAcumulado.toLocaleString('pt-BR')} kWh.` 
              : `A usina dimensionada não foi suficiente. Faltaram ${Math.abs(dadosCalculados.saldoAcumulado).toLocaleString('pt-BR')} kWh no período, que serão cobrados pela concessionária.`}
          </Text>
        </View>

      </Page>
    </Document>
  );
};