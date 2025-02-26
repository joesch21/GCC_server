// server/index.js
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers'); // Ethers v6 style

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS + JSON parsing
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------
   1) GCC Price Endpoint (DexScreener & BscScan)
------------------------------------------------------------------ */
app.get('/api/gcc/price', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    // DexScreener
    const DEXSCREENER_PAIR = '0x3d32d359bdad07C587a52F8811027675E4f5A833';
    const dexScreenerUrl = `https://api.dexscreener.com/latest/dex/pairs/bsc/${DEXSCREENER_PAIR}`;

    // BscScan
    const GCC_CONTRACT = '0x092aC429b9c3450c9909433eB0662c3b7c13cF9A';
    const BSCSCAN_API_KEY = 'HVYMP4JE3IHP4RMF5EYZD2RCSDBZHS4CQD';
    const bscScanUrl = `https://api.bscscan.com/api?module=stats&action=tokenprice&contractaddress=${GCC_CONTRACT}&apikey=${BSCSCAN_API_KEY}`;

    // Fetch DexScreener
    const dexResponse = await fetch(dexScreenerUrl);
    const dexData = await dexResponse.json();

    // Fetch BscScan
    const bscResponse = await fetch(bscScanUrl);
    const bscData = await bscResponse.json();

    // Extract prices
    const dexPrice = dexData?.pairs?.[0]?.priceUsd || null;
    const bscPrice = bscData?.result?.ethusd || null;

    if (!dexPrice && !bscPrice) {
      return res.status(404).json({
        success: false,
        message: 'GCC price not found',
      });
    }

    return res.json({
      success: true,
      dexPrice: dexPrice || 'Not available',
      bscPrice: bscPrice || 'Not available',
    });
  } catch (error) {
    console.error('Error fetching GCC price:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching GCC price',
      error: error.message,
    });
  }
});

/* ------------------------------------------------------------------
   2) GCC Volume Endpoint (Data from Flask)
------------------------------------------------------------------ */
app.get('/api/gcc/volume', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    // Flask endpoint returning JSON
    const flaskUrl = 'https://gcc24hrvolume.onrender.com/api/gcc_volume';
    const flaskResponse = await fetch(flaskUrl);

    if (!flaskResponse.ok) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch data from Flask',
      });
    }

    const data = await flaskResponse.json();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching GCC volume:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message,
    });
  }
});

/* ------------------------------------------------------------------
   3) GCC Balance + USD & AUD Endpoint (Ethers v6 for BSC)
------------------------------------------------------------------ */
app.get('/api/gcc/balance/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const fetch = (await import('node-fetch')).default;

    // 1) On-chain GCC Balance
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const contractAddress = '0x092aC429b9c3450c9909433eB0662c3b7c13cF9A'; // GCC token contract
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const balanceBN = await contract.balanceOf(walletAddress);
    const balanceTokens = parseFloat(ethers.formatUnits(balanceBN, 18));

    // 2) Fetch GCC price in USD from DexScreener
    const DEXSCREENER_PAIR = '0x3d32d359bdad07C587a52F8811027675E4f5A833';
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/pairs/bsc/${DEXSCREENER_PAIR}`);
    const dexData = await dexResponse.json();
    const priceUsd = parseFloat(dexData?.pairs?.[0]?.priceUsd || 0);

    // total value in USD
    const totalUsdValue = balanceTokens * priceUsd;

    // 3) Get USD->AUD exchange rate (exchangerate.host)
    const fxResponse = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=AUD');
    const fxData = await fxResponse.json();
    const usdToAud = parseFloat(fxData?.rates?.AUD || 1.5);

    // total value in AUD
    const totalAudValue = totalUsdValue * usdToAud;

    return res.json({
      success: true,
      walletAddress,
      balanceTokens,   // e.g. 1000
      priceUsd,        // e.g. 0.02
      totalUsdValue,   // e.g. 20
      totalAudValue,   // e.g. 30
      usdToAud,        // e.g. 1.5
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching balance',
      error: error.message,
    });
  }
});

// ------------------------------------------------------------------
// Start the server
// ------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ GCC Node API running on port ${PORT}`);
});
