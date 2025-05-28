import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ListViewClient } from './list-view-client';

interface ListPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export default async function ListPage({ params }: ListPageProps) {
  const { publicId } = await params;
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get the list with its items
  const list = await prisma.list.findUnique({
    where: { 
      publicId,
    },
    include: {
      items: {
        orderBy: [
          { order: 'desc' },
          { createdAt: 'desc' }
        ],
      },
      user: true,
    },
  });

  if (!list) {
    notFound();
  }

  // Check if the current user owns this list
  if (list.user.clerkId !== user.id) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ListViewClient list={list} />
    </div>
  );
} 