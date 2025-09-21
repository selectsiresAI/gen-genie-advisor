import React, { useState } from 'react';
import NexusEntryPage from './NexusEntryPage';
import Nexus1GenomicPrediction from './Nexus1GenomicPrediction';
import Nexus2PedigreePrediction from './Nexus2PedigreePrediction';

type SelectedMethod = 'entry' | 'nexus1' | 'nexus2';

const NexusApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<SelectedMethod>('entry');

  const handleMethodSelection = (method: 'nexus1' | 'nexus2') => {
    setCurrentView(method);
  };

  const handleBack = () => {
    setCurrentView('entry');
  };

  switch (currentView) {
    case 'nexus1':
      return <Nexus1GenomicPrediction onBack={handleBack} />;
    case 'nexus2':
      return <Nexus2PedigreePrediction onBack={handleBack} />;
    default:
      return <NexusEntryPage onSelectMethod={handleMethodSelection} />;
  }
};

export default NexusApp;