import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-1 pt-16 pb-16">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-blue/20 text-brand-blue text-xs font-semibold tracking-wide uppercase">
              <Zap className="w-3 h-3" />
              <span>AI-Powered Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-brand-white">
              Data-Driven <br />
              <span className="text-brand-teal">Betting Insights</span>
            </h1>
            <p className="text-lg text-brand-muted max-w-xl leading-relaxed">
              Stop guessing. Start winning. BetWise aggregates real-time data,
              trends, and predictive models to give you the edge you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/games"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-teal to-brand-blue text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
              >
                View Games
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/games"
                className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-muted/20 text-white font-medium px-8 py-3 rounded-full hover:bg-brand-surface/80 transition-colors"
              >
                Explore Odds
              </Link>
            </div>
          </div>

          {/* Abstract Dashboard Visual */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-teal to-brand-blue rounded-2xl blur opacity-30 animate-pulse"></div>
            <div className="relative bg-brand-surface border border-brand-muted/10 rounded-2xl p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-midnight p-4 rounded-xl border border-brand-muted/10">
                  <div className="text-brand-muted text-xs uppercase tracking-wider mb-1">
                    Success Rate
                  </div>
                  <div className="text-2xl font-bold text-brand-green flex items-center gap-2">
                    84.2% <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="bg-brand-midnight p-4 rounded-xl border border-brand-muted/10">
                  <div className="text-brand-muted text-xs uppercase tracking-wider mb-1">
                    Active Signals
                  </div>
                  <div className="text-2xl font-bold text-brand-white">
                    1,248
                  </div>
                </div>
              </div>
              <div className="h-48 bg-brand-midnight rounded-xl border border-brand-muted/10 p-4 grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-brand-surface/30 border border-brand-muted/10 rounded-lg p-3">
                  <div className="text-xs uppercase tracking-wider text-brand-muted mb-2">
                    Signal Momentum
                  </div>
                  <div className="h-24">
                    <svg
                      viewBox="0 0 300 120"
                      className="w-full h-full"
                      aria-label="Signal momentum chart"
                    >
                      <defs>
                        <linearGradient id="signalLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#19D4C5" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M10 90 L50 80 L90 88 L130 62 L170 68 L210 40 L250 50 L290 28"
                        fill="none"
                        stroke="url(#signalLine)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 90 L50 80 L90 88 L130 62 L170 68 L210 40 L250 50 L290 28 L290 110 L10 110 Z"
                        fill="rgba(25, 212, 197, 0.08)"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-brand-muted">
                    <span>Last 24h</span>
                    <span className="text-brand-green font-semibold">+18.4%</span>
                  </div>
                </div>

                <div className="bg-brand-surface/30 border border-brand-muted/10 rounded-lg p-3 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-wider text-brand-muted">
                    Success Rate
                  </div>
                  <div className="flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-brand-white"
                      style={{
                        background:
                          "conic-gradient(#19D4C5 0deg 303deg, rgba(148,163,184,0.15) 303deg 360deg)",
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-midnight flex items-center justify-center">
                        84%
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-brand-muted text-center">
                    1,248 active signals
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
