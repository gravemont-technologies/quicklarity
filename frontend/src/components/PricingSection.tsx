import { useState } from 'react';
import { PRICING_PLANS, ANNUAL_PRICING } from '../data/pricing';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const plans = isAnnual ? ANNUAL_PRICING : PRICING_PLANS;

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (planName === 'Starter') {
      // Free plan - redirect to signup
      window.location.href = '/signup';
      return;
    }

    if (planName === 'Enterprise') {
      // Contact sales
      window.location.href = 'mailto:sales@quicklarity.com';
      return;
    }

    // Create Stripe checkout session
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <section className="pricing-section py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your execution speed
          </p>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={!isAnnual ? 'font-semibold' : 'text-gray-500'}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAnnual ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={isAnnual ? 'font-semibold' : 'text-gray-500'}>
              Annual
              <span className="ml-2 text-sm text-green-600 font-semibold">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 bg-white transition-all hover:shadow-2xl ${
                plan.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">
                    /{isAnnual ? 'mo' : 'month'}
                  </span>
                </div>
                {isAnnual && plan.price > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Billed ${plan.price * 12}/year
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.priceId, plan.name)}
                className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">Trusted by founders at</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <span className="text-2xl font-bold">Y Combinator</span>
            <span className="text-2xl font-bold">500 Startups</span>
            <span className="text-2xl font-bold">Techstars</span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <details className="bg-white p-6 rounded-lg border">
              <summary className="font-semibold cursor-pointer">
                What's included in a strategic plan?
              </summary>
              <p className="mt-3 text-gray-600">
                Each plan includes: Executive summary, Top 5 prioritized tasks with rationale,
                4-8 week execution schedule, risk analysis & mitigation, and actionable next steps.
                Delivered via Notion with calendar events.
              </p>
            </details>
            <details className="bg-white p-6 rounded-lg border">
              <summary className="font-semibold cursor-pointer">
                How does the AI work?
              </summary>
              <p className="mt-3 text-gray-600">
                We use GPT-5 (the latest AI) with rule-based task scoring. Free users get
                GPT-5 Mini quality, paid users get full GPT-5 for best-in-class strategic advice.
                Cost per plan: ~$0.005 (less than a penny!)
              </p>
            </details>
            <details className="bg-white p-6 rounded-lg border">
              <summary className="font-semibold cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! Cancel anytime from your dashboard. No questions asked.
                You'll retain access until the end of your billing period.
              </p>
            </details>
            <details className="bg-white p-6 rounded-lg border">
              <summary className="font-semibold cursor-pointer">
                What's your refund policy?
              </summary>
              <p className="mt-3 text-gray-600">
                14-day money-back guarantee. If you're not satisfied with your first strategic plan,
                we'll refund you in full. No questions asked.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

