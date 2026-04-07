import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { homeSectionPath } from "@/lib/homeSections";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <Link to={homeSectionPath("contact")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Refund Policy</h1>

        <div className="prose prose-sm max-w-none font-body text-muted-foreground space-y-6">
          <p className="text-sm"><strong className="text-foreground">Last updated:</strong> March 24, 2026</p>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Perishable Goods</h2>
            <p>As our products are freshly baked and perishable, we generally do not accept returns. However, we are committed to your satisfaction and will address any quality concerns.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">2. Damaged or Incorrect Orders</h2>
            <p>If your order arrives damaged or is incorrect, please contact us within 2 hours of delivery with photos of the product. We will offer a full replacement or refund at our discretion.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Order Cancellations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orders can be cancelled for a full refund up to 24 hours before the scheduled delivery date.</li>
              <li>Cancellations made within 24 hours of delivery may incur a 50% cancellation fee.</li>
              <li>Custom orders cannot be cancelled once preparation has begun.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">4. Refund Processing</h2>
            <p>Approved refunds will be processed within 5–7 business days and credited to the original payment method.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">5. Contact Us</h2>
            <p>For refund requests or concerns, please reach out to <a href="mailto:echotreats.v@gmail.com" className="text-primary hover:underline">echotreats.v@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
