import React, { useEffect, useState, useRef } from 'react';
import { Satellite, Plane, Globe, Activity } from 'lucide-react';

/* ── Animated Counter ── */
const AnimatedValue = ({ target, suffix = '', formatNumber = true }) => {
    const [display, setDisplay] = useState(0);
    const prev = useRef(0);
    const rafId = useRef(null);

    useEffect(() => {
        const start = prev.current;
        const diff = target - start;
        if (diff === 0) return;

        const duration = 500;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + diff * eased);
            setDisplay(current);

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate);
            } else {
                prev.current = target;
            }
        };

        rafId.current = requestAnimationFrame(animate);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [target]);

    return (
        <span>
            {formatNumber ? display.toLocaleString() : display}
            {suffix}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, suffix = '' }) => (
    <div className="glass-panel stat-card p-3 md:p-4 rounded-lg flex flex-col gap-1.5 relative overflow-hidden group cursor-default">
        <div className="flex justify-between items-start">
            <div className="text-gray-400 text-[10px] md:text-xs font-medium tracking-wider uppercase">{title}</div>
            <Icon className="text-cyber-blue w-4 h-4 md:w-5 md:h-5 opacity-70" />
        </div>

        <div className="flex items-baseline gap-2 mt-1">
            <div className="text-xl md:text-3xl lg:text-4xl font-bold text-matrix-green">
                {typeof value === 'number' ? (
                    <AnimatedValue target={value} suffix={suffix} />
                ) : (
                    <span>{value}{suffix}</span>
                )}
            </div>
            {trend && (
                <div className={`text-xs font-mono ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-matrix-green' : 'text-danger'}`}>
                    {trend}
                </div>
            )}
        </div>
    </div>
);

const StatsGrid = ({ stats = {} }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3">
            <StatCard
                title="Tracked"
                value={stats.total || 0}
                icon={Satellite}
            />
            <StatCard
                title="Airborne"
                value={stats.airborne || 0}
                icon={Plane}
            />
            <StatCard
                title="On Ground"
                value={stats.onGround || 0}
                icon={Activity}
            />
            <StatCard
                title="Countries"
                value={stats.countries || 0}
                icon={Globe}
            />
        </div>
    );
};

export default StatsGrid;
