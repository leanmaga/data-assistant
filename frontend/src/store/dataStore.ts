import { create } from "zustand";

export interface Column {
  name: string;
  type: string;
  constraints: string;
}

export interface ForeignKey {
  column: string;
  refTable: string;
  refColumn: string;
}

export interface TableSchema {
  columns: Column[];
  primaryKeys: string[];
  foreignKeys: ForeignKey[];
}

export interface Schema {
  [tableName: string]: TableSchema;
}

export interface GeneratedData {
  [tableName: string]: any[];
}

interface DataState {
  schema: Schema | null;
  generatedData: GeneratedData | null;
  selectedTable: string | null;
  temperature: number;
  maxTokens: number;
  numRows: number;

  setSchema: (schema: Schema) => void;
  setGeneratedData: (data: GeneratedData) => void;
  setSelectedTable: (table: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setNumRows: (rows: number) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  schema: null,
  generatedData: null,
  selectedTable: null,
  temperature: 1.0,
  maxTokens: 100,
  numRows: 1000,

  setSchema: (schema) => set({ schema }),
  setGeneratedData: (data) => set({ generatedData: data }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setTemperature: (temp) => set({ temperature: temp }),
  setMaxTokens: (tokens) => set({ maxTokens: tokens }),
  setNumRows: (rows) => set({ numRows: rows }),
  reset: () =>
    set({
      schema: null,
      generatedData: null,
      selectedTable: null,
      temperature: 1.0,
      maxTokens: 100,
      numRows: 1000,
    }),
}));
