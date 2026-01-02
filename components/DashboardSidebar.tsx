"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Upload, Menu, X, Activity, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Embedded PDFs", href: "/dashboard/pdfs", icon: FileText },
  { name: "Upload PDF", href: "/dashboard/upload", icon: Upload },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
      // Swipe from left edge to right (open sidebar)
      if (touchStartX.current < 50 && touchEndX.current - touchStartX.current > 100) {
        setIsOpen(true)
      }
      
      // Swipe from right to left (close sidebar)
      if (isOpen && touchStartX.current - touchEndX.current > 100) {
        setIsOpen(false)
      }
    }

    // Only add listeners on mobile
    if (window.innerWidth < 1024) {
      document.addEventListener('touchstart', handleTouchStart)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile sticky header bar - Only visible on mobile screens */}
      <div className="fixed top-0 left-0 right-0 z-60 lg:hidden h-14 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="flex items-center h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-3">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold">Hospital RAG</span>
          </div>
        </div>
      </div>

      {/* Spacer for mobile header - pushes content down */}
      <div className="h-14 lg:hidden" />

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-70 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-80 h-screen w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand with Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">Hospital RAG</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
            
            {/* Close button - Only visible on mobile when sidebar is open */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs font-medium text-sidebar-foreground">Storage Status</p>
              <p className="mt-1 text-xs text-muted-foreground">24 PDFs embedded</p>
              <div className="mt-2 h-1.5 rounded-full bg-sidebar-border">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}