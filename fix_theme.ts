import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { regex: /bg-\[#02040a\]/g, replacement: 'bg-slate-50 dark:bg-[#02040a]' },
  { regex: /text-slate-200/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-400/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-white/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /bg-\[#0b0f1a\]/g, replacement: 'bg-white dark:bg-[#0b0f1a]' },
  { regex: /bg-white\/5/g, replacement: 'bg-black/5 dark:bg-white/5' },
  { regex: /bg-white\/10/g, replacement: 'bg-black/10 dark:bg-white/10' },
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-black/[0.02] dark:bg-white/[0.02]' },
  { regex: /bg-white\/\[0\.03\]/g, replacement: 'bg-white dark:bg-white/[0.03]' },
  { regex: /bg-white\/\[0\.04\]/g, replacement: 'bg-white dark:bg-white/[0.04]' },
  { regex: /bg-white\/\[0\.05\]/g, replacement: 'bg-slate-100 dark:bg-white/[0.05]' },
  { regex: /border-white\/5/g, replacement: 'border-black/5 dark:border-white/5' },
  { regex: /border-white\/10/g, replacement: 'border-black/10 dark:border-white/10' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-black/5 dark:hover:bg-white/5' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-black/10 dark:hover:bg-white/10' },
  { regex: /hover:bg-white\/\[0\.05\]/g, replacement: 'hover:bg-black/5 dark:hover:bg-white/[0.05]' },
  { regex: /bg-black\/20/g, replacement: 'bg-white/80 dark:bg-black/20' },
  { regex: /bg-black\/50/g, replacement: 'bg-slate-900/50 dark:bg-black/50' },
  { regex: /bg-black\/60/g, replacement: 'bg-slate-900/60 dark:bg-black/60' },
  { regex: /border-slate-800\/50/g, replacement: 'border-slate-200 dark:border-slate-800/50' },
  { regex: /from-\[#02040a\] via-\[#02040a\]/g, replacement: 'from-slate-50 via-slate-50 dark:from-[#02040a] dark:via-[#02040a]' },
  { regex: /text-indigo-400/g, replacement: 'text-indigo-600 dark:text-indigo-400' },
  { regex: /text-indigo-300/g, replacement: 'text-indigo-700 dark:text-indigo-300' },
  { regex: /border-indigo-500\/30/g, replacement: 'border-indigo-500/50 dark:border-indigo-500/30' },
  { regex: /bg-indigo-500\/10/g, replacement: 'bg-indigo-500/20 dark:bg-indigo-500/10' },
  { regex: /hover:text-white/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },
];

for (const { regex, replacement } of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx theme classes replaced.');
