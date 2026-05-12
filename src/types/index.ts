export type Theme = 'dark' | 'light';

export interface Command {
  id: string;
  title: string;
  syntax: string;
  description: string;
  analogy: string;
  examples: string[];
  category: string;
  note?: string;
}

export interface Category {
  label: string;
  id: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { label: 'Getting Started', id: 'getting-started', icon: '🚀' },
  { label: 'Authentication', id: 'authentication', icon: '🔐' },
  { label: 'Chat', id: 'chat', icon: '💬' },
  { label: 'Models', id: 'models', icon: '🧬' },
  { label: 'Configuration', id: 'configuration', icon: '⚙️' },
  { label: 'Code', id: 'code', icon: '💻' },
  { label: 'Agents', id: 'agents', icon: '🤖' },
  { label: 'MCP', id: 'mcp', icon: '🔌' },
  { label: 'Memory', id: 'memory', icon: '🧠' },
  { label: 'Instructions', id: 'instructions', icon: '📝' },
  { label: 'Troubleshooting', id: 'troubleshooting', icon: '🔧' },
];
