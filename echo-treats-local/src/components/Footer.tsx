import { Instagram, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-footer.png";

const Footer = () => {
  return (
    <footer id="contact" className="bg-accent text-foreground">
      <div className="container py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="bg-accent">
            <img src={logo} alt="Echo Treats" className="h-44 w-auto mb-4 -ml-6" />
            <p className="font-body text-sm opacity-70 leading-relaxed">
              Artisan cloud bakery crafting delicious, made-to-order treats for every occasion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 opacity-90">About</h4>
            <ul className="space-y-2">
              <li>
                <a href="#story" className="font-body text-sm opacity-60 hover:opacity-100 transition-opacity">Our Story</a>
              </li>
              <li>
                <a href="#" className="font-body text-sm opacity-60 hover:opacity-100 transition-opacity">Ingredients</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 opacity-90">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 font-body text-sm opacity-70">
                <MapPin className="w-4 h-4 flex-shrink-0" /> Hyderabad, India
              </li>
              <li className="flex items-center gap-2 font-body text-sm opacity-70">
                <Mail className="w-4 h-4 flex-shrink-0" /> echotreats.v@gmail.com
              </li>
              <li className="flex items-start gap-2 font-body text-sm opacity-70">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" /> 8:00am - 8:00pm, Mon to Sun
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 opacity-90">Follow Us</h4>
            <a
              href="https://instagram.com/echo.treats"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <Instagram className="w-4 h-4" /> @echo.treats
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs opacity-50">© 2026 Echo Treats. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="font-body text-xs opacity-50 hover:opacity-100 transition-opacity">Privacy Policy</Link>
            <Link to="/refund-policy" className="font-body text-xs opacity-50 hover:opacity-100 transition-opacity">Refund Policy</Link>
            <Link to="/terms-of-service" className="font-body text-xs opacity-50 hover:opacity-100 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
