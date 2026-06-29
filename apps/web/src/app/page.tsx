import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Globe2, ShieldCheck, Zap, Code, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        
        {/* ─── HERO SECTION ────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden section">
          {/* Animated Background */}
          <div className="absolute inset-0 grid-bg z-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 glow-orb z-0"></div>

          <div className="container-vp relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              VOPayX API v1.0 is now live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Global Payments <br />
              <span className="gradient-text">Without Borders</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 animate-slide-up text-balance" style={{ animationDelay: '200ms' }}>
              The financial operating system for the next generation of global commerce. Send, receive, and manage money across multiple currencies through a single, powerful API.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link href="/auth/signup" className="btn-primary btn-lg w-full sm:w-auto">
                Start Building <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="btn-secondary btn-lg w-full sm:w-auto">
                Contact Sales
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-20 pt-10 border-t border-bg-border/50 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <p className="text-sm font-medium text-text-muted mb-6 uppercase tracking-widest">Powered by enterprise infrastructure</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Simulated partner logos */}
                <div className="text-xl font-display font-bold">AyoHost</div>
                <div className="text-xl font-display font-bold">Paystack</div>
                <div className="text-xl font-display font-bold">Flutterwave</div>
                <div className="text-xl font-display font-bold flex items-center gap-1"><ShieldCheck className="w-5 h-5"/> PCI-DSS</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS COUNTER ───────────────────────────────────────── */}
        <section className="border-y border-bg-border bg-bg-secondary relative z-10">
          <div className="container-vp py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="stat-card border-none bg-transparent hover:border-none shadow-none text-center">
                <div className="stat-value">99.99%</div>
                <div className="stat-label">API Uptime</div>
              </div>
              <div className="stat-card border-none bg-transparent hover:border-none shadow-none text-center">
                <div className="stat-value">7+</div>
                <div className="stat-label">Global Currencies</div>
              </div>
              <div className="stat-card border-none bg-transparent hover:border-none shadow-none text-center">
                <div className="stat-value">&lt;2s</div>
                <div className="stat-label">Settlement Time</div>
              </div>
              <div className="stat-card border-none bg-transparent hover:border-none shadow-none text-center">
                <div className="stat-value">130+</div>
                <div className="stat-label">Countries Supported</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── THREE PILLARS ───────────────────────────────────────── */}
        <section className="section bg-bg-primary relative z-10">
          <div className="container-vp">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">One Platform.<br/>Infinite Possibilities.</h2>
              <p className="text-text-secondary text-lg">Whether you are an individual sending money home, a business collecting payments, or a developer building a fintech app, VOPayX provides the infrastructure.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Consumer */}
              <div className="card card-glow flex flex-col items-start text-left h-full group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe2 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Consumer Wallet</h3>
                <p className="text-text-secondary mb-6 flex-grow">Hold balances in multiple currencies, send money globally, and exchange FX instantly with zero hidden fees.</p>
                <Link href="/product" className="inline-flex items-center gap-1 text-accent font-medium hover:gap-2 transition-all">
                  Explore Wallet <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Business */}
              <div className="card card-glow flex flex-col items-start text-left h-full group">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-bold mb-3">Business Payments</h3>
                <p className="text-text-secondary mb-6 flex-grow">Accept payments globally, manage payroll, automate mass disbursements, and track financial analytics.</p>
                <Link href="/product" className="inline-flex items-center gap-1 text-success font-medium hover:gap-2 transition-all">
                  View Business Tools <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Developer */}
              <div className="card card-glow flex flex-col items-start text-left h-full group">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-xl font-bold mb-3">Developer Infrastructure</h3>
                <p className="text-text-secondary mb-6 flex-grow">Build your own fintech with our robust REST APIs, Webhooks, SDKs, and comprehensive documentation.</p>
                <Link href="/developers" className="inline-flex items-center gap-1 text-warning font-medium hover:gap-2 transition-all">
                  Read the Docs <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA SECTION ─────────────────────────────────────────── */}
        <section className="py-24 px-4 relative z-10">
          <div className="container-vp">
            <div className="glass !p-12 md:!p-16 text-center border-accent/20 bg-gradient-to-b from-bg-card to-bg-primary overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-accent/10 blur-[100px] rounded-full pointer-events-none"></div>
              
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 relative z-10">Ready to move money <span className="gradient-text">faster?</span></h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-10 relative z-10">
                Join thousands of individuals and businesses already using VOPayX to power their global financial operations.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Link href="/auth/signup" className="btn-primary btn-lg w-full sm:w-auto">
                  Create Free Account
                </Link>
                <Link href="/contact" className="btn-ghost btn-lg w-full sm:w-auto">
                  Talk to an Expert
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
