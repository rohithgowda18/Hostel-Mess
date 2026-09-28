import { useState } from 'react';
import {
  Star,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const DISH_RATINGS = [
  { dish: 'Paneer Butter Masala', category: 'Curry', rating: 4.5, reviews: 284, sentiment: 'Positive', status: 'Top Performer' },
  { dish: 'Steamed Basmati Rice', category: 'Staple', rating: 4.1, reviews: 312, sentiment: 'Positive', status: 'Healthy' },
  { dish: 'Dal Tadka', category: 'Lentil', rating: 3.8, reviews: 204, sentiment: 'Neutral', status: 'Salt calibrated' },
  { dish: 'Whole Wheat Chapati', category: 'Bread', rating: 3.5, reviews: 290, sentiment: 'Needs Work', status: 'Check Softness' },
  { dish: 'Filter Coffee', category: 'Beverage', rating: 4.8, reviews: 410, sentiment: 'Positive', status: 'Top Performer' },
  { dish: 'Gulab Jamun', category: 'Dessert', rating: 4.7, reviews: 340, sentiment: 'Positive', status: 'Top Performer' },
];

const WEEKLY_TREND = [
  { day: 'Mon', score: 4.1 },
  { day: 'Tue', score: 3.8 },
  { day: 'Wed', score: 4.4 },
  { day: 'Thu', score: 4.5 },
  { day: 'Fri', score: 4.2 },
];

export default function AdminQualityPage() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <PageHeader
        title="Food Quality & Sentiment Analytics"
        subtitle="Holistic meal quality scoring, student taste sentiment, and contractor SLA evaluation."
        badge="Quality Assurance"
      />

      {/* Main KPI Row (User Spec #14) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs col-span-2 md:col-span-1">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">4.2</span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 pt-1">
              {[1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-current" />
              ))}
              <Star className="h-3.5 w-3.5 fill-amber-400/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taste & Flavor</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">4.3</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '86%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hygiene & Prep</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">4.5</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Portion Quantity</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">3.9</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '78%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Serving Temp</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">4.0</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '80%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Bar (User Spec #14) */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              5-Day Quality Evolution
            </CardTitle>
            <Badge variant="outline" className="text-xs font-bold text-emerald-600">
              +6.8% Week-over-Week
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-end justify-between gap-4 h-36 px-4">
            {WEEKLY_TREND.map((item) => {
              const heightPct = Math.round((item.score / 5) * 100);
              return (
                <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.score}
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-28 flex items-end">
                    <div
                      className="w-full bg-blue-600 rounded-t-xl transition-all duration-500"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{item.day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dish Performance Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Individual Dish Scorecard
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Dish</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Student Rating</th>
                <th className="p-3.5">Reviews Logged</th>
                <th className="p-3.5">Sentiment</th>
                <th className="p-3.5 text-right pr-4">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {DISH_RATINGS.map((d) => (
                <tr key={d.dish} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 pl-4 font-bold text-slate-900 dark:text-slate-100">
                    {d.dish}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {d.category}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                      ★ {d.rating}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {d.reviews}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[11px] font-semibold ${
                      d.sentiment === 'Positive' ? 'text-emerald-600' : d.sentiment === 'Neutral' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {d.sentiment}
                    </span>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    <Badge
                      variant={d.status === 'Top Performer' ? 'success' : d.status === 'Healthy' ? 'neutral' : 'warning'}
                      className="text-[10px] font-bold"
                    >
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
