"use client";

import { useState } from "react";
import { useDataStore } from "@/store/dataStore";
import { Download, Send } from "lucide-react";
import { exportDataAsZip, modifyTableData } from "@/lib/api";

type PreviewRow = Record<string, unknown>;

export default function DataPreview() {
  const { schema, generatedData, selectedTable, setSelectedTable, setGeneratedData } =
    useDataStore();
  const [editInstruction, setEditInstruction] = useState("");
  const [modifying, setModifying] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!generatedData) return null;

  const tables = Object.keys(generatedData);
  const currentTable = selectedTable || tables[0];
  const currentData: PreviewRow[] = generatedData[currentTable] || [];

  const handleModify = async () => {
    if (!editInstruction.trim()) return;

    setModifying(true);
    try {
      const modifiedData = await modifyTableData(
        currentTable,
        currentData,
        editInstruction,
      );
      setGeneratedData({
        ...generatedData,
        [currentTable]: modifiedData,
      });
      setEditInstruction("");
    } catch (error) {
      console.error("Modification failed:", error);
      alert("Failed to modify data. Please try again.");
    } finally {
      setModifying(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDataAsZip(generatedData);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const columns: string[] = currentData.length > 0
    ? Object.keys(currentData[0])
    : schema?.[currentTable]?.columns.map((column: { name: string }) => column.name) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Preview</h2>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Download ZIP"}
        </button>
      </div>

      {/* Table Selector */}
      <div>
        <select
          value={currentTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col: string) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No rows were generated for this table.
                  </td>
                </tr>
              ) : currentData.map((row: PreviewRow, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col: string) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Edit</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            placeholder="Enter quick edit instructions..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleModify()}
          />
          <button
            onClick={handleModify}
            disabled={modifying || !editInstruction.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {modifying ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
