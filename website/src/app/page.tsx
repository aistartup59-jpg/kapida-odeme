import { AppointmentSection } from "@/components/appointment-section";
import { Audiences } from "@/components/audiences";
import { Contact } from "@/components/contact";
import { Faq } from "@/components/faq";
import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { PartialPayments } from "@/components/partial-payments";
import { PaymentMethods } from "@/components/payment-methods";
import { SecureMode } from "@/components/secure-mode";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <PaymentMethods />
        <HowItWorks />
        <PartialPayments />
        <SecureMode />
        <Audiences />
        <Features />
        <Faq />
        <AppointmentSection />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
