import { formatDate } from '@/lib/utils'

interface Props {
  date: string | null | undefined
  label?: string
}

export default function DueDateBadge({ date, label = 'Fällig' }: Props) {
  if (!date) return <span className="text-gray-400 text-xs">–</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(date)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let color = 'bg-green-100 text-green-700'
  let urgency = `in ${diffDays}d`

  if (diffDays < 0) {
    color = 'bg-red-100 text-red-700'
    urgency = `überfällig (${Math.abs(diffDays)}d)`
  } else if (diffDays <= 7) {
    color = 'bg-red-100 text-red-700'
    urgency = `in ${diffDays}d`
  } else if (diffDays <= 30) {
    color = 'bg-yellow-100 text-yellow-700'
    urgency = `in ${diffDays}d`
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}: {formatDate(date)} ({urgency})
    </span>
  )
}

