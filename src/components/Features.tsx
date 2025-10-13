import { Target, Zap, Lock, TrendingUp } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Laser-Focused Priorities",
      description: "Cut through noise. Get 3–5 actions that move revenue, not busywork. Based on your actual context and constraints."
    },
    {
      icon: Zap,
      title: "Immediate Execution",
      description: "Calendar invites for deep work blocks. Pre-scheduled. No decision fatigue. Just show up and execute."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your docs are processed ephemerally. GDPR-compliant. No training on your data. Delete anytime."
    },
    {
      icon: TrendingUp,
      title: "Revenue-First Logic",
      description: "AI trained on early-stage patterns. Prioritizes customer validation, revenue milestones, and fundraising readiness."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Built for Founder Velocity
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to eliminate friction between thinking and doing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-card border border-border rounded-2xl p-8 hover:border-accent/50 hover:shadow-medium transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};