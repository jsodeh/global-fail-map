import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { requireSuperAdmin } from '@/lib/auth/server-session';
import { eq, and, ne } from 'drizzle-orm';

// GET: Get admin by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;

    const [admin] = await db
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
      .where(eq(admins.id, id));

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to load admin:', error);
    return NextResponse.json(
      { error: 'Failed to load admin' },
      { status: 500 },
    );
  }
}

// PATCH: Update admin
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const { name, email, role, isActive, password } = body;

    // Prevent self-deactivation
    if (session.adminId === id && isActive === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate yourself' },
        { status: 400 },
      );
    }

    // Check if trying to demote the last super admin
    if (role === 'admin') {
      const [targetAdmin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, id));

      if (targetAdmin && targetAdmin.role === 'super_admin') {
        // Count remaining super admins
        const superAdmins = await db
          .select()
          .from(admins)
          .where(and(eq(admins.role, 'super_admin'), eq(admins.isActive, true)));

        if (superAdmins.length === 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last active super admin' },
            { status: 400 },
          );
        }
      }
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 },
        );
      }

      // Check if email is already used by another admin
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(and(eq(admins.email, email), ne(admins.id, id)))
        .limit(1);

      if (existingAdmin.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 },
        );
      }
    }

    // Validate role if provided
    if (role && role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "super_admin"' },
        { status: 400 },
      );
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Hash new password if provided
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 },
        );
      }
      updateData.passwordHash = await hash(password, 10);
    }

    // Update admin
    const [updatedAdmin] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, id))
      .returning({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      });

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to update admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 },
    );
  }
}

// DELETE: Deactivate admin (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = await context.params;

    // Prevent self-deletion
    if (session.adminId === id) {
      return NextResponse.json(
        { error: 'Cannot deactivate yourself' },
        { status: 400 },
      );
    }

    // Check if this is the last super admin
    const [targetAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, id));

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (targetAdmin.role === 'super_admin') {
      const superAdmins = await db
        .select()
        .from(admins)
        .where(and(eq(admins.role, 'super_admin'), eq(admins.isActive, true)));

      if (superAdmins.length === 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last active super admin' },
          { status: 400 },
        );
      }
    }

    // Deactivate admin
    await db
      .update(admins)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to deactivate admin:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate admin' },
      { status: 500 },
    );
  }
}
