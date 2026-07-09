import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, FileSpreadsheet, User, GitCompareArrows } from 'lucide-react';
import { t } from '@/lib/i18n';
import Nexus2PredictionIndividual from './nexus2/Nexus2PredictionIndividual';
import Nexus2PredictionBatch from './nexus2/Nexus2PredictionBatch';
import Nexus2SMSComparative from './nexus2/Nexus2SMSComparative';
import { HelpButton } from '@/components/help/HelpButton';
import { HelpHint } from '@/components/help/HelpHint';

type ViewMode = 'chooser' | 'individual' | 'batch' | 'sms-comparative';

interface Nexus2PedigreePredictionProps {
  onBack: () => void;
  selectedFarmId?: string | null;
}

const Nexus2PedigreePrediction: React.FC<Nexus2PedigreePredictionProps> = ({
  onBack,
  selectedFarmId
}) => {
  const [view, setView] = useState<ViewMode>('chooser');

  if (view === 'individual') {
    return (
      <div className="space-y-6">
        <HelpButton context="nexus2-pedigree" />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => setView('chooser')} className="bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nexus2.back')}
          </Button>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              {t('nexus2.title')}
              <HelpHint content="Informe pedigree completo, valide NAABs e gere PTAs projetadas" />
            </h2>
            <p className="text-muted-foreground">{t('nexus2.subtitle')}</p>
          </div>
        </div>
        <Nexus2PredictionIndividual />
      </div>
    );
  }

  if (view === 'batch') {
    return (
      <div className="space-y-6">
        <HelpButton context="nexus2-pedigree" />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => setView('chooser')} className="bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nexus2.back')}
          </Button>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              {t('nexus2.title')}
              <HelpHint content="Informe pedigree completo, valide NAABs e gere PTAs projetadas" />
            </h2>
            <p className="text-muted-foreground">{t('nexus2.subtitle')}</p>
          </div>
        </div>
        <Nexus2PredictionBatch selectedFarmId={selectedFarmId} />
      </div>
    );
  }

  if (view === 'sms-comparative') {
    return (
      <div className="space-y-6">
        <HelpButton context="nexus2-pedigree" />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => setView('chooser')} className="bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nexus2.back')}
          </Button>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Predição Comparativa SMS
              <HelpHint content="Compare predições de 3 touros recomendados pelo SMS para cada fêmea" />
            </h2>
            <p className="text-muted-foreground">Carregue o arquivo de acasalamento SMS e compare as predições</p>
          </div>
        </div>
        <Nexus2SMSComparative selectedFarmId={selectedFarmId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HelpButton context="nexus2-pedigree" />
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
            <HelpHint content="Informe pedigree completo, valide NAABs e gere PTAs projetadas" />
          </h2>
          <p className="text-muted-foreground">{t('nexus2.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Individual */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
          onClick={() => setView('individual')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">{t('nexus2.chooser.individual.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('nexus2.chooser.individual.desc')}
            </p>
            <Button size="lg" className="w-full text-white bg-red-700 hover:bg-red-600">
              <User className="w-4 h-4 mr-2" />
              {t('nexus2.chooser.individual.button')}
            </Button>
          </CardContent>
        </Card>

        {/* Batch */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
          onClick={() => setView('batch')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">{t('nexus2.chooser.batch.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('nexus2.chooser.batch.desc')}
            </p>
            <Button size="lg" className="w-full text-white bg-red-700 hover:bg-red-600">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {t('nexus2.chooser.batch.button')}
            </Button>
          </CardContent>
        </Card>

        {/* SMS Comparative */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
          onClick={() => setView('sms-comparative')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <GitCompareArrows className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Comparativa SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Compare predições de 3 touros recomendados pelo SMS para cada fêmea
            </p>
            <Button size="lg" className="w-full text-white bg-red-700 hover:bg-red-600">
              <GitCompareArrows className="w-4 h-4 mr-2" />
              Predição Comparativa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Nexus2PedigreePrediction;
