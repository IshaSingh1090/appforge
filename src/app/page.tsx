import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">AppForge</span>
        </div>
        <Link
          href="/auth/signin"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 border border-indigo-100">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          AI-Powered App Generator
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Turn ideas into apps
          <br />
          <span className="text-indigo-600">in minutes</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Describe your app in plain English. AppForge generates a complete working application
          with UI, APIs, and database — ready to customize and deploy.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth/signin"
            className="rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            Start Building Free
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-gray-200 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            See How It Works
          </a>
        </div>

        {/* App preview mockup */}
        <div className="mt-20 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-left shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Build me a CRM for managing customers</p>
                <p className="text-xs text-gray-400">Generating your app...</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Customers', 'Deals', 'Tasks'].map((item) => (
                <div key={item} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Total {item}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {Math.floor(Math.random() * 200 + 50)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How AppForge works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe your app',
                desc: 'Tell us what you want to build in plain English. Be as specific or vague as you like.',
                icon: '💬',
              },
              {
                step: '02',
                title: 'AI generates everything',
                desc: 'Our AI creates the complete app configuration — models, pages, forms, tables, and APIs.',
                icon: '⚡',
              },
              {
                step: '03',
                title: 'Deploy and use',
                desc: 'Your app is live instantly. Add data, customize, and export to GitHub.',
                icon: '🚀',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-xs font-bold text-indigo-600 mb-1">{item.step}</p>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>Built with Next.js · TypeScript · PostgreSQL · Prisma · TailwindCSS</p>
        <p className="mt-1">AppForge — AI App Generator · Demo Task Submission</p>
      </footer>
    </div>
  );
}
