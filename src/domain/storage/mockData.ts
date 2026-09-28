import { ClusterNode, HealthStatus, StoragePoolConfig, StorageProtocol, Volume } from './types';

export const INITIAL_POOLS: StoragePoolConfig[] = [
  {
    id: 'pool-01',
    name: 'pool_nvme_tier0',
    layout: 'RAID6',
    driveCount: 16,
    driveCapacityGiB: 3840,
    hotSpareCount: 2,
    encryptionEnabled: true,
    compressionEnabled: true,
  },
  {
    id: 'pool-02',
    name: 'pool_ddp_enterprise',
    layout: 'DDP',
    driveCount: 24,
    driveCapacityGiB: 7680,
    hotSpareCount: 0, // В DDP резерв распределён по всем дискам
    encryptionEnabled: true,
    compressionEnabled: false,
  },
  {
    id: 'pool-03',
    name: 'pool_hybrid_backup',
    layout: 'RAID5',
    driveCount: 8,
    driveCapacityGiB: 15360,
    hotSpareCount: 1,
    encryptionEnabled: false,
    compressionEnabled: true,
  },
];

export const INITIAL_NODES: ClusterNode[] = [
  {
    id: 'ctrl-a',
    name: 'ENGINE-AQ-CTRL-01A',
    role: 'controller-a',
    aluaState: 'active-optimized',
    heartbeatMs: 12,
    uptimeHours: 4218,
    cpuPercent: 34,
    cacheHitRatio: 98.4,
    interconnectLatencyUs: 18,
  },
  {
    id: 'ctrl-b',
    name: 'ENGINE-AQ-CTRL-01B',
    role: 'controller-b',
    aluaState: 'active-non-optimized',
    heartbeatMs: 14,
    uptimeHours: 4218,
    cpuPercent: 28,
    cacheHitRatio: 97.9,
    interconnectLatencyUs: 19,
  },
];

export function generateMockVolumes(count: number = 1200): Volume[] {
  const protocols: StorageProtocol[] = ['FC', 'iSCSI', 'NVMe-oF'];
  const poolIds = ['pool-01', 'pool-02', 'pool-03'];
  const volumes: Volume[] = [];

  for (let i = 1; i <= count; i++) {
    const isDegraded = i % 83 === 0;
    const isRebuilding = i % 149 === 0;
    const isFailed = i === 412;
    const status: HealthStatus = isFailed
      ? 'failed'
      : isRebuilding
        ? 'rebuilding'
        : isDegraded
          ? 'degraded'
          : 'optimal';

    const protocol = protocols[i % protocols.length];
    const poolId = poolIds[i % poolIds.length];
    const sizeGiB = 256 * ((i % 16) + 1);
    const allocatedRatio = 0.35 + ((i * 17) % 60) / 100;
    const thin = i % 3 !== 0;

    volumes.push({
      id: `vol-${i.toString().padStart(4, '0')}`,
      name: `lun_${protocol.toLowerCase()}_prod_${i.toString().padStart(4, '0')}`,
      poolId,
      sizeGiB,
      allocatedGiB: Math.round(thin ? sizeGiB * allocatedRatio : sizeGiB),
      status,
      protocol,
      thinProvisioned: thin,
      lunId: i % 256,
      iops: Math.round(1200 + ((i * 31) % 18000)),
      latencyMs: +(0.4 + ((i * 13) % 40) / 10).toFixed(2),
      targetPortGroup: `TPG-${(i % 4) + 1}`,
    });
  }

  return volumes;
}
