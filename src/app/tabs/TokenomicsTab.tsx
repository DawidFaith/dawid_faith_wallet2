import { useState } from "react";

export default function TokenomicsTab() {
  const [activeChart, setActiveChart] = useState<'tradingview' | 'dexscreener' | 'geckoterminal'>('dexscreener');

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
          Tokenomics Overview
        </h2>
        <p className="text-zinc-400 text-sm">
          Detaillierte Informationen über D.FAITH und D.INVEST Token
        </p>
      </div>

      {/* Price Chart */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📈 Live Price Chart
        </h3>
        
        {/* Chart Options Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveChart('tradingview')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              activeChart === 'tradingview' 
                ? 'bg-amber-500 text-black' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            TradingView
          </button>
          <button 
            onClick={() => setActiveChart('dexscreener')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              activeChart === 'dexscreener' 
                ? 'bg-amber-500 text-black' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            DexScreener
          </button>
          <button 
            onClick={() => setActiveChart('geckoterminal')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              activeChart === 'geckoterminal' 
                ? 'bg-amber-500 text-black' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            GeckoTerminal
          </button>
        </div>
        
        {/* TradingView Widget */}
        {activeChart === 'tradingview' && (
          <div className="w-full h-96 rounded-lg overflow-hidden bg-zinc-800">
            <iframe
              src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=BASE%3AD.FAITH&interval=1H&hidesidetoolbar=1&hidetabs=1&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=&hideideas=1&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=de"
              width="100%"
              height="100%"
              frameBorder="0"
              allowTransparency={true}
              scrolling="no"
              className="w-full h-full"
              title="TradingView Chart"
            />
          </div>
        )}
        
        {/* DexScreener */}
        {activeChart === 'dexscreener' && (
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
        )}
        
        {/* GeckoTerminal */}
        {activeChart === 'geckoterminal' && (
          <div className="w-full h-96 rounded-lg overflow-hidden bg-zinc-800">
            <iframe 
              height="100%" 
              width="100%" 
              title="GeckoTerminal Embed" 
              src="https://www.geckoterminal.com/base/pools/0x7109214bafde13a6ef8060644656464bccab93cd?embed=1&info=1&swaps=1&grayscale=1&light_chart=0&chart_type=price&resolution=1h" 
              frameBorder="0" 
              allow="clipboard-write" 
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}
        
        {/* Chart Info */}
        <div className="mt-4 text-xs text-zinc-400 text-center">
          Live-Daten von Base Chain • Pool: 0x7109214bafde13a6ef8060644656464bccab93cd
          {activeChart === 'dexscreener' && (
            <span className="ml-2 text-green-400">• DexScreener: Speziell für DEX-Trading optimiert</span>
          )}
          {activeChart === 'tradingview' && (
            <span className="ml-2 text-blue-400">• TradingView: Professionelle Chart-Analyse</span>
          )}
          {activeChart === 'geckoterminal' && (
            <span className="ml-2 text-purple-400">• GeckoTerminal: Vollständige Trading-Informationen</span>
          )}
        </div>
      </div>

      {/* Token Overview Grid */}
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
                  <span className="text-zinc-400">Total Supply:</span>
                  <div className="text-white font-semibold">100,000 D.FAITH</div>
                </div>
                <div>
                  <span className="text-zinc-400">Decimals:</span>
                  <div className="text-white font-semibold">2</div>
                </div>
                <div>
                  <span className="text-zinc-400">In Smart Contract:</span>
                  <div className="text-amber-400 font-semibold">80% (80,000)</div>
                </div>
                <div>
                  <span className="text-zinc-400">Circulating:</span>
                  <div className="text-white font-semibold">20% (20,000)</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">💰 Utility</h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Tradeable Token auf Base Chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Staking Rewards für D.INVEST Holder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Governance und Community Token</span>
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
              <p className="text-zinc-400 text-sm">Investment & Staking Token</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-semibold text-blue-300 mb-3">📊 Token Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-400">Total Supply:</span>
                  <div className="text-white font-semibold">10,000 D.INVEST</div>
                </div>
                <div>
                  <span className="text-zinc-400">Decimals:</span>
                  <div className="text-white font-semibold">0</div>
                </div>
                <div>
                  <span className="text-zinc-400">Price:</span>
                  <div className="text-blue-400 font-semibold">5€ per Token</div>
                </div>
                <div>
                  <span className="text-zinc-400">Min. Purchase:</span>
                  <div className="text-white font-semibold">5€</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">🎯 Benefits</h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Stake to earn D.FAITH rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Access to 80% D.FAITH supply via staking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Weekly reward distribution</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contract Information */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          🔒 Smart Contract Architecture
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Overview */}
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-3">📋 Contract Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Contract Type:</span>
                  <span className="text-white">WeeklyTokenStaking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Security:</span>
                  <span className="text-green-400">ReentrancyGuard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Staking Token:</span>
                  <span className="text-blue-400">D.INVEST (0 decimals)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Reward Token:</span>
                  <span className="text-amber-400">D.FAITH (2 decimals)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Min. Claim:</span>
                  <span className="text-white">0.01 D.FAITH</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-3">⚙️ Key Features</h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Flexible staking - stake/unstake anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Real-time reward calculation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Halving mechanism for sustainability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Compound rewards (auto-reinvestment)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Reward Stages */}
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-3">📈 Reward Stages (Halving System)</h4>
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-400 font-semibold">Stage 1</span>
                    <span className="text-green-400 font-bold">10% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">0 - 10,000 D.FAITH distributed</div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-blue-400 font-semibold">Stage 2</span>
                    <span className="text-blue-400 font-bold">5% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">10,000 - 20,000 D.FAITH</div>
                </div>
                
                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-purple-400 font-semibold">Stage 3</span>
                    <span className="text-purple-400 font-bold">2.5% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">20,000 - 40,000 D.FAITH</div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-yellow-400 font-semibold">Stage 4</span>
                    <span className="text-yellow-400 font-bold">1.25% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">40,000 - 60,000 D.FAITH</div>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 font-semibold">Stage 5</span>
                    <span className="text-red-400 font-bold">0.63% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">60,000 - 80,000 D.FAITH</div>
                </div>
                
                <div className="bg-zinc-500/10 border border-zinc-500/20 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 font-semibold">Stage 6</span>
                    <span className="text-zinc-400 font-bold">0.31% / Week</span>
                  </div>
                  <div className="text-xs text-zinc-400">80,000+ D.FAITH (Final)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-6 bg-zinc-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-amber-400 mb-3">🔄 How Staking Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h5 className="font-semibold text-white mb-1">Stake D.INVEST</h5>
              <p className="text-zinc-400 text-xs">Deposit your D.INVEST tokens into the staking contract</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-400 font-bold">2</span>
              </div>
              <h5 className="font-semibold text-white mb-1">Earn D.FAITH</h5>
              <p className="text-zinc-400 text-xs">Automatically earn D.FAITH rewards based on current stage rate</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-amber-400 font-bold">3</span>
              </div>
              <h5 className="font-semibold text-white mb-1">Claim & Compound</h5>
              <p className="text-zinc-400 text-xs">Claim rewards anytime (min. 0.01 D.FAITH) or let them compound</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Info */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          🎯 Token Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* D.FAITH Distribution */}
          <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
            <h4 className="font-semibold text-amber-400 mb-3">D.FAITH Distribution</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Smart Contract (Staking Rewards)</span>
                <span className="text-amber-400 font-semibold">80,000 (80%)</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-3">
                <div className="bg-amber-400 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Circulating Supply</span>
                <span className="text-white font-semibold">20,000 (20%)</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-3">
                <div className="bg-zinc-400 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-3">📊 Key Metrics</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Max D.FAITH from Staking:</span>
                <span className="text-amber-400 font-semibold">80,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">D.INVEST Required for Full Access:</span>
                <span className="text-blue-400 font-semibold">Any amount</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reward Calculation:</span>
                <span className="text-green-400 font-semibold">Real-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Minimum Claim:</span>
                <span className="text-white font-semibold">0.01 D.FAITH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Unstaking Period:</span>
                <span className="text-green-400 font-semibold">Instant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}