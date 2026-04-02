import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmptyState from '@/components/dashboard/empty-state';

function ratingVariant(rating) {
  if (rating >= 4) return 'success';
  if (rating === 3) return 'warning';
  return 'danger';
}

function RecentFeedbackTable({ rows, onReset }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback</CardTitle>
        <CardDescription>Latest comments from students and hostel residents</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title="No feedback found"
            description="No feedback entries match the current filters."
            actionLabel="Refresh"
            onAction={onReset}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.user}</TableCell>
                  <TableCell className="max-w-[360px] text-muted">{row.comment}</TableCell>
                  <TableCell>
                    <Badge variant={ratingVariant(row.rating)}>{row.rating}/5</Badge>
                  </TableCell>
                  <TableCell className="text-muted">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentFeedbackTable;
