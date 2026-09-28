import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  LogOut,
  Check,
  X,
  Users,
  QrCode,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { getMealDisplayName } from '@/data/food-options';
import { QRCodeSVG } from 'qrcode.react';

const getMemberDisplayName = (member) => {
  if (!member) return 'Unknown Resident';
  if (member.includes('@')) {
    const username = member.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  return member;
};

const getCurrentMeal = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'BREAKFAST';
  if (hour >= 11 && hour < 14) return 'LUNCH';
  if (hour >= 15 && hour < 19) return 'SNACKS';
  return 'DINNER';
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMealGoing, setCurrentMealGoing] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentUser = getUser() || {};
  const currentUserId = currentUser.email || '';
  const currentMeal = getCurrentMeal();

  const fetchGroupDetails = async () => {
    try {
      const data = await messApi.getGroupDetails(groupId);
      setGroup(data);

      try {
        const status = await messApi.getGroupMealStatus(groupId, currentMeal);
        setCurrentMealGoing(status.goingUsers || []);
      } catch (error) {
        setCurrentMealGoing([]);
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGroupDetails();
  }, [groupId]);

  const handleToggleGoing = async (memberEmail) => {
    if (memberEmail !== currentUserId) return;
    const isGoing = currentMealGoing.includes(currentUserId);

    try {
      if (isGoing) {
        await messApi.cancelGroupMealGoing(groupId, currentMeal, currentUserId);
      } else {
        await messApi.markGroupMealGoing(groupId, currentMeal, currentUserId);
      }
      fetchGroupDetails();
    } catch (error) {
      console.error('Failed to toggle going status:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this buddy group?')) return;
    try {
      await messApi.leaveGroup(groupId);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const copyGroupCode = () => {
    if (group?.groupCode) {
      navigator.clipboard.writeText(group.groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyInviteLink = () => {
    if (group?.groupCode) {
      const link = `${window.location.origin}/groups?join=${group.groupCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <EmptyState
          title="Buddy Group Not Found"
          description="This group does not exist or you are not a member."
          actionLabel="Back to Groups"
          onAction={() => navigate('/groups')}
        />
      </div>
    );
  }

  const members = group.members || [];
  const inviteLink = `${window.location.origin}/groups?join=${group.groupCode}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/groups')}
        className="gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to All Groups
      </Button>

      <PageHeader
        title={group.name}
        description={`Active dining squad with ${members.length} members. Share the invite code or QR for easy onboarding.`}
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={handleLeaveGroup}
            className="text-xs font-bold gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Leave Group
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Invite Share */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 shadow-card space-y-6">
            <div>
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Group QR Invite & Passcode
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Peers can scan this QR code or input the group code to join instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="p-3 bg-white rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                <QRCodeSVG value={inviteLink} size={140} />
              </div>

              <div className="space-y-4 w-full">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Group Code
                  </span>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-base font-mono font-bold text-teal-700 dark:text-teal-400">
                      {group.groupCode}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyGroupCode} className="text-xs font-bold gap-1 shrink-0">
                      <Copy className="h-4 w-4" /> {copiedCode ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Direct Invite URL
                  </span>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="text-xs h-9 font-mono" />
                    <Button variant="outline" size="sm" onClick={copyInviteLink} className="text-xs font-bold gap-1 shrink-0">
                      <Share2 className="h-4 w-4" /> {copiedLink ? 'Copied' : 'Share'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Members & Meal Coordination */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {getMealDisplayName(currentMeal)} Status
                </h3>
                <p className="text-[11px] text-slate-400">Click your name to toggle</p>
              </div>
              <Badge variant="primary" className="text-[10px]">
                {currentMealGoing.length} Going
              </Badge>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {members.map((member) => {
                const isGoing = currentMealGoing.includes(member);
                const isMe = member === currentUserId;

                return (
                  <button
                    key={member}
                    disabled={!isMe}
                    onClick={() => handleToggleGoing(member)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-md border text-xs transition-colors ${
                      isMe ? 'hover:border-teal-500 cursor-pointer' : 'cursor-default'
                    } ${
                      isGoing
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-7 w-7 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {member.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">
                        {getMemberDisplayName(member)} {isMe && '(You)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isGoing ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check className="h-3.5 w-3.5" /> Going
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not Marked</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
