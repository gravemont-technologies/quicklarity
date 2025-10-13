import { Quote } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      quote: "I went from 'paralyzed by options' to shipping our MVP feature in 48 hours. The calendar blocks alone saved me 3 hours of context-switching.",
      author: "Sarah Chen",
      role: "Founder, DevTools Startup",
      metric: "3 hrs saved in week 1"
    },
    {
      quote: "The blind spots section called out our pricing strategy gap. We adjusted before our next customer call and closed 2 deals that week.",
      author: "Marcus Williams",
      role: "Solo Founder, B2B SaaS",
      metric: "2 deals closed"
    },
    {
      quote: "This isn't just a report — it's a decision engine. Knowing what NOT to do was as valuable as the roadmap itself.",
      author: "Priya Kapoor",
      role: "Co-Founder, HealthTech",
      metric: "Eliminated 40% of backlog"
    }
  ];

  const caseStudy = {
    title: "Case Study: Pre-Seed Fintech → First Paying Customer in 72 Hours",
    before: "Scattered roadmap, 3 competing priorities, team unsure which feature to build first.",
    action: "Used Strategic Clarity Engine to identify highest-value milestone: payment integration MVP.",
    result: "Shipped stripped-down payment flow in 72 hours, landed first paying customer ($500 MRR), validated core hypothesis."
  };

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Founder Proof
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real outcomes from early pilots. No fluff, just execution velocity.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-2xl p-8 shadow-soft hover:shadow-medium transition-shadow"
            >
              <Quote className="w-10 h-10 text-accent mb-4" />
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>
              <div className="pt-6 border-t border-border">
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground mb-3">{testimonial.role}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {testimonial.metric}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Case study */}
        <div className="max-w-4xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {caseStudy.title}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold text-accent mb-2">BEFORE</p>
              <p className="text-foreground leading-relaxed">{caseStudy.before}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-accent mb-2">ACTION</p>
              <p className="text-foreground leading-relaxed">{caseStudy.action}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-accent mb-2">RESULT</p>
              <p className="text-foreground leading-relaxed">{caseStudy.result}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};