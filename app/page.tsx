import Link from 'next/link';
import UserSelector from './(components)/UserSelector';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Insyd Notifications Demo
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            A real-time notification system with AI-powered ranking
          </p>
        </div>

        {/* User Selection */}
        <UserSelector />

        {/* Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/notifications"
            className="w-full sm:w-auto px-6 py-3 text-center bg-blue-600 text-white font-medium rounded-lg 
              shadow-sm hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2"
          >
            View Notifications
          </Link>
          <Link
            href="/digest"
            className="w-full sm:w-auto px-6 py-3 text-center bg-white text-blue-600 font-medium rounded-lg 
              shadow-sm border border-blue-600 hover:bg-blue-50 transition-colors duration-200 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Digest
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-xl font-semibold mb-2">🚀 Real-time Updates</div>
            <p className="text-gray-600">
              Notifications appear instantly with real-time polling and toast alerts.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-xl font-semibold mb-2">🤖 AI-Powered Ranking</div>
            <p className="text-gray-600">
              Smart notification sorting based on relevance and importance.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-xl font-semibold mb-2">🎯 Demo Interactions</div>
            <p className="text-gray-600">
              Try out posts, likes, and follows with demo user interactions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-xl font-semibold mb-2">📱 Responsive Design</div>
            <p className="text-gray-600">
              Beautiful and functional on all devices and screen sizes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>No authentication required. Select a demo user to get started.</p>
          <p className="mt-2">
            Built with Next.js, Prisma, and Tailwind CSS.
          </p>
        </div>
      </div>
    </main>
  );
}
