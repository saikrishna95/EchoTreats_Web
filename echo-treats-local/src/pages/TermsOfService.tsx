import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { homeSectionPath } from "@/lib/homeSections";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <Link to={homeSectionPath("contact")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Terms of Service</h1>

        <div className="prose prose-sm max-w-none font-body text-muted-foreground space-y-6">
          <p className="text-sm"><strong className="text-foreground">Last updated:</strong> March 24, 2026</p>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing and using the Echo Treats website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">2. Products & Ordering</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All products are subject to availability.</li>
              <li>Prices are listed in Indian Rupees (₹) and may change without prior notice.</li>
              <li>We reserve the right to refuse or cancel any order at our discretion.</li>
              <li>Product images are for illustration purposes and may vary slightly from the actual product.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Delivery</h2>
            <p>We deliver within Hyderabad, India. Delivery times are estimates and may vary. Echo Treats is not responsible for delays caused by unforeseen circumstances.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">4. Allergen Disclaimer</h2>
            <p>Our products may contain allergens including nuts, dairy, eggs, wheat, and soy. Please inform us of any allergies when placing your order. We cannot guarantee a completely allergen-free environment.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">5. Intellectual Property</h2>
            <p>All content on this website, including text, images, logos, and designs, is the property of Echo Treats and may not be reproduced without written permission.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>Echo Treats shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">7. Governing Law</h2>
            <p>These terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">8. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:echotreats.v@gmail.com" className="text-primary hover:underline">echotreats.v@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
