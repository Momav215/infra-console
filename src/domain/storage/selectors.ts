import { createSelector } from '@reduxjs/toolkit';
import { StorageState } from './storageSlice';
import { StorageStatsSummary, ValidationResult } from './types';
import { calculateUsableCapacityGiB, validatePoolConfiguration } from './validators';

interface RootState {
  storage: StorageState;
}

export const selectStorageState = (state: RootState) => state.storage;
export const selectVolumesRaw = (state: RootState) => state.storage.volumes;
export const selectPools = (state: RootState) => state.storage.pools;
export const selectNodes = (state: RootState) => state.storage.nodes;
export const selectFilters = (state: RootState) => state.storage.filters;
export const selectSorting = (state: RootState) => state.storage.sorting;
export const selectSelectedVolumeId = (state: RootState) => state.storage.selectedVolumeId;
export const selectWizardConfig = (state: RootState) => state.storage.wizardConfig;

export const selectFilteredVolumes = createSelector(
  [selectVolumesRaw, selectFilters, selectSorting],
  (volumes, filters, sorting) => {
    const query = filters.query.trim().toLowerCase();

    const filtered = volumes.filter((vol) => {
      if (query && !vol.name.toLowerCase().includes(query) && !vol.id.toLowerCase().includes(query)) {
        return false;
      }
      if (filters.status !== 'all' && vol.status !== filters.status) {
        return false;
      }
      if (filters.protocol !== 'all' && vol.protocol !== filters.protocol) {
        return false;
      }
      if (filters.poolId !== 'all' && vol.poolId !== filters.poolId) {
        return false;
      }
      return true;
    });

    const { field, direction } = sorting;
    const factor = direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * factor;
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * factor;
      }
      return 0;
    });
  }
);

export const selectStorageSummary = createSelector(
  [selectVolumesRaw],
  (volumes): StorageStatsSummary => {
    let totalConfiguredGiB = 0;
    let totalAllocatedGiB = 0;
    let degradedCount = 0;
    let totalIops = 0;
    const latencies: number[] = [];

    for (let i = 0; i < volumes.length; i++) {
      const v = volumes[i];
      totalConfiguredGiB += v.sizeGiB;
      totalAllocatedGiB += v.allocatedGiB;
      if (v.status !== 'optimal') {
        degradedCount++;
      }
      totalIops += v.iops;
      latencies.push(v.latencyMs);
    }

    latencies.sort((a, b) => a - b);
    const p99Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.99));
    const p99LatencyMs = latencies.length > 0 ? latencies[p99Index] : 0;

    const totalConfiguredTiB = +(totalConfiguredGiB / 1024).toFixed(2);
    const totalAllocatedTiB = +(totalAllocatedGiB / 1024).toFixed(2);
    const provisioningRatio =
      totalAllocatedGiB > 0 ? +(totalConfiguredGiB / totalAllocatedGiB).toFixed(2) : 1;

    return {
      totalVolumes: volumes.length,
      totalConfiguredTiB,
      totalAllocatedTiB,
      provisioningRatio,
      degradedVolumeCount: degradedCount,
      aggregateIops: totalIops,
      p99LatencyMs,
    };
  }
);

export const selectSelectedVolume = createSelector(
  [selectVolumesRaw, selectSelectedVolumeId],
  (volumes, selectedId) => {
    if (!selectedId) return null;
    return volumes.find((v) => v.id === selectedId) ?? null;
  }
);

export const selectWizardValidation = createSelector(
  [selectWizardConfig],
  (config): ValidationResult => {
    return validatePoolConfiguration(config);
  }
);

export const selectWizardUsableCapacityGiB = createSelector(
  [selectWizardConfig],
  (config): number => {
    return calculateUsableCapacityGiB(
      config.layout,
      config.driveCount,
      config.driveCapacityGiB,
      config.hotSpareCount
    );
  }
);
