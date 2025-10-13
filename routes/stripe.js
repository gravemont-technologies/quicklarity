// Stripe webhook handler and checkout
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../lib/supabaseClient');
const { trackEvent } = require('../lib/posthogClient');

// Webhook handler (raw body required for signature verification)
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  
  // Get Clerk ID from Stripe metadata (set during checkout)
  const customer = await stripe.customers.retrieve(customerId);
  const clerkId = customer.metadata.clerk_id;
  
  if (!clerkId) {
    console.error('No clerk_id in customer metadata');
    return;
  }
  
  // Update founder record
  const { error } = await supabase
    .from('founders')
    .update({
      subscription_status: subscription.status,
      role: subscription.status === 'active' ? 'paid' : 'free',
      permissions: {
        phone_verified: customer.metadata.phone_verified === 'true',
        max_docs: subscription.status === 'active' ? 3 : 1,
        priority_queue: subscription.status === 'active',
      },
    })
    .eq('clerk_id', clerkId);
  
  if (error) {
    console.error('Failed to update founder:', error);
    return;
  }
  
  // Track event
  await trackEvent({
    distinctId: clerkId,
    event: 'subscription_activated',
    properties: {
      subscription_id: subscription.id,
      status: subscription.status,
      plan: subscription.items.data[0]?.price.id,
    },
  });
  
  console.log(`Updated subscription for ${clerkId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const clerkId = customer.metadata.clerk_id;
  
  if (!clerkId) return;
  
  // Downgrade to free
  await supabase
    .from('founders')
    .update({
      subscription_status: 'cancelled',
      role: 'free',
      permissions: {
        max_docs: 1,
        priority_queue: false,
      },
    })
    .eq('clerk_id', clerkId);
  
  console.log(`Subscription cancelled for ${clerkId}`);
}

module.exports = router;

