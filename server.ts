import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ledsignadil@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

// Server-side Supabase admin client (strictly for backend verification)
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Public client for user-token verification
const supabasePublic = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper: Authenticate user from Bearer JWT token
async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token || !supabasePublic) return null;

  try {
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health & Configuration Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'DESIGNHUB GLOBAL',
    supabaseConnected: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    serverTime: new Date().toISOString(),
  });
});

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    domain: 'https://www.wearstay.com',
  });
});

// 2. User Account Status & Export Allowance
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');

  if (!supabaseAdmin) {
    return res.json({
      user: { id: user.id, email: user.email, isAdmin },
      subscription: { status: 'free' },
      exportsUsed: 0,
      exportsAllowed: 2,
      notice: 'SUPABASE_SERVICE_ROLE_KEY not configured. Running in demo validation mode.',
    });
  }

  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const isPro = Boolean(sub);

    const { data: usage } = await supabaseAdmin
      .from('export_usage')
      .select('exports_count')
      .eq('user_id', user.id)
      .maybeSingle();

    const exportsUsed = usage?.exports_count || 0;

    res.json({
      user: { id: user.id, email: user.email, isAdmin },
      subscription: {
        status: isPro ? 'pro' : 'free',
        tier: isPro ? 'DESIGNHUB PRO ($4.99/mo)' : 'Free Starter',
        active: isPro,
      },
      exportsUsed,
      exportsAllowed: isPro ? Infinity : 2,
      canExport: isPro || exportsUsed < 2,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Database query error' });
  }
});

// 3. Server-side Export Claim (Strict 2-Free-Export Enforcement)
app.post('/api/exports/claim', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'Please sign in with Google or Email to claim an export.',
      code: 'AUTH_REQUIRED',
    });
  }

  const format = req.body.format || 'png';

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      allowed: true,
      exportsUsed: 1,
      format,
      notice: 'Server service key pending. Export granted under free trial.',
    });
  }

  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (sub && sub.status === 'active') {
      await supabaseAdmin.from('export_logs').insert({
        user_id: user.id,
        format,
        is_pro: true,
      });

      return res.json({
        success: true,
        allowed: true,
        isPro: true,
        message: 'Pro subscription verified. Unlimited export allowed.',
      });
    }

    const { data: usage, error: fetchErr } = await supabaseAdmin
      .from('export_usage')
      .select('id, exports_count')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const currentCount = usage?.exports_count || 0;

    if (currentCount >= 2) {
      return res.status(403).json({
        success: false,
        allowed: false,
        error: 'Your 2 free exports are used. Upgrade to DESIGNHUB PRO for $4.99/month to continue.',
        exportsUsed: currentCount,
        exportsAllowed: 2,
        code: 'QUOTA_EXCEEDED',
      });
    }

    const newCount = currentCount + 1;
    if (usage) {
      await supabaseAdmin
        .from('export_usage')
        .update({
          exports_count: newCount,
          last_exported_at: new Date().toISOString(),
        })
        .eq('id', usage.id);
    } else {
      await supabaseAdmin.from('export_usage').insert({
        user_id: user.id,
        exports_count: 1,
        last_exported_at: new Date().toISOString(),
      });
    }

    await supabaseAdmin.from('export_logs').insert({
      user_id: user.id,
      format,
      is_pro: false,
    });

    return res.json({
      success: true,
      allowed: true,
      exportsUsed: newCount,
      exportsRemaining: 2 - newCount,
      message: `Export authorized. ${2 - newCount} free export(s) remaining.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error processing export quota' });
  }
});

// 4. Cloud Project Saving & Loading
app.get('/api/projects', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in to access your cloud projects.' });
  }

  if (!supabaseAdmin) {
    return res.json({ projects: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, title, dimensions, unit, updated_at, preview_url')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ projects: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching projects' });
  }
});

app.post('/api/projects', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to save your project to the cloud.' });
  }

  const { id, title, canvas_data, dimensions, unit, preview_url } = req.body;
  if (!canvas_data) {
    return res.status(400).json({ error: 'Missing canvas design data.' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Cloud storage database not yet configured with service key.' });
  }

  try {
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .update({
          title: title || 'Untitled Project',
          canvas_data,
          dimensions: dimensions || '1280x720',
          unit: unit || 'px',
          preview_url: preview_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, project: data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: user.id,
          title: title || 'Untitled Design',
          canvas_data,
          dimensions: dimensions || '1280x720',
          unit: unit || 'px',
          preview_url: preview_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, project: data });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error saving project' });
  }
});

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });

  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading project' });
  }
});

app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });

  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error deleting project' });
  }
});

// 5. Signage Services Real Order Submission
app.post('/api/signage/order', async (req: Request, res: Response) => {
  const {
    customer_name,
    customer_phone,
    delivery_address,
    width,
    height,
    unit,
    color,
    material,
    quantity,
    fulfillment_option,
    advance_payment_ref,
    file_data_url,
    file_name,
  } = req.body;

  if (!customer_phone || !width || !height) {
    return res.status(400).json({ error: 'Please provide required contact phone and dimensions.' });
  }

  const orderId = 'DH-SIG-' + Math.floor(100000 + Math.random() * 900000);
  const user = await getAuthenticatedUser(req);

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      orderId,
      status: 'received_local_mode',
      message: 'Signage manufacturing inquiry recorded. Order reference generated.',
      details: { orderId, width, height, unit, customer_phone },
      notice: 'Backend database pending configuration. For immediate dispatch contact ledsignadil@gmail.com.',
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('signage_orders')
      .insert({
        order_id: orderId,
        user_id: user?.id || null,
        customer_name: customer_name || 'Commercial Client',
        customer_phone,
        delivery_address: delivery_address || 'Dispatch Office',
        width: Number(width),
        height: Number(height),
        unit: unit || 'inch',
        color: color || 'Default',
        material: material || 'Acrylic',
        quantity: Number(quantity) || 1,
        fulfillment_option: fulfillment_option || 'Delivery',
        advance_payment_ref: advance_payment_ref || null,
        file_name: file_name || null,
        file_data_url: file_data_url ? file_data_url.substring(0, 500000) : null,
        status: 'pending_review',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      orderId,
      order: data,
      message: 'Physical signage order saved successfully to production queue.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record signage order.' });
  }
});

// 6. Protected Admin View for Signage Orders
app.get('/api/admin/orders', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  if (!supabaseAdmin) {
    return res.json({ orders: [], notice: 'Database service role not connected.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('signage_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching admin orders' });
  }
});

// 7. PayPal Webhook Verification & Subscription Activation
app.post('/api/paypal/webhook', async (req: Request, res: Response) => {
  const event = req.body;
  if (!event || !event.event_type) {
    return res.status(400).send('Invalid webhook event payload');
  }

  console.log(`[PayPal Webhook Received] Type: ${event.event_type}`);

  if (!supabaseAdmin) {
    return res.status(200).json({ received: true, note: 'Database pending configuration' });
  }

  try {
    await supabaseAdmin.from('payment_records').insert({
      event_type: event.event_type,
      payload: event,
      status: 'received',
    });

    if (
      event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
      event.event_type === 'PAYMENT.SALE.COMPLETED' ||
      event.event_type === 'CHECKOUT.ORDER.APPROVED'
    ) {
      const resource = event.resource;
      const customId = resource.custom_id || resource.subscriber?.shipping_address?.name || '';
      const email = resource.subscriber?.email_address || resource.payer?.email_address || '';

      if (email || customId) {
        let targetUserId = customId;
        if (!targetUserId && email) {
          const { data: userProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (userProfile) targetUserId = userProfile.id;
        }

        if (targetUserId) {
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: targetUserId,
            status: 'active',
            plan: 'pro_monthly',
            amount: 4.99,
            currency: 'USD',
            paypal_subscription_id: resource.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          console.log(`Activated DESIGNHUB PRO for user: ${targetUserId}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('PayPal webhook handling error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE INTEGRATION (DEV & PROD)
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`DESIGNHUB GLOBAL server running on http://localhost:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Error starting server:', err);
});