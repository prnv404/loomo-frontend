'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { healthService, HealthStatus } from '@/lib/services'

export function ApiDemo() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await healthService.checkHealth()
      setHealthData(response.health)
    } catch (err: any) {
      setError(err.message || 'Failed to check GraphQL API health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API Status
          {healthData?.status === 'ok' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {error && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          GraphQL API connection status using DEV_URL from environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking API health...</span>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <Badge variant="destructive">Error</Badge>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {healthData && !loading && (
          <div className="space-y-2">
            <Badge variant="secondary">Connected</Badge>
            <div className="text-sm space-y-1">
              <p><strong>Status:</strong> {healthData.status}</p>
              <p><strong>Version:</strong> {healthData.version}</p>
              <p><strong>Last Check:</strong> {new Date(healthData.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={checkHealth} 
          disabled={loading}
          className="w-full gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
