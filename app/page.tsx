import Link from "next/link"
import { Bot, Phone, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HospitalHomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">+</span>
            </div>
            <span className="font-bold text-xl text-slate-900">CityCare Hospital</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Services
            </a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Doctors
            </a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Contact
            </a>
            <Button size="sm">Book Appointment</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-12 md:py-24 bg-linear-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 text-balance">
              World-Class Healthcare, <span className="text-blue-600">Close to Home</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 text-pretty">
              CityCare provides 24/7 emergency services, specialized consultations, and advanced diagnostics with a
              patient-first approach.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Our Services
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 bg-transparent">
                Find a Doctor
              </Button>
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Emergency Contact</h3>
              <p className="text-slate-600">Call (555) 123-4567 for immediate assistance 24/7.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Visit Us</h3>
              <p className="text-slate-600">123 Health Ave, Medical District, NY 10001.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Working Hours</h3>
              <p className="text-slate-600">OPD: 9:00 AM - 8:00 PM. Emergency: Open 24 Hours.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-blue-100 animate-bounce">
          <p className="text-sm font-semibold text-blue-700 whitespace-nowrap">Hi, how can I help you?</p>
        </div>
        <Link href="/chat">
          <button className="relative group">
            {/* Pulsing Ring Animation */}
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white">
              <Bot className="w-8 h-8" />
            </div>
          </button>
        </Link>
      </div>
    </div>
  )
}
