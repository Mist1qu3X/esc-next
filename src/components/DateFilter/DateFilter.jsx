'use client';
import { useState, useRef, useEffect } from 'react';
import './DateFilter.css';

// Единый фильтр по дате (месяц + год) — как на странице Calendar. Используется везде,
// чтобы на всех страницах фильтр по дате выглядел и работал одинаково.
// months: [{ value, label }] (JAN..DEC), years: [строки годов]. Опции «ALL …» добавляются сами.
export default function DateFilter({ month, year, onMonth, onYear, months = [], years = [] }) {
    const [open, setOpen] = useState(null); // 'month' | 'year' | null
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const monthOpts = [{ value: 'all', label: 'ALL MONTHS' }, ...months];
    const yearOpts = [{ value: 'all', label: 'ALL YEARS' }, ...years.map((y) => ({ value: String(y), label: String(y) }))];

    const dropdown = (id, value, opts, onChange) => {
        const current = opts.find((o) => o.value === value) || opts[0];
        return (
            <div className="df-dd">
                <button
                    type="button"
                    className={`df-btn ${open === id ? 'df-open' : ''} ${value !== 'all' ? 'df-set' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setOpen(open === id ? null : id); }}
                >
                    <span>{current.label}</span>
                    <i className="fa-solid fa-chevron-down df-caret"></i>
                </button>
                {open === id && (
                    <div className="df-menu">
                        {opts.map((o) => (
                            <button
                                type="button"
                                key={o.value}
                                className={`df-opt ${value === o.value ? 'df-active' : ''}`}
                                onClick={() => { onChange(o.value); setOpen(null); }}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="df-wrap" ref={ref}>
            {dropdown('month', month, monthOpts, onMonth)}
            {dropdown('year', year, yearOpts, onYear)}
        </div>
    );
}
