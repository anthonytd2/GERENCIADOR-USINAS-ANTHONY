/*
  # Sistema de Gestão de Usinas - Schema Completo

  1. Novas Tabelas
    - `Consumidores`
      - `ConsumidorID` (serial, primary key)
      - `Nome` (text, not null)
      - `MediaConsumo` (integer, nullable)
      - `PercentualDesconto` (numeric(5,4), nullable) - Ex: 0.2200 para 22%
      - `ValorKW` (numeric(10,4), nullable) - Valor do kW em R$
      - `TempoContratoAnos` (integer, nullable)
      - `InicioContrato` (date, nullable)
      - `VencimentoContrato` (date, nullable)
      - `Vendedor` (text, nullable)
    
    - `Usinas`
      - `UsinaID` (serial, primary key)
      - `NomeProprietario` (text, not null)
      - `Potencia` (integer, nullable) - Potência em kWp
      - `Tipo` (text, nullable) - Ex: GD1, GD2
      - `ValorKWBruto` (numeric(10,4), nullable)
      - `GeracaoEstimada` (integer, nullable) - Geração estimada em kWh
      - `InicioContrato` (date, nullable)
      - `VencimentoContrato` (date, nullable)
      - `TipoPagamento` (text, nullable) - Ex: Consumo ou Injetado
    
    - `Status`
      - `StatusID` (serial, primary key)
      - `Descricao` (text, not null, unique)
    
    - `Vinculos`
      - `VinculoID` (serial, primary key)
      - `ConsumidorID` (integer, foreign key)
      - `UsinaID` (integer, foreign key)
      - `StatusID` (integer, foreign key)
      - Unique constraint em (ConsumidorID, UsinaID)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para acesso autenticado completo
    
  3. Índices
    - Índices em Nome (Consumidores) e NomeProprietario (Usinas) para buscas
    - Índices nas foreign keys da tabela Vinculos
    
  4. Dados Iniciais
    - Inserção de 4 status padrão do sistema
*/

-- Tabela Consumidores
CREATE TABLE IF NOT EXISTS Consumidores (
  ConsumidorID serial PRIMARY KEY,
  Nome text NOT NULL,
  MediaConsumo integer,
  PercentualDesconto numeric(5,4),
  ValorKW numeric(10,4),
  TempoContratoAnos integer,
  InicioContrato date,
  VencimentoContrato date,
  Vendedor text
);

CREATE INDEX IF NOT EXISTS idx_nome_consumidor ON Consumidores(Nome);

ALTER TABLE Consumidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on Consumidores"
  ON Consumidores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabela Usinas
CREATE TABLE IF NOT EXISTS Usinas (
  UsinaID serial PRIMARY KEY,
  NomeProprietario text NOT NULL,
  Potencia integer,
  Tipo text,
  ValorKWBruto numeric(10,4),
  GeracaoEstimada integer,
  InicioContrato date,
  VencimentoContrato date,
  TipoPagamento text
);

CREATE INDEX IF NOT EXISTS idx_nome_proprietario ON Usinas(NomeProprietario);

ALTER TABLE Usinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on Usinas"
  ON Usinas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabela Status
CREATE TABLE IF NOT EXISTS Status (
  StatusID serial PRIMARY KEY,
  Descricao text NOT NULL UNIQUE
);

ALTER TABLE Status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on Status"
  ON Status FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir dados iniciais de Status
INSERT INTO Status (Descricao) VALUES
  ('Em compensação'),
  ('Aguardando transferência'),
  ('Revisar o consumo x compensação'),
  ('Consumo x compensação revisado')
ON CONFLICT (Descricao) DO NOTHING;

-- Tabela Vinculos
CREATE TABLE IF NOT EXISTS Vinculos (
  VinculoID serial PRIMARY KEY,
  ConsumidorID integer NOT NULL REFERENCES Consumidores(ConsumidorID) ON DELETE RESTRICT ON UPDATE CASCADE,
  UsinaID integer NOT NULL REFERENCES Usinas(UsinaID) ON DELETE RESTRICT ON UPDATE CASCADE,
  StatusID integer NOT NULL REFERENCES Status(StatusID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uk_consumidor_usina UNIQUE (ConsumidorID, UsinaID)
);

CREATE INDEX IF NOT EXISTS idx_vinculos_consumidor ON Vinculos(ConsumidorID);
CREATE INDEX IF NOT EXISTS idx_vinculos_usina ON Vinculos(UsinaID);
CREATE INDEX IF NOT EXISTS idx_vinculos_status ON Vinculos(StatusID);

ALTER TABLE Vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on Vinculos"
  ON Vinculos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);