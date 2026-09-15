"use client";

import { useDataStore } from "@/store/dataStore";

export default function AdvancedParams() {
  const {
    temperature,
    maxTokens,
    numRows,
    setTemperature,
    setMaxTokens,
    setNumRows,
  } = useDataStore();

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Advanced Parameters
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.0</span>
              <span className="font-medium text-gray-900">
                {temperature.toFixed(1)}
              </span>
              <span>2.0</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher values make output more random
          </p>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            step="100"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum tokens per response
          </p>
        </div>

        {/* Number of Rows */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rows per Table
          </label>
          <input
            type="number"
            min="1"
            max="10000"
            step="100"
            value={numRows}
            onChange={(e) => setNumRows(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of rows to generate
          </p>
        </div>
      </div>
    </div>
  );
}
