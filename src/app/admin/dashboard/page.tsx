
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"; // Assuming you have a Calendar component
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, FileText, BarChartBig, Activity, Download, Filter, AlertCircle, MessageSquare, LogOut, Settings, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import Link from 'next/link';

// Mock Data
const kpiData = [
  { title: "Total Users", value: "1,250", icon: Users, change: "+5% this month" },
  { title: "Total Reports Generated", value: "5,680", icon: FileText, change: "+120 this week" },
  { title: "Active Users Today", value: "312", icon: Activity, change: "-2% vs yesterday" },
  { title: "AI Tokens Used (Today)", value: "1.2M", icon: BarChartBig, change: "Total: 500M" },
  { title: "Total Exports", value: "850", icon: Download, change: "CSV most popular" },
  { title: "Active Alerts", value: "3", icon: AlertCircle, change: "Review needed" },
];

const mockLogs = [
  { id: "log001", userId: "user123", time: new Date().toISOString(), action: "search", outcome: "Success", tokensUsed: 230, entityId: "N/A" },
  { id: "log002", userId: "user456", time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), action: "generateReport", outcome: "Success", tokensUsed: 4100, entityId: "reportABC" },
  { id: "log003", userId: "user123", time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), action: "export", outcome: "Success", tokensUsed: 0, entityId: "reportXYZ (CSV)" },
  { id: "log004", userId: "user789", time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), action: "chat", outcome: "Success", tokensUsed: 150, entityId: "sessionS01" },
  { id: "log005", userId: "user456", time: new Date(Date.now() - 1000 * 60 * 20).toISOString(), action: "generateReport", outcome: "Failed", tokensUsed: 500, entityId: "N/A - Error" },
];

const mockUsers = [
    { id: "user123", name: "Ammar Test", email: "ammar@example.com", plan: "Pro", reports: 5, tokensUsed: 5832, lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: "user456", name: "Jane Doe", email: "jane@example.com", plan: "Free", reports: 1, tokensUsed: 4100, lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: "user789", name: "Sam Wilson", email: "sam@example.com", plan: "Enterprise", reports: 25, tokensUsed: 102500, lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
];

export default function AdminDashboardPage() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen w-full bg-background flex flex-col p-4 md:p-6 lg:p-8">
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary">AdminHub Contvia</h1>
                <p className="text-muted-foreground text-base md:text-lg">System Activity & Usage Analytics</p>
            </div>
            <Button variant="outline" asChild className="mt-3 sm:mt-0">
                <Link href="/"> <LogOut className="mr-2 h-4 w-4" /> Back to App </Link>
            </Button>
        </div>
      </header>

      {/* KPIs Section */}
      <section className="mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {kpiData.map((kpi) => (
            <Card key={kpi.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{kpi.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Content: Tabs and Filters */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 flex-grow">
        {/* Center Content with Tabs */}
        <main className="flex-grow lg:w-2/3 xl:w-3/4">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4 rounded-lg">
              <TabsTrigger value="activity">Activity Logs</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="exports">Exports</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card className="shadow-lg rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Live Activity Feed</CardTitle>
                  <CardDescription>Recent actions across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Tokens Used</TableHead>
                        <TableHead>Entity ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{log.userId}</TableCell>
                          <TableCell>{format(new Date(log.time), "PPpp")}</TableCell>
                          <TableCell><span className={`px-2 py-1 text-xs rounded-full ${log.action === 'search' ? 'bg-blue-100 text-blue-700' : log.action === 'generateReport' ? 'bg-green-100 text-green-700' : log.action === 'export' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{log.action}</span></TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${log.outcome === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {log.outcome}
                            </span>
                          </TableCell>
                          <TableCell>{log.tokensUsed > 0 ? log.tokensUsed.toLocaleString() : "-"}</TableCell>
                          <TableCell>{log.entityId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card className="shadow-lg rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">User Management</CardTitle>
                  <CardDescription>Overview of all registered users.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Tokens Used</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{user.id}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell><span className={`px-2 py-0.5 text-xs rounded-full ${user.plan === 'Pro' ? 'bg-primary/20 text-primary' : user.plan === 'Enterprise' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{user.plan}</span></TableCell>
                          <TableCell>{user.reports}</TableCell>
                          <TableCell>{user.tokensUsed.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(user.lastActive), "PPp")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent-foreground">View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Placeholder for other tabs */}
            {['reports', 'sessions', 'exports', 'alerts'].map(tabName => (
                 <TabsContent key={tabName} value={tabName}>
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader>
                        <CardTitle className="text-xl text-primary capitalize">{tabName}</CardTitle>
                        <CardDescription>Manage and view all {tabName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <p className="text-muted-foreground">Content for {tabName} will be displayed here. (Not yet implemented)</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
          </Tabs>
        </main>

        {/* Right Filter Panel */}
        <aside className="lg:w-1/3 xl:w-1/4">
          <Card className="shadow-lg rounded-xl sticky top-6">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center"><Filter className="mr-2 h-5 w-5" /> Filters</CardTitle>
              <CardDescription>Refine the data shown in the tables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="userIdFilter" className="text-sm font-medium text-muted-foreground">User ID</label>
                <Input id="userIdFilter" placeholder="Enter User ID" className="mt-1" />
              </div>
              <div>
                <label htmlFor="actionTypeFilter" className="text-sm font-medium text-muted-foreground">Action Type</label>
                <Select>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="search">Search</SelectItem>
                    <SelectItem value="generateReport">Generate Report</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="dateFromFilter" className="text-sm font-medium text-muted-foreground block mb-1">Date From</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
               <div>
                <label htmlFor="dateToFilter" className="text-sm font-medium text-muted-foreground block mb-1">Date To</label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Apply Filters</Button>
              <Button variant="outline" className="w-full">Reset Filters</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      
      <footer className="text-center text-sm text-muted-foreground mt-8 py-4 border-t">
        Contvia Admin Panel &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}


    