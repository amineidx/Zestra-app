'use client'

import React, { useState } from 'react'
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
import { Sparkles, MessageSquare, ChevronLeft, ChevronRight, Landmark } from 'lucide-react'

type TabType =
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isAssistantOpen, setIsAssistantOpen] = useState(true)

  const renderActiveTab = () => {
    switch (activeTab) {
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
        return <Dashboard onNavigate={(tab) => setActiveTab(tab as TabType)} />
    }
  }

  const tabLabels: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'clients', label: 'Clients (CRM)' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'documents', label: 'Documents' },
    { key: 'knowledge', label: 'Knowledge Base' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-canvas print:h-auto print:overflow-visible">
      {/* Pinned Top Navigation Bar (Airtable top-nav spec: 64px, white canvas, ink type) */}
      <header className="h-16 border-b border-hairline bg-canvas flex items-center justify-between px-6 shrink-0 print:hidden z-10">
        <div className="flex items-center gap-8">
          {/* Logo brand wordmark */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-ink">Zestra</span>
            <span className="text-[10px] bg-signature-coral text-white font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>

          {/* Navigation links (Quietly editorial layout) */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabLabels.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold tracking-tight uppercase rounded-md transition ${
                  activeTab === tab.key
                    ? 'bg-surface-soft text-ink'
                    : 'text-muted-custom hover:text-ink hover:bg-surface-soft/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-3">
          {/* Mobile Tab Select Dropdown */}
          <div className="lg:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="text-xs font-semibold uppercase bg-surface-soft border border-hairline text-ink rounded-md p-2 focus:outline-none"
            >
              {tabLabels.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Collapsible Assistant Toggle Button */}
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`h-10 px-4 rounded-lg text-xs font-semibold uppercase flex items-center gap-2 border transition ${
              isAssistantOpen
                ? 'bg-signature-cream text-ink border-signature-cream hover:bg-signature-cream/80'
                : 'bg-canvas text-ink border-hairline hover:bg-surface-soft'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Co-Pilot</span>
            {isAssistantOpen ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Left Side: Active Panel (Scrollable content) */}
        <main className="flex-1 overflow-y-auto print:overflow-visible print:block">
          <div className="min-h-full pb-16">{renderActiveTab()}</div>
        </main>

        {/* Right Side: Collapsible AI Assistant Sidepanel */}
        {isAssistantOpen && (
          <aside className="print:hidden">
            <AIAssistant />
          </aside>
        )}
      </div>
    </div>
  )
}
