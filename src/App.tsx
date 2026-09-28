import React, { useState } from 'react';
import { Header } from './components/Header';
import { MetricsSummary } from './components/MetricsSummary';
import { VirtualVolumeTable } from './components/VirtualVolumeTable';
import { PoolConfigurator } from './components/PoolConfigurator';
import { ClusterTopologyMap } from './components/ClusterTopologyMap';

type ActiveTab = 'volumes' | 'pools' | 'topology';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('volumes');

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <MetricsSummary />

        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'volumes' ? 'active' : ''}`}
            onClick={() => setActiveTab('volumes')}
          >
            Инвентарь томов (LUNs)
          </button>
          <button
            className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
          >
            Конфигуратор пулов (RDG/DDP)
          </button>
          <button
            className={`tab-btn ${activeTab === 'topology' ? 'active' : ''}`}
            onClick={() => setActiveTab('topology')}
          >
            HA-топология и ALUA
          </button>
        </div>

        <div className="tab-panel">
          {activeTab === 'volumes' && <VirtualVolumeTable />}
          {activeTab === 'pools' && <PoolConfigurator />}
          {activeTab === 'topology' && <ClusterTopologyMap />}
        </div>
      </main>

      <footer className="app-footer">
        <div>
          <strong>infra-console</strong> · Архитектурный демонстрационный проект на React 18, TypeScript, Redux Toolkit и Vite
        </div>
        <div>
          Автор: <strong>Владислав Окин</strong> · MIT License
        </div>
      </footer>
    </div>
  );
};

export default App;
