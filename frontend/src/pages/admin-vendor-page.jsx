import { useState } from 'react';
import {
  Store,
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  CheckCircle2,
  X,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminVendorPage() {
  const [breaches, setBreaches] = useState([
    {
      id: 'SLA-882',
      date: 'Sep 26, 2026',
      clause: 'Dinner Portion Availability (Clause 4.2)',
      description: 'Paneer shortage occurred before 8:45 PM on Thursday dinner.',
      proposedAdjustment: '₹4,500 contractor credit',
      status: 'PENDING_REVIEW'
    },
    {
      id: 'SLA-874',
      date: 'Sep 21, 2026',
      clause: 'Breakfast Serving Temperature (Clause 2.1)',
      description: 'Sambar temperature dipped below 60°C during 8:30 AM rush.',
      proposedAdjustment: '₹2,000 contractor credit',
      status: 'APPROVED'
    }
  ]);

  const [reviewModal, setReviewModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleApproveAdjustment = (id) => {
    setBreaches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b))
    );
    setReviewModal(null);
    setSuccessMsg(`SLA breach ${id} approved for contractor invoice adjustment!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <PageHeader
        title="Catering Contractor & SLA Governance"
        subtitle="Manage vendor performance benchmarks, review SLA adherence, and audit invoice reconciliations."
        badge="Vendor Management"
      />

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Contractor Overview Card (User Spec #19) */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  ABC Catering & Hospitality Services Ltd.
                </h2>
                <Badge variant="success" className="text-[10px] font-bold">
                  ACTIVE CONTRACT
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Contract Period: Aug 2026 – Jul 2027 • Daily Diners: ~1,100 • Renewal: In 10 months
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall SLA Compliance
              </span>
              <span className="text-3xl font-black text-emerald-600">91%</span>
            </div>
          </div>

          {/* SLA Sub-scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                <span>Taste Benchmark</span>
                <span className="text-slate-900 dark:text-slate-100">88%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Target: ≥ 85%</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                <span>Kitchen Hygiene</span>
                <span className="text-emerald-600">95%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Target: ≥ 90%</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                <span>Serving Temp</span>
                <span className="text-slate-900 dark:text-slate-100">90%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '90%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Target: ≥ 85%</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                <span>Issue Resolution</span>
                <span className="text-purple-600">92%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Target: ≥ 90%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Breach Incidents & Manual Audit Review (User Spec #19) */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            SLA Breach Audits & Adjustments
          </CardTitle>
          <p className="text-xs text-slate-400">
            Automated notifications flag potential contract breaches; adjustments require committee signoff before invoice credit.
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          {breaches.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{b.id}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{b.clause}</span>
                  <Badge
                    variant={b.status === 'APPROVED' ? 'success' : 'warning'}
                    className="text-[10px] font-bold"
                  >
                    {b.status === 'APPROVED' ? '✓ Adjustment Approved' : '⚠ Action Required'}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{b.description}</p>
                <p className="text-[11px] text-slate-400">{b.date} • Proposed: <strong className="text-slate-700 dark:text-slate-300">{b.proposedAdjustment}</strong></p>
              </div>

              {b.status === 'PENDING_REVIEW' ? (
                <Button
                  size="sm"
                  onClick={() => setReviewModal(b)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
                >
                  Review & Approve
                </Button>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                  Applied to Next Invoice
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Audit SLA Adjustment: {reviewModal.id}
              </h3>
              <button
                onClick={() => setReviewModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-slate-400">Clause Violated:</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{reviewModal.clause}</p>

              <p className="text-slate-400 mt-2">Incident Log:</p>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                {reviewModal.description}
              </p>

              <p className="text-slate-400 mt-2">Recommended Credit Adjustment:</p>
              <p className="text-lg font-black text-emerald-600">{reviewModal.proposedAdjustment}</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setReviewModal(null)}>
                Dismiss
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleApproveAdjustment(reviewModal.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Approve Invoice Credit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
