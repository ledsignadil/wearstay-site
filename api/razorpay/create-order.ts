export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error("Razorpay keys missing in Vercel");
    }

    const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    // फ्रंटएंड से कस्टमर का चुना हुआ अमाउंट और करेंसी लेना 
    // (अगर फ्रंटएंड करेंसी नहीं भेजता, तो डिफ़ॉल्ट 'INR' रुपये मान लेगा)
    const planAmount = req.body.amount;
    const planCurrency = req.body.currency || 'INR'; 

    if (!planAmount) {
        throw new Error("Amount is missing. Please select a plan.");
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: planAmount,         // अब 99, 299, 599 ऑटोमैटिक आएगा
        currency: planCurrency,     // अब 'INR' (रुपये) में पेमेंट होगी
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
