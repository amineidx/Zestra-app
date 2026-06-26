'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { Dashboard } from '@/features/dashboard'
import { Transactions } from '@/features/transactions'
import { Invoices } from '@/features/invoices'
import { Clients } from '@/features/clients'
import { Analytics } from '@/features/analytics'
import { Calendar } from '@/features/calendar'
import { Documents } from '@/features/documents'
import { Knowledge } from '@/features/knowledge'
import { Settings } from '@/features/settings'
import { AIAssistant } from '@/features/assistant'
import {
  Sparkles,
  LayoutDashboard,
  Receipt,
  Printer,
  Users,
  BarChart3,
  Calendar as CalendarIcon,
  FolderOpen,
  BookOpen,
  Settings as SettingsIcon,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Plus
} from 'lucide-react'

type TabType =
  | 'assistant'
  | 'dashboard'
  | 'transactions'
  | 'invoices'
  | 'clients'
  | 'analytics'
  | 'calendar'
  | 'documents'
  | 'knowledge'
  | 'settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('assistant')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Load Settings to get Business Name
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json()
    },
  })

  const userName = settings?.businessName || 'Auto Entrepreneur'

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'assistant':
        return <AIAssistant />
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab as TabType)} />
      case 'transactions':
        return <Transactions />
      case 'invoices':
        return <Invoices />
      case 'clients':
        return <Clients />
      case 'analytics':
        return <Analytics />
      case 'calendar':
        return <Calendar />
      case 'documents':
        return <Documents />
      case 'knowledge':
        return <Knowledge />
      case 'settings':
        return <Settings />
      default:
        return <AIAssistant />
    }
  }

  const navItems: { key: TabType; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'assistant', label: 'AI Co-Pilot', icon: Sparkles },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'invoices', label: 'Invoices', icon: Printer },
    { key: 'clients', label: 'Clients (CRM)', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { key: 'documents', label: 'Documents', icon: FolderOpen },
    { key: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  ]

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* 1. LEFT SIDEBAR (Desktop: lg viewports) */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-border/60 bg-card shrink-0 transition-all duration-300 ease-in-out z-20 ${
          isSidebarExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Top brand header */}
        <div className="h-16 px-4 flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className={`flex items-center gap-2 transition-opacity duration-300 ${
            isSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'
          }`}>
            <span className="font-bold text-lg tracking-tight text-ink dark:text-white">Zestra</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gemini-gradient text-white font-bold uppercase tracking-wider">
              PRO
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
          {/* New Chat quick button (Gemini style) */}
          {isSidebarExpanded ? (
            <button 
              onClick={() => setActiveTab('assistant')}
              className="w-full h-11 px-4 rounded-full bg-accent/60 hover:bg-accent text-xs font-semibold uppercase flex items-center justify-start gap-3 transition border border-border/40 text-ink dark:text-foreground hover:scale-[1.01]"
            >
              <Plus className="h-4.5 w-4.5 text-gemini-purple" />
              <span>New Instruction</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('assistant')}
              className="w-10 h-10 mx-auto rounded-full bg-accent/60 hover:bg-accent flex items-center justify-center transition border border-border/40 text-ink dark:text-foreground hover:scale-105"
              title="New Instruction"
            >
              <Plus className="h-4.5 w-4.5 text-gemini-purple" />
            </button>
          )}

          <div className="h-4" />

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 group relative ${
                  isSidebarExpanded ? 'px-4 py-3 justify-start gap-3' : 'p-3 justify-center'
                } ${
                  isActive 
                    ? 'bg-accent text-ink dark:text-white font-semibold border-l-4 border-gemini-blue' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
                title={!isSidebarExpanded ? item.label : undefined}
              >
                {isActive && item.key === 'assistant' ? (
                  <Icon className="h-5 w-5 text-gemini-gradient shrink-0" />
                ) : (
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-ink dark:text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                )}
                
                {isSidebarExpanded && (
                  <span className="text-sm tracking-tight truncate">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border/60 space-y-1 shrink-0">
          {/* Dark Mode toggle button */}
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 ${
              isSidebarExpanded ? 'px-4 py-2.5 gap-3' : 'p-2.5 justify-center'
            }`}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            {isSidebarExpanded && <span className="text-xs uppercase font-medium tracking-wider">Theme Mode</span>}
          </button>

          {/* Settings button */}
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center rounded-lg transition-all duration-200 ${
              isSidebarExpanded ? 'px-4 py-2.5 gap-3' : 'p-2.5 justify-center'
            } ${
              activeTab === 'settings' 
                ? 'bg-accent text-ink dark:text-white font-semibold' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            }`}
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
            {isSidebarExpanded && <span className="text-xs uppercase font-medium tracking-wider">Settings</span>}
          </button>

          {/* User profile section */}
          <div className={`w-full flex items-center ${isSidebarExpanded ? 'px-3 py-2 gap-3' : 'py-2 justify-center'}`}>
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 border border-border/60">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-ink dark:text-foreground truncate">{userName}</span>
                <span className="text-[10px] text-muted-foreground truncate">Algerian Auto Entrepreneur</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP-BAR & SIDEBAR DRAWER (sm to md viewports) */}
      <div className="lg:hidden flex flex-col flex-1 h-full overflow-hidden">
        <header className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-base tracking-tight">Zestra</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>
        </header>

        {/* Mobile slide-in Drawer Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}>
            <div 
              className="w-64 h-full bg-card border-r border-border/60 flex flex-col p-4 animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-border/60">
                <span className="font-bold text-lg">Zestra</span>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveTab(item.key)
                        setIsMobileOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                        isActive 
                          ? 'bg-accent text-ink dark:text-white border-l-4 border-gemini-blue' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-border/60 space-y-2">
                <button 
                  onClick={() => {
                    setActiveTab('settings')
                    setIsMobileOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'settings' ? 'bg-accent text-ink dark:text-white' : 'text-muted-foreground'
                  }`}
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {renderActiveTab()}
        </main>
      </div>

      {/* 3. DESKTOP WORKSPACE (lg viewports) */}
      <main className="hidden lg:flex flex-col flex-1 h-full overflow-hidden bg-background">
        {renderActiveTab()}
      </main>

    </div>
  )
}
