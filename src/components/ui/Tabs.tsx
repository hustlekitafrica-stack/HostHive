import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface TabItem {
  label: string;
  value: string;
  icon?: string;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}

interface TabContentProps {
  value: string;
  children: React.ReactNode;
}

export function Tabs({ items, defaultValue, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onChange?.(value);
  };

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-surface-200 mb-6">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => handleTabChange(item.value)}
            className={cn(
              'px-4 py-3 font-medium transition-colors border-b-2 -mb-px',
              activeTab === item.value
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-surface-600 hover:text-surface-900'
            )}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && (child.props as any).value === activeTab) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function TabContent({ value, children }: TabContentProps) {
  return <div>{children}</div>;
}
