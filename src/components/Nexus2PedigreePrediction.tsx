import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator } from 'lucide-react';
import { t } from '@/lib/i18n';
import Nexus2PredictionIndividual from './nexus2/Nexus2PredictionIndividual';
import Nexus2PredictionBatch from './nexus2/Nexus2PredictionBatch';
import { TutorialButtons } from "@/features/tutorial/TutorialButtons";
interface Nexus2PedigreePredictionProps {
  onBack: () => void;
  selectedFarmId?: string | null;
}
const Nexus2PedigreePrediction: React.FC<Nexus2PedigreePredictionProps> = ({
  onBack,
  selectedFarmId
}) => {
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={onBack} className="bg-slate-200 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('nexus2.back')}
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            {t('nexus2.title')}
          </h2>
          <p className="text-muted-foreground">{t('nexus2.subtitle')}</p>
        </div>
        <div className="ml-auto">
          <TutorialButtons slug="nexus" />
        </div>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="individual">{t('nexus2.tabs.individual')}</TabsTrigger>
          <TabsTrigger value="batch">{t('nexus2.tabs.batch')}</TabsTrigger>
        </TabsList>
        <TabsContent value="individual" className="space-y-6">
          <Nexus2PredictionIndividual />
        </TabsContent>
        <TabsContent value="batch" className="space-y-6">
          <Nexus2PredictionBatch selectedFarmId={selectedFarmId} />
        </TabsContent>
      </Tabs>
    </div>;
};
export default Nexus2PedigreePrediction;