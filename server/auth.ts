import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbClient, IUser } from "./database";

const JWT_SECRET = process.env.JWT_SECRET || "agrinovia-super-secret-key-2026";

// Extend Express Request interface to store authenticated user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "expert" | "farmer";
    displayName: string;
    photoURL?: string;
  };
}

// JWT Authenticated Middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, userPayload: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired access token" });
    }
    req.user = userPayload;
    next();
  });
}

// Role Authorization Middleware helper
export function requireRole(roles: Array<"admin" | "expert" | "farmer">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized access: privilege tier mismatch" });
    }
    next();
  };
}

// Authentication Router helper functions
export async function handleRegister(req: Request, res: Response) {
  try {
    const { email, password, displayName, role, phoneNumber, location } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }

    const validatedRole = role && ["admin", "expert", "farmer"].includes(role) ? role : "farmer";

    // Check if user already exists
    const existingUser = await dbClient.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email address already exists" });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const user = await dbClient.createUser({
      displayName,
      email,
      passwordHash,
      role: validatedRole as any,
      phoneNumber: phoneNumber || "",
      location: location || "",
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`
    });

    // Sign JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        location: user.location,
        photoURL: user.photoURL,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: "Failed to register user. System anomaly detected." });
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await dbClient.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password credentials" });
    }

    // Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password credentials" });
    }

    // Sign JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        location: user.location,
        photoURL: user.photoURL,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "An unexpected error occurred during sign-in." });
  }
}

export async function handleGetMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await dbClient.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile no longer exists in system directories" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        location: user.location,
        photoURL: user.photoURL,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error("❌ Fetch self profile error:", error);
    res.status(500).json({ error: "Failed to retrieve user profile credentials." });
  }
}

export async function handleGetAllUsers(req: AuthRequest, res: Response) {
  try {
    const rawUsers = await dbClient.listUsers();
    // Strip passwords before dispatching
    const users = rawUsers.map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      phoneNumber: u.phoneNumber,
      location: u.location,
      photoURL: u.photoURL,
      createdAt: u.createdAt
    }));
    res.json({ users });
  } catch (error: any) {
    console.error("❌ List users error:", error);
    res.status(500).json({ error: "Failed to fetch user directory." });
  }
}

export async function handleUpdateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { displayName, phoneNumber, location, role, photoURL } = req.body;
    
    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (location !== undefined) updates.location = location;
    if (role !== undefined && ["admin", "expert", "farmer"].includes(role)) {
      updates.role = role;
    }
    if (photoURL !== undefined) updates.photoURL = photoURL;

    const updatedUser = await dbClient.updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User profile no longer exists" });
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
        location: updatedUser.location,
        photoURL: updatedUser.photoURL,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error: any) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ error: "Failed to update user profile." });
  }
}
