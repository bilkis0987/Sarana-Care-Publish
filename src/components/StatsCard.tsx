import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  bgIconColor?: string
  index?: number
}

export function StatsCard({ title, value, icon: Icon, color = "text-primary", bgIconColor = "bg-primary/10", index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-glass border-none overflow-hidden glass relative group">
        <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text-', 'bg-')} opacity-70`} />
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-3.5 rounded-2xl ${bgIconColor} ${color} shadow-sm transition-colors duration-300`}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
