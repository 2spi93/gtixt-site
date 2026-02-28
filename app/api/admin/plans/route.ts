// /opt/gpti/gpti-site/app/api/admin/plans/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.adminPlans.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsedPlans = plans.map(plan => {
      let tasks: Array<{ id: string; description: string; status: string; assigned?: string }> = [];
      if (plan.description) {
        try {
          const raw = JSON.parse(plan.description);
          if (Array.isArray(raw)) {
            tasks = raw.map((item, index) => {
              if (typeof item === 'string') {
                return {
                  id: `${plan.id}_task_${index}`,
                  description: item,
                  status: 'pending',
                };
              }
              return {
                id: item?.id || `${plan.id}_task_${index}`,
                description: item?.description || 'No description',
                status: item?.status || 'pending',
                assigned: item?.assigned,
              };
            });
          }
        } catch (error) {
          // Ignore parse errors and fallback to empty tasks
        }
      }

      return {
        id: plan.id,
        title: plan.planName,
        date: plan.createdAt,
        status: plan.status,
        priority: 'medium',
        tasks,
      };
    });

    const grouped = await prisma.adminPlans.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts = grouped.reduce(
      (acc, item) => {
        acc.total += item._count.status || 0;
        acc.byStatus[item.status] = item._count.status || 0;
        return acc;
      },
      { total: 0, byStatus: {} as Record<string, number> }
    );

    return NextResponse.json({
      success: true,
      data: parsedPlans,
      counts,
    });
  } catch (error) {
    console.error('GET /api/admin/plans failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, tasks, status } = body;

    const taskArray = Array.isArray(tasks) ? tasks : [];

    const plan = await prisma.adminPlans.create({
      data: {
        id: `plan_${Date.now()}`,
        planName: title,
        status: status || 'pending',
        description: taskArray.length ? JSON.stringify(taskArray) : null,
        tasksCount: taskArray.length || 0,
        updatedAt: new Date(),
      },
    });

    await prisma.adminOperations.create({
      data: {
        id: `op_${Date.now()}`,
        operationType: 'plan',
        operation: 'CREATE',
        firmId: null,
        userId: 'system',
        status: 'success',
        details: { title, taskCount: tasks?.length || 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('POST /api/admin/plans failed:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, status, tasks } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });
    }

    const taskArray = Array.isArray(tasks) ? tasks : [];

    const updated = await prisma.adminPlans.update({
      where: { id },
      data: {
        planName: title,
        status: status || 'pending',
        description: taskArray.length ? JSON.stringify(taskArray) : null,
        tasksCount: taskArray.length || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/admin/plans failed:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });
    }

    await prisma.adminPlans.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/plans failed:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
