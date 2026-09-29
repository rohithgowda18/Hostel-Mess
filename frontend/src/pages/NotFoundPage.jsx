import { useNavigate } from 'react-router-dom';
import { Utensils, Home, ArrowLeft, Calendar, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';

export default function NotFoundPage() {
  const navigate = useNavigate();
  usePageTitle('Page Not Found (404)', 'The requested dining portal page does not exist or has been relocated.');

  return (
    <div className="min-h-screen bg-page text-on-surface flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 sm:p-10 rounded-2xl border border-outline-variant/30 shadow-lg text-center space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Icon Header */}
        <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-primary shadow-inner">
          <Utensils className="h-8 w-8 text-primary" />
        </div>

        {/* 404 Typography */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold uppercase tracking-wider">
            Status Code 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Dining Hall or Page Not Found
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            The page, menu timetable, or portal route you are looking for has been moved, renamed, or is currently unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/student/dashboard')}
            className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs h-10 px-5 gap-2 cursor-pointer shadow-xs"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/meals')}
            className="w-full sm:w-auto border-outline-variant/30 text-on-surface hover:bg-surface-container font-semibold text-xs h-10 px-4 gap-2 cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-primary" /> View Meals Menu
          </Button>
        </div>

        {/* Contact help footer */}
        <div className="pt-4 border-t border-outline-variant/20 text-[11px] text-on-surface-variant flex items-center justify-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          <span>Need assistance? Contact </span>
          <a href="mailto:mess-support@university.edu" className="text-primary font-semibold hover:underline">
            mess-support@university.edu
          </a>
        </div>
      </div>
    </div>
  );
}
