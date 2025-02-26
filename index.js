// server/index.js
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 1️⃣ Endpoint to fetch GCC price from DexScreener & BscScan
app.get('/api/gcc/price', async (req, res) => {
  try {
    // Dynamically import node-fetch in CommonJS
    const fetch = (await import('node-fetch')).default;

    // DexScreener API (Replace with your correct GCC pair if needed)
    const DEXSCREENER_PAIR = "0x3d32d359bdad07C587a52F8811027675E4f5A833"; 
    const dexScreenerUrl = `https://api.dexscreener.com/latest/dex/pairs/bsc/${DEXSCREENER_PAIR}`;

    // BscScan API (Replace contract & API key with your own if needed)
    const GCC_CONTRACT = "0x092aC429b9c3450c9909433eB0662c3b7c13cF9A";
    const BSCSCAN_API_KEY = "HVYMP4JE3IHP4RMF5EYZD2RCSDBZHS4CQD";
    const bscScanUrl = `https://api.bscscan.com/api?module=stats&action=tokenprice&contractaddress=${GCC_CONTRACT}&apikey=${BSCSCAN_API_KEY}`;

    // Fetch from DexScreener
    const dexResponse = await fetch(dexScreenerUrl);
    const dexData = await dexResponse.json();

    // Fetch from BscScan
    const bscResponse = await fetch(bscScanUrl);
    const bscData = await bscResponse.json();

    // Extract prices
    const dexPrice = dexData?.pairs?.[0]?.priceUsd || null;
    const bscPrice = bscData?.result?.ethusd || null;

    // If both are null, no price found
    if (!dexPrice && !bscPrice) {
      return res.status(404).json({ success: false, message: 'GCC price not found' });
    }

    return res.json({
      success: true,
      dexPrice: dexPrice || "Not available",
      bscPrice: bscPrice || "Not available"
    });
  } catch (error) {
    console.error('Error fetching GCC price:', error);
    return res.status(500).json({ success: false, message: 'Error fetching GCC price', error: error.message });
  }
});

// 2️⃣ Endpoint to fetch advanced data from your Flask site
// index.js (Node)
app.get('/api/gcc/volume', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const flaskUrl = 'https://your-flask.onrender.com/api/gcc_volume';

    const response = await fetch(flaskUrl);
    if (!response.ok) {
      return res.status(500).json({ success: false, message: 'Failed to fetch data from Flask' });
    }

    const data = await response.json();
    // data now includes "gccTradedVolume", "rewardTokenHolders", etc.
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching data', error: error.message });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`✅ GCC Node API running on port ${PORT}`);
});
