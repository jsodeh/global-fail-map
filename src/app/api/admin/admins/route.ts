import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { requireSuperAdmin } from '@/lib/auth/server-session';
import { desc, eq } from 'drizzle-orm';

// GET: List all admins
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const allAdmins = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      })
      .from(admins)
      .orderBy(desc(admins.createdAt));

    return NextResponse.json(allAdmins);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to load admins:', error);
    return NextResponse.json(
      { error: 'Failed to load admins' },
      { status: 500 },
    );
  }
}

// POST: Create a new admin
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const { email, name, password, role } = body;

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "super_admin"' },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create admin
    const [newAdmin] = await db
      .insert(admins)
      .values({
        email,
        name,
        passwordHash,
        role,
        isActive: true,
      })
      .returning({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
      });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 },
    );
  }
}
