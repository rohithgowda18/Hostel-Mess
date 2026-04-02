import { Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function CommunityChatPreview({ messages, onlineUsers }) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Chat Preview</CardTitle>
        <CardDescription>Quick pulse of student conversations and online users</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3">
          {safeMessages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-slate-800/20 p-4 text-sm text-muted">
              No community messages yet.
            </div>
          ) : null}

          {safeMessages.map((message) => (
            <div key={message.id} className="rounded-xl border border-border bg-slate-800/30 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{message.user}</p>
                <span className="text-xs text-muted">{message.time}</span>
              </div>
              <p className="text-sm text-muted">{message.message}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Online Users</p>
          <div className="flex flex-wrap gap-2">
            {safeUsers.length === 0 ? (
              <Badge variant="neutral">No users online</Badge>
            ) : null}

            {safeUsers.map((user) => (
              <Badge key={user} variant="neutral" className="gap-1.5">
                <Circle className="h-2.5 w-2.5 fill-success text-success" />
                {user}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CommunityChatPreview;
