import { describe, it, expect } from 'vitest';
import {
  calculateUsableCapacityGiB,
  validatePoolConfiguration,
  validateVolumeAllocation,
} from '../src/domain/storage/validators';
import { StoragePoolConfig } from '../src/domain/storage/types';

describe('Storage Domain Validators', () => {
  it('correctly calculates usable capacity across RAID layouts', () => {
    // RAID1: 4 drives of 1000 GiB = 2000 GiB usable
    expect(calculateUsableCapacityGiB('RAID1', 4, 1000, 0)).toBe(2000);

    // RAID5: 5 drives of 1000 GiB, 1 parity = 4000 GiB usable
    expect(calculateUsableCapacityGiB('RAID5', 5, 1000, 0)).toBe(4000);

    // RAID6: 8 drives of 1000 GiB, 2 parity = 6000 GiB usable
    expect(calculateUsableCapacityGiB('RAID6', 8, 1000, 0)).toBe(6000);

    // RAID6 with 1 hot-spare: 8 - 1 = 7 active drives, minus 2 parity = 5000 GiB usable
    expect(calculateUsableCapacityGiB('RAID6', 8, 1000, 1)).toBe(5000);
  });

  it('rejects pool configurations violating minimum disk drive count', () => {
    const invalidRaid6: StoragePoolConfig = {
      id: 'pool-test',
      name: 'pool_test',
      layout: 'RAID6',
      driveCount: 3, // RAID6 requires min 4
      driveCapacityGiB: 3840,
      hotSpareCount: 0,
      encryptionEnabled: false,
      compressionEnabled: false,
    };

    const res = validatePoolConfiguration(invalidRaid6);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.field === 'driveCount')).toBe(true);
  });

  it('rejects odd number of drives for RAID1 Mirror', () => {
    const oddMirror: StoragePoolConfig = {
      id: 'mirror-test',
      name: 'mirror_test',
      layout: 'RAID1',
      driveCount: 3, // must be even
      driveCapacityGiB: 1920,
      hotSpareCount: 0,
      encryptionEnabled: false,
      compressionEnabled: false,
    };

    const res = validatePoolConfiguration(oddMirror);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('чётным'))).toBe(true);
  });

  it('warns about missing hot spares on large drive counts', () => {
    const largePoolNoSpares: StoragePoolConfig = {
      id: 'large-pool',
      name: 'large_pool',
      layout: 'RAID6',
      driveCount: 16,
      driveCapacityGiB: 3840,
      hotSpareCount: 0,
      encryptionEnabled: false,
      compressionEnabled: false,
    };

    const res = validatePoolConfiguration(largePoolNoSpares);
    expect(res.isValid).toBe(true);
    expect(res.warnings.some((w) => w.field === 'hotSpareCount')).toBe(true);
  });

  it('validates volume allocation against available capacity and LUN ID uniqueness', () => {
    const existingLuns = new Set([0, 1, 5]);

    // Duplicate LUN ID
    const dupLunRes = validateVolumeAllocation(
      { name: 'vol1', sizeGiB: 500, lunId: 1, thinProvisioned: false },
      10000,
      existingLuns
    );
    expect(dupLunRes.isValid).toBe(false);
    expect(dupLunRes.errors.some((e) => e.field === 'lunId')).toBe(true);

    // Thick provisioning exceeds physical capacity
    const thickOverRes = validateVolumeAllocation(
      { name: 'vol2', sizeGiB: 15000, lunId: 10, thinProvisioned: false },
      10000,
      existingLuns
    );
    expect(thickOverRes.isValid).toBe(false);
    expect(thickOverRes.errors.some((e) => e.field === 'sizeGiB')).toBe(true);

    // Thin provisioning overcommit produces warning rather than hard error
    const thinOverRes = validateVolumeAllocation(
      { name: 'vol3', sizeGiB: 15000, lunId: 11, thinProvisioned: true },
      10000,
      existingLuns
    );
    expect(thinOverRes.isValid).toBe(true);
    expect(thinOverRes.warnings.length).toBeGreaterThan(0);
  });
});
