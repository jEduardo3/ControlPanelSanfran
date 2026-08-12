import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/session';
import { hasPermission } from '../../../../lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const fileName = new URL(req.url).searchParams.get('file');
  if (!fileName || path.basename(fileName) !== fileName) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
  }

  const attachmentUrl = `/api/excuses/attachment?file=${encodeURIComponent(fileName)}`;
  const excuse = await prisma.excuse.findFirst({
    where: { attachmentUrl },
    select: { userId: true, attachmentName: true, attachmentMimeType: true },
  });
  if (!excuse) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  const canViewAll = hasPermission(currentUser.permissions, 'excuses.view');
  if (!canViewAll && excuse.userId !== currentUser.id) {
    return NextResponse.json({ error: 'Sin permiso para ver el archivo' }, { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'uploads', 'excuses', fileName);
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': excuse.attachmentMimeType ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(excuse.attachmentName ?? fileName)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
}
