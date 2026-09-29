import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Calendar, Bell, Star, MessageSquareWarning } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/hooks/use-page-title';

export default function EmptyStatePage() {
  const navigate = useNavigate();
  usePageTitle('Empty State Showcase', 'Preview of standard empty state views across the mess dining portal.');

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Standard Empty State Views</h1>
        <p className="text-xs text-on-surface-variant">
          Campus portal components displayed when meal reports, notices, feedback, or attendance entries have no data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empty State 1: Meals */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <EmptyState
            icon={UtensilsCrossed}
            title="No Meal Verification Reports"
            description="No student residents have filed verification reports for this meal session yet."
            actionLabel="Report Current Meal"
            onAction={() => navigate('/student/report-meal')}
            secondaryActionLabel="View Weekly Menu"
            onSecondaryAction={() => navigate('/student/meals')}
          />
        </div>

        {/* Empty State 2: Notices */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <EmptyState
            icon={Bell}
            title="All Clear — No Active Notices"
            description="There are currently no dining announcements or kitchen schedule updates published by the hostel warden."
            actionLabel="Refresh Board"
            onAction={() => window.location.reload()}
          />
        </div>

        {/* Empty State 3: Feedback */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <EmptyState
            icon={Star}
            title="No Quality Ratings Submitted"
            description="You haven't submitted any feedback for today's dining hall services. Your ratings help improve meals."
            actionLabel="Rate Today's Food"
            onAction={() => navigate('/student/feedback')}
          />
        </div>

        {/* Empty State 4: Complaints */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <EmptyState
            icon={MessageSquareWarning}
            title="Zero Pending Grievances"
            description="You have no unresolved complaints or tickets filed with the hostel mess administration."
            actionLabel="File New Issue"
            onAction={() => navigate('/student/complaints')}
          />
        </div>
      </div>
    </div>
  );
}
