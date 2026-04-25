import React from 'react';
import { Sunrise, Sun, Sunset, Moon, Clock, Newspaper, ExternalLink, TrendingUp, Globe, Briefcase, Heart } from 'lucide-react';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export const PrayerCard = ({ data }: { data: { city: string, timings: PrayerTimings } }) => {
  const prayerIcons: Record<string, any> = {
    'Fajr': <Sunrise size={14} className="text-amber-200" />,
    'Sunrise': <Sun size={14} className="text-amber-300" />,
    'Dhuhr': <Sun size={14} className="text-yellow-400" />,
    'Asr': <Sun size={14} className="text-orange-400" />,
    'Maghrib': <Sunset size={14} className="text-rose-300" />,
    'Isha': <Moon size={14} className="text-indigo-200" />
  };

  return (
    <div className="my-8 p-0 bg-[#0a2e2a] rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group/card max-w-sm border border-emerald-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -ml-16 -mb-16" />
      
      <div className="p-6 pb-4 border-b border-white/5 relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold">S</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Sugd AI</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white/90">{data.city}</h3>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60 mb-1">Source</div>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold tracking-tighter uppercase">Aladhan</div>
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 relative z-10">
        {Object.entries(data.timings).filter(([k]) => ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(k)).map(([name, time]) => (
          <div key={name} className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-4 rounded-3xl transition-all duration-300 group/tile">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{name}</div>
              <div className="opacity-50 group-hover/tile:opacity-100 transition-opacity">
                {prayerIcons[name] || <Clock size={14} />}
              </div>
            </div>
            <div className="text-xl font-black tracking-tight group-hover/tile:scale-105 transition-transform origin-left">{time}</div>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0 text-center relative z-10">
        <div className="text-[9px] font-medium text-emerald-500/40 italic">
          Times are based on local coordination. Verify with your local mosque.
        </div>
      </div>
    </div>
  );
};

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  summary: string;
  type: 'politics' | 'economy' | 'culture' | 'sport';
}

export const NewsCard = ({ data }: { data: { items: NewsItem[] } }) => {
  const typeIcons = {
    politics: <Globe size={12} className="text-blue-400" />,
    economy: <TrendingUp size={12} className="text-emerald-400" />,
    culture: <Heart size={12} className="text-rose-400" />,
    sport: <Briefcase size={12} className="text-amber-400" />
  };

  return (
    <div className="my-8 w-full max-w-2xl bg-white dark:bg-[#0b0f1a] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden relative group/news">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      
      <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 relative z-10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Newspaper className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Sogdian Post</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Latest Intel • Sugd AI Global News</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Date</div>
          <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            {new Date().toLocaleDateString('tg-TJ', { day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      <div className="divide-y divide-black/5 dark:divide-white/5 relative z-10">
        {data.items.map((item, idx) => (
          <div key={idx} className="p-6 md:p-8 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all duration-300 group/item">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/10">
                    {typeIcons[item.type] || <Globe size={12} className="text-indigo-400" />}
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">{item.type}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">•</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.source}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-3">
                  {item.summary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 group/link"
                  >
                    Бихонед (Read More) <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </a>
                  <div className="flex -space-x-1">
                    {[1,2].map(i => <div key={i} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-[#0b0f1a]" />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 text-center">
        <p className="text-[10px] font-medium text-slate-500 tracking-wide uppercase">
          Synthesized by Azam Corp Neural Engine
        </p>
      </div>
    </div>
  );
};
