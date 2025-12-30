import Link from "next/link"
import { Upload, FileText, Activity, Users, MessageSquare, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Hi Admin, welcome to your dashboard</h1>
          <p className="text-muted-foreground">Manage your medical knowledge base and monitor patient interactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-5 w-5" />
              Upload PDF
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/pdfs">
              <FileText className="mr-2 h-5 w-5" />
              Chunked PDFs
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Chunks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.4k</div>
            <p className="text-xs text-muted-foreground">Across all embeddings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">Live interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Knowledge retrieval and response latency across the hospital network.</CardDescription>
          </CardHeader>
          <CardContent className="h-75 flex items-center justify-center border-t pt-6">
            <div className="text-center space-y-2">
              <Activity className="h-12 w-12 text-primary/20 mx-auto" />
              <p className="text-muted-foreground font-medium">Response Analytics Loading...</p>
              <p className="text-xs text-muted-foreground/60">Real-time vector search metrics</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Latest medical documentation processed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "Patient_Care_v2.pdf", size: "2.4 MB", status: "Embedded" },
                { name: "Clinical_Trials.pdf", size: "5.8 MB", status: "Embedded" },
                { name: "Medication_Guide.pdf", size: "1.2 MB", status: "Processing" },
              ].map((file, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded-full ${file.status === "Embedded" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {file.status}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary" asChild>
              <Link href="/dashboard/pdfs">View All Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
