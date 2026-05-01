"use client";
import React, { useState, useEffect, useRef } from 'react';

interface Option { label: string; value: string; }
interface Props { label: string; icon: string; options: Option[]; selected: string[]; onChange: (v: string[]) => void; }

export default function MultiSelectDropdown({ label, icon, options, selected, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs cursor-pointer flex justify-between items-center hover:border-sky-200 transition-colors">
        <span className="truncate text-slate-700">{icon} {selected.length === 0 ? label : `${selected.length} sélectionné(s)`}</span>
        <span className="text-slate-400 text-[10px]">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto p-2 flex flex-col gap-1 animate-in fade-in">
          {options.map((o, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer rounded-xl text-xs font-bold text-slate-700 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-sky-500 rounded cursor-pointer" checked={selected.includes(o.value)}
                onChange={(e) => { if (e.target.checked) onChange([...selected, o.value]); else onChange(selected.filter(x => x !== o.value)); }} />
              {o.label}
            </label>
          ))}
          {options.length === 0 && <p className="text-xs text-center text-slate-400 p-2">Aucune option</p>}
        </div>
      )}
    </div>
  );
}
