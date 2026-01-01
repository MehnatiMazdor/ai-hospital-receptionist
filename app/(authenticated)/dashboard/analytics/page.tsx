"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { MessageSquare, Users, BrainCircuit, TrendingUp } from "lucide-react"

const queryData = [
  { day: "Mon", queries: 120, satisfaction: 85 },
  { day: "Tue", queries: 150, satisfaction: 88 },
  { day: "Wed", queries: 180, satisfaction: 92 },
  { day: "Thu", queries: 140, satisfaction: 84 },
  { day: "Fri", queries: 210, satisfaction: 90 },
  { day: "Sat", queries: 90, satisfaction: 95 },
  { day: "Sun", queries: 80, satisfaction: 94 },
]

const intentData = [
  { intent: "Appointment", count: 450, color: "hsl(var(--chart-1))" },
  { intent: "Medication", count: 320, color: "hsl(var(--chart-2))" },
  { intent: "Diagnosis", count: 280, color: "hsl(var(--chart-3))" },
  { intent: "Billing", count: 150, color: "hsl(var(--chart-4))" },
  { intent: "General", count: 100, color: "hsl(var(--chart-5))" },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Queries Analytics</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Monitor patient interactions and AI performance metrics.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Queries", value: "8,241", change: "+14%", icon: MessageSquare },
          { title: "Avg. Daily Queries", value: "1,177", change: "+5%", icon: TrendingUp },
          { title: "Top Intent", value: "Appointments", change: "42% total", icon: BrainCircuit },
          { title: "User Satisfaction", value: "92%", change: "+2% vs avg", icon: Users },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500 font-medium">{stat.change}</span> from previous period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Weekly Query Volume</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Number of queries received over the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80 lg:h-87.5">
            <ChartContainer config={{ queries: { label: "Queries", color: "hsl(var(--primary))" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={queryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="queries" fill="var(--color-queries)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Intent Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Most frequent topics patients are asking about.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80 lg:h-87.5">
            <ChartContainer config={{ count: { label: "Count", color: "hsl(var(--chart-1))" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="intent"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{ fontSize: 11 }}
                    className="sm:w-25"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">AI Satisfaction Score</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Patient feedback trends based on AI response quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80 lg:h-87.5">
            <ChartContainer config={{ satisfaction: { label: "Satisfaction %", color: "hsl(var(--chart-2))" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={queryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} domain={[80, 100]} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="var(--color-satisfaction)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-satisfaction)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
