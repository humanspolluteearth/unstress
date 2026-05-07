import React from 'react';
import { FinanceLedger } from './modules/finance/FinanceLedger';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-8">
        <FinanceLedger />
      </main>
    </div>
  );
};
