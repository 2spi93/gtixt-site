'use client';
export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';

export default function AgentsMonitorPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🤖 Agents Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Active Agents</div>
          <div className="text-4xl font-bold text-green-600 mt-2">8</div>
          <p className="text-sm text-gray-500 mt-2">Running AI agents</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Processing</div>
          <div className="text-4xl font-bold text-blue-600 mt-2">142</div>
          <p className="text-sm text-gray-500 mt-2">Items being analyzed</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Avg Score</div>
          <div className="text-4xl font-bold text-purple-600 mt-2">8.4</div>
          <p className="text-sm text-gray-500 mt-2">Out of 10.0</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Errors</div>
          <div className="text-4xl font-bold text-red-600 mt-2">0</div>
          <p className="text-sm text-gray-500 mt-2">This hour</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Agent Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <div className="font-semibold text-gray-900">Enrichment Agent</div>
            <div className="text-sm text-gray-600 mt-1">Status: <span className="text-green-600 font-bold">✓ Running</span></div>
            <div className="text-sm text-gray-600">Processed: 1,240 items/hour</div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <div className="font-semibold text-gray-900">Scoring Agent</div>
            <div className="text-sm text-gray-600 mt-1">Status: <span className="text-green-600 font-bold">✓ Running</span></div>
            <div className="text-sm text-gray-600">Avg Score: 8.7/10</div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '87%'}}></div>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <div className="font-semibold text-gray-900">Risk Analysis Agent</div>
            <div className="text-sm text-gray-600 mt-1">Status: <span className="text-green-600 font-bold">✓ Running</span></div>
            <div className="text-sm text-gray-600">Alerts Generated: 8</div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <div className="font-semibold text-gray-900">Sentiment Agent</div>
            <div className="text-sm text-gray-600 mt-1">Status: <span className="text-green-600 font-bold">✓ Running</span></div>
            <div className="text-sm text-gray-600">Sentiment Score: 0.72</div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{width: '72%'}}></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">System Health</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Agent</th>
                <th className="px-6 py-3 text-left font-semibold">CPU</th>
                <th className="px-6 py-3 text-left font-semibold">Memory</th>
                <th className="px-6 py-3 text-left font-semibold">Uptime</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">Enrichment Agent</td>
                <td className="px-6 py-3">12%</td>
                <td className="px-6 py-3">340 MB</td>
                <td className="px-6 py-3">45h 23m</td>
                <td className="px-6 py-3"><span className="text-green-600">✓ Healthy</span></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">Scoring Agent</td>
                <td className="px-6 py-3">8%</td>
                <td className="px-6 py-3">210 MB</td>
                <td className="px-6 py-3">45h 23m</td>
                <td className="px-6 py-3"><span className="text-green-600">✓ Healthy</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
