import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    publicId: string;
    itemId: string;
  }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { publicId, itemId } = await params;
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the list and verify ownership
    const list = await prisma.list.findUnique({
      where: { publicId },
      include: { user: true },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (list.user.clerkId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the item and verify it belongs to this list
    const item = await prisma.listItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.listId !== list.id) {
      return NextResponse.json({ error: 'Item does not belong to this list' }, { status: 403 });
    }

    // Delete the item
    await prisma.listItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
} 