import React, { useState } from 'react';
import NexusEntryPage from './NexusEntryPage';
import Nexus1GenomicPrediction from './Nexus1GenomicPrediction';
import Nexus2PedigreePrediction from './Nexus2PedigreePrediction';
import Nexus3Groups from "./nexus/Nexus3Groups";
import { HelpButton } from '@/components/help/HelpButton';

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

  return (
    <>
      <HelpButton context="nexus" />
      {currentView === 'nexus1' ? (
        <Nexus1GenomicPrediction onBack={handleBack} />
      ) : currentView === 'nexus2' ? (
        <Nexus2PedigreePrediction onBack={handleBack} selectedFarmId={selectedFarmId} />
      ) : currentView === 'nexus3' ? (
        <Nexus3Groups />
      ) : (
        <NexusEntryPage onSelectMethod={handleMethodSelection} />
      )}
    </>
  );
};

export default NexusApp;
