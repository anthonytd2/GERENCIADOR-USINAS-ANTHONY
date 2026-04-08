import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #3b82f6', paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  
  infoBox: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 15 },
  infoColumn: { flex: 1 },
  infoLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  infoValue: { fontSize: 12, color: '#0f172a', marginTop: 3 },

  resumoContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  resumoCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 },
  resumoLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' },
  resumoValueGeracao: { fontSize: 14, color: '#2563eb', fontWeight: 'bold', marginTop: 4 },
  resumoValueConsumo: { fontSize: 14, color: '#ea580c', fontWeight: 'bold', marginTop: 4 },
  resumoValuePropria: { fontSize: 14, color: '#0d9488', fontWeight: 'bold', marginTop: 4 },
  resumoValueSaldoPos: { fontSize: 14, color: '#16a34a', fontWeight: 'bold', marginTop: 4 },
  resumoValueSaldoNeg: { fontSize: 14, color: '#dc2626', fontWeight: 'bold', marginTop: 4 },

  table: { width: '100%', marginBottom: 20 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0' },
  tableColBase: { padding: 6, fontSize: 8 },
  colMes: { width: '15%', fontWeight: 'bold', color: '#334155' },
  colBaseNum: { flex: 1, textAlign: 'right' },
  
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
    totalGeracaoPropria: number;
    saldoAcumulado: number;
    temGeracaoPropria: boolean;
  };
  chartImage?: string | null;
}

export const RelatorioSimulacaoPDF = ({ titulo, consumidorNome, usinaNome, dadosCalculados, chartImage }: Props) => {
  const isPositivo = dadosCalculados.saldoAcumulado >= 0;
  const temPropria = dadosCalculados.temGeracaoPropria;

  const consumoResidualTotal = dadosCalculados.totalConsumido - dadosCalculados.totalGeracaoPropria;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Estudo de Viabilidade Comercial</Text>
          <Text style={styles.subtitle}>{titulo} • Emitido em {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Consumidor (Alvo)</Text>
            <Text style={styles.infoValue}>{consumidorNome || 'Não Informado'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Usina Nova (Proposta)</Text>
            <Text style={styles.infoValue}>{usinaNome || 'Não Informada'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumo do Período Projetado</Text>
        <View style={styles.resumoContainer}>
          {temPropria && (
             <View style={styles.resumoCard}>
               <Text style={styles.resumoLabel}>Consumo Bruto</Text>
               <Text style={[styles.resumoValueConsumo, { color: '#64748b' }]}>{dadosCalculados.totalConsumido.toLocaleString('pt-BR')} kWh</Text>
             </View>
          )}

          {temPropria && (
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Abate (Ger. Própria)</Text>
              <Text style={styles.resumoValuePropria}>- {dadosCalculados.totalGeracaoPropria.toLocaleString('pt-BR')} kWh</Text>
            </View>
          )}

          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>{temPropria ? 'Necessidade Real (Falta)' : 'Consumo Total'}</Text>
            <Text style={styles.resumoValueConsumo}>{temPropria ? consumoResidualTotal.toLocaleString('pt-BR') : dadosCalculados.totalConsumido.toLocaleString('pt-BR')} kWh</Text>
          </View>

          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Nova Usina Projetada</Text>
            <Text style={styles.resumoValueGeracao}>+ {dadosCalculados.totalGerado.toLocaleString('pt-BR')} kWh</Text>
          </View>
          
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Saldo Final Acumulado</Text>
            <Text style={isPositivo ? styles.resumoValueSaldoPos : styles.resumoValueSaldoNeg}>
              {isPositivo ? '+' : ''}{dadosCalculados.saldoAcumulado.toLocaleString('pt-BR')} kWh
            </Text>
          </View>
        </View>

        {/* 🟢 GRÁFICO IMPRESSO */}
        {chartImage && (
          <View style={{ marginVertical: 15, alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Curva de Geração vs Consumo</Text>
            <Image src={chartImage} style={{ width: '100%', height: 'auto' }} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Jornada do Banco de Créditos (Mês a Mês)</Text>
        <View style={styles.table}>
          
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableColBase, styles.colMes]}>Mês</Text>
            <Text style={[styles.tableColBase, styles.colBaseNum]}>{temPropria ? 'Cons. Total' : 'Consumo'}</Text>
            {temPropria && <Text style={[styles.tableColBase, styles.colBaseNum, { color: '#0d9488' }]}>Ger. Própria</Text>}
            {temPropria && <Text style={[styles.tableColBase, styles.colBaseNum, { color: '#ea580c' }]}>O Que Falta</Text>}
            <Text style={[styles.tableColBase, styles.colBaseNum]}>Usina Nova</Text>
            <Text style={[styles.tableColBase, styles.colBaseNum]}>Balanço</Text>
            <Text style={[styles.tableColBase, styles.colBaseNum, { fontWeight: 'bold' }]}>Acumulado</Text>
          </View>

          {dadosCalculados.detalhado.map((linha, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tableColBase, styles.colMes]}>{linha.mesGrafico !== '?' ? linha.mesGrafico : `Mês ${i+1}`}</Text>
              
              <Text style={[styles.tableColBase, styles.colBaseNum, { color: temPropria ? '#64748b' : '#ea580c' }]}>{linha.consumoNum.toLocaleString('pt-BR')}</Text>
              
              {temPropria && (
                <Text style={[styles.tableColBase, styles.colBaseNum, { color: '#0d9488' }]}>- {linha.geracaoPropriaNum.toLocaleString('pt-BR')}</Text>
              )}
              
              {temPropria && (
                <Text style={[styles.tableColBase, styles.colBaseNum, { color: '#ea580c', fontWeight: 'bold' }]}>{linha.consumoResidual.toLocaleString('pt-BR')}</Text>
              )}

              <Text style={[styles.tableColBase, styles.colBaseNum, { color: '#2563eb' }]}>{linha.geracaoNum.toLocaleString('pt-BR')}</Text>
              
              <Text style={[styles.tableColBase, styles.colBaseNum, linha.balancoMes >= 0 ? styles.textVerde : styles.textVermelho]}>
                {linha.balancoMes > 0 ? '+' : ''}{linha.balancoMes.toLocaleString('pt-BR')}
              </Text>
              
              <Text style={[styles.tableColBase, styles.colBaseNum, { fontWeight: 'bold' }, linha.saldoAcumulado >= 0 ? styles.textVerde : styles.textVermelho]}>
                {linha.saldoAcumulado.toLocaleString('pt-BR')}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.veredictoBox, isPositivo ? styles.veredictoPositivo : styles.veredictoNegativo]}>
          <Text style={[styles.veredictoTitle, isPositivo ? styles.textVerde : styles.textVermelho]}>
            Veredito: {isPositivo ? 'SISTEMA AUTOSSUFICIENTE' : 'DÉFICIT DE GERAÇÃO'}
          </Text>
          <Text style={[styles.veredictoText, isPositivo ? styles.textVerde : styles.textVermelho]}>
            {isPositivo 
              ? `A Usina Nova dimensionada cobriu 100% da necessidade restante do cliente. Houve uma sobra final de ${dadosCalculados.saldoAcumulado.toLocaleString('pt-BR')} kWh.` 
              : `A Usina Nova dimensionada não foi suficiente. Faltaram ${Math.abs(dadosCalculados.saldoAcumulado).toLocaleString('pt-BR')} kWh no período, que ainda serão cobrados pela concessionária.`}
          </Text>
        </View>

      </Page>
    </Document>
  );
};