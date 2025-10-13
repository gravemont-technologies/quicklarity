import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Pricing = () => {
  const tiers = [
    {
      name: "Pilot",
      price: "$97",
      period: "one-time",
      description: "Test the engine. One 3-day strategic map + 30-day access.",
      features: [
        "90-second assessment",
        "Upload up to 3 docs",
        "1 strategic map generation",
        "Notion deliverable + calendar invites",
        "Email support",
        "Money-back if not actionable within 24hrs"
      ],
      cta: "Start Pilot",
      highlight: false
    },
    {
      name: "Growth",
      price: "$297",
      period: "/month",
      description: "For founders iterating fast. Unlimited maps, priority support.",
      features: [
        "Everything in Pilot",
        "Unlimited strategic maps",
        "Priority email + Slack support",
        "Weekly sync calls (optional)",
        "Custom integrations (Notion, Linear, etc.)",
        "Advanced analytics on execution velocity"
      ],
      cta: "Unlock Growth",
      highlight: true
    },
    {
      name: "Operator",
      price: "$997",
      period: "/month",
      description: "For teams scaling execution. White-glove support + custom workflows.",
      features: [
        "Everything in Growth",
        "Dedicated strategy partner",
        "Custom AI training on your playbook",
        "Bi-weekly strategy sessions",
        "Team onboarding (up to 5 users)",
        "API access for custom workflows"
      ],
      cta: "Book Demo",
      highlight: false
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Pricing Built for Speed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your velocity. All tiers include our 24-hour actionability guarantee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={index}
              className={`relative bg-card border rounded-2xl p-8 ${
                tier.highlight 
                  ? 'border-accent shadow-glow scale-105' 
                  : 'border-border shadow-soft'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-accent text-white text-sm font-medium shadow-medium flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </div>

              <Button 
                className={`w-full mb-6 ${tier.highlight ? 'pricing-highlight' : 'pricing-default'}`}
                size="lg"
              >
                {tier.cta}
              </Button>

              <div className="space-y-3 pt-6 border-t border-border">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-16 max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-3">24-Hour Actionability Guarantee</h3>
          <p className="text-muted-foreground leading-relaxed">
            If your 3-Day Strategic Map doesn't provide clear, actionable next steps within 24 hours of delivery, 
            we'll refund 100% — no questions asked. We're betting on clarity.
          </p>
        </div>
      </div>
    </section>
  );
};