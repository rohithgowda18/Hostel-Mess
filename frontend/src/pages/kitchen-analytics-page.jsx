import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import {
  TrendingDown,
  Sparkles,
  Users,
  DollarSign,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

export default function KitchenAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await messApi.getKitchenWasteForecast();
      setData(res);
    } catch (e) {
      console.error('Failed to load kitchen forecast:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      window.open('http://localhost:8080/api/analytics/export', '_blank');
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
            AI Demand Engine
          </Badge>
        }
        title="Kitchen Intelligence & Food Waste Forecaster"
        description="Predictive dining attendance forecasting, automated raw ingredient batch sizing, and contractor SLA penalty audit."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadForecast}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExportCsv}
              disabled={downloading}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Audit CSV
            </Button>
          </div>
        }
      />

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Projected Headcount"
          value={data?.projectedHeadcount || 0}
          subtitle={`Next service: ${data?.nextSlot || 'DINNER'} (${data?.confidencePercentage || 94}% confidence)`}
          accentColor="blue"
        />
        <StatCard
          icon={TrendingDown}
          title="Food Waste Prevented"
          value={`${data?.foodSavedKg || 0} kg`}
          subtitle="Based on verified meal skips today"
          badgeText="Eco Impact"
          accentColor="emerald"
        />
        <StatCard
          icon={DollarSign}
          title="Estimated Budget Saved"
          value={`₹${(data?.moneySavedInr || 0).toLocaleString()}`}
          subtitle="Over-preparation cost avoided"
          accentColor="amber"
        />
        <StatCard
          icon={ShieldCheck}
          title="Contractor SLA Score"
          value={`${data?.contractorSlaScore || 85}%`}
          subtitle={`Penalty: ${data?.recommendedPenaltyDeductionPercent || 0}% invoice deduction`}
          badgeText={data?.contractorSlaScore >= 80 ? 'Good Standing' : 'Under Review'}
          accentColor="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Batch Preparation Sizing Calculator */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Recommended Batch Cooking Quantities
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated precisely for {data?.projectedHeadcount || 0} dining students
                </p>
              </div>
              <Badge variant="success">Auto-Scaled</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Raw Basmati / Ponni Rice
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {data?.ingredients?.riceKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <p className="text-[11px] text-slate-500">0.18 kg per resident ratio</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Toor / Moong Dal Mix
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {data?.ingredients?.dalKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <p className="text-[11px] text-slate-500">Sambar / Dal Tadka batch</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mixed Vegetables
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {data?.ingredients?.sabziKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <p className="text-[11px] text-slate-500">Fresh market preparation</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Chapatis / Rotis
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {data?.ingredients?.chapatiUnits || 0} <span className="text-xs font-normal text-slate-400">units</span>
                </div>
                <p className="text-[11px] text-slate-500">2.2 pieces per attendee baseline</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Smart Demand Algorithm:</strong> Calculations incorporate registered intent votes, exam schedule adjustments, and historic weekend dining attrition.
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column (5 Cols): Contractor SLA Scorecard */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 shadow-card space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Catering Vendor SLA Compliance
              </h3>
              <p className="text-xs text-slate-500">Contractual quality and hygiene metrics</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Average Food Rating</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {data?.averageFoodRating || 4.1} / 5.0
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Unresolved Complaints</span>
                <span className={`font-bold ${data?.unresolvedComplaints > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {data?.unresolvedComplaints || 0} issues
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Contractual Threshold</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Min 4.0 / 5.0</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-900 dark:text-slate-100">Recommended Monthly Deduction</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  {data?.recommendedPenaltyDeductionPercent || 0}%
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Warden Audit Policy:</span>
              <p>
                Deductions are automatically factored into monthly catering reimbursement invoices whenever the composite score drops below 80%.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
