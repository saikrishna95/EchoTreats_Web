import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnnouncementBarProps {
  visible?: boolean;
}

const AnnouncementBar = ({ visible = true }: AnnouncementBarProps) => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from("announcements" as any)
      .select("text")
      .eq("is_active", true)
      .order("sort_order");

    if (!error && data && (data as any[]).length > 0) {
      setAnnouncements((data as any[]).map((a) => a.text));
    } else {
      setAnnouncements(["Welcome to EchoTreats! 🎂"]);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();

    const channel = supabase
      .channel("announcements")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "announcements" },
        () => void fetchAnnouncements()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAnnouncements]);

  const texts = announcements.length > 0 ? announcements : ["Welcome to EchoTreats! 🎂"];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-primary overflow-hidden py-2 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div className="animate-marquee flex whitespace-nowrap">
        {[...texts, ...texts].map((text, i) => (
          <span key={i} className="mx-8 text-xs font-body font-medium text-primary-foreground tracking-wide">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
