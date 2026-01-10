// components/ui/tabs.tsx
'use client';

import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, variant = 'underline', className = '' }: TabsProps) {
  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? variant === 'pills'
                      ? 'bg-green-100 text-green-700 rounded-t-lg'
                      : 'border-green-500 text-green-600'
                    : variant === 'pills'
                      ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    ml-2 py-0.5 px-2 text-xs font-medium rounded-full
                    ${isActive 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-gray-200 text-gray-800'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-6">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

export default Tabs;