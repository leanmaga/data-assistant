"use client";

import { useState } from "react";
import SchemaUploader from "@/components/SchemaUploader";
import AdvancedParams from "@/components/AdvancedParams";
import DataPreview from "@/components/DataPreview";
import { useDataStore } from "@/store/dataStore";
import { generateData } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function DataGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    schema,
    generatedData,
    numRows,
    temperature,
    maxTokens,
    setGeneratedData,
  } = useDataStore();

  const handleGenerate = async () => {
    if (!schema) {
      alert("Please upload a DDL schema first");
      return;
    }

    setLoading(true);
    try {
      const data = await generateData({
        schema,
        prompt,
        numRows,
        temperature,
        maxTokens,
      });
      setGeneratedData(data);
    } catch (error) {
      console.error("Generation failed:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to generate data: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="p-8 max-w-7xl mx-auto">
  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
    Data Generation
  </h1>

  <section className="mb-8">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Prompt
    </label>
    <textarea
      className="w-full h-32 px-4 py-3 border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </section>

      {/* Schema Upload */}
      <SchemaUploader />

      {/* Advanced Parameters */}
      <AdvancedParams />

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !schema}
        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate"
        )}
      </button>

      {/* Data Preview */}
      {generatedData && (
        <div className="mt-8">
          <DataPreview />
        </div>
      )}
    </div>
  );
}
