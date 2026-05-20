import React from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import type { EventAdminRow } from '../types'

interface EventAdminsCardProps {
  admins: EventAdminRow[]
  onAskRemove: (admin: EventAdminRow) => void
}

const EventAdminsCard: React.FC<EventAdminsCardProps> = ({ admins, onAskRemove }) => {
  return (
    <Card className={ADMIN_CARD_PLAIN_CLASS}>
      <CardHeader>
        <CardTitle>Event Admins</CardTitle>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-sm text-muted-foreground">No event admins assigned yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="w-30">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={`${admin.user_id}:${admin.event_id}`}>
                  <TableCell className="font-medium">{admin.username}</TableCell>
                  <TableCell>{admin.event_name}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onAskRemove(admin)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default EventAdminsCard
