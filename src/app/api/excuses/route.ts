import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function saveAttachment(file: File, currentUserId: string) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('El archivo excede el máximo permitido de 5 MB.');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^\w.\-]/g, '');

  const uniqueName = `${Date.now()}-${currentUserId}-${safeName}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'excuses');
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, uniqueName);
  await fs.writeFile(filePath, buffer);

  return {
    attachmentUrl: `/uploads/excuses/${uniqueName}`,
    attachmentName: file.name,
    attachmentMimeType: file.type,
  };
}

async function deleteExistingAttachment(attachmentUrl?: string | null) {
  if (!attachmentUrl) return;

  const cleanUrl = attachmentUrl.replace(/^\/+/, '');
  const fullPath = path.join(process.cwd(), 'public', cleanUrl);

  try {
    await fs.unlink(fullPath);
  } catch {
    // ignorar si no existe
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canViewAll = hasPermission(currentUser.permissions, 'excuses.view');
    const canViewOwn = hasPermission(currentUser.permissions, 'excuses.view.own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver excusas' },
        { status: 403 }
      );
    }

    const excuses = await prisma.excuse.findMany({
      orderBy: { createdAt: 'desc' },
      ...(canViewOwn && !canViewAll
        ? {
            where: {
              userId: currentUser.id,
            },
          }
        : {}),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            activityDate: true,
          },
        },
        reviewedBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({ data: excuses });
  } catch (error) {
    console.error('GET /api/excuses error:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo excusas',
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

    if (!hasPermission(currentUser.permissions, 'excuses.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear excusas' },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const activityId = String(formData.get('activityId') ?? '');
    const reason = String(formData.get('reason') ?? '').trim();
    const file = formData.get('attachment');

    if (!activityId || !reason) {
      return NextResponse.json(
        { error: 'Actividad y justificación son obligatorias' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        activityDate: true,
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const existing = await prisma.excuse.findFirst({
      where: {
        userId: currentUser.id,
        activityId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya enviaste una excusa para esta actividad' },
        { status: 409 }
      );
    }

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentMimeType: string | null = null;

    if (file && file instanceof File && file.size > 0) {
      try {
        const saved = await saveAttachment(file, currentUser.id);
        attachmentUrl = saved.attachmentUrl;
        attachmentName = saved.attachmentName;
        attachmentMimeType = saved.attachmentMimeType;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Error guardando archivo',
          },
          { status: 400 }
        );
      }
    }

    const excuse = await prisma.excuse.create({
      data: {
        userId: currentUser.id,
        activityId,
        reason,
        status: 'PENDIENTE',
        attachmentUrl,
        attachmentName,
        attachmentMimeType,
      },
      include: {
        activity: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Excusa enviada correctamente',
        data: excuse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/excuses error:', error);
    return NextResponse.json(
      {
        error: 'Error creando excusa',
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

    if (!hasPermission(currentUser.permissions, 'excuses.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar tus excusas' },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const excuseId = String(formData.get('excuseId') ?? '');
    const activityId = String(formData.get('activityId') ?? '');
    const reason = String(formData.get('reason') ?? '').trim();
    const removeAttachment =
      String(formData.get('removeAttachment') ?? 'false') === 'true';
    const replaceAttachment =
      String(formData.get('replaceAttachment') ?? 'false') === 'true';
    const file = formData.get('attachment');

    if (!excuseId || !activityId || !reason) {
      return NextResponse.json(
        {
          error: 'excuseId, activityId y justificación son obligatorios',
        },
        { status: 400 }
      );
    }

    const existingExcuse = await prisma.excuse.findUnique({
      where: { id: excuseId },
      select: {
        id: true,
        userId: true,
        status: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentMimeType: true,
        activity: {
          select: {
            activityDate: true,
          },
        },
      },
    });

    if (!existingExcuse) {
      return NextResponse.json(
        { error: 'Excusa no encontrada' },
        { status: 404 }
      );
    }

    if (existingExcuse.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'No puedes editar una excusa que no es tuya' },
        { status: 403 }
      );
    }

    if (existingExcuse.status !== 'PENDIENTE') {
      return NextResponse.json(
        { error: 'Solo puedes editar excusas pendientes' },
        { status: 409 }
      );
    }

    const now = new Date();
    const originalActivityDate = new Date(existingExcuse.activity.activityDate);

    if (originalActivityDate <= now) {
      return NextResponse.json(
        { error: 'No puedes editar excusas de actividades pasadas' },
        { status: 409 }
      );
    }

    const newActivity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        activityDate: true,
      },
    });

    if (!newActivity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const newActivityDate = new Date(newActivity.activityDate);

    if (newActivityDate <= now) {
      return NextResponse.json(
        { error: 'Solo puedes mover la excusa a actividades futuras' },
        { status: 409 }
      );
    }

    const duplicate = await prisma.excuse.findFirst({
      where: {
        userId: currentUser.id,
        activityId,
        NOT: {
          id: excuseId,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya tienes una excusa registrada para esa actividad' },
        { status: 409 }
      );
    }

    let attachmentUrl: string | null = existingExcuse.attachmentUrl;
    let attachmentName: string | null = existingExcuse.attachmentName;
    let attachmentMimeType: string | null = existingExcuse.attachmentMimeType;

    if (removeAttachment) {
      await deleteExistingAttachment(existingExcuse.attachmentUrl);
      attachmentUrl = null;
      attachmentName = null;
      attachmentMimeType = null;
    }

    if (replaceAttachment && file && file instanceof File && file.size > 0) {
      try {
        await deleteExistingAttachment(existingExcuse.attachmentUrl);
        const saved = await saveAttachment(file, currentUser.id);
        attachmentUrl = saved.attachmentUrl;
        attachmentName = saved.attachmentName;
        attachmentMimeType = saved.attachmentMimeType;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Error guardando archivo',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.excuse.update({
      where: { id: excuseId },
      data: {
        activityId,
        reason,
        attachmentUrl: attachmentUrl ?? null,
        attachmentName: attachmentName ?? null,
        attachmentMimeType: attachmentMimeType ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            activityDate: true,
          },
        },
        reviewedBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Excusa actualizada correctamente',
      data: updated,
    });
  } catch (error) {
    console.error('PATCH /api/excuses error:', error);
    return NextResponse.json(
      {
        error: 'Error actualizando excusa',
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

    if (!hasPermission(currentUser.permissions, 'excuses.delete')) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar excusas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El id de la excusa es obligatorio' },
        { status: 400 }
      );
    }

    const existing = await prisma.excuse.findUnique({
      where: { id },
      select: {
        id: true,
        attachmentUrl: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Excusa no encontrada' },
        { status: 404 }
      );
    }

    if (existing.attachmentUrl) {
      await deleteExistingAttachment(existing.attachmentUrl);
    }

    await prisma.excuse.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Excusa eliminada correctamente',
    });
  } catch (error) {
    console.error('DELETE /api/excuses error:', error);
    return NextResponse.json(
      {
        error: 'Error eliminando excusa',
        details: String(error),
      },
      { status: 500 }
    );
  }
}