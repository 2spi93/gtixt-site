"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface VisitorAnalytics {
  dailyStats: Array<{
    date: string;
    total_visits: number;
    unique_visitors: number;
    bot_visits: number;
    human_visits: number;
  }>;
  byPath: Array<{
    path: string;
    total_visits: number;
    unique_visitors: number;
    bot_visits: number;
  }>;
  botSummary: Array<{
    bot_type: string;
    visits: number;
    unique_bots: number;
  }>;
  topCountries: Array<{
    country: string;
    visits: number;
    unique_visitors: number;
  }>;
  topOrganizations: Array<{
    org_name: string;
    visitor_class: string;
    visits: number;
    unique_visitors: number;
    is_institutional: boolean;
  }>;
  totalVisitors: number;
  totalBots: number;
  institutionalVisitors: number;
}

interface RecentVisitor {
  id: string;
  ip_address: string;
  user_agent: string;
  path: string;
  country: string | null;
  city: string | null;
  region: string | null;
  org_name: string | null;
  asn: string | null;
  as_name: string | null;
  is_institutional: boolean;
  visitor_class: string;
  device_type: string;
  browser: string;
  os: string;
  is_bot: boolean;
  bot_type: string | null;
  timestamp: string;
  status_code: number | null;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function VisitorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [recentVisitors, setRecentVisitors] = useState<RecentVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch analytics summary
      const analyticsRes = await fetch(
        `/api/admin/visitors?days=${days}&view=summary`,
        { credentials: 'include' }
      );

      if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.data);

      // Fetch recent visitors
      const recentRes = await fetch(
        `/api/admin/visitors?limit=50&view=recent`,
        { credentials: 'include' }
      );

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentVisitors(recentData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const renderBotType = (botType: string | null) => {
    if (!botType) return "Human";
    return botType.charAt(0).toUpperCase() + botType.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visitor analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center p-8 text-gray-600">No data available</div>;
  }

  // Prepare data for charts
  const dailyData = analytics.dailyStats.map((stat) => ({
    ...stat,
    date: formatDate(stat.date),
  }));

  const botPieData = analytics.botSummary.map((bot) => ({
    name: renderBotType(bot.bot_type),
    value: bot.visits,
  }));

  const humanToRobotRatio = [
    { name: "Human", value: analytics.totalVisitors - analytics.totalBots },
    { name: "Bots", value: analytics.totalBots },
  ];

  return (
    <div className="space-y-8 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitor Analytics</h1>
          <p className="text-gray-600 mt-1">Track and analyze all site visitors</p>
        </div>
        <div className="space-x-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Visitors</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.totalVisitors.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Visits</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.dailyStats
              .reduce((sum, stat) => sum + stat.total_visits, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Bot Visitors</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {analytics.totalBots.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Human Visitors</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {(analytics.totalVisitors - analytics.totalBots).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Institutional</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {analytics.institutionalVisitors.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Visits Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Visits Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_visits"
                stroke="#3b82f6"
                name="Total Visits"
              />
              <Line
                type="monotone"
                dataKey="human_visits"
                stroke="#10b981"
                name="Human Visits"
              />
              <Line
                type="monotone"
                dataKey="bot_visits"
                stroke="#ef4444"
                name="Bot Visits"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Human vs Bot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={humanToRobotRatio}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {humanToRobotRatio.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intelligence Tables */}
      <div className="space-y-6">
      <SectionCard title="Top Pages" subtitle="Most visited routes and visitor concentration.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Path</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Total Visits
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Unique Visitors
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Bot Visits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.byPath.slice(0, 10).map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-gray-900 font-mono">{page.path}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {page.total_visits.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {page.unique_visitors.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-red-600">{page.bot_visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Bot Summary */}
      {analytics.botSummary.length > 0 && (
        <SectionCard title="Top Bots" subtitle="Detected crawlers, monitors, and automated traffic.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Bot Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Visits
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Unique Bots
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.botSummary.map((bot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-900 font-medium">
                      {renderBotType(bot.bot_type)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      {bot.visits.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      {bot.unique_bots.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Recent Visitors */}
      <SectionCard title="Recent Visitors" subtitle="Latest sessions with geo, organization and device context.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Location</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Organization</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Profile</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Path</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentVisitors.slice(0, 20).map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-900 font-mono text-[11px]">{visitor.ip_address}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-[11px]">
                    {[visitor.city, visitor.region, visitor.country].filter(Boolean).join(", ") || "Unknown"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 text-[11px] max-w-[260px] truncate" title={visitor.org_name || "Unknown"}>
                    {visitor.org_name || "Unknown"}
                  </td>
                  <td className="px-4 py-2.5 text-[11px]">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                      visitor.is_institutional ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {visitor.is_institutional ? "Institutional" : visitor.visitor_class || "Unknown"}
                    </span>
                    <div className="text-gray-500 mt-1">{visitor.device_type} · {visitor.browser} · {visitor.os}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-[11px]">{visitor.path}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        visitor.is_bot
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {visitor.is_bot ? renderBotType(visitor.bot_type) : "Human"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-[11px]">
                    {new Date(visitor.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Geo & Institutional Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Top Countries" subtitle="Geographic concentration of incoming traffic.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Country</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Visits</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.topCountries.map((row, idx) => (
                  <tr key={`${row.country}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-[11px] text-gray-900">{row.country}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-600">{row.visits.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-600">{row.unique_visitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Top Organizations" subtitle="Companies and institutional entities inferred from network ownership.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Organization</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Class</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.topOrganizations.map((row, idx) => (
                  <tr key={`${row.org_name}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-[11px] text-gray-900 max-w-[280px] truncate" title={row.org_name}>{row.org_name}</td>
                    <td className="px-4 py-2.5 text-[11px]">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                        row.is_institutional ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {row.is_institutional ? "institutional" : row.visitor_class}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-600">{row.visits.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
      </div>
    </div>
  );
}

export default VisitorAnalyticsDashboard;
