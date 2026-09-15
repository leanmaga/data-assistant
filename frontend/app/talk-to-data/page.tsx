"use client";

import { MessageSquare, Sparkles } from "lucide-react";

export default function TalkToDataPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Talk to your data</h1>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border border-blue-100">
        <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Coming in Phase 2 & 3
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Soon you'll be able to query your generated data using natural
          language, generate SQL queries with AI, and visualize insights with
          interactive charts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Natural Language Queries
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ask questions in plain English and get instant answers from your
              data
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Smart Visualizations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Automatically generate charts and graphs from your queries
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">SQL Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI-powered SQL query generation with explanation
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-blue-200">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            In the meantime, generate some synthetic data in the{" "}
            <a
              href="/data-generation"
              className="text-blue-600 font-medium hover:underline"
            >
              Data Generation
            </a>{" "}
            tab
          </p>
        </div>
      </div>
    </div>
  );
}
