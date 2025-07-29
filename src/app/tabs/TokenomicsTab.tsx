import { useState } from "react";
import StakingContractDetails from "./StakingContractDetails";

export default function TokenomicsTab() {
  // Nur DexScreener-Chart bleibt erhalten

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
          Tokenomics Übersicht
        </h2>
        <p className="text-zinc-400 text-sm">
          Ausführliche Informationen zu den D.FAITH und D.INVEST Token
        </p>
      </div>

      {/* Preis-Chart (nur DexScreener) */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📈 Live-Preis-Chart
        </h3>
        <div className="w-full h-96 rounded-lg overflow-hidden bg-zinc-800">
          <iframe
            src="https://dexscreener.com/base/0x7109214bafde13a6ef8060644656464bccab93cd?embed=1&theme=dark&trades=0&info=0"
            width="100%"
            height="100%"
            frameBorder="0"
            className="w-full h-full"
            title="DexScreener Chart"
          />
        </div>
        <div className="mt-4 text-xs text-zinc-400 text-center">
          Live-Daten von der Base Chain • Pool: 0x7109214bafde13a6ef8060644656464bccab93cd
          <span className="ml-2 text-green-400">• DexScreener: Speziell für DEX-Trading optimiert</span>
        </div>
      </div>

      {/* Vertragsdetails Staking Smart Contract (Live) */}
      <StakingContractDetails />
    </div>
  );
}