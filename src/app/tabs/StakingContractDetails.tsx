import { useEffect, useState } from "react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { base } from "thirdweb/chains";

const DFAITH_TOKEN = {
  address: "0x69eFD833288605f320d77eB2aB99DDE62919BbC1",
  decimals: 2,
  symbol: "D.FAITH"
};
const STAKING_CONTRACT = {
  address: "0xe85b32a44b9eD3ecf8bd331FED46fbdAcDBc9940",
};

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID!,
});

export default function StakingContractDetails() {
  const [rewardBalance, setRewardBalance] = useState<string>("-");
  const [totalRewardsDistributed, setTotalRewardsDistributed] = useState<string>("-");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stakingContract = getContract({ client, chain: base, address: STAKING_CONTRACT.address });
        // getContractInfo liefert: totalStakedTokens, rewardBalance, currentStage, currentRate
        const contractInfo = await readContract({
          contract: stakingContract,
          method: "function getContractInfo() view returns (uint256,uint256,uint8,uint256)",
          params: []
        });
        const rewardBalanceRaw = contractInfo[1];
        setRewardBalance((Number(rewardBalanceRaw) / Math.pow(10, DFAITH_TOKEN.decimals)).toFixed(DFAITH_TOKEN.decimals));

        // totalRewardsDistributed ist public, kann direkt gelesen werden
        const totalRewards = await readContract({
          contract: stakingContract,
          method: "function totalRewardsDistributed() view returns (uint256)",
          params: []
        });
        setTotalRewardsDistributed((Number(totalRewards) / Math.pow(10, DFAITH_TOKEN.decimals)).toFixed(DFAITH_TOKEN.decimals));
      } catch (e) {
        setRewardBalance("-");
        setTotalRewardsDistributed("-");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 mt-8">
      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        🔒 Staking Smart Contract – Live Daten
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-400 mb-3">📋 Vertragsdetails</h4>
          <div className="space-y-2 text-sm">
            <div className="mb-2">
              <span className="text-zinc-400">Vertragstyp:</span>
              <span className="text-white ml-2">Staking Contract</span>
            </div>
            <div className="mb-2">
              <span className="text-zinc-400">Adresse:</span>
              <span className="text-blue-400 font-mono text-xs ml-2">0xe85b...9940</span>
              <a href="https://basescan.org/address/0xe85b32a44b9eD3ecf8bd331FED46fbdAcDBc9940#code" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 underline text-xs">Verifizierter Code</a>
            </div>
            <div className="mb-2">
              <span className="text-zinc-400">Sicherheit:</span>
              <span className="text-green-400 ml-2">ReentrancyGuard</span>
            </div>
            <div className="mb-2">
              <span className="text-zinc-400">Staking-Token:</span>
              <span className="text-blue-400 ml-2">D.INVEST (0 Dezimalstellen)</span>
            </div>
            <div className="mb-2">
              <span className="text-zinc-400">Belohnungs-Token:</span>
              <span className="text-amber-400 ml-2">D.FAITH (2 Dezimalstellen)</span>
            </div>
            <div>
              <span className="text-zinc-400">Min. Auszahlungsbetrag:</span>
              <span className="text-white ml-2">0.01 D.FAITH</span>
            </div>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col justify-center">
          <h4 className="font-semibold text-amber-400 mb-3">💸 Live Rewards</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Verfügbare Rewards im Contract:</span>
              <span className="text-amber-400 font-semibold">{loading ? "..." : rewardBalance + " D.FAITH"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Bereits ausgeschüttete Rewards:</span>
              <span className="text-green-400 font-semibold">{loading ? "..." : totalRewardsDistributed + " D.FAITH"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
