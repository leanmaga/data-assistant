import axios from "axios";
import { Schema, GeneratedData } from "@/store/dataStore";
import JSZip from "jszip";

// Configure base URL - adjust based on your deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Parse DDL Schema
export async function parseSchema(ddlText: string): Promise<Schema> {
  const response = await api.post("/api/schema/parse", { ddl_text: ddlText });
  return response.data.schema;
}

// Generate synthetic data
export async function generateData(params: {
  schema: Schema;
  prompt: string;
  numRows: number;
  temperature: number;
  maxTokens: number;
}): Promise<GeneratedData> {
  const response = await api.post("/api/data/generate", {
    schema: params.schema,
    prompt_instructions: params.prompt,
    num_rows: params.numRows,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
  });

  const data = response.data.data as GeneratedData;
  const hasRows = Object.values(data).some(
    (tableRows) => Array.isArray(tableRows) && tableRows.length > 0,
  );

  if (!hasRows) {
    throw new Error(
      "The backend returned no rows. Check the backend logs and Gemini configuration.",
    );
  }

  return data;
}

// Modify table data
export async function modifyTableData(
  tableName: string,
  currentData: any[],
  instructions: string,
): Promise<any[]> {
  const response = await api.post("/api/data/modify", {
    table_name: tableName,
    current_data: currentData,
    instructions,
  });
  return response.data.data;
}

// Export data as ZIP
export async function exportDataAsZip(data: GeneratedData): Promise<void> {
  const zip = new JSZip();

  // Add each table as a CSV file
  Object.entries(data).forEach(([tableName, rows]) => {
    if (rows.length === 0) return;

    // Generate CSV content
    const columns = Object.keys(rows[0]);
    const header = columns.join(",");
    const csvRows = rows.map((row) =>
      columns
        .map((col) => {
          const value = row[col];
          // Escape values containing commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    );

    const csv = [header, ...csvRows].join("\n");
    zip.file(`${tableName}.csv`, csv);
  });

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `synthetic_data_${timestamp}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Store data in PostgreSQL
export async function storeInPostgres(data: GeneratedData): Promise<void> {
  await api.post("/api/data/store", { data });
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await api.get("/health");
    return response.status === 200;
  } catch {
    return false;
  }
}
