import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Copy */}
          <div className="space-y-8 animate-fade-in">
            {/* Pilot badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <span>Early Pilot Program • Limited Spots</span>
            </div>
            
            {/* Headlines - showing medium variant */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                From chaos to traction in{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  90 minutes
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Strategic Clarity Engine turns founder overwhelm into a 3-day execution roadmap. 
                Answer 7 questions, upload your docs, get your plan.
              </p>
            </div>

            {/* Proof bullets */}
            <div className="space-y-3 py-4">
              <ProofBullet text="Save 7+ hours of planning in your first 72 hours" />
              <ProofBullet text="Clear priorities → faster revenue decisions" />
              <ProofBullet text="Battle-tested with 5 early-stage founders" />
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="hero-cta text-lg px-8 py-6 shadow-glow">
                Start Your 90-Second Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="hero-secondary text-lg px-8 py-6">
                See How It Works
              </Button>
            </div>

            {/* Trust line */}
            <p className="text-sm text-muted-foreground pt-4">
              Docs processed securely • GDPR-compliant • Ephemeral by default
            </p>
          </div>

          {/* Right column - Hero image */}
          <div className="relative animate-fade-in-delay">
            <div className="relative rounded-2xl overflow-hidden shadow-large">
              <img 
                src={heroImage} 
                alt="Strategic planning workspace showcasing the clarity engine interface" 
                className="w-full h-auto object-cover"
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
            {/* Floating proof element */}
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-medium">
              <p className="text-sm font-medium">Avg. time saved</p>
              <p className="text-3xl font-bold text-primary">7.2 hrs</p>
              <p className="text-xs text-muted-foreground">in first 72 hours</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProofBullet = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3">
    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
    <span className="text-base text-foreground">{text}</span>
  </div>
);