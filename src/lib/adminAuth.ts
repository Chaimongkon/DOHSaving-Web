import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest, type JwtPayload } from "@/lib/auth";

export interface AuthenticatedAdminUser extends JwtPayload {
  isActive: boolean;
  menuPermissions: string[];
}

const ADMIN_ONLY = "__admin_only__";
const ANY_PERMISSION = "__any_permission__";

function normalizeMenuPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAdminPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function resolveAdminWritePermission(pathname: string): string | null {
  const normalizedPath = normalizeAdminPath(pathname);
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== "api" || segments[1] !== "admin") {
    return null;
  }

  const section = segments[2];
  const subSection = segments[3];
  const leaf = segments[4];

  if (!section) return null;

  switch (section) {
    case "users":
      return ADMIN_ONLY;
    case "upload":
    case "visitor-stats":
      return ANY_PERMISSION;
    case "activity-albums":
    case "activity-photos":
      return "/admin/photo-albums";
    case "contact":
      return "/admin/contact-info";
    case "site-images":
      return "/admin/mega-images";
    case "pages":
      if (!subSection) return null;
      return leaf === "images"
        ? `/admin/pages/${subSection}/images`
        : `/admin/pages/${subSection}`;
    default:
      return `/admin/${section}`;
  }
}

async function getAuthenticatedAdminUser(
  req: NextRequest
): Promise<AuthenticatedAdminUser | null> {
  const payload = await authenticateRequest(req);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      userName: true,
      fullName: true,
      userRole: true,
      isActive: true,
      menuPermissions: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    userId: user.id,
    userName: user.userName,
    fullName: user.fullName || user.userName,
    userRole: user.userRole || "viewer",
    isActive: user.isActive,
    menuPermissions: normalizeMenuPermissions(user.menuPermissions),
  };
}

function hasPermission(
  user: AuthenticatedAdminUser,
  permission: string | null
): boolean {
  if (user.userRole === "admin") {
    return true;
  }

  if (!permission) {
    return false;
  }

  if (permission === ADMIN_ONLY) {
    return false;
  }

  if (permission === ANY_PERMISSION) {
    return user.menuPermissions.length > 0;
  }

  return user.menuPermissions.includes(permission);
}

export async function requireAdmin(
  req: NextRequest
): Promise<AuthenticatedAdminUser | NextResponse> {
  const user = await getAuthenticatedAdminUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return user;
}

export async function requirePermission(
  req: NextRequest,
  permission: string
): Promise<AuthenticatedAdminUser | NextResponse> {
  const user = await getAuthenticatedAdminUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return user;
}

export async function requireAdminRouteAccess(
  req: NextRequest
): Promise<AuthenticatedAdminUser | NextResponse> {
  const permission = resolveAdminWritePermission(req.nextUrl.pathname);
  if (!permission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return requirePermission(req, permission);
}

export async function requireAdminWriteAccess(
  req: NextRequest
): Promise<AuthenticatedAdminUser | NextResponse> {
  return requireAdminRouteAccess(req);
}
