'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  id: string;
  date: string;
  title: string;
  tasks: Task[];
  status: 'pending' | 'draft' | 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  assigned?: string;
}

export default function Planning() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showAIPlan, setShowAIPlan] = useState(false);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanError, setAiPlanError] = useState('');
  const [planningError, setPlanningError] = useState('');
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [aiPlan, setAiPlan] = useState<{
    title: string;
    recommendation: string;
    tasks: string[];
  } | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'draft' | 'active' | 'completed'>('pending');
  const [editTasksText, setEditTasksText] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans/');
      if (!res.ok) {
        setPlanningError('Failed to load plans');
        return;
      }
      const data = await res.json();
      setPlans(data.data || []);
      if (data.counts) {
        setCounts(data.counts);
      }
      setPlanningError('');
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlanningError('Failed to load plans');
    }
  };

  const generateAIPlan = async () => {
    setAiPlanLoading(true);
    setAiPlanError('');
    try {
      const res = await fetch('/api/admin/ai/generate-plan/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        setAiPlanError('Failed to generate plan. Try again.');
        return;
      }
      const data = await res.json();
      if (data.plan) {
        setAiPlan(data.plan);
      } else {
        setAiPlanError('Failed to generate plan. Try again.');
      }
    } catch (error) {
      console.error('Failed to generate AI plan:', error);
      setAiPlanError('Failed to generate plan. Try again.');
    } finally {
      setAiPlanLoading(false);
    }
  };

  const createPlanFromAI = async () => {
    if (!aiPlan) return;
    try {
      const res = await fetch('/api/admin/plans/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiPlan.title,
          tasks: aiPlan.tasks.map(t => ({ description: t, status: 'pending' })),
          status: 'pending',
        }),
      });
      if (!res.ok) {
        setAiPlanError('Failed to create plan. Try again.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        fetchPlans();
        setShowAIPlan(false);
        setAiPlan(null);
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
      setAiPlanError('Failed to create plan. Try again.');
    }
  };

  const startEdit = (plan: Plan) => {
    setEditPlanId(plan.id);
    setEditTitle(plan.title);
    setEditStatus(plan.status || 'pending');
    setEditTasksText(plan.tasks.map(task => task.description).join('\n'));
  };

  const cancelEdit = () => {
    setEditPlanId(null);
    setEditTitle('');
    setEditStatus('pending');
    setEditTasksText('');
  };

  const saveEdit = async (planId: string) => {
    const taskLines = editTasksText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const tasks = taskLines.map((description, index) => ({
      id: `${planId}_task_${index}`,
      description,
      status: 'pending',
    }));

    try {
      const res = await fetch('/api/admin/plans/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: planId,
          title: editTitle,
          status: editStatus,
          tasks,
        }),
      });
      if (!res.ok) {
        setPlanningError('Failed to update plan');
        return;
      }
      const data = await res.json();
      if (data.success) {
        fetchPlans();
        cancelEdit();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      setPlanningError('Failed to update plan');
    }
  };

  const markComplete = async (planId: string) => {
    try {
      const res = await fetch('/api/admin/plans/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, status: 'completed' }),
      });
      if (!res.ok) {
        setPlanningError('Failed to complete plan');
        return;
      }
      const data = await res.json();
      if (data.success) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to complete plan:', error);
      setPlanningError('Failed to complete plan');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      const res = await fetch(`/api/admin/plans/?id=${planId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setPlanningError('Failed to delete plan');
        return;
      }
      const data = await res.json();
      if (data.success) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      setPlanningError('Failed to delete plan');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'done':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📅 Planning & Attack Plans</h1>
          {counts && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                Total {counts.total}
              </span>
              {Object.entries(counts.byStatus).map(([status, value]) => (
                <span key={status} className="px-2 py-1 rounded bg-white text-gray-700 border">
                  {status.toUpperCase()} {value}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setShowAIPlan(true);
            generateAIPlan();
          }}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
        >
          🚀 Generate with Pilote
        </button>
      </div>

      {planningError && (
        <Card className="border border-red-300 bg-red-50">
          <CardContent className="py-3 text-red-700 font-semibold">{planningError}</CardContent>
        </Card>
      )}

      {/* Pilote AI Plan Generation */}
      {showAIPlan && (
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pilote AI-Generated Daily Attack Plan</CardTitle>
              <button onClick={() => setShowAIPlan(false)} className="text-gray-600 hover:text-gray-800">
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {aiPlanLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">🤔 Pilote is analyzing your system...</p>
              </div>
            ) : aiPlan ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-purple-700">{aiPlan.title}</h3>
                  <p className="text-gray-700 mt-2">{aiPlan.recommendation}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recommended Tasks:</h4>
                  <ul className="space-y-2">
                    {aiPlan.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-gray-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={createPlanFromAI}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
                  >
                    ✓ Accept & Create Plan
                  </button>
                  <button
                    onClick={() => generateAIPlan()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                  >
                    🔄 Regenerate
                  </button>
                </div>
              </div>
            ) : aiPlanError ? (
              <p className="text-red-600">{aiPlanError}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No plans yet. Generate one with AI! 🚀</p>
            </CardContent>
          </Card>
        ) : (
          plans.map(plan => (
            <Card key={plan.id} className={getPriorityColor(plan.priority)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{new Date(plan.date).toDateString()}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-white">
                    {plan.status.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {editPlanId === plan.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'pending' | 'draft' | 'active' | 'completed')}
                        className="mt-1 w-full border rounded px-3 py-2"
                      >
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Tasks (one per line)</label>
                      <textarea
                        value={editTasksText}
                        onChange={(e) => setEditTasksText(e.target.value)}
                        rows={5}
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit(plan.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.isArray(plan?.tasks) && plan.tasks.length > 0 ? (
                      plan.tasks.map(task => (
                        <div key={task?.id || Math.random()} className="flex items-start gap-3 p-2 hover:bg-white/50 rounded">
                          <input
                            type="checkbox"
                            checked={task?.status === 'done'}
                            className="mt-1 cursor-pointer"
                            readOnly
                          />
                          <div className="flex-1">
                            <span
                              className={task?.status === 'done' ? 'line-through text-gray-500' : ''}
                            >
                              {task?.description || 'No description'}
                            </span>
                            {task?.assigned && (
                              <p className="text-xs text-gray-600 mt-1">👤 {task.assigned}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task?.status || 'pending')}`}>
                            {task?.status ? task.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No tasks in this plan</p>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex gap-2">
                  {editPlanId === plan.id ? (
                    <button onClick={cancelEdit} className="text-gray-600 hover:underline text-sm">Cancel</button>
                  ) : (
                    <button onClick={() => startEdit(plan)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  )}
                  <button onClick={() => markComplete(plan.id)} className="text-green-600 hover:underline text-sm">Complete</button>
                  <button onClick={() => deletePlan(plan.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
