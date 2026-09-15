"use client";

import { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useDataStore } from "@/store/dataStore";
import { parseSchema } from "@/lib/api";

const sampleSchemas = [
  {
    label: "Company Employees",
    url: "/company_employee_schema.ddl",
  },
  {
    label: "Library Management",
    url: "/library_mgm_schema.ddl",
  },
  {
    label: "Restaurants",
    url: "/restrurants_schema.ddl",
  },
];

export default function SchemaUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState(sampleSchemas[0].url);
  const { schema, setSchema } = useDataStore();

  const processSchemaText = async (text: string, sourceName: string) => {
    setFileName(sourceName);
    setUploading(true);

    try {
      const parsedSchema = await parseSchema(text);
      setSchema(parsedSchema);
    } catch (error) {
      console.error("Failed to parse schema:", error);
      alert("Failed to parse DDL schema. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    await processSchemaText(text, file.name);
  };

  const handleLoadSample = async () => {
    const sample = sampleSchemas.find((item) => item.url === selectedSample);
    if (!sample) return;

    const response = await fetch(sample.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample schema: ${response.status}`);
    }

    const text = await response.text();
    await processSchemaText(text, sample.label);
  };

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Upload DDL Schema
      </label>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload DDL Schema
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".sql,.txt,.ddl"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          <select
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
            className="px-3 py-2 border border-gray-300  dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sampleSchemas.map((sample) => (
              <option key={sample.url} value={sample.url}>
                {sample.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              handleLoadSample().catch((error) => {
                console.error(error);
                alert("Failed to load sample schema.");
              });
            }}
            className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:bg-blue-950 transition-colors text-sm"
          >
            Load sample
          </button>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Supported formats: SQL, TXT, DDL
      </div>

      {/* Status Display */}
      {uploading && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Parsing schema...</span>
        </div>
      )}

      {schema && !uploading && (
        <div className="mt-4 flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            ✅ Loaded schema with {Object.keys(schema).length} tables
            {fileName && ` (${fileName})`}
          </span>
        </div>
      )}

      {/* Schema Info */}
      {schema && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900  dark:text-gray-100 mb-2">
            Schema Tables:
          </h3>
          <ul className="space-y-1">
            {Object.entries(schema).map(([tableName, tableInfo]) => (
              <li key={tableName} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{tableName}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({tableInfo.columns.length} columns)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
