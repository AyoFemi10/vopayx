'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { WalletData, TransactionData } from '@vopay/shared';
import { ArrowUpRight, ArrowDownRight, Plus, Send, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    wallets: WalletData[];
    recentTransactions: TransactionData[];
  } | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/users/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 skeleton"></div>
          <div className="h-96 skeleton"></div>
        </div>
        <div className="h-[500px] skeleton"></div>
      </div>
    );
  }

  const defaultWallet = data?.wallets.find(w => w.isDefault) || data?.wallets[0];
  const totalBalanceUsd = data?.wallets.reduce((acc, w) => {
    // Rough mock conversion for display purposes
    const rate = w.currency === 'NGN' ? 1/1500 : w.currency === 'GBP' ? 1.25 : w.currency === 'EUR' ? 1.08 : 1;
    return acc + (Number(w.balance) * rate);
  }, 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* ─── MAIN COLUMN ───────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6 lg:space-y-8">
        
        {/* Total Balance Card */}
        <div className="card bg-gradient-brand text-white border-0 shadow-glow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative z-10">
            <p className="text-white/80 font-medium mb-1">Estimated Total Balance (USD)</p>
            <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-8">
              {formatCurrency(totalBalanceUsd, 'USD')}
            </h2>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/wallets?action=deposit" className="btn-secondary !bg-white/20 !border-white/10 hover:!bg-white/30 backdrop-blur-md">
                <Plus className="w-4 h-4" /> Add Money
              </Link>
              <Link href="/dashboard/transfers?action=send" className="btn-secondary !bg-black/20 !border-black/10 hover:!bg-black/30 backdrop-blur-md">
                <Send className="w-4 h-4" /> Send Money
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Link href="/dashboard/transfers" className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
              View all
            </Link>
          </div>

          {data?.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-secondary">No transactions yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data?.recentTransactions.map((tx) => {
                const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type) || 
                                 (tx.type === 'TRANSFER' && (tx as any).transfer?.receiverUserId === user?.id);
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-bg-hover transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isCredit ? "bg-success/10 text-success" : "bg-error/10 text-error"
                      )}>
                        {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">
                          {tx.type === 'TRANSFER' 
                            ? (isCredit 
                                ? `From ${(tx as any).transfer?.senderUser?.firstName} ${(tx as any).transfer?.senderUser?.lastName}`
                                : `To ${(tx as any).transfer?.receiverUser?.firstName} ${(tx as any).transfer?.receiverUser?.lastName}`)
                            : tx.description || tx.type}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {format(new Date(tx.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        isCredit ? "text-success" : "text-white"
                      )}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── SIDE COLUMN ───────────────────────────────────────── */}
      <div className="space-y-6 lg:space-y-8">
        {/* Wallets */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Your Wallets</h3>
            <button className="text-text-muted hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {data?.wallets.map((wallet) => (
              <Link 
                href={`/dashboard/wallets/${wallet.currency.toLowerCase()}`}
                key={wallet.id} 
                className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-primary border border-bg-border flex items-center justify-center font-bold text-sm group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    {wallet.currency}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{wallet.currency} Wallet</p>
                    <p className="text-xs text-text-muted mt-0.5">{wallet.isDefault ? 'Default' : 'Active'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(wallet.balance, wallet.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
             <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent hover:text-accent transition-colors text-sm font-medium text-text-secondary">
                <ArrowDownRight className="w-5 h-5" /> Request
             </button>
             <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent hover:text-accent transition-colors text-sm font-medium text-text-secondary">
                <ArrowLeftRight className="w-5 h-5" /> Exchange
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
