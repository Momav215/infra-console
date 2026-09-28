import { RaidLayout, StoragePoolConfig, ValidationIssue, ValidationResult, Volume } from './types';

const MIN_DRIVES_BY_LAYOUT: Record<RaidLayout, number> = {
  RAID1: 2,
  RAID5: 3,
  RAID6: 4,
  DDP: 11,
};

export function calculateUsableCapacityGiB(
  layout: RaidLayout,
  driveCount: number,
  driveCapacityGiB: number,
  hotSpares: number = 0
): number {
  const activeDrives = Math.max(0, driveCount - hotSpares);
  if (activeDrives < MIN_DRIVES_BY_LAYOUT[layout]) {
    return 0;
  }

  switch (layout) {
    case 'RAID1':
      return (activeDrives / 2) * driveCapacityGiB;
    case 'RAID5':
      return (activeDrives - 1) * driveCapacityGiB;
    case 'RAID6':
      return (activeDrives - 2) * driveCapacityGiB;
    case 'DDP':
      // Dynamic Disk Pool резервирует эквивалент ~2 дисков под распределённую четность + эквивалент 1-2 под spare
      return Math.max(0, (activeDrives - 2) * driveCapacityGiB * 0.96);
  }
}

export function validatePoolConfiguration(config: StoragePoolConfig): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Валидация имени пула
  if (!config.name || config.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Имя пула не может быть пустым' });
  } else if (!/^[a-zA-Z0-9_\-]{3,32}$/.test(config.name.trim())) {
    errors.push({
      field: 'name',
      message: 'Имя должно содержать от 3 до 32 символов (латиница, цифры, дефис или подчёркивание)',
    });
  }

  // Валидация количества дисков по типу RAID
  const minRequired = MIN_DRIVES_BY_LAYOUT[config.layout];
  if (config.driveCount < minRequired) {
    errors.push({
      field: 'driveCount',
      message: `Для схемы ${config.layout} требуется минимум ${minRequired} физических дисков (указано: ${config.driveCount})`,
    });
  }

  if (config.layout === 'RAID1' && config.driveCount % 2 !== 0) {
    errors.push({
      field: 'driveCount',
      message: `Для схемы RAID1 (Mirror) количество дисков должно быть чётным (указано: ${config.driveCount})`,
    });
  }

  // Валидация Hot-Spare политики
  if (config.hotSpareCount < 0) {
    errors.push({ field: 'hotSpareCount', message: 'Количество резервных дисков не может быть отрицательным' });
  } else if (config.hotSpareCount >= config.driveCount) {
    errors.push({
      field: 'hotSpareCount',
      message: 'Количество резервных дисков не может превышать или равняться общему числу дисков',
    });
  } else if (config.layout !== 'DDP' && config.driveCount >= 12 && config.hotSpareCount === 0) {
    warnings.push({
      field: 'hotSpareCount',
      message: 'Для пулов от 12 дисков рекомендуется выделить минимум 1 диск Dedicated Hot-Spare',
    });
  }

  if (config.hotSpareCount > 0 && config.hotSpareCount / config.driveCount > 0.35) {
    warnings.push({
      field: 'hotSpareCount',
      message: 'Доля резервных дисков превышает 35% от пула. Это снижает полезный объём хранилища',
    });
  }

  if (config.driveCapacityGiB <= 0) {
    errors.push({ field: 'driveCapacityGiB', message: 'Ёмкость одного диска должна быть больше 0 GiB' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateVolumeAllocation(
  volume: Pick<Volume, 'name' | 'sizeGiB' | 'lunId' | 'thinProvisioned'>,
  availablePoolCapacityGiB: number,
  existingLunIds: Set<number>
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!volume.name || volume.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Имя тома обязательно для заполнения' });
  }

  if (volume.sizeGiB <= 0) {
    errors.push({ field: 'sizeGiB', message: 'Размер тома должен быть строго больше 0 GiB' });
  }

  if (volume.lunId < 0 || volume.lunId > 255) {
    errors.push({ field: 'lunId', message: 'Идентификатор LUN ID должен быть в диапазоне от 0 до 255' });
  } else if (existingLunIds.has(volume.lunId)) {
    errors.push({ field: 'lunId', message: `LUN ID ${volume.lunId} уже занят в текущей целевой группе` });
  }

  if (!volume.thinProvisioned && volume.sizeGiB > availablePoolCapacityGiB) {
    errors.push({
      field: 'sizeGiB',
      message: `Недостаточно нераспределённого пространства в пуле для Thick Provisioning (доступно: ${availablePoolCapacityGiB.toFixed(1)} GiB)`,
    });
  } else if (volume.thinProvisioned && volume.sizeGiB > availablePoolCapacityGiB) {
    warnings.push({
      field: 'sizeGiB',
      message: 'Thick-переподписка (Thin Overcommit): выделенный виртуальный размер превышает физический остаток пула',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
