import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNodes } from '../domain/storage/selectors';
import { failoverNodeRole } from '../domain/storage/storageSlice';
import { ClusterNode } from '../domain/storage/types';

export const ClusterTopologyMap: React.FC = () => {
  const dispatch = useDispatch();
  const nodes = useSelector(selectNodes);

  const ctrlA = nodes.find((n: ClusterNode) => n.role === 'controller-a') || nodes[0];
  const ctrlB = nodes.find((n: ClusterNode) => n.role === 'controller-b') || nodes[1];

  const isOptimizedA = ctrlA?.aluaState === 'active-optimized';
  const isOptimizedB = ctrlB?.aluaState === 'active-optimized';

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Топология HA-кластера и ALUA Multi-Pathing</h2>
          <p className="card-subtitle">
            Аппаратный контур отказоустойчивости контроллеров СХД, шина когерентного кэша и состояние портов
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => dispatch(failoverNodeRole())}
          title="Смена активных путей ALUA между контроллерами"
        >
          Имитация ALUA Failover
        </button>
      </div>

      <div className="topology-viewport">
        <svg viewBox="0 0 900 320" className="topology-svg">
          <defs>
            <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="activePath" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="standbyPath" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Клиентский уровень / SAN Fabric */}
          <rect x="250" y="20" width="400" height="42" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <text x="450" y="46" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
            HOST SAN FABRIC (Fibre Channel / NVMe-oF Targets)
          </text>

          {/* Линии от Fabric к контроллерам */}
          {/* Путь к Ctrl A */}
          <path
            d="M 330 62 L 330 110 L 220 110 L 220 135"
            fill="none"
            stroke={isOptimizedA ? '#10b981' : '#f59e0b'}
            strokeWidth={isOptimizedA ? '3' : '2'}
            strokeDasharray={isOptimizedA ? 'none' : '4 4'}
          />
          {/* Путь к Ctrl B */}
          <path
            d="M 570 62 L 570 110 L 680 110 L 680 135"
            fill="none"
            stroke={isOptimizedB ? '#10b981' : '#f59e0b'}
            strokeWidth={isOptimizedB ? '3' : '2'}
            strokeDasharray={isOptimizedB ? 'none' : '4 4'}
          />

          {/* Метки путей */}
          <rect x="150" y="88" width="140" height="20" rx="4" fill="#0f172a" stroke="#334155" />
          <text x="220" y="102" textAnchor="middle" fill={isOptimizedA ? '#34d399' : '#fbbf24'} fontSize="10" fontFamily="JetBrains Mono, monospace">
            {isOptimizedA ? 'ALUA: Active-Optimized' : 'ALUA: Active-NonOpt'}
          </text>

          <rect x="610" y="88" width="140" height="20" rx="4" fill="#0f172a" stroke="#334155" />
          <text x="680" y="102" textAnchor="middle" fill={isOptimizedB ? '#34d399' : '#fbbf24'} fontSize="10" fontFamily="JetBrains Mono, monospace">
            {isOptimizedB ? 'ALUA: Active-Optimized' : 'ALUA: Active-NonOpt'}
          </text>

          {/* Контроллер А */}
          <g transform="translate(100, 135)">
            <rect
              width="240"
              height="110"
              rx="8"
              fill="#1e293b"
              stroke={isOptimizedA ? '#10b981' : '#475569'}
              strokeWidth={isOptimizedA ? '2' : '1'}
            />
            <circle cx="20" cy="24" r="5" fill={isOptimizedA ? '#10b981' : '#f59e0b'} />
            <text x="35" y="28" fill="#f8fafc" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
              {ctrlA?.name ?? 'CTRL-A'}
            </text>
            <text x="20" y="54" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              CPU: {ctrlA?.cpuPercent}% | Кэш: {ctrlA?.cacheHitRatio}%
            </text>
            <text x="20" y="74" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              Heartbeat: {ctrlA?.heartbeatMs} ms
            </text>
            <text x="20" y="94" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              Аптайм: {ctrlA?.uptimeHours} ч · SAS Online
            </text>
          </g>

          {/* Контроллер B */}
          <g transform="translate(560, 135)">
            <rect
              width="240"
              height="110"
              rx="8"
              fill="#1e293b"
              stroke={isOptimizedB ? '#10b981' : '#475569'}
              strokeWidth={isOptimizedB ? '2' : '1'}
            />
            <circle cx="20" cy="24" r="5" fill={isOptimizedB ? '#10b981' : '#f59e0b'} />
            <text x="35" y="28" fill="#f8fafc" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
              {ctrlB?.name ?? 'CTRL-B'}
            </text>
            <text x="20" y="54" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              CPU: {ctrlB?.cpuPercent}% | Кэш: {ctrlB?.cacheHitRatio}%
            </text>
            <text x="20" y="74" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              Heartbeat: {ctrlB?.heartbeatMs} ms
            </text>
            <text x="20" y="94" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              Аптайм: {ctrlB?.uptimeHours} ч · SAS Online
            </text>
          </g>

          {/* Межконтроллерная шина (Interconnect / PCIe Mirroring Link) */}
          <line x1="340" y1="190" x2="560" y2="190" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
          <rect x="400" y="178" width="100" height="24" rx="4" fill="#0f172a" stroke="#0284c7" />
          <text x="450" y="194" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono, monospace">
            PCIe NTB {ctrlA?.interconnectLatencyUs}µs
          </text>

          {/* Линии вниз к дисковым корзинам (JBOD / NVMe-oF Enclosure) */}
          <path d="M 220 245 L 220 270 L 450 270 L 450 280" fill="none" stroke="#64748b" strokeWidth="2" />
          <path d="M 680 245 L 680 270 L 450 270" fill="none" stroke="#64748b" strokeWidth="2" />

          {/* Дисковая полка JBOD */}
          <rect x="250" y="280" width="400" height="32" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <text x="450" y="301" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
            24-BAY NVMe DUAL-PORT DRIVE CHASSIS (SAS-4 / U.3 BACKPLANE)
          </text>
        </svg>
      </div>
    </div>
  );
};
