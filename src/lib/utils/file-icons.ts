/**
 * Map file extensions to icon names (lucide-react compatible)
 */

const EXTENSION_MAP: Record<string, { icon: string; color: string }> = {
  // JavaScript / TypeScript
  ts: { icon: 'FileCode2', color: '#3178c6' },
  tsx: { icon: 'FileCode2', color: '#3178c6' },
  js: { icon: 'FileCode2', color: '#f7df1e' },
  jsx: { icon: 'FileCode2', color: '#f7df1e' },
  mjs: { icon: 'FileCode2', color: '#f7df1e' },
  mts: { icon: 'FileCode2', color: '#3178c6' },

  // Styles
  css: { icon: 'Palette', color: '#1572b6' },
  scss: { icon: 'Palette', color: '#cc6699' },
  less: { icon: 'Palette', color: '#1d365d' },

  // Markup
  html: { icon: 'Globe', color: '#e34c26' },
  svg: { icon: 'Image', color: '#ffb13b' },
  xml: { icon: 'FileText', color: '#e37933' },

  // Data
  json: { icon: 'Braces', color: '#cbcb41' },
  yaml: { icon: 'FileText', color: '#cb171e' },
  yml: { icon: 'FileText', color: '#cb171e' },
  toml: { icon: 'FileText', color: '#9c4221' },

  // Config
  env: { icon: 'Lock', color: '#ecd53f' },
  gitignore: { icon: 'GitBranch', color: '#f05032' },

  // Markdown
  md: { icon: 'FileText', color: '#083fa1' },
  mdx: { icon: 'FileText', color: '#083fa1' },

  // Images
  png: { icon: 'Image', color: '#a074c4' },
  jpg: { icon: 'Image', color: '#a074c4' },
  jpeg: { icon: 'Image', color: '#a074c4' },
  gif: { icon: 'Image', color: '#a074c4' },
  webp: { icon: 'Image', color: '#a074c4' },
  ico: { icon: 'Image', color: '#a074c4' },

  // SQL
  sql: { icon: 'Database', color: '#e38c00' },
};

const FILENAME_MAP: Record<string, { icon: string; color: string }> = {
  'package.json': { icon: 'Package', color: '#cb3837' },
  'tsconfig.json': { icon: 'Settings', color: '#3178c6' },
  'vite.config.ts': { icon: 'Zap', color: '#646cff' },
  'netlify.toml': { icon: 'Cloud', color: '#00c7b7' },
  'README.md': { icon: 'BookOpen', color: '#083fa1' },
  'PLAN.md': { icon: 'ClipboardList', color: '#22c55e' },
  '.gitignore': { icon: 'GitBranch', color: '#f05032' },
};

export function getFileIcon(fileName: string): { icon: string; color: string } {
  // Check filename first
  const byName = FILENAME_MAP[fileName];
  if (byName) return byName;

  // Then extension
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const byExt = EXTENSION_MAP[ext];
  if (byExt) return byExt;

  // Default
  return { icon: 'File', color: '#a1a1aa' };
}
