import { Clock, FileText, Calendar } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Clock,
      title: "90-Second Quiz",
      description: "7 focused questions about your business, priorities, and current roadblocks.",
      time: "< 90 sec",
      action: "Start Assessment"
    },
    {
      icon: FileText,
      title: "Upload Context",
      description: "Paste or link 1–3 docs (pitch deck, roadmap, notes). We'll extract what matters.",
      time: "30 sec",
      action: "Generate Map"
    },
    {
      icon: Calendar,
      title: "Get Your 3-Day Plan",
      description: "Receive structured Notion page + 3 calendar invites with prioritized actions.",
      time: "< 2 min",
      action: "View Deliverable"
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three steps, 90 total minutes. From scattered thoughts to structured execution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent/40 to-transparent" />
              )}
              
              <div className="bg-card border border-border rounded-2xl p-8 shadow-soft hover:shadow-medium transition-shadow relative z-10 h-full">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold shadow-medium">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">{step.description}</p>
                
                {/* Time badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Clock className="w-3 h-3" />
                  {step.time}
                </div>

                {/* Action preview */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">Action:</p>
                  <p className="text-base font-semibold text-foreground">{step.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success message preview */}
        <div className="mt-16 max-w-2xl mx-auto bg-accent/5 border border-accent/20 rounded-xl p-6">
          <p className="text-sm font-medium text-accent mb-2">✓ Success Message</p>
          <p className="text-foreground font-medium">
            "Your 3-Day Strategic Map is ready! Check your email for your Notion page and calendar invites. 
            Optional: Book a 15-min walkthrough with our team."
          </p>
        </div>
      </div>
    </section>
  );
};