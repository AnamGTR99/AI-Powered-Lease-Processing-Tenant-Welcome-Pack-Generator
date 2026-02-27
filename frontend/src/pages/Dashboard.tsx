import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
