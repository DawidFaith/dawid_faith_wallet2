// Vereinfachte Uniswap Integration für bessere Performance
export interface SwapQuote {
  amountOut: string;
  amountOutMin: string;
  route: any;
  methodParameters?: {
    calldata: string;
    value: string;
    to: string;
  };
  gasEstimate: string;
  gasPrice: string;
  priceImpact: string;
}

export interface SwapParams {
  amountIn: string; // in ETH (human readable, z.B. "0.1")
  slippageTolerance: number; // in percent, z.B. 1 für 1%
  recipient: string; // wallet address
  deadline?: number; // Unix timestamp, optional
}

// Fallback: verwende eine vereinfachte API für Quotes (1inch oder 0x API)
export async function getUniswapQuote(params: SwapParams): Promise<SwapQuote | null> {
  try {
    console.log("=== Getting Quote via 1inch API as Uniswap fallback ===");
    console.log("Amount In ETH:", params.amountIn);
    
    const DFAITH_TOKEN = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1";
    const ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // 1inch ETH representation
    
    // ETH zu Wei umwandeln
    const amountInWei = (parseFloat(params.amountIn) * Math.pow(10, 18)).toString();
    
    // 1inch Quote API für Base Chain
    const quoteParams = new URLSearchParams({
      src: ETH_TOKEN,
      dst: DFAITH_TOKEN,
      amount: amountInWei,
      from: params.recipient,
      slippage: params.slippageTolerance.toString(),
      disableEstimate: "true"
    });
    
    const quoteUrl = `https://api.1inch.dev/swap/v6.0/8453/quote?${quoteParams}`;
    
    const response = await fetch(quoteUrl, {
      headers: {
        'accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error("1inch API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.dstAmount) {
      console.error("Invalid response from 1inch API");
      return null;
    }
    
    // D.FAITH Amount (mit 2 Dezimalstellen)
    const amountOut = (Number(data.dstAmount) / Math.pow(10, 2)).toFixed(2);
    const amountOutMin = (Number(data.dstAmount) * (1 - params.slippageTolerance / 100) / Math.pow(10, 2)).toFixed(2);
    
    console.log("Quote received:", amountOut, "D.FAITH");
    
    return {
      amountOut: amountOut,
      amountOutMin: amountOutMin,
      route: data,
      gasEstimate: data.gas || "300000",
      gasPrice: "1000000000", // 1 Gwei
      priceImpact: "0.50" // Geschätzt
    };
    
  } catch (error) {
    console.error("Error getting quote:", error);
    return null;
  }
}

// Vereinfachte Swap-Ausführung
export async function executeUniswapSwap(
  quote: SwapQuote, 
  thirdwebSendTransaction: (transaction: any) => void
): Promise<void> {
  try {
    console.log("=== Executing swap via 1inch API ===");
    
    const DFAITH_TOKEN = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1";
    const ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    
    // Hole Swap-Daten von 1inch
    const swapParams = new URLSearchParams({
      src: ETH_TOKEN,
      dst: DFAITH_TOKEN,
      amount: quote.route.fromTokenAmount,
      from: quote.route.from || "0x0000000000000000000000000000000000000000",
      slippage: "1",
      disableEstimate: "true"
    });
    
    const swapUrl = `https://api.1inch.dev/swap/v6.0/8453/swap?${swapParams}`;
    
    const response = await fetch(swapUrl, {
      headers: {
        'accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`1inch swap API error: ${response.status}`);
    }
    
    const swapData = await response.json();
    
    if (!swapData.tx) {
      throw new Error("No transaction data received from 1inch");
    }
    
    // Transaction über thirdweb senden
    const transaction = {
      to: swapData.tx.to,
      data: swapData.tx.data,
      value: swapData.tx.value,
      gasLimit: swapData.tx.gas || "300000"
    };
    
    console.log("Sending transaction via thirdweb:", transaction);
    thirdwebSendTransaction(transaction);
    
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}

// Vereinfachte Preis-Abfrage
export async function getDFAITHPriceFromUniswap(): Promise<number | null> {
  try {
    console.log("Fetching D.FAITH price via 1inch API...");
    
    const DFAITH_TOKEN = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1";
    const ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    
    // 1 ETH in Wei
    const oneEthInWei = Math.pow(10, 18).toString();
    
    const quoteParams = new URLSearchParams({
      src: ETH_TOKEN,
      dst: DFAITH_TOKEN,
      amount: oneEthInWei,
      from: "0x0000000000000000000000000000000000000000",
      slippage: "1",
      disableEstimate: "true"
    });
    
    const quoteUrl = `https://api.1inch.dev/swap/v6.0/8453/quote?${quoteParams}`;
    
    const response = await fetch(quoteUrl, {
      headers: {
        'accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error("1inch price API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.dstAmount) {
      console.error("Invalid price response from 1inch API");
      return null;
    }
    
    // D.FAITH per ETH
    const dfaithPerEth = Number(data.dstAmount) / Math.pow(10, 2); // D.FAITH hat 2 Dezimalstellen
    console.log("D.FAITH per ETH from 1inch:", dfaithPerEth);
    
    // ETH per D.FAITH (umgekehrt)
    const ethPerDfaith = 1 / dfaithPerEth;
    console.log("ETH per D.FAITH:", ethPerDfaith);
    
    return ethPerDfaith;
    
  } catch (error) {
    console.error("Error fetching D.FAITH price:", error);
    return null;
  }
}
