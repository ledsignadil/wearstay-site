import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: 399, // $3.99 payment
      currency: req.body.currency || 'USD',
      receipt: `rcpt_${req.body.userId || 'guest'}`
    });
    
    res.status(200).json({ success: true, ...order });
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
