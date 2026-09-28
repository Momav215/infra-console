import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectWizardConfig,
  selectWizardValidation,
  selectWizardUsableCapacityGiB,
} from '../domain/storage/selectors';
import {
  updateWizardConfig,
  resetWizardConfig,
  saveNewPool,
} from '../domain/storage/storageSlice';
import { RaidLayout } from '../domain/storage/types';

const LAYOUT_DESCRIPTIONS: Record<RaidLayout, string> = {
  RAID1: 'Mirror (зеркалирование). 50% полезной ёмкости, высокая скорость случайного чтения.',
  RAID5: 'Single Parity (одинарная чётность). Высокая эффективность использования дисков, потеря 1 диска.',
  RAID6: 'Dual Parity (двойная чётность). Защита от одновременного отказа 2 дисков. Рекомендовано для Enterprise SSD.',
  DDP: 'Dynamic Disk Pool. Распределённая чётность и динамический spare-space по всем дискам. Быстрый ребилд.',
};

export const PoolConfigurator: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector(selectWizardConfig);
  const validation = useSelector(selectWizardValidation);
  const usableCapacityGiB = useSelector(selectWizardUsableCapacityGiB);

  const rawCapacityGiB = config.driveCount * config.driveCapacityGiB;
  const usableTiB = (usableCapacityGiB / 1024).toFixed(2);
  const rawTiB = (rawCapacityGiB / 1024).toFixed(2);
  const efficiencyPercent = rawCapacityGiB > 0 ? Math.round((usableCapacityGiB / rawCapacityGiB) * 100) : 0;

  const handleSave = () => {
    if (!validation.isValid) return;
    dispatch(
      saveNewPool({
        ...config,
        id: `pool-${Date.now()}`,
      })
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Конфигуратор пулов хранения (RDG / DDP)</h2>
          <p className="card-subtitle">
            Интерактивный расчёт топологии дисковых групп с предиктивной валидацией политик отказоустойчивости
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => dispatch(resetWizardConfig())}>
            Сброс
          </button>
          <button
            className="btn btn-primary"
            disabled={!validation.isValid}
            onClick={handleSave}
          >
            Создать пул
          </button>
        </div>
      </div>

      <div className="wizard-grid">
        {/* Форма параметров */}
        <div className="wizard-form">
          <div className="form-group">
            <label className="form-label">Идентификатор / Имя пула</label>
            <input
              type="text"
              className="input"
              value={config.name}
              onChange={(e) => dispatch(updateWizardConfig({ name: e.target.value }))}
              placeholder="pool_nvme_prod_01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Схема защиты данных (RAID Layout)</label>
            <div className="layout-selector-grid">
              {(['RAID1', 'RAID5', 'RAID6', 'DDP'] as RaidLayout[]).map((layout) => (
                <div
                  key={layout}
                  className={`layout-option ${config.layout === layout ? 'active' : ''}`}
                  onClick={() => dispatch(updateWizardConfig({ layout }))}
                >
                  <div className="layout-title">{layout}</div>
                  <div className="layout-desc">{LAYOUT_DESCRIPTIONS[layout]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Количество дисков в группе: <strong>{config.driveCount}</strong>
              </label>
              <input
                type="range"
                min="2"
                max="60"
                step="1"
                className="range-input"
                value={config.driveCount}
                onChange={(e) => dispatch(updateWizardConfig({ driveCount: Number(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Выделенный резерв (Hot-Spare): <strong>{config.hotSpareCount}</strong>
              </label>
              <input
                type="range"
                min="0"
                max={Math.max(0, config.driveCount - 2)}
                step="1"
                disabled={config.layout === 'DDP'}
                className="range-input"
                value={config.hotSpareCount}
                onChange={(e) => dispatch(updateWizardConfig({ hotSpareCount: Number(e.target.value) }))}
              />
              {config.layout === 'DDP' && (
                <span className="field-hint">В DDP резерв распределён по всем накопителям автоматически</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ёмкость накопителя</label>
              <select
                className="select"
                value={config.driveCapacityGiB}
                onChange={(e) => dispatch(updateWizardConfig({ driveCapacityGiB: Number(e.target.value) }))}
              >
                <option value={1920}>1.92 TB (NVMe U.3 / SAS SSD)</option>
                <option value={3840}>3.84 TB (NVMe Enterprise TLC)</option>
                <option value={7680}>7.68 TB (NVMe Enterprise TLC)</option>
                <option value={15360}>15.36 TB (High Density QLC)</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.encryptionEnabled}
                  onChange={(e) => dispatch(updateWizardConfig({ encryptionEnabled: e.target.checked }))}
                />
                Аппаратное шифрование (SED / AES-256)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.compressionEnabled}
                  onChange={(e) => dispatch(updateWizardConfig({ compressionEnabled: e.target.checked }))}
                />
                Inline-компрессия данных
              </label>
            </div>
          </div>
        </div>

        {/* Интерактивная телеметрия и валидация */}
        <div className="wizard-summary-panel">
          <h3 className="panel-title">Сводка проектируемого пула</h3>

          <div className="capacity-card">
            <div className="capacity-stat">
              <span className="stat-label">Полезная ёмкость</span>
              <span className="stat-value highlight">{usableTiB} TiB</span>
            </div>
            <div className="capacity-stat">
              <span className="stat-label">Сырая ёмкость (Raw)</span>
              <span className="stat-value">{rawTiB} TiB</span>
            </div>
            <div className="capacity-stat">
              <span className="stat-label">Эффективность пула</span>
              <span className="stat-value">{efficiencyPercent}%</span>
            </div>
          </div>

          {/* Ошибки валидации */}
          {validation.errors.length > 0 && (
            <div className="alert alert-error">
              <div className="alert-title">Ошибки конфигурации ({validation.errors.length})</div>
              <ul className="alert-list">
                {validation.errors.map((err, idx) => (
                  <li key={idx}>{err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Предупреждения */}
          {validation.warnings.length > 0 && (
            <div className="alert alert-warning">
              <div className="alert-title">Рекомендации архитектуры ({validation.warnings.length})</div>
              <ul className="alert-list">
                {validation.warnings.map((warn, idx) => (
                  <li key={idx}>{warn.message}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.isValid && validation.warnings.length === 0 && (
            <div className="alert alert-success">
              ✓ Конфигурация соответствует спецификациям отказоустойчивости Tier-1 СХД
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
