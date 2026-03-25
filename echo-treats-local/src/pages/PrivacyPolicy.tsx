import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <Link to="/" state={{ scrollToSection: "contact" }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-sm max-w-none font-body text-muted-foreground space-y-6">
          <p className="text-sm"><strong className="text-foreground">Last updated:</strong> March 24, 2026</p>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, phone number, delivery address, and payment details when you place an order or create an account on Echo Treats.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and deliver your orders</li>
              <li>To communicate with you about your orders and promotions</li>
              <li>To improve our products and services</li>
              <li>To send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Information Sharing</h2>
            <p>We do not sell or rent your personal information to third parties. We may share your information with delivery partners solely for the purpose of fulfilling your orders.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">5. Cookies</h2>
            <p>We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting us at <a href="mailto:echotreats.v@gmail.com" className="text-primary hover:underline">echotreats.v@gmail.com</a>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:echotreats.v@gmail.com" className="text-primary hover:underline">echotreats.v@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
