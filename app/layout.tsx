import './globals.css';

export const metadata = {
  title: 'Insyd Notifications Demo',
  description: 'A modern notification system POC with Next.js, Prisma, and AI ranking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Insyd Notifications Demo
          </h1>
          {children}
        </main>
      </body>
    </html>
  )
}
