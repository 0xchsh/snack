import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma'; // Use the singleton
// import { PrismaClient } from '@/generated/prisma'; // Comment out direct import
import { nanoid } from 'nanoid';
import { getRandomEmoji } from '@/lib/emojis';

// const prisma = new PrismaClient(); // Comment out direct instantiation

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkId = user.id; // Use user.id directly from currentUser()

  try {
    const { title, description, emoji } = await request.json();

    // Use "Untitled List" as default title if none provided or empty
    const listTitle = title && title.trim() ? title.trim() : "Untitled List";

    // Use provided emoji or generate a random one
    const listEmoji = emoji || getRandomEmoji();

    // Ensure user exists in DB, create if not
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!dbUser) {
      const username = user.username || `user_${nanoid(8)}`;
      try {
        dbUser = await prisma.user.create({
          data: {
            clerkId,
            username,
          },
        });
      } catch (error: any) {
        // Handle potential race condition or unique constraint violation if username is taken
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
          // Username taken, try generating a new one or append nanoid
          const newUsername = `${user.username || 'user'}_${nanoid(4)}`;
          dbUser = await prisma.user.create({
            data: {
              clerkId,
              username: newUsername,
            },
          });
        } else {
          throw error; // Re-throw if it's not the expected unique constraint error
        }
      }
    }

    const publicId = nanoid(10);

    const newList = await prisma.list.create({
      data: {
        title: listTitle,
        description,
        emoji: listEmoji,
        publicId,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
} 