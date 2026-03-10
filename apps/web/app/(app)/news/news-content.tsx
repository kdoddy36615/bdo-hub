"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  Newspaper,
  CalendarDays,
  Gift,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface NewsItem {
  id: number;
  category: string;
  image: string;
  link: string;
  region: string;
  title: string;
  created_at: string;
}

interface EventItem {
  id: number;
  active: number;
  region: string;
  title: string;
  img: string;
  link: string;
  end_at: string | null;
  created_at: string;
}

interface CouponItem {
  id: number;
  code: string;
  regions: string[] | null;
  expire_at: string;
  created_at: string;
  items: { main_key: number; amount: number; name: string | null; grade: number; img: string }[];
}

const NEWS_CATEGORY_COLORS: Record<string, string> = {
  Maintenance: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "GM Notes": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Notices: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  Updates: "bg-green-500/15 text-green-400 border-green-500/30",
  "Pearl Shop": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Completed: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
};

const DEFAULT_CATEGORY_COLOR = "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

type Tab = "events" | "news" | "coupons";

export function NewsContent() {
  const [tab, setTab] = useState<Tab>("events");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/garmoth/news").then((r) => r.json()),
      fetch("/api/garmoth/events").then((r) => r.json()),
      fetch("/api/garmoth/coupons").then((r) => r.json()),
    ])
      .then(([newsData, eventsData, couponsData]) => {
        setNews(newsData.data ?? []);
        // Only active events for NA
        setEvents(
          (eventsData as EventItem[]).filter(
            (e) => e.active === 1 && (e.region === "na" || e.region === "global")
          )
        );
        // Only non-expired coupons
        const now = new Date();
        setCoupons(
          (couponsData as CouponItem[]).filter(
            (c) => new Date(c.expire_at) > now
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function copyCode(coupon: CouponItem) {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    toast.success(`Copied: ${coupon.code}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function timeUntil(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">News & Events</h1>
        <p className="text-muted-foreground">
          Live from Garmoth &mdash; {events.length} active events, {coupons.length} coupons
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {([
          { id: "events" as Tab, label: "Events", icon: CalendarDays, count: events.length },
          { id: "news" as Tab, label: "News", icon: Newspaper, count: news.length },
          { id: "coupons" as Tab, label: "Coupons", icon: Gift, count: coupons.length },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <Badge variant="secondary" className="text-xs ml-1">
              {t.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {tab === "events" && (
        <div className="grid gap-3 md:grid-cols-2">
          {events.length > 0 ? (
            events.map((event) => (
              <a
                key={event.id}
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="overflow-hidden transition-colors hover:border-primary/30 h-full">
                  {event.img && (
                    <div className="aspect-[21/9] overflow-hidden bg-muted">
                      <img
                        src={event.img}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {event.title}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      {event.end_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeUntil(event.end_at)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ongoing</span>
                      )}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No active events right now</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* News Tab */}
      {tab === "news" && (
        <div className="space-y-2">
          {news.slice(0, 30).map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="h-12 w-20 rounded object-cover shrink-0 bg-muted"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${NEWS_CATEGORY_COLORS[item.category] ?? DEFAULT_CATEGORY_COLOR}`}>
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Coupons Tab */}
      {tab === "coupons" && (
        <div className="space-y-3">
          {coupons.length > 0 ? (
            coupons.map((coupon) => (
              <Card key={coupon.id} className="transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <code className="text-sm font-bold tracking-wider bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Expires {formatDate(coupon.expire_at)} ({timeUntil(coupon.expire_at)})
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(coupon)}
                    >
                      {copiedId === coupon.id ? (
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {copiedId === coupon.id ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  {coupon.items && coupon.items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pl-8">
                      {coupon.items.map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Sparkles className="mr-1 h-3 w-3" />
                          {item.name ?? `Item #${item.main_key}`} x{item.amount}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No active coupons right now</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
