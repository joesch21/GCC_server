const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Add a root route to confirm the server is running
app.get('/', (req, res) => {
  res.send('🚀 GCC Server is live! Backend is working correctly.');
});

// ✅ Wallet verification endpoint
app.post('/api/verify-wallet', async (req, res) => {
  const { walletAddress, signature } = req.body;
  
  const message = "GCC Membership Verification"; // Static message for now

  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
      res.json({ success: true, message: 'Wallet verified successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Signature verification failed' });
    }
  } catch (error) {
    console.error("Error during signature verification:", error);
    res.status(500).json({ success: false, message: 'Error verifying signature', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
