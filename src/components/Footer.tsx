import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      {/* CTA section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8 pb-16 border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent">
            ⚡ Limited Pilot Spots Available
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Ready to turn chaos into traction?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join early-stage founders who are moving faster with Strategic Clarity Engine. 
            90-second assessment. 2-minute delivery. 72-hour results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="hero-cta text-lg px-8 py-6">
              Start Your Assessment Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="hero-secondary text-lg px-8 py-6">
              Book a Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Strategic Clarity Engine</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered strategic planning for early-stage founders. From chaos to traction in 90 minutes.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-accent transition-colors">How It Works</a></li>
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-accent transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">Pricing</a></li>
              <li><a href="#faq" className="text-sm text-muted-foreground hover:text-accent transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-sm text-muted-foreground hover:text-accent transition-colors">About</a></li>
              <li><a href="#case-studies" className="text-sm text-muted-foreground hover:text-accent transition-colors">Case Studies</a></li>
              <li><a href="#privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex gap-3 mb-4">
              <a href="#twitter" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#linkedin" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:hello@strategicclarityengine.com" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Questions? Email us at<br />
              <a href="mailto:hello@strategicclarityengine.com" className="text-accent hover:underline">
                hello@strategicclarityengine.com
              </a>
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Strategic Clarity Engine. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            GDPR-compliant • SOC 2 Type II • Ephemeral data processing
          </p>
        </div>
      </div>
    </footer>
  );
};