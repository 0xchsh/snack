import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get or create user in database
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: {
      lists: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!dbUser) {
    // Create user if doesn't exist
    dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        username: user.username || `user_${Date.now()}`,
      },
      include: {
        lists: true,
      },
    });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="text-muted-foreground">
            Create and manage your curated lists
          </p>
        </div>
      </div>
      
      <DashboardClient lists={dbUser.lists} />
    </div>
  );
} 