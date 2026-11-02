export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error("Razorpay keys missing in Vercel Environment Variables");
    }

    // Razorpay authentication set up karna
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    // Direct Razorpay API ko request bhejna (Bina kisi package ke)
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 399, // 399 cents = $3.99
        currency: req.body.currency || 'USD',
        receipt: `rcpt_${req.body.userId || 'guest'}`
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
       throw new Error(data.error?.description || "Order creation failed");
    }

    res.status(200).json({ success: true, ...data });
  } catch (error) {
    console.error("Razorpay Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
