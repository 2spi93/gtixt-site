'use client';
export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';

export default function ReviewQueuePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📋 Review Queue</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Pending Reviews</div>
          <div className="text-4xl font-bold text-blue-600 mt-2">0</div>
          <p className="text-sm text-gray-500 mt-2">Items awaiting approval</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">In Progress</div>
          <div className="text-4xl font-bold text-yellow-600 mt-2">0</div>
          <p className="text-sm text-gray-500 mt-2">Currently being reviewed</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Completed</div>
          <div className="text-4xl font-bold text-green-600 mt-2">0</div>
          <p className="text-sm text-gray-500 mt-2">Approved & processed</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Review Items</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No items in queue</p>
          <p className="text-sm mt-2">All pending items have been reviewed</p>
        </div>
      </Card>
    </div>
  );
}
