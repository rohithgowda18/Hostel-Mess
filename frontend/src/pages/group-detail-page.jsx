import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, LogOut, Users, MessageCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/dashboard/empty-state';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { MEAL_TYPES, getMealDisplayName } from '@/data/food-options';

// Helper function to extract friendly name from email or ID
const getMemberDisplayName = (member) => {
  if (!member) return 'Unknown User';
  
  // If it's an email, extract username and capitalize first letter
  if (member.includes('@')) {
    const username = member.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  // If it looks like a MongoDB ObjectID (24 hex chars), show a generic name
  if (/^[a-f0-9]{24}$/i.test(member)) {
    return 'Unknown Member';
  }
  
  // Otherwise return as is
  return member;
};

// Helper function to get current meal based on time
const getCurrentMeal = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Breakfast: 6 AM - 10 AM
  if (hour >= 6 && hour < 10) return 'BREAKFAST';
  
  // Lunch: 11 AM - 2 PM
  if (hour >= 11 && hour < 14) return 'LUNCH';
  
  // Evening Snacks: 3 PM - 7 PM
  if (hour >= 15 && hour < 19) return 'SNACKS';
  
  // Dinner: 7 PM - 10 PM
  if (hour >= 19 && hour < 22) return 'DINNER';
  
  // Default to next meal or breakfast if outside meal times
  return 'BREAKFAST';
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupStatusByMeal, setGroupStatusByMeal] = useState({});
  const [groupChatMessages, setGroupChatMessages] = useState([]);
  const [groupChatInput, setGroupChatInput] = useState('');
  const [groupChatLoading, setGroupChatLoading] = useState(false);

  const currentUser = getUser();
  const currentUserId = currentUser?.email || '';

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const data = await messApi.getGroupDetails(groupId);
      setGroup(data);
      
      // Fetch meal status for all meal types
      const statusByMeal = {};
      for (const mealType of MEAL_TYPES) {
        try {
          const status = await messApi.getGroupMealStatus(groupId, mealType);
          statusByMeal[mealType] = status;
        } catch (error) {
          statusByMeal[mealType] = { goingUsers: [] };
        }
      }
      setGroupStatusByMeal(statusByMeal);

      // Fetch group chat messages
      const messages = await messApi.getMessages('GROUP', groupId);
      setGroupChatMessages(messages);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMealGoing = async (mealType) => {
    try {
      const status = groupStatusByMeal[mealType] || { goingUsers: [] };
      const isGoing = (status.goingUsers || []).includes(currentUserId);

      if (isGoing) {
        await messApi.cancelGroupMealGoing(groupId, mealType, currentUserId);
      } else {
        await messApi.markGroupMealGoing(groupId, mealType, currentUserId);
      }

      fetchGroupDetails();
    } catch (error) {
      console.error('Failed to update meal status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!groupChatInput.trim()) return;

    try {
      setGroupChatLoading(true);
      await messApi.sendMessage('GROUP', groupId, groupChatInput);
      setGroupChatInput('');
      fetchGroupDetails();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setGroupChatLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      // Left as TODO: Backend needs to implement leave group endpoint
      // await messApi.leaveGroup(groupId);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const copyGroupCode = () => {
    if (group?.groupCode) {
      navigator.clipboard.writeText(group.groupCode);
    }
  };

  if (loading) {
    return <div className="text-center text-muted">Loading group...</div>;
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
  const isCreator = group.creator === currentUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/groups')} className="text-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted text-sm mt-1">{members.length} members</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="going" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Going
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Info
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
              <CardDescription>Messages visible only to group members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-slate-900/20 h-96 overflow-y-auto p-4 space-y-3">
                {groupChatMessages.length === 0 ? (
                  <div className="text-center text-muted text-sm h-full flex items-center justify-center">
                    No messages yet
                  </div>
                ) : (
                  groupChatMessages
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    .map((msg, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-sm text-foreground">{msg.username}</p>
                          <p className="text-xs text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm text-foreground mt-1">{msg.message}</p>
                      </div>
                    ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={groupChatInput}
                  onChange={(e) => setGroupChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={groupChatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!groupChatInput.trim() || groupChatLoading}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Going Tab */}
        <TabsContent value="going" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meal Attendance</CardTitle>
              <CardDescription>Mark if you're going to the current meal</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentMeal = getCurrentMeal();
                const status = groupStatusByMeal[currentMeal] || { goingUsers: [] };
                const isGoing = (status.goingUsers || []).includes(currentUserId);
                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted mb-1">Current Meal</p>
                          <p className="font-bold text-2xl text-foreground">{getMealDisplayName(currentMeal)}</p>
                        </div>
                        <Badge variant="default" className="text-lg px-3 py-1">{status.goingCount || 0} Going</Badge>
                      </div>
                      <Button
                        variant={isGoing ? 'danger' : 'success'}
                        className="w-full text-lg py-6"
                        onClick={() => handleToggleMealGoing(currentMeal)}
                      >
                        {isGoing ? 'Not Going' : 'Going'}
                      </Button>
                    </div>
                    <div className="p-4 bg-slate-900/30 rounded-lg border border-border">
                      <p className="text-xs text-muted">Meal times:</p>
                      <div className="text-xs text-muted mt-2 space-y-1">
                        <p>🌅 Breakfast: 6 AM - 10 AM</p>
                        <p>🍽️ Lunch: 11 AM - 2 PM</p>
                        <p>☕ Evening Snacks: 3 PM - 7 PM</p>
                        <p>🌙 Dinner: 7 PM - 10 PM</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>{members.length} members in total</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <EmptyState title="No members" description="This group has no members" />
              ) : (
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{getMemberDisplayName(member)}</p>
                        {member.includes('@') && (
                          <p className="text-xs text-muted">{member}</p>
                        )}
                      </div>
                      {member === group.creator && (
                        <Badge variant="secondary">Creator</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>Group details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-slate-900/20 p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted mb-1">Group Code</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg border border-border bg-card p-2 text-sm text-foreground font-mono">
                      {group.groupCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyGroupCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted mb-1">Created By</p>
                  <div>
                    <p className="text-foreground font-medium">{getMemberDisplayName(group.creator)}</p>
                    <p className="text-xs text-muted">{group.creator}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted mb-1">Members</p>
                  <p className="text-foreground">{members.length}</p>
                </div>
              </div>

              <Button
                variant="danger"
                className="w-full"
                onClick={handleLeaveGroup}
                disabled={isCreator}
                title={isCreator ? "Creator cannot leave group" : ""}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
