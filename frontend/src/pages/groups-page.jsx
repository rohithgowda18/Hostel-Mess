import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/dashboard/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

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

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const currentUser = getUser();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await messApi.getUserGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const newGroup = await messApi.createGroup(groupName);
      setGroups([...groups, newGroup]);
      setGroupName('');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) return;

    try {
      const joinedGroup = await messApi.joinGroup(groupCode);
      setGroups([...groups, joinedGroup]);
      setGroupCode('');
      setJoinDialogOpen(false);
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups</h1>
          <p className="text-muted mt-1">Manage and coordinate with your groups</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>Create a new group to coordinate meals</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
                <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Group</DialogTitle>
                <DialogDescription>Enter a group code to join</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Group code"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
                />
                <Button onClick={handleJoinGroup} disabled={!groupCode.trim()}>
                  Join Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted">Loading groups...</div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create or join a group to get started"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group._id || group.id}
              className="cursor-pointer transition-all hover:border-primary hover:bg-card/50"
              onClick={() => navigate(`/groups/${group._id || group.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {group.name}
                  <Badge variant="secondary">{group.memberCount || group.members?.length || 0}</Badge>
                </CardTitle>
                <CardDescription>Code: {group.groupCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Open Group
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
