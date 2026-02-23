"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  CourierCheckData,
  SummaryData,
  CourierData,
} from "@/lib/bdcourier";
import { COURIER_KEYS, normalizeBdPhone } from "@/lib/bdcourier";

/* ──────────────────────────────────────────────
   Risk helpers
   ────────────────────────────────────────────── */

type RiskLevel = "unknown" | "low" | "medium" | "high";

function getFraudRisk(summary: SummaryData): {
  risk: RiskLevel;
  label: string;
  emoji: string;
} {
  const { success_ratio, total_parcel } = summary;
  if (total_parcel === 0)
    return { risk: "unknown", label: "No History", emoji: "❓" };
  if (success_ratio >= 80)
    return { risk: "low", label: "Trusted", emoji: "✅" };
  if (success_ratio >= 50)
    return { risk: "medium", label: "Moderate Risk", emoji: "⚠️" };
  return { risk: "high", label: "High Risk", emoji: "🚫" };
}

const riskColors: Record<RiskLevel, { text: string; bg: string; ring: string }> = {
  unknown: {
    text: "var(--risk-unknown)",
    bg: "var(--risk-unknown-bg)",
    ring: "var(--risk-unknown)",
  },
  low: {
    text: "var(--risk-low)",
    bg: "var(--risk-low-bg)",
    ring: "var(--risk-low)",
  },
  medium: {
    text: "var(--risk-medium)",
    bg: "var(--risk-medium-bg)",
    ring: "var(--risk-medium)",
  },
  high: {
    text: "var(--risk-high)",
    bg: "var(--risk-high-bg)",
    ring: "var(--risk-high)",
  },
};

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function StatusDot({ status }: { status: "idle" | "ok" | "error" }) {
  if (status === "idle") return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{
        background: status === "ok" ? "var(--success)" : "var(--error)",
        boxShadow:
          status === "ok"
            ? "0 0 6px rgba(52,199,89,.4)"
            : "0 0 6px rgba(255,59,48,.4)",
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Risk hero skeleton */}
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-center">
          <div className="skeleton w-24 h-24 rounded-full" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="skeleton w-32 h-5 rounded-full" />
          <div className="skeleton w-20 h-4 rounded-full" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] p-3"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="skeleton w-8 h-8 rounded-lg mx-auto" />
            <div className="skeleton w-10 h-5 rounded mx-auto mt-2" />
            <div className="skeleton w-14 h-3 rounded mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskGauge({
  ratio,
  riskInfo,
}: {
  ratio: number;
  riskInfo: { risk: RiskLevel; label: string; emoji: string };
}) {
  const colors = riskColors[riskInfo.risk];
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (ratio / 100) * circumference;

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 animate-scale-in"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-col items-center">
        {/* SVG Gauge */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="var(--border)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={colors.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </svg>
          {/* Center number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ color: colors.text }}
            >
              {ratio.toFixed(0)}
            </span>
            <span
              className="text-[11px] font-medium mt-0.5 uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Score
            </span>
          </div>
        </div>

        {/* Risk badge */}
        <div
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold"
          style={{ background: colors.bg, color: colors.text }}
        >
          <span>{riskInfo.emoji}</span>
          <span>{riskInfo.label}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] p-3 text-center animate-slide-up"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg mx-auto flex items-center justify-center text-[18px]"
        style={{ background: "var(--bg)" }}
      >
        {icon}
      </div>
      <div
        className="text-[22px] font-bold mt-1.5 tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div
        className="text-[11px] font-medium mt-0.5 uppercase tracking-wider"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </div>
    </div>
  );
}

function CourierRow({
  courier,
  delay,
}: {
  courier: CourierData;
  delay: number;
}) {
  const barColor =
    courier.success_ratio >= 80
      ? "var(--success)"
      : courier.success_ratio >= 50
        ? "var(--warning)"
        : courier.total_parcel === 0
          ? "var(--border)"
          : "var(--error)";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={courier.logo}
        alt=""
        className="w-9 h-9 rounded-[var(--radius-sm)] object-contain flex-shrink-0"
        style={{ background: "var(--bg)" }}
      />
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className="text-[14px] font-semibold truncate"
            style={{ color: "var(--text)" }}
          >
            {courier.name}
          </span>
          <span
            className="text-[14px] font-bold tabular-nums flex-shrink-0 ml-2"
            style={{ color: "var(--text)" }}
          >
            {courier.success_ratio}%
          </span>
        </div>
        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden"
          style={{ background: "var(--bg)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${courier.total_parcel === 0 ? 0 : Math.max(courier.success_ratio, 3)}%`,
              background: barColor,
              transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>
        <div
          className="text-[11px] mt-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          {courier.success_parcel}/{courier.total_parcel} delivered
          {courier.cancelled_parcel > 0 && (
            <span style={{ color: "var(--error)" }}>
              {" "}· {courier.cancelled_parcel} cancelled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Install Prompt (iOS + Android/Desktop)
   ────────────────────────────────────────────── */

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    );
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );

    // Android / Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;

  return (
    <div
      className="rounded-[var(--radius-lg)] p-4 animate-slide-up"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p
            className="text-[14px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            📲 Install App
          </p>
          {isIOS ? (
            <p
              className="text-[12px] mt-1 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Tap the share button{" "}
              <span role="img" aria-label="share">⎋</span> in Safari,
              then tap <strong>"Add to Home Screen"</strong>{" "}
              <span role="img" aria-label="plus">➕</span>
            </p>
          ) : deferredPrompt ? (
            <button
              onClick={async () => {
                const prompt = deferredPrompt as unknown as {
                  prompt: () => void;
                  userChoice: Promise<{ outcome: string }>;
                };
                prompt.prompt();
                await prompt.userChoice;
                setDeferredPrompt(null);
              }}
              className="mt-2 px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-semibold transition-all active:scale-[0.97]"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Add to Home Screen
            </button>
          ) : (
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Install this app for quick access
            </p>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[18px] p-1 flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Home() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<CourierCheckData | null>(null);
  const [courierOpen, setCourierOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");
  const [planData, setPlanData] = useState<{
    remaining_paid_calls?: number;
    remaining_free_calls?: number;
    has_subscription?: boolean;
  } | null>(null);

  /* Live-normalization preview */
  const normalizedPreview = useMemo(() => {
    if (phone.length < 4) return "";
    const n = normalizeBdPhone(phone);
    return n || "";
  }, [phone]);

  /* Service worker registration */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => { });
    }
  }, []);

  /* Initial data fetch */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/check-connection")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setApiStatus(json.status === "success" ? "ok" : "error");
      })
      .catch(() => {
        if (!cancelled) setApiStatus("error");
      });
    fetch("/api/my-plan")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.status === "success" && json.data) {
          setPlanData({
            remaining_paid_calls: json.data.remaining_paid_calls,
            remaining_free_calls: json.data.remaining_free_calls,
            has_subscription: json.data.has_subscription,
          });
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const raw = normalizeBdPhone(phone);
      if (!raw) {
        setErrorMessage("Enter a valid BD number (e.g. 01730285500)");
        setStatus("error");
        return;
      }
      setStatus("loading");
      setErrorMessage("");
      setData(null);
      setCourierOpen(false);
      try {
        const res = await fetch("/api/courier-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: raw }),
        });
        const json = await res.json();
        if (json.status === "error") {
          setErrorMessage(json.error || "Request failed");
          setStatus("error");
          return;
        }
        if (json.data) {
          setData(json.data);
          setStatus("success");
        } else {
          setErrorMessage("Invalid response");
          setStatus("error");
        }
      } catch {
        setErrorMessage("Service temporarily unavailable");
        setStatus("error");
      }
    },
    [phone]
  );

  const riskInfo = data?.summary != null ? getFraudRisk(data.summary) : null;

  /* Sort couriers by total_parcel descending */
  const sortedCouriers = useMemo(() => {
    if (!data) return [];
    return COURIER_KEYS.map((key) => data[key] as CourierData)
      .filter(Boolean)
      .sort((a, b) => b.total_parcel - a.total_parcel);
  }, [data]);

  const remainingCalls =
    planData != null
      ? (planData.remaining_paid_calls ?? 0) +
      (planData.remaining_free_calls ?? 0)
      : null;

  return (
    <div
      className="min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{ background: "var(--bg)" }}
    >
      <main className="mx-auto max-w-[430px] px-4 py-5 flex flex-col gap-5">
        {/* ───── Header ───── */}
        <header className="text-center pt-3 pb-1 animate-fade-in">
          {/* Brand mark */}
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-[22px] font-bold"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              boxShadow: "0 4px 12px rgba(200,149,110,0.3)",
            }}
          >
            গ
          </div>
          <h1
            className="text-[20px] font-bold tracking-tight mt-3"
            style={{ color: "var(--text)" }}
          >
            G TE Goyna
          </h1>
          <p
            className="text-[13px] font-medium mt-0.5"
            style={{ color: "var(--primary)" }}
          >
            গ তে গয়না
          </p>
          <p
            className="text-[13px] mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Courier Ratio Checker
          </p>
          {/* Status row */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <StatusDot status={apiStatus} />
            {apiStatus !== "idle" && (
              <span
                className="text-[11px] font-medium"
                style={{
                  color: apiStatus === "ok" ? "var(--success)" : "var(--error)",
                }}
              >
                {apiStatus === "ok" ? "Connected" : "Offline"}
              </span>
            )}
          </div>
        </header>

        {/* ───── Search Card ───── */}
        <section
          className="rounded-[var(--radius-lg)] p-4 animate-slide-up"
          style={{
            background: "var(--surface)",
            boxShadow: "var(--shadow-card)",
            animationDelay: "100ms",
            animationFillMode: "backwards",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="phone" className="sr-only">
              Phone number
            </label>
            {/* Input wrapper */}
            <div className="relative">
              {/* Phone icon */}
              <div
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
                style={{ color: "var(--text-tertiary)" }}
              >
                📱
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[50px] pl-11 pr-4 rounded-[var(--radius-md)] text-[17px] font-medium border transition-all duration-200"
                style={{
                  background: "var(--bg)",
                  color: "var(--text)",
                  borderColor:
                    status === "error" && errorMessage
                      ? "var(--error)"
                      : "transparent",
                }}
                disabled={status === "loading"}
              />
            </div>
            {/* Normalized preview */}
            {normalizedPreview && phone !== normalizedPreview && (
              <div
                className="flex items-center gap-1.5 px-1 animate-fade-in"
              >
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  →
                </span>
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: "var(--primary)" }}
                >
                  {normalizedPreview}
                </span>
              </div>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="min-h-[50px] w-full rounded-[var(--radius-md)] font-semibold text-[16px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                boxShadow: "0 2px 8px rgba(200,149,110,0.3)",
              }}
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  />
                  Checking…
                </span>
              ) : (
                "Check Number"
              )}
            </button>
          </form>
        </section>

        {/* ───── Error ───── */}
        {status === "error" && errorMessage && (
          <div
            className="rounded-[var(--radius-md)] px-4 py-3 text-[14px] font-medium animate-slide-down flex items-center gap-2"
            style={{ background: "var(--error-bg)", color: "var(--error)" }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ───── Loading skeleton ───── */}
        {status === "loading" && <SkeletonCard />}

        {/* ───── Results ───── */}
        {status === "success" && data?.summary && riskInfo && (
          <section className="flex flex-col gap-4">
            {/* Risk Gauge */}
            <RiskGauge ratio={data.summary.success_ratio} riskInfo={riskInfo} />

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Total"
                value={data.summary.total_parcel}
                color="var(--text)"
                icon="📦"
                delay={150}
              />
              <StatCard
                label="Success"
                value={data.summary.success_parcel}
                color="var(--success)"
                icon="✅"
                delay={250}
              />
              <StatCard
                label="Cancelled"
                value={data.summary.cancelled_parcel}
                color="var(--error)"
                icon="❌"
                delay={350}
              />
            </div>

            {/* Per-courier breakdown */}
            <div>
              <button
                type="button"
                onClick={() => setCourierOpen((o) => !o)}
                className="flex items-center justify-between w-full min-h-[50px] px-4 rounded-[var(--radius-lg)] text-left text-[15px] font-semibold active:scale-[0.98] transition-transform duration-150"
                style={{
                  background: "var(--surface)",
                  color: "var(--text)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <span className="flex items-center gap-2">
                  <span>🚚</span>
                  Per-Courier Breakdown
                </span>
                <span
                  className="text-[14px] transition-transform duration-200"
                  style={{
                    color: "var(--text-tertiary)",
                    transform: courierOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  ▼
                </span>
              </button>
              {courierOpen && (
                <div
                  className="mt-2 rounded-[var(--radius-lg)] overflow-hidden animate-slide-down"
                  style={{
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  {sortedCouriers.map((c, i) => (
                    <div key={c.name}>
                      {i > 0 && (
                        <div
                          className="mx-4 h-px"
                          style={{ background: "var(--border)" }}
                        />
                      )}
                      <CourierRow courier={c} delay={i * 60} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ───── Install Prompt ───── */}
        <InstallPrompt />

        {/* ───── Footer ───── */}
        <footer
          className="flex items-center justify-between pt-3 mt-1 animate-fade-in"
          style={{
            borderTop: "1px solid var(--border)",
            animationDelay: "400ms",
            animationFillMode: "backwards",
          }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Internal Use Only
          </span>
          {remainingCalls !== null && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              <span>🔑</span>
              {remainingCalls} checks left
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}
