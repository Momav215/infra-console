export type HealthStatus = 'optimal' | 'degraded' | 'rebuilding' | 'failed';

export type StorageProtocol = 'FC' | 'iSCSI' | 'NVMe-oF';

export type RaidLayout = 'RAID1' | 'RAID5' | 'RAID6' | 'DDP';

export interface Volume {
  id: string;
  name: string;
  poolId: string;
  sizeGiB: number;
  allocatedGiB: number;
  status: HealthStatus;
  protocol: StorageProtocol;
  thinProvisioned: boolean;
  lunId: number;
  iops: number;
  latencyMs: number;
  targetPortGroup: string;
}

export interface DiskDrive {
  id: string;
  slot: number;
  enclosure: string;
  mediaType: 'NVMe' | 'SAS_SSD' | 'NL_SAS';
  status: 'active' | 'spare' | 'rebuilding' | 'unassigned' | 'failed';
  capacityGiB: number;
  temperatureC: number;
  wearPercent: number;
}

export interface StoragePoolConfig {
  id: string;
  name: string;
  layout: RaidLayout;
  driveCount: number;
  driveCapacityGiB: number;
  hotSpareCount: number;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export type AluaState = 'active-optimized' | 'active-non-optimized' | 'standby' | 'unavailable';

export interface ClusterNode {
  id: string;
  name: string;
  role: 'controller-a' | 'controller-b';
  aluaState: AluaState;
  heartbeatMs: number;
  uptimeHours: number;
  cpuPercent: number;
  cacheHitRatio: number;
  interconnectLatencyUs: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface StorageStatsSummary {
  totalVolumes: number;
  totalConfiguredTiB: number;
  totalAllocatedTiB: number;
  provisioningRatio: number;
  degradedVolumeCount: number;
  aggregateIops: number;
  p99LatencyMs: number;
}
