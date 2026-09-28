import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClusterNode, HealthStatus, StoragePoolConfig, StorageProtocol, Volume } from './types';
import { generateMockVolumes, INITIAL_NODES, INITIAL_POOLS } from './mockData';

export interface StorageState {
  volumes: Volume[];
  pools: StoragePoolConfig[];
  nodes: ClusterNode[];
  selectedVolumeId: string | null;
  filters: {
    query: string;
    status: HealthStatus | 'all';
    protocol: StorageProtocol | 'all';
    poolId: string | 'all';
  };
  sorting: {
    field: 'name' | 'sizeGiB' | 'allocatedGiB' | 'iops' | 'latencyMs' | 'lunId';
    direction: 'asc' | 'desc';
  };
  wizardConfig: StoragePoolConfig;
}

const DEFAULT_WIZARD: StoragePoolConfig = {
  id: '',
  name: 'pool_new_array',
  layout: 'RAID6',
  driveCount: 12,
  driveCapacityGiB: 3840,
  hotSpareCount: 1,
  encryptionEnabled: true,
  compressionEnabled: true,
};

const initialState: StorageState = {
  volumes: generateMockVolumes(1200),
  pools: INITIAL_POOLS,
  nodes: INITIAL_NODES,
  selectedVolumeId: null,
  filters: {
    query: '',
    status: 'all',
    protocol: 'all',
    poolId: 'all',
  },
  sorting: {
    field: 'name',
    direction: 'asc',
  },
  wizardConfig: DEFAULT_WIZARD,
};

export const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.query = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<HealthStatus | 'all'>) => {
      state.filters.status = action.payload;
    },
    setProtocolFilter: (state, action: PayloadAction<StorageProtocol | 'all'>) => {
      state.filters.protocol = action.payload;
    },
    setPoolFilter: (state, action: PayloadAction<string | 'all'>) => {
      state.filters.poolId = action.payload;
    },
    setSorting: (
      state,
      action: PayloadAction<{ field: StorageState['sorting']['field']; direction: 'asc' | 'desc' }>
    ) => {
      state.sorting = action.payload;
    },
    selectVolume: (state, action: PayloadAction<string | null>) => {
      state.selectedVolumeId = action.payload;
    },
    updateWizardConfig: (state, action: PayloadAction<Partial<StoragePoolConfig>>) => {
      state.wizardConfig = { ...state.wizardConfig, ...action.payload };
    },
    resetWizardConfig: (state) => {
      state.wizardConfig = {
        ...DEFAULT_WIZARD,
        name: `pool_${Date.now().toString().slice(-4)}`,
      };
    },
    saveNewPool: (state, action: PayloadAction<StoragePoolConfig>) => {
      state.pools.push(action.payload);
      state.wizardConfig = {
        ...DEFAULT_WIZARD,
        name: `pool_${Date.now().toString().slice(-4)}`,
      };
    },
    failoverNodeRole: (state) => {
      state.nodes = state.nodes.map((node) => {
        if (node.aluaState === 'active-optimized') {
          return { ...node, aluaState: 'active-non-optimized' };
        }
        if (node.aluaState === 'active-non-optimized') {
          return { ...node, aluaState: 'active-optimized' };
        }
        return node;
      });
    },
  },
});

export const {
  setSearchQuery,
  setStatusFilter,
  setProtocolFilter,
  setPoolFilter,
  setSorting,
  selectVolume,
  updateWizardConfig,
  resetWizardConfig,
  saveNewPool,
  failoverNodeRole,
} = storageSlice.actions;

export default storageSlice.reducer;
