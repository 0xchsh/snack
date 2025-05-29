import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';
import Link from 'next/link';

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
        <div className="flex items-center space-x-3">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile picture"
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
      
      <DashboardClient lists={dbUser.lists} />
    </div>
  );
} 