"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  MessageSquare,
  BrainCircuit,
  Layers,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Upload,
  Award,
  LogOut,
  BookOpen,
  Map,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

// ─── Mock Analytics Data ────────────────────────────────────────────────────────

const MONTHLY_SIGNUPS = [
  { month: "Sep", users: 12 },
  { month: "Oct", users: 28 },
  { month: "Nov", users: 45 },
  { month: "Dec", users: 38 },
  { month: "Jan", users: 62 },
  { month: "Feb", users: 89 },
  { month: "Mar", users: 134 },
];

const TOOL_USAGE = [
  { month: "Sep", quizzes: 8, flashcards: 14, concepts: 5 },
  { month: "Oct", quizzes: 22, flashcards: 31, concepts: 12 },
  { month: "Nov", quizzes: 35, flashcards: 48, concepts: 19 },
  { month: "Dec", quizzes: 29, flashcards: 42, concepts: 24 },
  { month: "Jan", quizzes: 58, flashcards: 76, concepts: 35 },
  { month: "Feb", quizzes: 72, flashcards: 95, concepts: 48 },
  { month: "Mar", quizzes: 96, flashcards: 128, concepts: 64 },
];

const DOCUMENT_UPLOADS = [
  { month: "Sep", uploads: 5 },
  { month: "Oct", uploads: 14 },
  { month: "Nov", uploads: 22 },
  { month: "Dec", uploads: 18 },
  { month: "Jan", uploads: 34 },
  { month: "Feb", uploads: 47 },
  { month: "Mar", uploads: 61 },
];

const ENGAGEMENT_RATE = [{ name: "Engagement", value: 78, fill: "#fff" }];

const RECENT_ACTIVITY = [
  { id: 1, type: "signup", text: "Sarah Chen created an account", time: "2 min ago", icon: Users },
  { id: 2, type: "upload", text: "Marcus Vance uploaded 'Organic Chemistry.pdf'", time: "8 min ago", icon: Upload },
  { id: 3, type: "quiz", text: "Elena Rodriguez completed a quiz on Vectors", time: "14 min ago", icon: BrainCircuit },
  { id: 4, type: "flashcard", text: "James T. generated 12 flashcards", time: "22 min ago", icon: Layers },
  { id: 5, type: "concept", text: "Amara Diallo used Concept Explainer on 'Thermodynamics'", time: "31 min ago", icon: Lightbulb },
  { id: 6, type: "signup", text: "Lucas Moretti created an account", time: "45 min ago", icon: Users },
  { id: 7, type: "upload", text: "Sofia Andreou uploaded 'Calculus II Notes.pdf'", time: "1h ago", icon: Upload },
  { id: 8, type: "quiz", text: "David Kim scored 9/10 on History quiz", time: "1h ago", icon: Award },
];

const TOP_USERS = [
  { rank: 1, name: "Elena Rodriguez", activity: 142, docs: 8 },
  { rank: 2, name: "Sarah Chen", activity: 128, docs: 6 },
  { rank: 3, name: "Marcus Vance", activity: 97, docs: 12 },
  { rank: 4, name: "James T.", activity: 84, docs: 4 },
  { rank: 5, name: "Amara Diallo", activity: 71, docs: 5 },
];

// ─── KPI Cards ──────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: "Total Students", value: "408", trend: "+18%", up: true, icon: Users },
  { label: "Documents", value: "201", trend: "+24%", up: true, icon: FileText },
  { label: "Chat Sessions", value: "1,247", trend: "+12%", up: true, icon: MessageSquare },
  { label: "Quizzes Taken", value: "320", trend: "+33%", up: true, icon: BrainCircuit },
  { label: "Flashcards", value: "434", trend: "+28%", up: true, icon: Layers },
  { label: "Concepts", value: "207", trend: "+9%", up: true, icon: Lightbulb },
];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-400 capitalize">{entry.dataKey}:</span>
          <span className="text-white font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Animation Variants ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6 },
  },
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-white/20 relative">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#050505] to-[#050505]" />
        <div
          className="absolute inset-0 grid-bg opacity-[0.03]"
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-[#050505]/80 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col shrink-0 relative z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-neutral-800/10 via-transparent to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="p-6 pb-6 relative z-10">
          <Link href="/" className="flex flex-col group inline-block focus:outline-none">
            <span className="leading-none uppercase group-hover:opacity-80 transition-opacity text-2xl font-semibold tracking-tight font-display text-white">
              EduNova
            </span>
            <span className="leading-none uppercase group-hover:text-white transition-colors text-[10px] font-light text-neutral-500 tracking-[0.25em] font-display mt-1.5">
              Admin Console
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 relative z-10">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 border border-white/10 rounded-lg transition-all font-medium text-sm"
          >
            <Activity size={18} />
            <span>Analytics</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all text-sm"
          >
            <MessageSquare size={18} />
            <span>Tutor Chat</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="px-4 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.2em] mb-3 font-mono">
              Coming Soon
            </p>
            <div className="flex items-center gap-3 px-4 py-3 text-neutral-700 cursor-not-allowed text-sm">
              <Map size={18} />
              <span>Weak Topics</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-neutral-700 cursor-not-allowed text-sm">
              <Settings size={18} />
              <span>AI Quizzes</span>
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5 bg-black/50 relative z-10">
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="flex items-center justify-center gap-3 w-full text-center text-neutral-500 hover:text-white transition-colors tracking-widest uppercase text-xs font-semibold py-2"
          >
            <LogOut size={16} />
            <span>Exit Console</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-8 lg:p-12 max-w-[1600px] mx-auto"
        >
          {/* Header */}
          <motion.header variants={itemVariants} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em]">
                Admin Overview
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-medium tracking-tight text-white leading-tight">
              Platform
              <br />
              <span className="text-neutral-600">Analytics</span>
            </h1>
            <p className="text-neutral-500 mt-4 font-light max-w-lg">
              Real-time overview of EduNova engagement, growth metrics, and student activity across all services.
            </p>
          </motion.header>

          {/* ─── KPI Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
            {KPI_CARDS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                variants={itemVariants}
                className="group relative bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/15 transition-all duration-500 overflow-hidden"
              >
                {/* Top glow line */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex items-center justify-between mb-4">
                  <kpi.icon size={18} className="text-neutral-600 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
                  <div
                    className={`flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase ${
                      kpi.up ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.trend}
                  </div>
                </div>

                <p className="text-2xl lg:text-3xl font-display font-medium text-white tracking-tight mb-1">{kpi.value}</p>
                <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em]">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* ─── Charts Row 1 ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* User Signups Area Chart */}
            <motion.div
              variants={itemVariants}
              className="xl:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-display font-medium text-white tracking-tight">Monthly User Signups</h3>
                  <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">Account creation trend</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] px-3 py-1.5 rounded-full">
                  <ArrowUpRight size={12} className="text-white/60" />
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">+51% this quarter</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={MONTHLY_SIGNUPS}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#444", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#signupGrad)"
                    dot={{ fill: "#050505", stroke: "#fff", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#fff", stroke: "#fff", strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Engagement Radial + Quick Stats */}
            <motion.div
              variants={itemVariants}
              className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div>
                <h3 className="text-sm font-display font-medium text-white tracking-tight">Engagement Rate</h3>
                <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">Active / Total users</p>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="75%"
                      outerRadius="100%"
                      data={ENGAGEMENT_RATE}
                      startAngle={90}
                      endAngle={-270}
                      barSize={10}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-medium text-white">78%</span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mt-1">Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-center">
                  <p className="text-lg font-display font-medium text-white">318</p>
                  <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-[0.15em]">Active</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-center">
                  <p className="text-lg font-display font-medium text-neutral-500">90</p>
                  <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-[0.15em]">Inactive</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Charts Row 2 ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {/* Tool Usage Evolution Bar Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-display font-medium text-white tracking-tight">Tool Usage Evolution</h3>
                  <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">Quiz · Flashcard · Concept usage per month</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-white" />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Quizzes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-neutral-500" />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Flashcards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-neutral-700" />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Concepts</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={TOOL_USAGE} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#444", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quizzes" fill="#ffffff" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="flashcards" fill="#737373" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="concepts" fill="#404040" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Document Uploads Line Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-display font-medium text-white tracking-tight">Document Uploads</h3>
                  <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">PDFs indexed per month</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] px-3 py-1.5 rounded-full">
                  <FileText size={12} className="text-white/60" />
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">201 total</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={276}>
                <LineChart data={DOCUMENT_UPLOADS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#444", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="uploads"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ fill: "#050505", stroke: "#fff", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#fff", stroke: "#fff", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ─── Bottom Row: Activity + Top Users ─────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Recent Activity */}
            <motion.div
              variants={itemVariants}
              className="xl:col-span-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="p-6 pb-4 border-b border-white/5">
                <h3 className="text-sm font-display font-medium text-white tracking-tight">Recent Activity</h3>
                <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">Live platform events</p>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {RECENT_ACTIVITY.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <event.icon size={15} className="text-neutral-500" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 truncate">{event.text}</p>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-600 tracking-widest uppercase whitespace-nowrap">
                      {event.time}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Active Users */}
            <motion.div
              variants={itemVariants}
              className="xl:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl relative overflow-hidden group hover:border-white/10 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="p-6 pb-4 border-b border-white/5">
                <h3 className="text-sm font-display font-medium text-white tracking-tight">Top Active Students</h3>
                <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.2em] mt-1">By interaction count</p>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {TOP_USERS.map((u) => (
                  <div
                    key={u.rank}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group/row"
                  >
                    <span className="text-[10px] font-mono text-neutral-700 w-5 text-center">
                      {String(u.rank).padStart(2, "0")}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-display font-medium text-neutral-400">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 truncate group-hover/row:text-white transition-colors">{u.name}</p>
                      <p className="text-[10px] font-mono text-neutral-600 tracking-widest uppercase">
                        {u.docs} docs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-medium text-white">{u.activity}</p>
                      <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-[0.15em]">actions</p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-700 group-hover/row:text-neutral-400 transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer spacer */}
          <div className="h-12" />
        </motion.div>
      </main>
    </div>
  );
}
