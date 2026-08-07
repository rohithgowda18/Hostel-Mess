import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, LogOut, Info, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/dashboard/empty-state';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { getMealDisplayName } from '@/data/food-options';
import { QRCodeSVG } from 'qrcode.react';

const getMemberDisplayName = (member) => {
  if (!member) return 'Unknown User';
  if (member.includes('@')) {
    const username = member.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  if (/^[a-f0-9]{24}$/i.test(member)) {
    return 'Unknown Member';
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

  const currentUser = getUser();
  const currentUserId = currentUser?.email || '';

  const fetchGroupDetails = async () => {
    try {
      const data = await messApi.getGroupDetails(groupId);
      setGroup(data);
      
      const currentMeal = getCurrentMeal();
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
    const currentMeal = getCurrentMeal();
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
    if (!confirm('Are you sure you want to leave this group?')) return;
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
      alert('Group code copied!');
    }
  };

  const copyInviteLink = () => {
    if (group?.groupCode) {
      const link = `${window.location.origin}/groups?join=${group.groupCode}`;
      navigator.clipboard.writeText(link);
      alert('Invite link copied!');
    }
  };

  if (loading) {
    return <div className="text-center text-muted py-10">Loading group details...</div>;
  }

  if (!group) {
    return (
      <div className="text-center">
        <EmptyState title="Group not found" description="This group doesn't exist" />
        <Button onClick={() => navigate('/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  const members = group.members || [];
  const inviteLink = `${window.location.origin}/groups?join=${group.groupCode}`;
  const currentMeal = getCurrentMeal();

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/groups')} className="text-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted text-xs">{members.length} members</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleLeaveGroup} className="gap-2">
          <LogOut className="h-4 w-4" /> Leave Group
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Members List - Going Status side card */}
        <Card className="bg-slate-900 border-border lg:col-span-1 h-fit">
          <CardHeader className="py-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">Going for {getMealDisplayName(currentMeal)}</CardTitle>
            <CardDescription className="text-[10px]">Click your name to toggle</CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {members.map((member) => {
              const isGoing = currentMealGoing.includes(member);
              const isMe = member === currentUserId;
              return (
                <button
                  key={member}
                  disabled={!isMe}
                  onClick={() => handleToggleGoing(member)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    isMe ? 'hover:bg-slate-800/40 cursor-pointer' : 'cursor-default'
                  } ${isGoing ? 'bg-success/10 border-success/30 text-success' : 'bg-slate-950/20 border-border/30 text-muted'}`}
                >
                  <span className="truncate font-medium">{getMemberDisplayName(member)} {isMe && '(You)'}</span>
                  {isGoing ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Details & Invitation Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900/50 border-border">
            <CardHeader>
              <CardTitle>Group Invitation</CardTitle>
              <CardDescription>Share group access using QR Code or link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/40 p-4 rounded-xl border border-border/50">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG value={inviteLink} size={150} />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <span className="text-xs text-muted block mb-1">Invite Link</span>
                    <div className="flex gap-2">
                      <Input value={inviteLink} readOnly className="bg-slate-950 border-border text-xs" />
                      <Button variant="outline" size="sm" onClick={copyInviteLink}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted block mb-1">Short Group Code</span>
                    <div className="flex gap-2">
                      <code className="flex-1 rounded-lg border border-border bg-slate-950 p-2 text-sm font-mono text-foreground">
                        {group.groupCode}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyGroupCode}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
