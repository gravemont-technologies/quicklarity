// API client utilities for frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function submitIntake(payload) {
  try {
    const res = await fetch(`${API_URL}/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit intake');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Submit intake error:', error);
    throw error;
  }
}

export async function pollStatus(jobId) {
  try {
    const res = await fetch(`${API_URL}/status/${jobId}`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch status');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Poll status error:', error);
    throw error;
  }
}

export async function submitRating(jobId, rating, feedback) {
  try {
    const res = await fetch(`${API_URL}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ jobId, rating, feedback }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to submit rating');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Submit rating error:', error);
    throw error;
  }
}

export async function createCheckoutSession(planId) {
  try {
    const res = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ planId }),
    });
    
    const data = await res.json();
    return data.url;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

