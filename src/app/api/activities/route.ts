
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activitySchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import {
  sendActivityAssignedEmail,
  sendEmailBatch,
} from '@/lib/mailer';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canViewAll = hasPermission(currentUser.permissions, 'activities.view');
    const canViewOwn = hasPermission(currentUser.permissions, 'activities.view.own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver actividades' },
        { status: 403 }
      );
    }

    const activities = await prisma.activity.findMany({
      orderBy: {
        activityDate: 'desc',
      },
      where:
        canViewOwn && !canViewAll
          ? {
              assignedUsers: {
                some: {
                  userId: currentUser.id,
                },
              },
            }
          : {},
      include: {
        createdBy: {
          select: {
            fullName: true,
          },
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error('GET /api/activities error:', error);

    return NextResponse.json(
      {
        error: 'Error obteniendo actividades',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'activities.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear actividades' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsed = activitySchema.safeParse({
      ...body,
      createdById: currentUser.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((id: unknown) => typeof id === 'string')
      : [];

    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          activityDate: new Date(parsed.data.activityDate),
          location: parsed.data.location,
          createdById: currentUser.id,
        },
      });

      if (userIds.length > 0) {
        await tx.activityAssignment.createMany({
          data: userIds.map((userId: string) => ({
            activityId: created.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    if (userIds.length > 0) {
      const assignedUsers = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
          isActive: true,
        },
        select: {
          fullName: true,
          email: true,
        },
      });

      await sendEmailBatch({
  items: assignedUsers,
  batchSize: 8,
  delayMs: 1500,
  send: async (user) => {
    await sendActivityAssignedEmail({
      to: user.email,
      fullName: user.fullName,
      activityTitle: activity.title,
      description: activity.description,
      activityDate: new Date(activity.activityDate),
      location: activity.location,
    });
  },
  onError: (user, mailError) => {
    console.error(
      `Error enviando correo de actividad a ${user.email}:`,
      mailError
    );
  },
});
    }

    return NextResponse.json(
      {
        message: 'Actividad creada correctamente',
        data: activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/activities error:', error);

    return NextResponse.json(
      {
        error: 'Error creando actividad',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'activities.update')) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar actividades' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      id,
      title,
      description,
      activityDate,
      location,
      userIds,
    } = body as {
      id?: string;
      title?: string;
      description?: string;
      activityDate?: string;
      location?: string;
      userIds?: string[];
    };

    if (!id || !title || !activityDate) {
      return NextResponse.json(
        {
          error: 'id, título y fecha son obligatorios',
        },
        { status: 400 }
      );
    }

    const existing = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Actividad no encontrada',
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.activity.update({
        where: { id },
        data: {
          title,
          description: description ?? '',
          activityDate: new Date(activityDate),
          location: location ?? '',
        },
      });

      if (Array.isArray(userIds)) {
        await tx.activityAssignment.deleteMany({
          where: {
            activityId: id,
          },
        });

        if (userIds.length > 0) {
          await tx.activityAssignment.createMany({
            data: userIds.map((userId) => ({
              activityId: id,
              userId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return NextResponse.json({
      message: 'Actividad actualizada correctamente',
    });
  } catch (error) {
    console.error('PATCH /api/activities error:', error);

    return NextResponse.json(
      {
        error: 'Error actualizando actividad',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'activities.delete')) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar actividades' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'El id de la actividad es obligatorio',
        },
        { status: 400 }
      );
    }

    const existing = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Actividad no encontrada',
        },
        { status: 404 }
      );
    }

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Actividad eliminada correctamente',
    });
  } catch (error) {
    console.error('DELETE /api/activities error:', error);

    return NextResponse.json(
      {
        error: 'Error eliminando actividad',
        details: String(error),
      },
      { status: 500 }
    );
  }
}