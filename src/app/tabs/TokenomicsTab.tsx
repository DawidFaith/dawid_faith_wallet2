import { useState } from "react";

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

      {/* Token Übersicht Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* D.FAITH Token */}
        <div className="bg-zinc-900 rounded-xl border border-amber-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/D.FAITH.png" alt="D.FAITH" className="w-16 h-16 object-contain" />
            <div>
              <h3 className="text-2xl font-bold text-amber-400">D.FAITH</h3>
              <p className="text-zinc-400 text-sm">Dawid Faith Token</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <h4 className="font-semibold text-amber-300 mb-3">📊 Token Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-400">Gesamtangebot:</span>
                  <div className="text-white font-semibold">100.000 D.FAITH</div>
                </div>
                <div>
                  <span className="text-zinc-400">Dezimalstellen:</span>
                  <div className="text-white font-semibold">2</div>
                </div>
                <div>
                  <span className="text-zinc-400">Im Smart Contract:</span>
                  <div className="text-amber-400 font-semibold">80% (80.000)</div>
                </div>
                <div>
                  <span className="text-zinc-400">Umlaufmenge:</span>
                  <div className="text-white font-semibold">20% (20.000)</div>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">💰 Nutzen</h4>
              <ul className="text-sm text-zinc-300 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Handel & Staking auf Base Chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Exklusiver Merch-Kauf</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Social Media Boost & Community</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* D.INVEST Token */}
        <div className="bg-zinc-900 rounded-xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/D.INVEST.png" alt="D.INVEST" className="w-16 h-16 object-contain" />
            <div>
              <h3 className="text-2xl font-bold text-blue-400">D.INVEST</h3>
              <p className="text-zinc-400 text-sm">Investment- & Staking-Token</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-semibold text-blue-300 mb-3">📊 Token Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-400">Gesamtangebot:</span>
                  <div className="text-white font-semibold">10.000 D.INVEST</div>
                </div>
                <div>
                  <span className="text-zinc-400">Dezimalstellen:</span>
                  <div className="text-white font-semibold">0</div>
                </div>
                <div>
                  <span className="text-zinc-400">Preis:</span>
                  <div className="text-blue-400 font-semibold">5€ pro Token</div>
                </div>
                <div>
                  <span className="text-zinc-400">Min. Kaufbetrag:</span>
                  <div className="text-white font-semibold">5€</div>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">🎯 Vorteile</h4>
              <ul className="text-sm text-zinc-300 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>D.FAITH-Staking für Rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Zugang zu 80% D.FAITH Supply</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Rewards ab 0,01 D.FAITH jederzeit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contract Informationen */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          🔒 Smart-Contract-Architektur
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Übersicht */}
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-3">📋 Vertragsdetails</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Vertragstyp:</span>
                  <span className="text-white">WeeklyTokenStaking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sicherheit:</span>
                  <span className="text-green-400">ReentrancyGuard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Staking-Token:</span>
                  <span className="text-blue-400">D.INVEST (0 Dezimalstellen)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Belohnungs-Token:</span>
                  <span className="text-amber-400">D.FAITH (2 Dezimalstellen)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Min. Auszahlungsbetrag:</span>
                  <span className="text-white">0,01 D.FAITH</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-3">⚙️ Wichtige Funktionen</h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Flexibles Staking – jederzeit ein- und aussteigen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Echtzeit-Belohnungsberechnung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Halving-Mechanismus für Nachhaltigkeit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Compound Rewards (automatische Reinvestition)</span>
                </li>
              </ul>
            </div>
          </div>
          {/* Belohnungsstufen */}
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-3">📈 Belohnungsstufen (Halving-System)</h4>
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-400 font-semibold">Stufe 1</span>
                    <span className="text-green-400 font-bold">10% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">0 – 10.000 D.FAITH ausgeschüttet</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-blue-400 font-semibold">Stufe 2</span>
                    <span className="text-blue-400 font-bold">5% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">10.000 – 20.000 D.FAITH</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-purple-400 font-semibold">Stufe 3</span>
                    <span className="text-purple-400 font-bold">2,5% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">20.000 – 40.000 D.FAITH</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-yellow-400 font-semibold">Stufe 4</span>
                    <span className="text-yellow-400 font-bold">1,25% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">40.000 – 60.000 D.FAITH</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 font-semibold">Stufe 5</span>
                    <span className="text-red-400 font-bold">0,63% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">60.000 – 80.000 D.FAITH</div>
                </div>
                <div className="bg-zinc-500/10 border border-zinc-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 font-semibold">Stufe 6</span>
                    <span className="text-zinc-400 font-bold">0,31% / Woche</span>
                  </div>
                  <div className="text-xs text-zinc-400">80.000+ D.FAITH (Finale Stufe)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* So funktioniert's */}
        <div className="mt-6 bg-zinc-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-amber-400 mb-3">🔄 So funktioniert Staking</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h5 className="font-semibold text-white mb-1">D.INVEST staken</h5>
              <p className="text-zinc-400 text-xs">Lege deine D.INVEST Token im Staking-Vertrag an</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-400 font-bold">2</span>
              </div>
              <h5 className="font-semibold text-white mb-1">D.FAITH verdienen</h5>
              <p className="text-zinc-400 text-xs">Erhalte automatisch D.FAITH-Belohnungen je nach aktueller Stufe</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-amber-400 font-bold">3</span>
              </div>
              <h5 className="font-semibold text-white mb-1">Auszahlen & Reinvestieren</h5>
              <p className="text-zinc-400 text-xs">Belohnungen jederzeit auszahlen (min. 0,01 D.FAITH) oder automatisch reinvestieren</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verteilungs-Info */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          🎯 Token-Verteilung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* D.FAITH Verteilung */}
          <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
            <h4 className="font-semibold text-amber-400 mb-3">D.FAITH Verteilung</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Smart Contract (Staking-Belohnungen)</span>
                <span className="text-amber-400 font-semibold">80.000 (80%)</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-3">
                <div className="bg-amber-400 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Umlaufmenge</span>
                <span className="text-white font-semibold">20.000 (20%)</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-3">
                <div className="bg-zinc-400 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          {/* Wichtige Kennzahlen */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-3">📊 Wichtige Kennzahlen</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Max. D.FAITH durch Staking:</span>
                <span className="text-amber-400 font-semibold">80.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Benötigte D.INVEST für vollen Zugang:</span>
                <span className="text-blue-400 font-semibold">Beliebiger Betrag</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Belohnungsberechnung:</span>
                <span className="text-green-400 font-semibold">Echtzeit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mindest-Auszahlung:</span>
                <span className="text-white font-semibold">0,01 D.FAITH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Unstaking-Dauer:</span>
                <span className="text-green-400 font-semibold">Sofort</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}