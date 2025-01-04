"use client";
import { YouTubeAnalyzer } from "@/components/YouTubeAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">YouTube Watch History</span>
            <span className="block text-indigo-600 dark:text-indigo-500">Analytics Dashboard</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover insights from your YouTube watch history. Upload your data and explore your
            viewing patterns, favorite channels, and more.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {/* Feature 1 */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -left-3 w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Viewing Patterns
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Analyze your daily and yearly viewing patterns to understand your YouTube habits.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -left-3 w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Watch Time Insights
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Track your total watch time and see how it's distributed across channels and time
              periods.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -left-3 w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Channel Analytics
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Discover your most-watched channels and understand your content preferences.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            How to Get Started
          </h2>
          <div className="prose prose-indigo dark:prose-invert mx-auto">
            <ol className="text-left text-gray-500 dark:text-gray-400 list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://google.takeout.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:text-indigo-600"
                >
                  Google Takeout
                </a>
              </li>
              <li>Select only "YouTube and YouTube Music"</li>
              <li>Choose "History" and deselect all other data</li>
              <li>Export and download your data</li>
              <li>Upload the JSON file below to see your stats</li>
            </ol>
          </div>
        </div>

        {/* Main Component */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 text-lg font-medium text-gray-900 dark:text-white">
              Your Analytics
            </span>
          </div>
        </div>

        <div className="mt-8">
          <YouTubeAnalyzer />
        </div>
      </div>
    </div>
  );
}
