import React, { useState } from 'react';
import NexusEntryPage from './NexusEntryPage';
import Nexus1GenomicPrediction from './Nexus1GenomicPrediction';
import Nexus2PedigreePrediction from './Nexus2PedigreePrediction';
import Nexus3Groups from "./nexus/Nexus3Groups";

type SelectedMethod = 'entry' | 'nexus1' | 'nexus2' | 'nexus3';

interface NexusAppProps {
  selectedFarmId?: string | null;
  defaultFarmId?: string | null;
}

const NexusApp: React.FC<NexusAppProps> = ({ selectedFarmId, defaultFarmId }) => {
  const [currentView, setCurrentView] = useState<SelectedMethod>('entry');

  const handleMethodSelection = (method: 'nexus1' | 'nexus2' | 'nexus3') => {
    setCurrentView(method);
  };

  const handleBack = () => {
    setCurrentView('entry');
  };

  switch (currentView) {
    case 'nexus1':
      return <Nexus1GenomicPrediction onBack={handleBack} />;
    case 'nexus2':
      return <Nexus2PedigreePrediction onBack={handleBack} selectedFarmId={selectedFarmId} />;
    case 'nexus3':
      return (
        <Nexus3Groups
          onBack={handleBack}
          initialFarmId={selectedFarmId ?? undefined}
          fallbackDefaultFarmId={defaultFarmId ?? undefined}
        />
      );
    default:
      return <NexusEntryPage onSelectMethod={handleMethodSelection} />;
  }
};

export default NexusApp;
