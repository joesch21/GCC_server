// server/index.js
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/verify-wallet', async (req, res) => {
  const { walletAddress, signature } = req.body;
  
  // Static message for demonstration.
  // For production, use a dynamic nonce or challenge message.
  const message = "GCC Membership Verification";

  try {
    // Recover the address that signed the message
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Compare the recovered address with the provided wallet address
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
  console.log(`Server running on port ${PORT}`);
});
