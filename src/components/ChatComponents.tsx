import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const CodeBlock = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || 'text';

  const onCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    toast.success("Код нусхабардорӣ шуд (Code copied!)");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/code relative my-6 rounded-[1.5rem] bg-[#02040a] border border-white/5 shadow-2xl overflow-hidden font-mono text-[13px]">
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400/60" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang}</span>
        </div>
        <button 
          onClick={onCopy}
          className="p-1.5 hover:bg-white/10 rounded-md transition-all text-slate-500 hover:text-white"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-6 overflow-x-auto custom-scrollbar">
        <code className={className}>{children}</code>
      </div>
    </div>
  );
};
