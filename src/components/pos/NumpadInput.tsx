'use client';

interface NumpadInputProps {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  masked?: boolean;
  label?: string;
}

export function NumpadInput({ value, onChange, maxLength = 4, masked = true, label }: NumpadInputProps) {
  const press = (char: string) => {
    if (char === 'DEL') { onChange(value.slice(0, -1)); return; }
    if (char === 'CLR') { onChange(''); return; }
    if (value.length >= maxLength) return;
    onChange(value + char);
  };

  const keys = ['1','2','3','4','5','6','7','8','9','CLR','0','DEL'];

  return (
    <div className="flex flex-col items-center gap-4">
      {label && <p className="text-slate-400 text-sm">{label}</p>}
      <div className="flex gap-3 mb-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-white font-bold text-lg transition-all
              ${i < value.length ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/50'}`}
          >
            {masked ? (i < value.length ? '●' : '') : (value[i] ?? '')}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`w-16 h-16 rounded-2xl font-bold text-lg transition-all active:scale-95
              ${k === 'DEL' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : k === 'CLR' ? 'bg-slate-600/50 text-slate-300 border border-slate-500 hover:bg-slate-600'
              : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 hover:border-slate-400'}`}
          >
            {k === 'DEL' ? '⌫' : k}
          </button>
        ))}
      </div>
    </div>
  );
}
