import { LucideIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: number
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-600',   text: 'text-blue-700',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-600',  text: 'text-green-700',  border: 'border-green-100' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-600',    text: 'text-red-700',    border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-100' },
}

export function MetricCard({ title, value, subtitle, icon: Icon, color, trend }: MetricCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <div className={cn('bg-white rounded-xl border p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow', colors.border)}>
      <div className={cn('p-3 rounded-xl flex-shrink-0', colors.icon)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={cn('h-3.5 w-3.5', trend >= 0 ? 'text-green-500' : 'text-red-500 rotate-180')} />
            <span className={cn('text-xs font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend > 0 ? '+' : ''}{trend}% vs período anterior
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
