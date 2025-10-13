import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "Why not just use GPT myself?",
      answer: "GPT gives you generic advice. Strategic Clarity Engine knows early-stage patterns — revenue milestones, fundraising timelines, product-market fit signals. It's trained to prioritize what moves the needle for pre-seed → seed founders, not just answer questions. Plus, you get structured deliverables (Notion + calendar) that integrate into your workflow."
    },
    {
      question: "What happens to my uploaded documents?",
      answer: "Your docs are processed ephemerally and never stored long-term. We extract insights, generate your strategic map, then delete all uploaded content within 24 hours. GDPR-compliant. Your data is never used to train models. You can request immediate deletion anytime."
    },
    {
      question: "How accurate is the 3-Day Strategic Map?",
      answer: "It's based on your actual context (quiz + docs), tested with 5 early-stage founders who saved an average of 7.2 hours in their first 72 hours. The AI identifies blind spots, prioritizes revenue-first actions, and flags what to defer. If it's not actionable within 24 hours, we refund 100%."
    },
    {
      question: "Can I regenerate my map if my priorities change?",
      answer: "Pilot tier includes 1 generation. Growth tier gives you unlimited regenerations. Update your docs, retake the quiz, and get a fresh map whenever you pivot or gain new information."
    },
    {
      question: "Who is this NOT for?",
      answer: "If you're post-Series A with a structured ops team, you probably don't need this. Strategic Clarity Engine is built for solo founders and early-stage teams (pre-seed → seed) who need to move fast with limited resources. If you already have a dedicated COO or strategy consultant, this might be redundant."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Answers to common questions about how it works and what to expect.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 shadow-soft"
            >
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-accent py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};