import { describe, it, expect } from 'vitest';
import { selectFilteredVolumes, selectStorageSummary } from '../src/domain/storage/selectors';
import { Volume } from '../src/domain/storage/types';

describe('Storage Redux Selectors', () => {
  const sampleVolumes: Volume[] = [
    {
      id: 'vol-1',
      name: 'lun_fc_prod_001',
      poolId: 'pool-1',
      sizeGiB: 1024,
      allocatedGiB: 512,
      status: 'optimal',
      protocol: 'FC',
      thinProvisioned: true,
      lunId: 10,
      iops: 5000,
      latencyMs: 1.2,
      targetPortGroup: 'TPG-1',
    },
    {
      id: 'vol-2',
      name: 'lun_iscsi_dev_002',
      poolId: 'pool-2',
      sizeGiB: 2048,
      allocatedGiB: 2048,
      status: 'degraded',
      protocol: 'iSCSI',
      thinProvisioned: false,
      lunId: 20,
      iops: 12000,
      latencyMs: 3.5,
      targetPortGroup: 'TPG-2',
    },
    {
      id: 'vol-3',
      name: 'lun_nvme_cache_003',
      poolId: 'pool-1',
      sizeGiB: 512,
      allocatedGiB: 256,
      status: 'optimal',
      protocol: 'NVMe-oF',
      thinProvisioned: true,
      lunId: 5,
      iops: 45000,
      latencyMs: 0.3,
      targetPortGroup: 'TPG-1',
    },
  ];

  it('filters volumes by search query and protocol', () => {
    const mockState = {
      storage: {
        volumes: sampleVolumes,
        pools: [],
        nodes: [],
        selectedVolumeId: null,
        filters: {
          query: 'iscsi',
          status: 'all' as const,
          protocol: 'all' as const,
          poolId: 'all',
        },
        sorting: { field: 'name' as const, direction: 'asc' as const },
        wizardConfig: {} as any,
      },
    };

    const filtered = selectFilteredVolumes(mockState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('lun_iscsi_dev_002');
  });

  it('aggregates storage metrics across all volumes', () => {
    const mockState = {
      storage: {
        volumes: sampleVolumes,
        pools: [],
        nodes: [],
        selectedVolumeId: null,
        filters: { query: '', status: 'all' as const, protocol: 'all' as const, poolId: 'all' },
        sorting: { field: 'name' as const, direction: 'asc' as const },
        wizardConfig: {} as any,
      },
    };

    const summary = selectStorageSummary(mockState);
    expect(summary.totalVolumes).toBe(3);
    expect(summary.degradedVolumeCount).toBe(1);
    expect(summary.aggregateIops).toBe(62000);
    // Total GiB: 1024 + 2048 + 512 = 3584 GiB = 3.5 TiB
    expect(summary.totalConfiguredTiB).toBe(3.5);
  });
});
