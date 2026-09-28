import React from 'react';
import { useSelector } from 'react-redux';
import { selectStorageSummary } from '../domain/storage/selectors';

export const MetricsSummary: React.FC = () => {
  const summary = useSelector(selectStorageSummary);

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-label">Сконфигурированная ёмкость</span>
          <span className="metric-badge">All Pools</span>
        </div>
        <div className="metric-value">{summary.totalConfiguredTiB.toLocaleString()} TiB</div>
        <div className="metric-sub">
          Фактически записано: <strong>{summary.totalAllocatedTiB.toLocaleString()} TiB</strong>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-label">Коэффициент переподписки</span>
          <span className="metric-badge">Thin Ratio</span>
        </div>
        <div className="metric-value highlight">{summary.provisioningRatio}x</div>
        <div className="metric-sub">Оптимизация пулов за счёт динамического выделения</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-label">Совокупная нагрузка (IOPS)</span>
          <span className="metric-badge">Real-Time</span>
        </div>
        <div className="metric-value">{summary.aggregateIops.toLocaleString()}</div>
        <div className="metric-sub">Суммарный поток ввода-вывода хостов</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-label">Задержка (P99 Latency)</span>
          <span className="metric-badge">SLA &lt; 5ms</span>
        </div>
        <div className="metric-value">{summary.p99LatencyMs} ms</div>
        <div className="metric-sub">99-й перцентиль времени отклика СХД</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-label">Всего LUN томов</span>
          <span className="metric-badge">Inventory</span>
        </div>
        <div className="metric-value">{summary.totalVolumes.toLocaleString()}</div>
        <div className="metric-sub">
          {summary.degradedVolumeCount > 0 ? (
            <span className="text-warn">Требуют внимания: {summary.degradedVolumeCount}</span>
          ) : (
            <span className="text-good">Все тома в статусе Optimal</span>
          )}
        </div>
      </div>
    </div>
  );
};
