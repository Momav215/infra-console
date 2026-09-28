import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectFilteredVolumes,
  selectFilters,
  selectSorting,
  selectPools,
  selectSelectedVolumeId,
} from '../domain/storage/selectors';
import {
  setSearchQuery,
  setStatusFilter,
  setProtocolFilter,
  setPoolFilter,
  setSorting,
  selectVolume,
  StorageState,
} from '../domain/storage/storageSlice';
import { HealthStatus, StorageProtocol, Volume } from '../domain/storage/types';

const ROW_HEIGHT = 44;
const OVERSCAN = 6;
const CONTAINER_HEIGHT = 480;

export const VirtualVolumeTable: React.FC = () => {
  const dispatch = useDispatch();
  const volumes = useSelector(selectFilteredVolumes);
  const filters = useSelector(selectFilters);
  const sorting = useSelector(selectSorting);
  const pools = useSelector(selectPools);
  const selectedId = useSelector(selectSelectedVolumeId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [filters]);

  const totalCount = volumes.length;
  const totalHeight = totalCount * ROW_HEIGHT;

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(CONTAINER_HEIGHT / ROW_HEIGHT);
    const end = Math.min(totalCount, start + visibleCount + OVERSCAN * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, totalCount]);

  const visibleVolumes = useMemo(() => {
    return volumes.slice(startIndex, endIndex);
  }, [volumes, startIndex, endIndex]);

  const offsetY = startIndex * ROW_HEIGHT;

  const handleSortClick = (field: StorageState['sorting']['field']) => {
    if (sorting.field === field) {
      dispatch(
        setSorting({
          field,
          direction: sorting.direction === 'asc' ? 'desc' : 'asc',
        })
      );
    } else {
      dispatch(setSorting({ field, direction: 'asc' }));
    }
  };

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'optimal':
        return <span className="badge badge-success">Optimal</span>;
      case 'degraded':
        return <span className="badge badge-warning">Degraded</span>;
      case 'rebuilding':
        return <span className="badge badge-info">Rebuild</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Управление логическими томами (LUNs)</h2>
          <p className="card-subtitle">
            Виртуализированный рендеринг таблицы ({totalCount.toLocaleString()} томов в памяти без падения FPS)
          </p>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            className="input"
            placeholder="Поиск по имени или ID..."
            value={filters.query}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          />
        </div>

        <select
          className="select"
          value={filters.status}
          onChange={(e) => dispatch(setStatusFilter(e.target.value as HealthStatus | 'all'))}
        >
          <option value="all">Все статусы</option>
          <option value="optimal">Optimal</option>
          <option value="degraded">Degraded</option>
          <option value="rebuilding">Rebuilding</option>
          <option value="failed">Failed</option>
        </select>

        <select
          className="select"
          value={filters.protocol}
          onChange={(e) => dispatch(setProtocolFilter(e.target.value as StorageProtocol | 'all'))}
        >
          <option value="all">Все протоколы</option>
          <option value="FC">Fibre Channel (FC)</option>
          <option value="iSCSI">iSCSI</option>
          <option value="NVMe-oF">NVMe-oF</option>
        </select>

        <select
          className="select"
          value={filters.poolId}
          onChange={(e) => dispatch(setPoolFilter(e.target.value))}
        >
          <option value="all">Все пулы</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.layout})
            </option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="virtual-table-wrapper">
        <div className="table-header-row">
          <div className="col col-name" onClick={() => handleSortClick('name')}>
            Имя тома {sorting.field === 'name' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
          <div className="col col-status">Статус</div>
          <div className="col col-protocol">Протокол</div>
          <div className="col col-lun" onClick={() => handleSortClick('lunId')}>
            LUN ID {sorting.field === 'lunId' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
          <div className="col col-size" onClick={() => handleSortClick('sizeGiB')}>
            Размер {sorting.field === 'sizeGiB' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
          <div className="col col-alloc" onClick={() => handleSortClick('allocatedGiB')}>
            Занято {sorting.field === 'allocatedGiB' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
          <div className="col col-iops" onClick={() => handleSortClick('iops')}>
            IOPS {sorting.field === 'iops' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
          <div className="col col-lat" onClick={() => handleSortClick('latencyMs')}>
            Задержка {sorting.field === 'latencyMs' ? (sorting.direction === 'asc' ? '▲' : '▼') : ''}
          </div>
        </div>

        <div
          ref={containerRef}
          className="virtual-scroll-viewport"
          style={{ height: CONTAINER_HEIGHT }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleVolumes.map((vol: Volume) => {
                const isSelected = vol.id === selectedId;
                const percent = Math.min(100, Math.round((vol.allocatedGiB / vol.sizeGiB) * 100));

                return (
                  <div
                    key={vol.id}
                    className={`virtual-row ${isSelected ? 'selected' : ''}`}
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => dispatch(selectVolume(isSelected ? null : vol.id))}
                  >
                    <div className="col col-name">
                      <span className="mono-text">{vol.name}</span>
                      {vol.thinProvisioned && <span className="thin-tag">Thin</span>}
                    </div>
                    <div className="col col-status">{getStatusBadge(vol.status)}</div>
                    <div className="col col-protocol">
                      <span className="protocol-badge">{vol.protocol}</span>
                    </div>
                    <div className="col col-lun mono-text">{vol.lunId}</div>
                    <div className="col col-size mono-text">{(vol.sizeGiB / 1024).toFixed(2)} TiB</div>
                    <div className="col col-alloc">
                      <div className="usage-bar-cell">
                        <div className="bar-bg">
                          <div
                            className={`bar-fill ${percent > 85 ? 'fill-warn' : 'fill-good'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="mono-text usage-text">{percent}%</span>
                      </div>
                    </div>
                    <div className="col col-iops mono-text">{vol.iops.toLocaleString()}</div>
                    <div className="col col-lat mono-text">{vol.latencyMs} ms</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="table-footer">
        Показано {visibleVolumes.length} элементов из {totalCount.toLocaleString()} (смещение: {startIndex}..{endIndex})
      </div>
    </div>
  );
};
