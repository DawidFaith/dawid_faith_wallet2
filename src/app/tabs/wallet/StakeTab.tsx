import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { FaLock, FaUnlock, FaCoins, FaClock, FaInfoCircle, FaTimes } from "react-icons/fa";
import { useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareContractCall, resolveMethod, readContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { useSendTransaction } from "thirdweb/react";
import { balanceOf, approve } from "thirdweb/extensions/erc20";

const STAKING_CONTRACT = "0xe85b32a44b9eD3ecf8bd331FED46fbdAcDBc9940"; // Staking Contract - NEU!
const DFAITH_TOKEN = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1"; // D.FAITH Token NEU
const DFAITH_DECIMALS = 2;
const DINVEST_TOKEN = "0x6F1fFd03106B27781E86b33Df5dBB734ac9DF4bb"; // D.INVEST Token NEU
const DINVEST_DECIMALS = 0;
const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID! });

interface StakeTabProps {
  onStakeChanged?: () => void;
}

export default function StakeTab({ onStakeChanged }: StakeTabProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState("stake");
  const [available, setAvailable] = useState("0");
  const [staked, setStaked] = useState("0");
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<string | null>(null); // Track welche Operation durchgeführt wurde
  const [currentStage, setCurrentStage] = useState(1);
  const [currentRewardRate, setCurrentRewardRate] = useState(10); // Default auf 10 (erste Stufe)
  const [totalStakedTokens, setTotalStakedTokens] = useState("0");
  const [totalRewardsDistributed, setTotalRewardsDistributed] = useState("0.00");
  const [userCount, setUserCount] = useState(0);
  const [dfaithBalance, setDfaithBalance] = useState("0.00");
  const [dinvestBalance, setDinvestBalance] = useState("0");
  const [stakeTimestamp, setStakeTimestamp] = useState<number>(0);
  const [canUnstake, setCanUnstake] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [minClaimAmount, setMinClaimAmount] = useState("0.01");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState<number>(0);
  const [secondsPerClaim, setSecondsPerClaim] = useState<number>(0);

  // Real-time Update für nextClaimTimestamp Anzeige
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));

  // Timer für Live-Updates der Wartezeitanzeige
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000); // Update jede Sekunde

    return () => clearInterval(interval);
  }, []);

  // Hilfsfunktion zum Zurücksetzen des Status
  const resetTxStatus = () => {
    setTxStatus(null);
    setLastOperation(null);
  };

  // Korrekte API-Funktion für Balance-Abfrage auf Base Chain
  const fetchTokenBalanceViaInsightApi = async (
    tokenAddress: string,
    accountAddress: string
  ): Promise<string> => {
    if (!accountAddress) return "0";
    try {
      const params = new URLSearchParams({
        chain_id: "8453", // Base Chain ID
        token_address: tokenAddress,
        owner_address: accountAddress,
        include_native: "true",
        resolve_metadata_links: "true",
        include_spam: "false",
        limit: "50",
        metadata: "false",
      });
      const url = `https://insight.thirdweb.com/v1/tokens?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-client-id": process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
        },
      });
      
      if (!res.ok) {
        console.error("Insight API Fehlerstatus:", res.status, res.statusText);
        throw new Error("API Error");
      }
      
      const data = await res.json();
      const balance = data?.data?.[0]?.balance ?? "0";
      return balance;
    } catch (e) {
      console.error("Insight API Fehler:", e);
      return "0";
    }
  };

  // Neue Funktion: Hole alle User- und Contractdaten mit neuen Methoden
  const fetchStakeInfo = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      
      // Versuche zuerst getUserInfo mit verbesserter Fehlerbehandlung
      try {
        const userInfo = await readContract({
          contract: staking,
          method: "function getUserInfo(address) view returns (uint256,uint256,uint256,bool,bool)",
          params: [account.address]
        });
        // [stakedAmount, claimableReward, stakeTimestamp, canUnstake, canClaim]
        console.log("getUserInfo Ergebnis:", userInfo);
        console.log("Gestakte Menge (getUserInfo):", userInfo[0].toString());
        console.log("Claimable Rewards (getUserInfo):", userInfo[1].toString());
        
        setStaked(userInfo[0].toString());
        setClaimableRewards((Number(userInfo[1]) / Math.pow(10, DFAITH_DECIMALS)).toFixed(DFAITH_DECIMALS));
        setStakeTimestamp(Number(userInfo[2]));
        setCanUnstake(userInfo[3]);
        setCanClaim(userInfo[4]);
      } catch (userInfoError) {
        console.log("getUserInfo fehlgeschlagen, versuche stakes mapping:", userInfoError);
        
        // Fallback 1: Versuche direkt das stakes mapping
        try {
          const stakedAmount = await readContract({
            contract: staking,
            method: "function stakers(address) view returns (uint256,uint256,uint256,uint256)",
            params: [account.address]
          });
          // [amount, lastRewardUpdate, stakeTimestamp, accumulatedRewards]
          console.log("stakers mapping Ergebnis:", stakedAmount);
          setStaked(stakedAmount[0].toString());
          setStakeTimestamp(Number(stakedAmount[2]));
          
          // Versuche claimableReward separat zu holen
          try {
            const claimable = await readContract({
              contract: staking,
              method: "function getClaimableReward(address) view returns (uint256)",
              params: [account.address]
            });
            setClaimableRewards((Number(claimable) / Math.pow(10, DFAITH_DECIMALS)).toFixed(DFAITH_DECIMALS));
          } catch {
            setClaimableRewards("0.00");
          }
          
        } catch (stakersError) {
          console.log("stakers mapping fehlgeschlagen, versuche einfaches stakes:", stakersError);
          
          // Fallback 2: Versuche einfaches stakes mapping
          try {
            const simpleStaked = await readContract({
              contract: staking,
              method: "function stakes(address) view returns (uint256)",
              params: [account.address]
            });
            console.log("stakes mapping Ergebnis:", simpleStaked.toString());
            setStaked(simpleStaked.toString());
          } catch {
            console.log("Alle Staking-Abfragen fehlgeschlagen");
            setStaked("0");
          }
          
          // Setze Defaults für andere Werte
          setClaimableRewards("0.00");
          setStakeTimestamp(0);
        }
        
        // Setze Defaults für canUnstake und canClaim
        setCanUnstake(false);
        setCanClaim(false);
      }

      // Detailed Reward Info - mit Fallback
      try {
        const detailed = await readContract({
          contract: staking,
          method: "function getDetailedRewardInfo(address) view returns (uint256,uint256,uint256,uint256,bool)",
          params: [account.address]
        });
        // [claimableReward, nextClaimTimestamp, secondsPerClaim, currentRatePercent, canClaimNow]
        console.log("getDetailedRewardInfo Ergebnis:", detailed);
        console.log("secondsPerClaim vom Contract:", Number(detailed[2]));
        
        // Verwende getDetailedRewardInfo für genauere claimableRewards
        const detailedClaimable = (Number(detailed[0]) / Math.pow(10, DFAITH_DECIMALS)).toFixed(2);
        console.log("Detaillierte claimableRewards:", detailedClaimable);
        setClaimableRewards(detailedClaimable);
        
        setNextClaimTimestamp(Number(detailed[1]));
        setSecondsPerClaim(Number(detailed[2]));
        setCurrentRewardRate(Number(detailed[3]));
        setCanClaim(detailed[4]);
      } catch (detailedError) {
        console.log("getDetailedRewardInfo fehlgeschlagen, verwende Fallback:", detailedError);
        
        // Fallback: Verwende getClaimableReward
        try {
          const claimable = await readContract({
            contract: staking,
            method: "function getClaimableReward(address) view returns (uint256)",
            params: [account.address]
          });
          setClaimableRewards((Number(claimable) / Math.pow(10, DFAITH_DECIMALS)).toFixed(2));
        } catch {
          setClaimableRewards("0.00");
        }
        
        // Fallback für currentRewardRate
        try {
          const rate = await readContract({
            contract: staking,
            method: "function getCurrentRewardRate() view returns (uint256)",
            params: []
          });
          setCurrentRewardRate(Number(rate));
        } catch {
          setCurrentRewardRate(10); // Default
        }
        
        // Defaults setzen
        setNextClaimTimestamp(0);
        setSecondsPerClaim(0);
        setCanClaim(false);
      }

      // Contract Info - mit erweiterten Fallbacks
      try {
        const contractInfo = await readContract({
          contract: staking,
          method: "function getContractInfo() view returns (uint256,uint256,uint8,uint256)",
          params: []
        });
        // [totalStakedTokens, rewardBalance, currentStage, currentRate]
        console.log("getContractInfo Ergebnis:", contractInfo);
        setTotalStakedTokens(contractInfo[0].toString());
        setCurrentStage(Number(contractInfo[2]));
        // Verwende currentRate aus getContractInfo als Fallback
        if (currentRewardRate === 10) { // Falls noch auf Default
          setCurrentRewardRate(Number(contractInfo[3]));
        }
      } catch (contractInfoError) {
        console.log("getContractInfo fehlgeschlagen, versuche alternative Methoden:", contractInfoError);
        
        // Fallback: Versuche getCurrentStage einzeln
        try {
          const stage = await readContract({
            contract: staking,
            method: "function getCurrentStage() view returns (uint8)",
            params: []
          });
          setCurrentStage(Number(stage));
        } catch {
          setCurrentStage(1);
        }
        
        // Fallback: Versuche totalStaked einzeln
        try {
          const totalStaked = await readContract({
            contract: staking,
            method: "function totalStaked() view returns (uint256)",
            params: []
          });
          setTotalStakedTokens(totalStaked.toString());
        } catch {
          setTotalStakedTokens("0");
        }
      }
      
      // Versuche totalRewardsDistributed separat zu holen
      try {
        const rewardsDistributed = await readContract({
          contract: staking,
          method: "function totalRewardsDistributed() view returns (uint256)",
          params: []
        });
        setTotalRewardsDistributed((Number(rewardsDistributed) / Math.pow(10, DFAITH_DECIMALS)).toFixed(DFAITH_DECIMALS));
      } catch {
        setTotalRewardsDistributed("0.00");
      }

      // Minimum Claim Amount (Konstant, aber für UI)
      setMinClaimAmount("0.01");
      
      // Debug: Überprüfe finale Werte
      console.log("Finale fetchStakeInfo Werte:", {
        staked,
        claimableRewards,
        currentRewardRate,
        currentStage,
        totalStakedTokens,
        totalRewardsDistributed
      });
    } catch (e) {
      setStaked("0");
      setClaimableRewards("0.00");
      setCanUnstake(false);
      setCanClaim(false);
      setNextClaimTimestamp(0);
      setSecondsPerClaim(0);
      setCurrentRewardRate(10);
      setCurrentStage(1);
      setTotalStakedTokens("0");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account?.address) return;
    // D.INVEST Balance via Insight API (0 Decimals)
    (async () => {
      const dinvestValue = await fetchTokenBalanceViaInsightApi(DINVEST_TOKEN, account.address);
      setAvailable(Math.floor(Number(dinvestValue)).toString());
      await fetchStakeInfo();
    })();
  }, [account?.address, txStatus]);

  // D.FAITH und D.INVEST Balances abrufen
  useEffect(() => {
    if (!account?.address) {
      setDfaithBalance("0.00");
      setDinvestBalance("0");
      return;
    }
    // D.FAITH
    (async () => {
      try {
        const res = await fetch(`https://insight.thirdweb.com/v1/tokens?chain_id=8453&token_address=${DFAITH_TOKEN}&owner_address=${account.address}&include_native=true`);
        const data = await res.json();
        const bal = data?.data?.[0]?.balance ?? "0";
        setDfaithBalance((Number(bal) / Math.pow(10, DFAITH_DECIMALS)).toFixed(DFAITH_DECIMALS));
      } catch { setDfaithBalance("0.00"); }
    })();
    // D.INVEST
    (async () => {
      try {
        const res = await fetch(`https://insight.thirdweb.com/v1/tokens?chain_id=8453&token_address=${DINVEST_TOKEN}&owner_address=${account.address}&include_native=true`);
        const data = await res.json();
        const bal = data?.data?.[0]?.balance ?? "0";
        setDinvestBalance(Math.floor(Number(bal)).toString());
      } catch { setDinvestBalance("0"); }
    })();
  }, [account?.address]);

  // State für echte Contract-Zeitberechnung
  const [timeToMinClaimForAmount, setTimeToMinClaimForAmount] = useState<number | null>(null);
  
  // Funktion: Echte Contract-Zeit für einen Betrag abfragen
  const getTimeToMinClaimFromContract = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) {
      setTimeToMinClaimForAmount(null);
      return;
    }
    
    try {
      console.log("🔍 Lade getTimeToMinClaim für", amount, "D.INVEST Token...");
      
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      const result = await readContract({
        contract: staking,
        method: "function getTimeToMinClaim(uint256) view returns (uint256)",
        params: [BigInt(amount)]
      });
      
      const timeInSeconds = Number(result);
      console.log("⏳ Contract getTimeToMinClaim für", amount, "Token:", timeInSeconds, "Sekunden (≈", (timeInSeconds / 3600).toFixed(1), "Stunden)");
      
      setTimeToMinClaimForAmount(timeInSeconds);
    } catch (error) {
      console.error("❌ Fehler beim Laden getTimeToMinClaim:", error);
      setTimeToMinClaimForAmount(null);
    }
  }, []);
  
  // Effekt: Lade Contract-Zeit wenn Stake-Betrag sich ändert
  useEffect(() => {
    if (stakeAmount && parseInt(stakeAmount) > 0) {
      getTimeToMinClaimFromContract(parseInt(stakeAmount));
    } else {
      setTimeToMinClaimForAmount(null);
    }
  }, [stakeAmount, getTimeToMinClaimFromContract]);

  // Stake Function (echtes Staking mit Approval-Check)
  const handleStake = async () => {
    if (!stakeAmount || parseInt(stakeAmount) <= 0 || !account?.address) {
      console.log("Ungültige Eingabe oder keine Wallet verbunden");
      return;
    }

    const amountToStakeNum = parseInt(stakeAmount);
    const availableNum = parseInt(available);

    if (amountToStakeNum > availableNum) {
      setTxStatus("error");
      console.log("Nicht genügend Token verfügbar");
      return;
    }

    // Minimum Staking Check (mindestens 1 Token)
    if (amountToStakeNum < 1) {
      setTxStatus("error");
      console.log("Mindestens 1 D.INVEST Token erforderlich");
      return;
    }

    setTxStatus("pending");
    console.log("🔍 STAKING DEBUG START - MIT KORREKTEM CONTRACT!");
    console.log("✅ Staking Contract und D.FAITH Token haben jetzt unterschiedliche Adressen!");
    console.log("✅ Staking Contract:", STAKING_CONTRACT);
    console.log("✅ D.FAITH Token:", DFAITH_TOKEN);

    try {
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      const dinvest = getContract({ client, chain: base, address: DINVEST_TOKEN });
      const amountToStake = BigInt(amountToStakeNum);

      console.log("🔍 Staking Debug Info:");
      console.log("- Wallet:", account.address);
      console.log("- Staking Contract:", STAKING_CONTRACT);
      console.log("- D.INVEST Token:", DINVEST_TOKEN);
      console.log("- D.FAITH Token:", DFAITH_TOKEN);
      console.log("- Staking Betrag:", amountToStakeNum);
      console.log("- Verfügbare Token:", availableNum);
      console.log("- Aktuell gestaked:", staked);
      console.log("📝 Smart Contract Details:");
      console.log("- Contract Name: WeeklyTokenStaking");
      console.log("- Minimum Staking Zeit: 7 Tage");
      console.log("- Minimum Claim Betrag: 0.01 D.FAITH");
      console.log("- Staking Token Decimals: 0 (D.INVEST)");
      console.log("- Reward Token Decimals: 2 (D.FAITH)");
      
      // 1. D.INVEST Token Balance direkt vom Contract abrufen
      let tokenBalance = BigInt(0);
      try {
        tokenBalance = await readContract({
          contract: dinvest,
          method: "function balanceOf(address) view returns (uint256)",
          params: [account.address]
        });
        console.log("- D.INVEST Balance (Contract):", tokenBalance.toString());
      } catch (e) {
        console.error("❌ Fehler beim Abrufen der Token Balance:", e);
      }

      // 2. Prüfung ob Token Balance ausreichend ist
      if (tokenBalance < amountToStake) {
        console.error("❌ Token Balance nicht ausreichend!");
        console.log("- Benötigt:", amountToStake.toString());
        console.log("- Verfügbar:", tokenBalance.toString());
        setTxStatus("error");
        setTimeout(() => setTxStatus(null), 5000);
        return;
      }

      // 3. Aktuelle Allowance prüfen
      let allowance = BigInt(0);
      try {
        allowance = await readContract({
          contract: dinvest,
          method: "function allowance(address,address) view returns (uint256)",
          params: [account.address, STAKING_CONTRACT]
        });
        console.log("- Aktuelle Allowance:", allowance.toString());
      } catch (e) {
        console.error("❌ Fehler beim Abrufen der Allowance:", e);
        allowance = BigInt(0);
      }
      
      // 4. Staking Contract Status prüfen
      try {
        const contractOwner = await readContract({
          contract: staking,
          method: "function owner() view returns (address)",
          params: []
        });
        console.log("- Contract Owner:", contractOwner);
      } catch (e) {
        console.error("❌ Contract Owner nicht abrufbar:", e);
      }

      // 5. Prüfung ob das Staking aktiv ist
      try {
        const isPaused = await readContract({
          contract: staking,
          method: "function paused() view returns (bool)",
          params: []
        });
        console.log("- Contract Paused:", isPaused);
        if (isPaused) {
          console.error("❌ Staking Contract ist pausiert!");
          setTxStatus("error");
          setTimeout(() => setTxStatus(null), 5000);
          return;
        }
      } catch (e) {
        console.log("- Contract Pause Status nicht abrufbar (evtl. kein Pausable Contract)");
      }

      // 6. Prüfung ob User bereits gestaked hat
      try {
        const userStake = await readContract({
          contract: staking,
          method: "function stakes(address) view returns (uint256)",
          params: [account.address]
        });
        console.log("- User Stake (Contract):", userStake.toString());
      } catch (e) {
        console.log("- User Stake nicht direkt abrufbar (möglicherweise andere Struktur)");
      }

      // 7. Approve, falls nötig (mit etwas Puffer)
      if (allowance < amountToStake) {
        console.log("🔐 Approval erforderlich");
        setTxStatus("approving");
        
        const approveAmount = amountToStake * BigInt(2); // Etwas mehr für zukünftige Transaktionen
        console.log("- Approve Betrag:", approveAmount.toString());
        
        const approveTx = prepareContractCall({
          contract: dinvest,
          method: "function approve(address,uint256) returns (bool)",
          params: [STAKING_CONTRACT, approveAmount]
        });
        
        await new Promise<void>((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: (result) => {
              console.log("✅ Approval erfolgreich:", result);
              resolve();
            },
            onError: (error) => {
              console.error("❌ Approval fehlgeschlagen:", error);
              reject(error);
            }
          });
        });
        
        // Kurz warten für Blockchain-Bestätigung
        console.log("⏳ Warten auf Blockchain-Bestätigung...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Allowance nach Approval nochmal prüfen
        try {
          const newAllowance = await readContract({
            contract: dinvest,
            method: "function allowance(address,address) view returns (uint256)",
            params: [account.address, STAKING_CONTRACT]
          });
          console.log("- Neue Allowance nach Approval:", newAllowance.toString());
          if (newAllowance < amountToStake) {
            console.error("❌ Allowance nach Approval immer noch nicht ausreichend!");
            setTxStatus("error");
            setTimeout(() => setTxStatus(null), 5000);
            return;
          }
        } catch (e) {
          console.error("❌ Fehler beim Prüfen der neuen Allowance:", e);
        }
      }
      
      // 8. Staking Contract Validierung - Prüfe ob es ein echter Staking Contract ist
      console.log("🔍 Validierung des Staking Contracts...");
      try {
        // Versuche eine typische Staking-Funktion zu finden
        const stakingInfo = await readContract({
          contract: staking,
          method: "function getStakingStatus() view returns (uint8, uint256, uint256)",
          params: []
        });
        console.log("✅ Staking Contract ist funktionsfähig, Status:", stakingInfo);
      } catch (e) {
        console.error("❌ Staking Contract scheint nicht die erwarteten Funktionen zu haben:", e);
        console.log("⚠️ Versuche trotzdem fortzufahren...");
      }

      // 9. Final Balance Check vor dem Staking
      try {
        const finalBalance = await readContract({
          contract: dinvest,
          method: "function balanceOf(address) view returns (uint256)",
          params: [account.address]
        });
        console.log("- Final Balance Check:", finalBalance.toString());
        if (finalBalance < amountToStake) {
          console.error("❌ Balance hat sich zwischen Checks geändert!");
          setTxStatus("error");
          setTimeout(() => setTxStatus(null), 5000);
          return;
        }
      } catch (e) {
        console.error("❌ Final Balance Check fehlgeschlagen:", e);
      }

      // 10. Stake die Token mit dem korrekten Staking Contract
      console.log("🔒 Staking wird mit dem korrekten Contract durchgeführt...");
      setTxStatus("staking");
      
      const stakeTx = prepareContractCall({
        contract: staking,
        method: "function stake(uint256)",
        params: [amountToStake]
      });
      
      console.log("- Stake Transaction vorbereitet:");
      console.log("- Staking Contract:", STAKING_CONTRACT);
      console.log("- D.FAITH Token:", DFAITH_TOKEN);
      console.log("- D.INVEST Token:", DINVEST_TOKEN);
      console.log("- Method: stake(uint256)");
      console.log("- Params:", [amountToStake.toString()]);
      
      await new Promise<void>((resolve, reject) => {
        sendTransaction(stakeTx, {
          onSuccess: (result) => {
            console.log("✅ Staking erfolgreich mit korrektem Contract:", result);
            setTxStatus("success");
            setLastOperation("stake"); // Markiere als Staking-Operation
            setStakeAmount("");
            
            // Sofort Parent-Komponente benachrichtigen
            if (onStakeChanged) {
              onStakeChanged();
            }
            
            // Sofortige lokale Balance-Aktualisierung
            if (account?.address) {
              fetchTokenBalanceViaInsightApi(DINVEST_TOKEN, account.address).then(balance => {
                setAvailable(Math.floor(Number(balance)).toString());
                console.log("✅ Staking: Sofortige Balance-Aktualisierung auf:", Math.floor(Number(balance)).toString());
              });
            }
            
            // Stake-Info nach kurzer Verzögerung aktualisieren
            setTimeout(() => {
              fetchStakeInfo();
            }, 1000);
            
            setTimeout(() => resetTxStatus(), 3000);
            resolve();
          },
          onError: (error: any) => {
            console.error("❌ Staking fehlgeschlagen:", error);
            console.error("❌ Error Details:", {
              message: error?.message || "Unbekannter Fehler",
              code: error?.code || "N/A", 
              data: error?.data || "N/A",
              stack: error?.stack || "N/A"
            });
            
            // Erweiterte Fehleranalyse
            if (error?.message?.includes("execution reverted")) {
              console.error("🔍 EXECUTION REVERTED - Mögliche Ursachen:");
              console.error("1. Staking Contract ist pausiert oder hat Zugangskontrollen");
              console.error("2. Minimaler Staking-Betrag nicht erreicht");
              console.error("3. Contract-spezifische Validierungen fehlgeschlagen");
              console.error("4. Gas-Limit zu niedrig");
              console.error("5. Timing-Beschränkungen (z.B. Cooldown-Periode)");
            }
            
            setTxStatus("error");
            setTimeout(() => setTxStatus(null), 5000);
            reject(error);
          }
        });
      });        } catch (e: any) {
          console.error("❌ Stake Fehler:", e);
          console.error("❌ Error Details:", {
            message: e?.message || "Unbekannter Fehler",
            code: e?.code || "N/A",
            data: e?.data || "N/A",
            stack: e?.stack || "N/A"
          });
          setTxStatus("error");
          setTimeout(() => setTxStatus(null), 5000);
        } finally {
          console.log("🔍 STAKING DEBUG END");
        }
      };

  // Unstake Function
  const handleUnstake = async (amountToUnstake: string) => {
    if (!account?.address || staked === "0") {
      console.log("Keine Token zum Unstaken verfügbar");
      return;
    }
    
    if (!amountToUnstake || parseInt(amountToUnstake) <= 0) {
      console.log("Ungültiger Unstake-Betrag");
      return;
    }
    
    const unstakeAmountNum = parseInt(amountToUnstake);
    
    // Validierung
    if (unstakeAmountNum > parseInt(staked)) {
      console.log("Nicht genügend Token gestaked");
      return;
    }
    
    setTxStatus("pending");
    
    try {
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      
      console.log('Unstaking:', unstakeAmountNum, "Token");
      
      // Der Smart Contract hat nur eine unstake(uint256) Funktion
      // Diese funktioniert sowohl für partielles als auch vollständiges Unstaking
      const unstakeTx = prepareContractCall({
        contract: staking,
        method: "function unstake(uint256)",
        params: [BigInt(unstakeAmountNum)]
      });
      
      console.log("Unstake Transaction vorbereitet:");
      console.log("- Contract:", STAKING_CONTRACT);
      console.log("- Method: unstake(uint256)");
      console.log("- Params:", [BigInt(unstakeAmountNum).toString()]);
      
      await new Promise<void>((resolve, reject) => {
        sendTransaction(unstakeTx, {
          onSuccess: (result) => {
            console.log('Unstaking erfolgreich:', result);
            setTxStatus("success");
            setLastOperation("unstake"); // Markiere als Unstaking-Operation
            
            // Sofort Parent-Komponente benachrichtigen
            if (onStakeChanged) {
              onStakeChanged();
            }
            
            // Sofortige lokale Balance-Aktualisierung
            if (account?.address) {
              fetchTokenBalanceViaInsightApi(DINVEST_TOKEN, account.address).then(balance => {
                setAvailable(Math.floor(Number(balance)).toString());
                console.log("✅ Unstaking: Sofortige Balance-Aktualisierung auf:", Math.floor(Number(balance)).toString());
              });
            }
            
            // Stake-Info nach kurzer Verzögerung aktualisieren
            setTimeout(() => {
              fetchStakeInfo();
            }, 1000);
            
            setTimeout(() => resetTxStatus(), 3000);
            resolve();
          },
          onError: (error) => {
            console.error('Unstaking fehlgeschlagen:', error);
            console.error("Unstake Error Details:", {
              message: error?.message || "Unbekannter Fehler",
              code: (error as any)?.code || "N/A",
              data: (error as any)?.data || "N/A"
            });
            setTxStatus("error");
            setTimeout(() => setTxStatus(null), 5000);
            reject(error);
          }
        });
      });
      
    } catch (e) {
      console.error("Unstake Fehler:", e);
      setTxStatus("error");
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  // Claim Rewards Function
  const handleClaim = async () => {
    if (!account?.address || !canClaim) {
      console.log("Keine Rewards zum Einfordern verfügbar oder Mindestbetrag nicht erreicht");
      return;
    }
    
    setTxStatus("pending");
    
    try {
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      
      console.log("Claim Rewards:", claimableRewards);
      
      const claimTx = prepareContractCall({
        contract: staking,
        method: "function claimReward()",
        params: []
      });
      
      await new Promise<void>((resolve, reject) => {
        sendTransaction(claimTx, {
          onSuccess: () => {
            console.log("Claim erfolgreich");
            setTxStatus("success");
            setLastOperation("claim"); // Markiere als Claim-Operation
            setTimeout(() => resetTxStatus(), 3000);
            resolve();
          },
          onError: (error) => {
            console.error("Claim fehlgeschlagen:", error);
            setTxStatus("error");
            setTimeout(() => setTxStatus(null), 5000);
            reject(error);
          }
        });
      });
      
    } catch (e) {
      console.error("Claim Fehler:", e);
      setTxStatus("error");
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  // Reward Rate formatieren - Contract gibt Basis-Punkte zurück (1000 = 10.00%)
  const formatRewardRate = (rate: number) => {
    return (rate / 100).toFixed(2);
  };

  // Hilfsfunktion für den User-Reward pro Woche
  const getUserWeeklyReward = () => {
    const stakedNum = parseInt(staked) || 0;
    // Smart Contract Rate: currentRewardRate ist bereits in Basis-Punkten (z.B. 1000 = 10.00%)
    // Berechnung: (stakedAmount * rate) / 10000 für korrekte Prozent-Umrechnung
    const weeklyReward = ((stakedNum * currentRewardRate) / 10000).toFixed(2);
    console.log("Weekly Reward Berechnung (Contract-konform):", {
      staked: stakedNum,
      currentRewardRate,
      weeklyReward,
      calculation: `${stakedNum} * ${currentRewardRate} / 10000 = ${weeklyReward}`,
      note: "Contract verwendet Basis-Punkte (1000 = 10.00%)"
    });
    return weeklyReward;
  };

  // Hilfsfunktion: Berechne korrekte Zeit für Claims basierend auf gestaketen Token
  const calculateCorrectClaimTime = (stakedAmount: number, currentRewardRate: number, minClaimAmount: number): number => {
    if (!stakedAmount || !currentRewardRate || !minClaimAmount) return 0;
    
    // Smart Contract-konforme Berechnung mit Basis-Punkten
    const weeklyReward = (stakedAmount * currentRewardRate) / 10000; // D.FAITH pro Woche (Basis-Punkte)
    const weeksToMinClaim = minClaimAmount / weeklyReward;
    const secondsToMinClaim = weeksToMinClaim * 604800; // 604800 = Sekunden pro Woche
    
    return Math.max(0, secondsToMinClaim);
  };

  // Hilfsfunktion: Formatiere Zeit in Sekunden zu lesbarer Form
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return "< 1m";
  };

  // Zeit bis Unstaking möglich ist (in Sekunden)
  const timeUntilUnstake = useMemo(() => {
    if (!stakeTimestamp) return 0;
    const minStakePeriod = 7 * 24 * 60 * 60; // 7 Tage in Sekunden
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = stakeTimestamp + minStakePeriod;
    return Math.max(0, unlockTime - now);
  }, [stakeTimestamp]);

  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            D.INVEST Staking
          </h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 bg-zinc-800/60 hover:bg-zinc-700/60 rounded-full transition-colors"
            title="Contract Informationen"
          >
            <FaInfoCircle className="text-amber-400 text-lg" />
          </button>
        </div>
        <p className="text-zinc-400">Verdienen Sie kontinuierlich D.FAITH Token durch Staking</p>
      </div>

      {/* Zentrale Status-Meldungen - immer sichtbar oben */}
      {(txStatus === "success" || txStatus === "error" || txStatus === "pending" || txStatus === "approving" || txStatus === "staking") && (
        <div className={`p-4 rounded-xl text-center text-sm font-medium border mb-4 ${
          txStatus === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" :
          txStatus === "error" ? "bg-red-500/20 text-red-400 border-red-500/30" :
          txStatus === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
          txStatus === "approving" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
          txStatus === "staking" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
          ""
        }`}>
          <div className="flex items-center justify-center gap-2">
            {(txStatus === "pending" || txStatus === "approving" || txStatus === "staking") && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            )}
            <span>
              {txStatus === "success" && lastOperation === "stake" && "✅ Staking erfolgreich abgeschlossen!"}
              {txStatus === "success" && lastOperation === "unstake" && "✅ Unstaking erfolgreich abgeschlossen!"}
              {txStatus === "success" && lastOperation === "claim" && "✅ Belohnungen erfolgreich eingefordert!"}
              {txStatus === "success" && !lastOperation && "✅ Operation erfolgreich abgeschlossen!"}
              {txStatus === "error" && lastOperation === "stake" && "❌ Staking fehlgeschlagen! Bitte versuchen Sie es erneut."}
              {txStatus === "error" && lastOperation === "unstake" && "❌ Unstaking fehlgeschlagen! Bitte versuchen Sie es erneut."}
              {txStatus === "error" && lastOperation === "claim" && "❌ Claim fehlgeschlagen! Bitte versuchen Sie es erneut."}
              {txStatus === "error" && !lastOperation && "❌ Transaktion fehlgeschlagen! Bitte versuchen Sie es erneut."}
              {txStatus === "pending" && lastOperation === "stake" && "⏳ Staking wird verarbeitet..."}
              {txStatus === "pending" && lastOperation === "unstake" && "⏳ Unstaking wird verarbeitet..."}
              {txStatus === "pending" && lastOperation === "claim" && "⏳ Belohnungen werden eingefordert..."}
              {txStatus === "pending" && !lastOperation && "⏳ Transaktion wird verarbeitet..."}
              {txStatus === "approving" && "🔐 Token-Genehmigung wird erteilt..."}
              {txStatus === "staking" && "🔒 Staking-Vorgang läuft..."}
            </span>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-zinc-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-amber-400">Smart Contract Informationen</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 bg-zinc-800/60 hover:bg-zinc-700/60 rounded-full transition-colors"
              >
                <FaTimes className="text-zinc-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Hauptinformationen */}
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-full">
                    <FaCoins className="text-amber-400 text-lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-400">D.INVEST Staking</h4>
                    <p className="text-xs text-zinc-400">Verdienen Sie D.FAITH Token durch Staking</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Aktuelle Stufe:</span>
                    <div className="text-amber-400 font-semibold">Stufe {currentStage}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Wöchentliche Rate:</span>
                    <div className="text-amber-400 font-semibold">{(currentRewardRate / 10000).toFixed(2)} D.FAITH pro Token</div>
                  </div>
                </div>
              </div>

              {/* Ihr Staking Status */}
              {staked !== "0" && (
                <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-700/50">
                  <h4 className="font-semibold text-blue-400 mb-3">Ihr Staking Status</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-zinc-500">Gestakte Token:</span>
                      <div className="text-blue-400 font-semibold">{staked} D.INVEST</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Wöchentlicher Reward:</span>
                      <div className="text-blue-400 font-semibold">{getUserWeeklyReward()} D.FAITH</div>
                    </div>
                    {secondsPerClaim > 0 && (
                      <>
                        <div>
                          <span className="text-zinc-500">Claim-Intervall:</span>
                          <div className="text-blue-400 font-semibold">{formatTime(secondsPerClaim)}</div>
                        </div>
                        <div>
                          <span className="text-zinc-500">Verfügbare Rewards:</span>
                          <div className="text-blue-400 font-semibold">{claimableRewards} D.FAITH</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reward Stufen - Vollständig */}
              <div className="bg-green-800/20 rounded-xl p-4 border border-green-700/50">
                <h4 className="font-semibold text-green-400 mb-3">Alle Reward Stufen (Halving System)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 1:</span>
                    <span className="text-green-400">10.00% (0-10k D.FAITH verteilt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 2:</span>
                    <span className="text-green-400">5.00% (10k-20k D.FAITH verteilt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 3:</span>
                    <span className="text-green-400">2.50% (20k-40k D.FAITH verteilt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 4:</span>
                    <span className="text-green-400">1.25% (40k-60k D.FAITH verteilt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 5:</span>
                    <span className="text-green-400">0.63% (60k-80k D.FAITH verteilt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 6+:</span>
                    <span className="text-green-400">0.31% (ab 80k D.FAITH verteilt)</span>
                  </div>
                  <div className="text-center mt-3 pt-2 border-t border-green-700/30">
                    <span className="text-xs text-zinc-500">
                      Aktuell verteilt: {totalRewardsDistributed} D.FAITH
                    </span>
                    <div className="text-xs text-zinc-400 mt-1">
                      Bei jeder Stufe halbiert sich die wöchentliche Reward-Rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Wichtige Regeln */}
              <div className="bg-orange-800/20 rounded-xl p-4 border border-orange-700/50">
                <h4 className="font-semibold text-orange-400 mb-3">Wichtige Regeln</h4>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div>• <strong>Staking:</strong> Jederzeit möglich, mindestens 1 D.INVEST</div>
                  <div>• <strong>Unstaking:</strong> Jederzeit möglich (ganz oder teilweise)</div>
                  <div>• <strong>Rewards:</strong> Kontinuierliche Berechnung, Claim ab {minClaimAmount} D.FAITH</div>
                  <div>• <strong>Automatik:</strong> Beim Unstaking werden Rewards automatisch ausgezahlt</div>
                  <div>• <strong>Sicherheit:</strong> D.FAITH Token können nur durch D.INVEST herausgeholt werden, nicht durch Owner</div>
                </div>
              </div>

              {/* Network Info - Kompakt */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700">
                <h4 className="font-semibold text-zinc-400 mb-3">Netzwerk & Statistiken</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Netzwerk:</span>
                    <div className="text-zinc-300">Base Chain</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Total Staked:</span>
                    <div className="text-zinc-300">{totalStakedTokens} D.INVEST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aktuelle Reward-Stufe */}
      <div className="bg-gradient-to-br from-blue-800/30 to-blue-900/30 rounded-xl p-4 border border-blue-700/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-400">Aktuelle Reward-Stufe</div>
            <div className="text-xs text-zinc-500">
              {(currentRewardRate / 10000).toFixed(2)} D.FAITH pro D.INVEST pro Woche
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-400">Stufe {currentStage}</div>
            <div className="text-xs text-zinc-500">Total verteilt: {totalRewardsDistributed} D.FAITH</div>
          </div>
        </div>
      </div>

      {/* Staking Overview: Verfügbar, Gestaked, Reward */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-4 border border-zinc-700 text-center">
          <div className="text-sm text-zinc-500 mb-1">Verfügbar</div>
          <div className="text-xl font-bold text-amber-400">
            {loading ? "Laden..." : available}
          </div>
          <div className="text-xs text-zinc-500">D.INVEST</div>
        </div>
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-4 border border-zinc-700 text-center">
          <div className="text-sm text-zinc-500 mb-1">Gestaked</div>
          <div className="text-xl font-bold text-purple-400">
            {loading ? "Laden..." : staked}
          </div>
          <div className="text-xs text-zinc-500">D.INVEST</div>
        </div>
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-4 border border-zinc-700 text-center flex flex-col items-center justify-center">
          <div className="text-sm text-zinc-500 mb-1">Rate</div>
          <div className="text-xl font-bold text-green-400 break-words max-w-full" style={{wordBreak:'break-word'}}>
            {getUserWeeklyReward()}
          </div>
          <div className="text-xs text-zinc-500">D.FAITH/Woche</div>
        </div>
      </div>

      {/* Verfügbare Belohnungen */}
      <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full">
              <FaCoins className="text-black text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-amber-400">Verfügbare Belohnungen</h3>
              <p className="text-xs text-zinc-500">
                {secondsPerClaim > 0 && staked !== "0"
                  ? `Kontinuierliche Belohnung alle ${formatTime(secondsPerClaim)} → ${minClaimAmount} D.FAITH`
                  : `Kontinuierliche D.FAITH Belohnungen (min. ${minClaimAmount})`
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-amber-400">{claimableRewards}</div>
            <div className="text-xs text-zinc-500">D.FAITH</div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canClaim || loading || txStatus === "pending"}
          onClick={handleClaim}
        >
          <FaCoins className="inline mr-2" />
          {txStatus === "pending" ? "Wird verarbeitet..." : 
           !canClaim ? "Warten" : 
           "Belohnungen einfordern"}
        </Button>
      </div>

      {/* Stake/Unstake Tabs */}
      <div className="flex bg-zinc-800/50 rounded-xl p-1">
        <button 
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
            activeTab === "stake" 
              ? "bg-amber-500/20 text-amber-400" 
              : "text-zinc-400 hover:text-zinc-300"
          }`}
          onClick={() => setActiveTab("stake")}
        >
          <FaLock className="inline mr-2" />
          Staken
        </button>
        <button 
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
            activeTab === "unstake" 
              ? "bg-amber-500/20 text-amber-400" 
              : "text-zinc-400 hover:text-zinc-300"
          }`}
          onClick={() => setActiveTab("unstake")}
        >
          <FaUnlock className="inline mr-2" />
          Unstaken
        </button>
      </div>

      {/* Stake Interface */}
      {activeTab === "stake" && (
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-6 border border-zinc-700 space-y-6">
          {/* Eingabe und verfügbare Balance in einer Zeile */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-zinc-300">D.INVEST Betrag</label>
              <div className="flex items-center gap-2 bg-zinc-800/60 px-2 py-1 rounded-lg">
                <span className="text-xs text-zinc-500">Verfügbar:</span>
                <span className="text-xs font-bold text-amber-400">{loading ? "Laden..." : available}</span>
                <button 
                  className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition ml-2"
                  onClick={() => setStakeAmount(available)}
                  disabled={loading || parseInt(available) <= 0}
                >
                  MAX
                </button>
              </div>
            </div>
            <input 
              type="number"
              placeholder="0"
              className="w-full bg-zinc-900/80 border border-zinc-600 rounded-xl py-4 px-4 text-lg font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
              value={stakeAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Nur positive ganze Zahlen erlauben, mindestens 1
                if (value === "" || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
                  setStakeAmount(value);
                }
              }}
              min="1"
              step="1"
            />
          </div>

          {/* Reward Vorschau für Eingabe */}
          {stakeAmount && parseInt(stakeAmount) > 0 && (
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700 flex flex-col items-center mt-2">
              <div className="text-xs text-zinc-400 mb-1">Ihr wöchentlicher Reward (Stufe {currentStage}):</div>
              <div className="text-2xl font-bold text-amber-400">
                {/* Smart Contract konforme Berechnung: (amount * rate) / 10000 */}
                {/* Basis-Punkte: 1000 = 10.00% = 0.10 D.FAITH pro D.INVEST/Woche */}
                {(() => {
                  const amount = parseInt(stakeAmount);
                  const rate = currentRewardRate;
                  if (isNaN(amount) || isNaN(rate)) return "-";
                  const reward = (amount * rate) / 10000; // Basis-Punkte Konvertierung
                  return reward.toFixed(2);
                })()} D.FAITH
              </div>
              {/* Nächster Reward verfügbar in ... */}
              <div className="text-xs text-zinc-500 mt-2">
                {(() => {
                  const amount = parseInt(stakeAmount);
                  if (isNaN(amount) || amount <= 0) return "Reward aktuell nicht verfügbar";
                  
                  // Zeige echte Contract-Zeit wenn verfügbar und vernünftig
                  if (timeToMinClaimForAmount !== null && timeToMinClaimForAmount < 604800) {
                    return `Nächster Claim möglich in: ${formatTime(timeToMinClaimForAmount)} (Contract)`;
                  }
                  
                  // Immer korrekte Berechnung verwenden
                  const rate = currentRewardRate;
                  if (rate === 0) return "Reward aktuell nicht verfügbar";
                  
                  const correctTime = calculateCorrectClaimTime(amount, rate, Number(minClaimAmount) || 0.01);
                  
                  // Debug-Log für 1 Token
                  if (amount === 1) {
                    console.log("⏳ Korrekte Zeit für 1 Token:", correctTime, "Sekunden (≈", (correctTime / 3600).toFixed(1), "Stunden)");
                    console.log("⏳ Wöchentlicher Reward (Contract-konform):", (amount * rate) / 10000, "D.FAITH");
                  }
                  
                  return `Nächster Claim möglich in: ${formatTime(correctTime)}`;
                })()}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!stakeAmount || parseInt(stakeAmount) <= 0 || parseInt(stakeAmount) > parseInt(available) || loading || txStatus === "pending" || txStatus === "approving" || txStatus === "staking"}
            onClick={handleStake}
          >
            <FaLock className="inline mr-2" />
            {txStatus === "approving" && "Approval läuft..."}
            {txStatus === "staking" && (parseInt(staked) > 0 ? "Token hinzufügen..." : "Staking läuft...")}
            {txStatus === "pending" && "Wird verarbeitet..."}
            {!txStatus && (!stakeAmount || parseInt(stakeAmount) <= 0) && "Betrag eingeben (min. 1)"}
            {!txStatus && stakeAmount && parseInt(stakeAmount) > parseInt(available) && "Nicht genügend Token"}
            {!txStatus && stakeAmount && parseInt(stakeAmount) > 0 && parseInt(stakeAmount) <= parseInt(available) && (
              parseInt(staked) > 0 
                ? `${stakeAmount} D.INVEST hinzufügen` 
                : `${stakeAmount} D.INVEST staken`
            )}
          </Button>

        </div>
      )}

      {/* Unstake Interface */}
      {activeTab === "unstake" && (
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-6 border border-zinc-700 space-y-6">
          {staked === "0" ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xs">ℹ</span>
                </div>
                <div className="text-sm text-zinc-400">
                  Sie haben derzeit keine D.INVEST Token gestaked.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Eingabe und gestakte Balance */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-zinc-300">D.INVEST Betrag</label>
                  <div className="flex items-center gap-2 bg-zinc-800/60 px-2 py-1 rounded-lg">
                    <span className="text-xs text-zinc-500">Gestaked:</span>
                    <span className="text-xs font-bold text-purple-400">{loading ? "Laden..." : staked}</span>
                    <button 
                      className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition ml-2"
                      onClick={() => setUnstakeAmount(staked)}
                      disabled={loading || parseInt(staked) <= 0}
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-zinc-900/80 border border-zinc-600 rounded-xl py-4 px-4 text-lg font-bold text-purple-400 focus:border-purple-500 focus:outline-none"
                  value={unstakeAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Nur positive ganze Zahlen erlauben, mindestens 1
                    if (value === "" || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
                      setUnstakeAmount(value);
                    }
                  }}
                  min="1"
                  step="1"
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!unstakeAmount || parseInt(unstakeAmount) <= 0 || parseInt(unstakeAmount) > parseInt(staked) || loading || txStatus === "pending"}
                onClick={() => {
                  handleUnstake(unstakeAmount);
                  setUnstakeAmount("");
                }}
              >
                <FaUnlock className="inline mr-2" />
                {txStatus === "pending" && "Wird verarbeitet..."}
                {!txStatus && (!unstakeAmount || parseInt(unstakeAmount) <= 0) && "Betrag eingeben (min. 1)"}
                {!txStatus && unstakeAmount && parseInt(unstakeAmount) > parseInt(staked) && "Nicht genügend Token gestaked"}
                {!txStatus && unstakeAmount && parseInt(unstakeAmount) > 0 && parseInt(unstakeAmount) <= parseInt(staked) && `${unstakeAmount} D.INVEST unstaken`}
              </Button>

            </>
          )}
        </div>
      )}
    </div>
  );
}
