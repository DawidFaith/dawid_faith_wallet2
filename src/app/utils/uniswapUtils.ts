// Browser-kompatible Uniswap Utils mit dynamischen Imports
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

// Base Chain Configuration
const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = 'https://mainnet.base.org';

// Token Definitionen für Base Chain
const DFAITH_TOKEN_ADDRESS = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1";
const WETH_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH auf Base

// Dynamische Initialisierung um Server-Side Rendering zu vermeiden
let uniswapInitialized = false;
let router: any = null;
let WETH: any = null;
let DFAITH: any = null;

async function initializeUniswap() {
  if (uniswapInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    // Dynamische Imports für Browser-only
    const [
      { ethers },
      { Token, CurrencyAmount, TradeType, Percent },
      { AlphaRouter, SwapType }
    ] = await Promise.all([
      import('ethers'),
      import('@uniswap/sdk-core'),
      import('@uniswap/smart-order-router')
    ]);

    // Provider Setup für Base Chain (ethers v5 syntax)
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    // Token Instanzen erstellen
    WETH = new Token(
      BASE_CHAIN_ID,
      WETH_TOKEN_ADDRESS,
      18,
      'WETH',
      'Wrapped Ether'
    );

    DFAITH = new Token(
      BASE_CHAIN_ID,
      DFAITH_TOKEN_ADDRESS,
      2, // D.FAITH hat 2 Dezimalstellen
      'DFAITH',
      'Dawid Faith Token'
    );

    // Alpha Router initialisieren
    router = new AlphaRouter({
      chainId: BASE_CHAIN_ID,
      provider: provider
    });

    uniswapInitialized = true;
    console.log("Uniswap SDK initialized successfully");

  } catch (error) {
    console.error("Failed to initialize Uniswap SDK:", error);
    throw error;
  }
}

/**
 * Holt eine Quote für ETH -> D.FAITH Swap von Uniswap
 */
export async function getUniswapQuote(params: SwapParams): Promise<SwapQuote | null> {
  try {
    // Erst Uniswap initialisieren
    await initializeUniswap();
    
    if (!router || !WETH || !DFAITH) {
      throw new Error("Uniswap SDK not properly initialized");
    }

    console.log("=== Uniswap Quote Request ===");
    console.log("Amount In ETH:", params.amountIn);
    console.log("Slippage:", params.slippageTolerance + "%");
    console.log("Recipient:", params.recipient);

    // Dynamische Imports für die aktuellen Funktionen
    const [
      { ethers },
      { CurrencyAmount, TradeType, Percent },
      { SwapType }
    ] = await Promise.all([
      import('ethers'),
      import('@uniswap/sdk-core'),
      import('@uniswap/smart-order-router')
    ]);

    // ETH Amount in Wei umwandeln (ethers v5 syntax)
    const amountInWei = ethers.utils.parseEther(params.amountIn);
    
    // CurrencyAmount für WETH erstellen (da wir mit WETH tauschen)
    const currencyAmountIn = CurrencyAmount.fromRawAmount(
      WETH,
      amountInWei.toString()
    );

    // Slippage als Percent
    const slippageTolerance = new Percent(
      Math.floor(params.slippageTolerance * 100), // z.B. 100 für 1%
      10000 // basis points
    );

    // Deadline (standardmäßig 20 Minuten von jetzt)
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1200;

    console.log("Requesting route from Uniswap...");
    
    // Route von Alpha Router holen
    const route = await router.route(
      currencyAmountIn,
      DFAITH,
      TradeType.EXACT_INPUT,
      {
        recipient: params.recipient,
        slippageTolerance: slippageTolerance,
        deadline: deadline,
        type: SwapType.SWAP_ROUTER_02,
      }
    );

    if (!route) {
      console.error("No route found for ETH -> D.FAITH swap");
      return null;
    }

    console.log("Route found!");
    console.log("Quote:", route.quote.toExact(), "D.FAITH");
    console.log("Price Impact:", route.estimatedGasUsed.toString());

    // Quote-Objekt zurückgeben
    const quote: SwapQuote = {
      amountOut: route.quote.toExact(), // Amount in D.FAITH (human readable)
      amountOutMin: route.quote.multiply(slippageTolerance.invert()).toExact(),
      route: route,
      methodParameters: route.methodParameters ? {
        calldata: route.methodParameters.calldata,
        value: route.methodParameters.value,
        to: route.methodParameters.to
      } : undefined,
      gasEstimate: route.estimatedGasUsed.toString(),
      gasPrice: route.gasPriceWei.toString(),
      priceImpact: route.trade?.priceImpact.toFixed(2) || "0.00"
    };

    return quote;

  } catch (error) {
    console.error("Error getting Uniswap quote:", error);
    return null;
  }
}

/**
 * Führt einen ETH -> D.FAITH Swap über Uniswap aus
 * Benutzt thirdweb für die Transaktion
 */
export async function executeUniswapSwap(
  quote: SwapQuote, 
  thirdwebSendTransaction: (transaction: any) => void
): Promise<void> {
  try {
    if (!quote.methodParameters) {
      throw new Error("No method parameters in quote");
    }

    console.log("=== Executing Uniswap Swap ===");
    console.log("To:", quote.methodParameters.to);
    console.log("Value:", quote.methodParameters.value);
    console.log("Calldata length:", quote.methodParameters.calldata.length);

    // Transaction für thirdweb vorbereiten
    const transaction = {
      to: quote.methodParameters.to,
      data: quote.methodParameters.calldata,
      value: quote.methodParameters.value,
      gasLimit: quote.gasEstimate
    };

    console.log("Sending transaction via thirdweb...");
    
    // Transaktion über thirdweb senden
    thirdwebSendTransaction(transaction);

  } catch (error) {
    console.error("Error executing Uniswap swap:", error);
    throw error;
  }
}

/**
 * Holt den aktuellen D.FAITH Preis in ETH von Uniswap
 */
export async function getDFAITHPriceFromUniswap(): Promise<number | null> {
  try {
    // Erst Uniswap initialisieren
    await initializeUniswap();
    
    if (!router || !WETH || !DFAITH) {
      throw new Error("Uniswap SDK not properly initialized");
    }

    console.log("Fetching D.FAITH price from Uniswap...");
    
    // Dynamische Imports für die aktuellen Funktionen
    const [
      { ethers },
      { CurrencyAmount, TradeType, Percent },
      { SwapType }
    ] = await Promise.all([
      import('ethers'),
      import('@uniswap/sdk-core'),
      import('@uniswap/smart-order-router')
    ]);
    
    // 1 ETH als Input verwenden um Preis zu berechnen (ethers v5 syntax)
    const oneEthInWei = ethers.utils.parseEther("1");
    
    const currencyAmountIn = CurrencyAmount.fromRawAmount(
      WETH,
      oneEthInWei.toString()
    );

    const route = await router.route(
      currencyAmountIn,
      DFAITH,
      TradeType.EXACT_INPUT,
      {
        recipient: "0x0000000000000000000000000000000000000000", // Dummy address für Quote
        slippageTolerance: new Percent(100, 10000), // 1% slippage
        deadline: Math.floor(Date.now() / 1000) + 1200,
        type: SwapType.SWAP_ROUTER_02,
      }
    );

    if (!route) {
      console.error("No route found for price lookup");
      return null;
    }

    // D.FAITH pro ETH
    const dfaithPerEth = parseFloat(route.quote.toExact());
    console.log("D.FAITH per ETH from Uniswap:", dfaithPerEth);
    
    // ETH pro D.FAITH (umgekehrt)
    const ethPerDfaith = 1 / dfaithPerEth;
    console.log("ETH per D.FAITH:", ethPerDfaith);
    
    return ethPerDfaith;

  } catch (error) {
    console.error("Error fetching D.FAITH price from Uniswap:", error);
    return null;
  }
}
