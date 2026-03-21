import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const faqs = [
    {
        question: "How do I place an order?",
        answer: "Simply browse our products, add items to your cart, and proceed to checkout. You'll fill in your details, and we'll notify you once your order is ready for pickup. No payment is needed online!"
    },
    {
        question: "When and where can I pick up my order?",
        answer: "We have two pickup schedules weekly. Orders placed between Monday and Wednesday can be picked up on Wednesday. Orders placed between Thursday and Saturday can be picked up on Saturday. All pickups are on campus at the designated location."
    },
    {
        question: "How do I pay for my order?",
        answer: "All payments are made in person when you come to pick up your order. We accept cash and mobile money at the pickup point."
    },
    {
        question: "What if I miss my pickup day?",
        answer: "Please try your best to pick up your order on the scheduled day. If you foresee a problem, contact support as soon as possible to make alternative arrangements. Repeated failure to pick up orders may result in account suspension."
    },
    {
        question: "Can I cancel or change my order?",
        answer: "Once an order is placed, it is processed quickly. If you need to make a change or cancel, please contact our support team immediately. We can't guarantee changes if the order is already prepared."
    },
    {
        question: "How do I return a product?",
        answer: "Since all transactions are completed in person at pickup, please inspect your items carefully. If you have an issue with a product, please address it with our representative at the pickup point. Returns after leaving the pickup point are handled on a case-by-case basis."
    }
]


export default function FaqPage() {
  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
            <CardDescription>Find answers to common questions about our service.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                     <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent>
                        {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
