const announcements = [
  "✨ Freshly baked artisan treats — made to order with love",
  "🎂 Order custom cakes for special occasions",
  "🚚 Free delivery on orders above ₹5999",
  "🌸 Festival specials now live — order before they're gone!",
];

interface AnnouncementBarProps {
  visible?: boolean;
}

const AnnouncementBar = ({ visible = true }: AnnouncementBarProps) => {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-primary overflow-hidden py-2 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div className="animate-marquee flex whitespace-nowrap">
        {[...announcements, ...announcements].map((text, i) => (
          <span key={i} className="mx-8 text-xs font-body font-medium text-primary-foreground tracking-wide">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
