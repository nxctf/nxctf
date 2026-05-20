import React from 'react'
import {
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
import type { UserLite } from '../types'

interface GlobalAdminsCardProps {
  admins: UserLite[]
}

const GlobalAdminsCard: React.FC<GlobalAdminsCardProps> = ({ admins }) => {
  return (
    <Card className={ADMIN_CARD_PLAIN_CLASS}>
      <CardHeader>
        <CardTitle>Global Admins</CardTitle>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-sm text-muted-foreground">No global admins found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.username}</TableCell>
                  <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default GlobalAdminsCard
