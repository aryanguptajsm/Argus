import React, { useEffect, useRef, useMemo } from 'react';
import { Terminal } from 'lucide-react';

const LOG_COLOR_MAP = {
    error: 'text-danger',
    success: 'text-matrix-green',
    warning: 'text-warning',
    info: 'text-cyber-blue',
    default: 'text-matrix-green/70',
};

function getLogColor(msg) {
    if (msg.includes('ERROR') || msg.includes('⚠')) return LOG_COLOR_MAP.error;
    if (msg.includes('NEW CONTACT') || msg.includes('+')) return LOG_COLOR_MAP.success;
    if (msg.includes('SIGNAL LOST') || msg.includes('-')) return LOG_COLOR_MAP.warning;
    if (msg.includes('AUTH') || msg.includes('UPLINK')) return LOG_COLOR_MAP.info;
    return LOG_COLOR_MAP.default;
}

const TerminalFeed = ({ logs = [] }) => {
    const scrollRef = useRef(null);

    // Only render last 30 lines for performance
    const visibleLogs = useMemo(() => {
        return logs.slice(-30);
    }, [logs]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleLogs]);

    return (
        <div className="glass-panel rounded-lg flex flex-col h-full border border-matrix-green/30">
            <div className="p-2.5 border-b border-matrix-green/30 flex items-center gap-2 bg-matrix-green/5">
                <Terminal className="w-3.5 h-3.5 text-matrix-green" />
                <span className="text-[10px] font-bold text-matrix-green tracking-widest uppercase">System Terminal</span>
                <span className="ml-auto text-[9px] text-gray-500 font-mono">{logs.length} entries</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-3 overflow-y-auto font-mono text-[10px] md:text-[11px] space-y-1"
                style={{ maxHeight: 'calc(100% - 36px)' }}
            >
                {visibleLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-gray-600 flex-shrink-0">[{log.time}]</span>
                        <span className="text-gray-500 opacity-50 flex-shrink-0">&gt;</span>
                        <span className={`break-all ${getLogColor(log.msg)}`}>{log.msg}</span>
                    </div>
                ))}
                <div className="flex gap-2 opacity-70">
                    <span className="text-gray-500 opacity-50">&gt;</span>
                    <span className="w-1.5 h-3 bg-matrix-green inline-block animate-pulse"></span>
                </div>
            </div>
        </div>
    );
};

export default TerminalFeed;
