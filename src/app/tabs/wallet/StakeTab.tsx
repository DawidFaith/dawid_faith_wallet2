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
  const [activeTab, setActiveTab] = useState("stake");
  const [available, setAvailable] = useState("0");
  const [staked, setStaked] = useState("0");
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
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
      
      // Versuche zuerst getUserInfo
      try {
        const userInfo = await readContract({
          contract: staking,
          method: "function getUserInfo(address) view returns (uint256,uint256,uint256,bool,bool)",
          params: [account.address]
        });
        // [stakedAmount, claimableReward, stakeTimestamp, canUnstake, canClaim]
        console.log("getUserInfo Ergebnis:", userInfo);
        setStaked(userInfo[0].toString());
        setClaimableRewards((Number(userInfo[1]) / Math.pow(10, 2)).toFixed(2));
        setStakeTimestamp(Number(userInfo[2]));
        setCanUnstake(userInfo[3]);
        setCanClaim(userInfo[4]);
      } catch (userInfoError) {
        console.log("getUserInfo fehlgeschlagen, versuche stakes mapping:", userInfoError);
        
        // Fallback: Versuche direkt das stakes mapping
        const stakedAmount = await readContract({
          contract: staking,
          method: "function stakes(address) view returns (uint256)",
          params: [account.address]
        });
        console.log("stakes mapping Ergebnis:", stakedAmount.toString());
        setStaked(stakedAmount.toString());
        
        // Setze Defaults für andere Werte
        setClaimableRewards("0.00");
        setStakeTimestamp(0);
        setCanUnstake(false);
        setCanClaim(false);
      }

      // Detailed Reward Info
      const detailed = await readContract({
        contract: staking,
        method: "function getDetailedRewardInfo(address) view returns (uint256,uint256,uint256,uint256,bool)",
        params: [account.address]
      });
      // [claimableReward, nextClaimTimestamp, secondsPerClaim, currentRatePercent, canClaimNow]
      setNextClaimTimestamp(Number(detailed[1]));
      setSecondsPerClaim(Number(detailed[2]));
      setCurrentRewardRate(Number(detailed[3]));
      setCanClaim(detailed[4]);

      // Contract Info
      const contractInfo = await readContract({
        contract: staking,
        method: "function getContractInfo() view returns (uint256,uint256,uint8,uint256,uint256,uint256)",
        params: []
      });
      // [totalStakedTokens, rewardBalance, currentStage, currentRate, totalRewardsDistributed, userCount]
      setTotalStakedTokens(contractInfo[0].toString());
      setCurrentStage(Number(contractInfo[2]));
      // totalRewardsDistributed ist [4] (5. Wert)
      setTotalRewardsDistributed((Number(contractInfo[4]) / Math.pow(10, DFAITH_DECIMALS)).toFixed(DFAITH_DECIMALS));
      // userCount ist [5] (6. Wert)
      setUserCount(Number(contractInfo[5]));

      // Minimum Claim Amount (Konstant, aber für UI)
      setMinClaimAmount("0.01");
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
            setStakeAmount("");
            
            // Callback für Parent-Komponente
            if (onStakeChanged) {
              onStakeChanged();
            }
            
            // Stake-Info aktualisieren
            setTimeout(() => {
              fetchStakeInfo();
            }, 2000); // Längere Wartezeit für Blockchain-Bestätigung
            
            setTimeout(() => setTxStatus(null), 3000);
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

  // Unstake Function (supports both full and partial unstaking)
  const handleUnstake = async (isPartial: boolean = false) => {
    if (!account?.address || staked === "0" || !canUnstake) {
      console.log("Keine Token zum Unstaken verfügbar oder Mindestzeit nicht erreicht");
      return;
    }
    
    let unstakeAmountNum = 0;
    
    if (isPartial) {
      // Für partielles Unstaking: Benutzer nach Betrag fragen
      const userInput = prompt(`Wie viele D.INVEST Token möchten Sie unstaken?\nVerfügbar: ${staked} Token`, "");
      if (!userInput) return; // Benutzer hat abgebrochen
      
      unstakeAmountNum = parseInt(userInput);
      
      // Validierung
      if (isNaN(unstakeAmountNum) || unstakeAmountNum <= 0) {
        console.log("Ungültiger Betrag eingegeben");
        return;
      }
      
      if (unstakeAmountNum > parseInt(staked)) {
        console.log("Nicht genügend Token gestaked");
        return;
      }
    } else {
      // Für vollständiges Unstaking: alle Token
      unstakeAmountNum = parseInt(staked);
    }
    
    setTxStatus("pending");
    
    try {
      const staking = getContract({ client, chain: base, address: STAKING_CONTRACT });
      
      console.log(`${isPartial ? 'Partielles' : 'Vollständiges'} Unstaking:`, unstakeAmountNum, "Token");
      
      let unstakeTx;
      
      if (isPartial) {
        // Verwende unstakePartial Funktion
        unstakeTx = prepareContractCall({
          contract: staking,
          method: "function unstakePartial(uint256)",
          params: [BigInt(unstakeAmountNum)]
        });
      } else {
        // Verwende unstake Funktion (komplett)
        unstakeTx = prepareContractCall({
          contract: staking,
          method: "function unstake()",
          params: []
        });
      }
      
      await new Promise<void>((resolve, reject) => {
        sendTransaction(unstakeTx, {
          onSuccess: () => {
            console.log(`${isPartial ? 'Partielles' : 'Vollständiges'} Unstaking erfolgreich`);
            setTxStatus("success");
            
            // Callback für Parent-Komponente
            if (onStakeChanged) {
              onStakeChanged();
            }
            
            // Stake-Info aktualisieren
            setTimeout(() => {
              fetchStakeInfo();
            }, 2000); // Längere Wartezeit für Blockchain-Bestätigung
            
            setTimeout(() => setTxStatus(null), 3000);
            resolve();
          },
          onError: (error) => {
            console.error(`${isPartial ? 'Partielles' : 'Vollständiges'} Unstaking fehlgeschlagen:`, error);
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
            setTimeout(() => setTxStatus(null), 3000);
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

  // Reward Rate formatieren - Contract gibt direkte Werte zurück (10 = 10%)
  const formatRewardRate = (rate: number) => {
    return (rate / 100).toFixed(2);
  };

  // Hilfsfunktion für den User-Reward pro Woche
  const getUserWeeklyReward = () => {
    const stakedNum = parseInt(staked) || 0;
    return ((stakedNum * currentRewardRate) / 100).toFixed(2);
  };

  // Hilfsfunktion: Berechne korrekte Zeit für Claims basierend auf gestaketen Token
  const calculateCorrectClaimTime = (stakedAmount: number, currentRewardRate: number, minClaimAmount: number): number => {
    if (!stakedAmount || !currentRewardRate || !minClaimAmount) return 0;
    
    // Vereinfachte, mathematisch korrekte Berechnung
    const weeklyReward = (stakedAmount * currentRewardRate) / 100; // D.FAITH pro Woche
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
            
            <div className="space-y-6">
              {/* Contract Übersicht */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700">
                <h4 className="font-semibold text-amber-400 mb-3">Contract Übersicht</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Contract Name:</span>
                    <div className="text-zinc-300 font-mono">WeeklyTokenStaking</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Network:</span>
                    <div className="text-zinc-300">Base Chain (8453)</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Staking Token:</span>
                    <div className="text-zinc-300">D.INVEST (0 Decimals)</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Reward Token:</span>
                    <div className="text-zinc-300">D.FAITH (2 Decimals)</div>
                  </div>
                </div>
              </div>

              {/* Reward System */}
              <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-700/50">
                <h4 className="font-semibold text-blue-400 mb-3">Reward System</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Berechnungsweise:</span>
                    <div className="text-zinc-300">Kontinuierliche Berechnung pro Sekunde</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Aktuelle Stufe:</span>
                    <div className="text-blue-400 font-semibold">Stufe {currentStage} - {(currentRewardRate / 100).toFixed(2)} D.FAITH pro D.INVEST pro Woche</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Mindest-Claim:</span>
                    <div className="text-zinc-300">{minClaimAmount} D.FAITH</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Total verteilt:</span>
                    <div className="text-zinc-300">{totalRewardsDistributed} D.FAITH</div>
                  </div>
                </div>
              </div>

              {/* Reward Stufen */}
              <div className="bg-green-800/20 rounded-xl p-4 border border-green-700/50">
                <h4 className="font-semibold text-green-400 mb-3">Reward Stufen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 1 (0-10.000 D.FAITH):</span>
                    <span className="text-green-400">0.10 D.FAITH pro D.INVEST/Woche</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 2 (10.000-20.000 D.FAITH):</span>
                    <span className="text-green-400">0.05 D.FAITH pro D.INVEST/Woche</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 3 (20.000-40.000 D.FAITH):</span>
                    <span className="text-green-400">0.03 D.FAITH pro D.INVEST/Woche</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 4 (40.000-60.000 D.FAITH):</span>
                    <span className="text-green-400">0.02 D.FAITH pro D.INVEST/Woche</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stufe 5+ (60.000+ D.FAITH):</span>
                    <span className="text-green-400">0.01 D.FAITH pro D.INVEST/Woche</span>
                  </div>
                </div>
              </div>

              {/* Regeln & Bedingungen */}
              <div className="bg-orange-800/20 rounded-xl p-4 border border-orange-700/50">
                <h4 className="font-semibold text-orange-400 mb-3">Regeln & Bedingungen</h4>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div>• <strong>Mindest-Staking-Zeit:</strong> 7 Tage (1 Woche)</div>
                  <div>• <strong>Rewards:</strong> Kontinuierliche Berechnung pro Sekunde</div>
                  <div>• <strong>Unstaking:</strong> Vollständig oder teilweise möglich</div>
                  <div>• <strong>Partielles Unstaking:</strong> Sie können einen gewünschten Betrag unstaken</div>
                  <div>• <strong>Automatischer Claim:</strong> Beim Unstaking werden alle Rewards automatisch ausgezahlt</div>
                  <div>• <strong>Sicherheit:</strong> ReentrancyGuard & Pausable Contract</div>
                </div>
              </div>

              {/* Live Stats */}
              <div className="bg-purple-800/20 rounded-xl p-4 border border-purple-700/50">
                <h4 className="font-semibold text-purple-400 mb-3">Live Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Total Staked:</span>
                    <div className="text-purple-400 font-semibold">{totalStakedTokens} D.INVEST</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Active Users:</span>
                    <div className="text-purple-400 font-semibold">{userCount}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Rewards Distributed:</span>
                    <div className="text-purple-400 font-semibold">{totalRewardsDistributed} D.FAITH</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Current Stage:</span>
                    <div className="text-purple-400 font-semibold">Stufe {currentStage}</div>
                  </div>
                </div>
              </div>

              {/* Contract Adressen */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700">
                <h4 className="font-semibold text-amber-400 mb-3">Contract Adressen</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Staking Contract:</span>
                    <div className="text-zinc-300 font-mono break-all">{STAKING_CONTRACT}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">D.FAITH Token:</span>
                    <div className="text-zinc-300 font-mono break-all">{DFAITH_TOKEN}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">D.INVEST Token:</span>
                    <div className="text-zinc-300 font-mono break-all">{DINVEST_TOKEN}</div>
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
              {(currentRewardRate / 100).toFixed(2)} D.FAITH pro D.INVEST pro Woche
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
                {!canClaim && nextClaimTimestamp > 0 
                  ? `Nächster Claim in: ${formatTime(nextClaimTimestamp)}`
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
           !canClaim && nextClaimTimestamp > 0 ? `Warten: ${formatTime(nextClaimTimestamp)}` : 
           !canClaim ? `Mindestbetrag: ${minClaimAmount} D.FAITH` : 
           "Belohnungen einfordern"}
        </Button>
        {/* Status-Meldungen */}
        {(txStatus === "success" || txStatus === "error" || txStatus === "pending") && (
          <div className={`mt-3 p-3 rounded-lg text-center text-sm font-medium border ${
            txStatus === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" :
            txStatus === "error" ? "bg-red-500/20 text-red-400 border-red-500/30" :
            txStatus === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
            ""
          }`}>
            <div className="flex items-center justify-center gap-2">
              {txStatus === "pending" && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              )}
              <span>
                {txStatus === "success" && "✅ Belohnungen erfolgreich eingefordert!"}
                {txStatus === "error" && "❌ Fehler beim Einfordern der Belohnungen!"}
                {txStatus === "pending" && "⏳ Belohnungen werden eingefordert..."}
              </span>
            </div>
          </div>
        )}
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
                {/* Reward pro Woche nach Contract-Logik: (amount * rate) / 100 */}
                {(() => {
                  const amount = parseInt(stakeAmount);
                  const rate = currentRewardRate;
                  if (isNaN(amount) || isNaN(rate)) return "-";
                  const reward = (amount * rate) / 100;
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
                    console.log("⏳ Wöchentlicher Reward:", (amount * rate) / 100, "D.FAITH");
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

        {/* Status kompakt als Info-Box */}
        {(txStatus === "success" || txStatus === "error" || txStatus === "pending" || txStatus === "approving" || txStatus === "staking") && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium border ${
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
                {txStatus === "success" && "✅ Transaktion erfolgreich abgeschlossen!"}
                {txStatus === "error" && "❌ Transaktion fehlgeschlagen! Bitte versuchen Sie es erneut."}
                {txStatus === "pending" && "⏳ Transaktion wird verarbeitet..."}
                {txStatus === "approving" && "🔐 Token-Genehmigung wird erteilt..."}
                {txStatus === "staking" && "🔒 Staking-Vorgang läuft..."}
              </span>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Unstake Interface */}
      {activeTab === "unstake" && (
        <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-xl p-6 border border-zinc-700 space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-xs">⚠</span>
              </div>
              <div className="text-sm text-zinc-300">
                <div className="font-medium">Unstaking Optionen</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Gestakt: {staked} D.INVEST Token.
                  Unstaking ist nur nach mindestens 7 Tagen möglich.
                  {!canUnstake && timeUntilUnstake > 0 && (
                    <span className="block text-orange-400 mt-1">
                      Unstaking möglich in: {formatTime(timeUntilUnstake)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {staked === "0" && (
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
          )}

          {/* Unstaking Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partial Unstaking */}
            <Button 
              className="w-full bg-orange-700/50 hover:bg-orange-600/50 text-orange-300 font-bold py-3 rounded-xl border border-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={staked === "0" || loading || txStatus === "pending" || !canUnstake}
              onClick={() => handleUnstake(true)}
            >
              <FaUnlock className="inline mr-2" />
              {txStatus === "pending" && "Wird verarbeitet..."}
              {!txStatus && staked === "0" && "Keine Token gestaked"}
              {!txStatus && staked !== "0" && !canUnstake && `Warten: ${formatTime(timeUntilUnstake)}`}
              {!txStatus && staked !== "0" && canUnstake && "Teilweise unstaken"}
            </Button>

            {/* Full Unstaking */}
            <Button 
              className="w-full bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 font-bold py-3 rounded-xl border border-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={staked === "0" || loading || txStatus === "pending" || !canUnstake}
              onClick={() => handleUnstake(false)}
            >
              <FaUnlock className="inline mr-2" />
              {txStatus === "pending" && "Wird verarbeitet..."}
              {!txStatus && staked === "0" && "Keine Token gestaked"}
              {!txStatus && staked !== "0" && !canUnstake && `Warten: ${formatTime(timeUntilUnstake)}`}
              {!txStatus && staked !== "0" && canUnstake && `Alle ${staked} D.INVEST unstaken`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
