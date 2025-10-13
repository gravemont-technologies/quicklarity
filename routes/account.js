// Account management routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../lib/supabaseClient');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Stripe checkout session for Quicklarity
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    
    // Get or create Stripe customer
    const { data: founder } = await supabase
      .from('founders')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    
    if (!founder) {
      return res.status(404).json({ error: 'Founder not found' });
    }
    
    // Check if phone verified (from Clerk)
    const phoneVerified = founder.phone_verified || false;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PAID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: founder.email,
      metadata: {
        clerk_id: clerkId,
        phone_verified: phoneVerified.toString(),
      },
    });
    
    res.json({ url: session.url });
    
  } catch (error) {
    next(error);
  }
});

// Delete account (GDPR compliance)
router.post('/deleteAccount', requireAuth, async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    
    // Find founder
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
    
    if (!founder) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Delete all related data (cascade will handle jobs, ratings, etc.)
    const { error } = await supabase
      .from('founders')
      .delete()
      .eq('id', founder.id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Account deleted successfully' });
    
  } catch (error) {
    next(error);
  }
});

// Submit rating
router.post('/rating', requireAuth, async (req, res, next) => {
  try {
    const { jobId, rating, feedback } = req.body;
    
    if (!jobId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating data' });
    }
    
    const clerkId = req.auth.userId;
    
    // Get founder ID
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
    
    if (!founder) {
      return res.status(404).json({ error: 'Founder not found' });
    }
    
    // Insert rating
    const { error } = await supabase
      .from('ratings')
      .insert({
        founder_id: founder.id,
        job_id: jobId,
        rating,
        feedback: feedback || null,
      });
    
    if (error) throw error;
    
    res.json({ success: true });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;

