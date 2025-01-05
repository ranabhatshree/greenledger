'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, Github, Leaf } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-gray-800">
      <header className="container mx-auto p-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-800">GreenLedger</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="https://github.com/ranabhatshree/greenledger" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-green-700 hover:text-green-900 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
            <Link 
              href="/login" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="text-green-700 border-green-700 hover:bg-green-100">
                Login
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12">
        <section className={`text-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-5xl font-bold mb-6 text-green-800">
            Simplify Your Accounting with GreenLedger
          </h1>
          <p className="text-xl mb-8 text-green-700">
            Open-source accounting software for a sustainable future
          </p>
          <Link 
            href="#features" 
            className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
          >
            Explore Features
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>

        <section id="features" className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-center text-green-800">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-green-700">Intuitive Bookkeeping</h3>
              <p className="text-gray-600">Streamline your financial processes with our user-friendly interface. GreenLedger simplifies complex accounting tasks, making it easy for businesses of all sizes to maintain accurate records.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-green-700">Comprehensive Reporting</h3>
              <p className="text-gray-600">Generate detailed financial reports with just a few clicks. From balance sheets to cash flow statements, GreenLedger provides the insights you need to make informed business decisions.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-green-700">Sustainability Metrics</h3>
              <p className="text-gray-600">Track your organization's environmental impact alongside financial performance. GreenLedger integrates eco-friendly metrics, helping you measure and improve your sustainability efforts.</p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-green-100 rounded-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-green-800">Open Source</h2>
            <p className="text-xl mb-8 text-green-700">
              GreenLedger is free and open source. Join our community and contribute to sustainable accounting practices.
            </p>
            <Link 
              href="https://github.com/ranabhatshree/greenledger" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
            >
              View on GitHub
              <Github className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} GreenLedger. All rights reserved.</p>
          <p className="mt-2">Made with 💚 for a sustainable future</p>
        </div>
      </footer>
    </div>
  )
}

