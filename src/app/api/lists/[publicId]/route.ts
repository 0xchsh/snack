import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emoji, title, description, viewMode } = await request.json();

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

    // Prepare update data
    const updateData: any = {};
    
    if (emoji !== undefined) {
      updateData.emoji = emoji;
    }
    
    if (title !== undefined) {
      // Use "Untitled List" as fallback for empty titles
      updateData.title = title && title.trim() ? title.trim() : "Untitled List";
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (viewMode !== undefined) {
      // Validate viewMode
      if (viewMode === 'LIST' || viewMode === 'GALLERY') {
        updateData.viewMode = viewMode;
      }
    }

    // Update the list
    const updatedList = await prisma.list.update({
      where: { publicId },
      data: updateData,
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Failed to update list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
} 