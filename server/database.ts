import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "";
const IS_MONGODB_CONFIGURED = !!MONGODB_URI && MONGODB_URI.trim() !== "";

// Type declaration for the unified User record
export interface IUser {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "expert" | "farmer";
  createdAt: Date;
  phoneNumber?: string;
  location?: string;
  photoURL?: string;
}

export interface IReport {
  id: string;
  ownerId: string;
  findings: string;
  imageUrl: string;
  status: string;
  createdAt: Date;
}

// ==========================================
// MONGODB MONGOOSE SCHEMA DEFINITIONS
// ==========================================
let MongooseUserModel: any = null;
let MongooseReportModel: any = null;

if (IS_MONGODB_CONFIGURED) {
  try {
    const UserSchema = new mongoose.Schema({
      displayName: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["admin", "expert", "farmer"], default: "farmer" },
      createdAt: { type: Date, default: Date.now },
      phoneNumber: { type: String, default: "" },
      location: { type: String, default: "" },
      photoURL: { type: String, default: "" },
    });

    // Clean virtuals for ID mapping
    UserSchema.virtual("id").get(function () {
      return this._id.toHexString();
    });
    UserSchema.set("toJSON", { virtuals: true });
    UserSchema.set("toObject", { virtuals: true });

    MongooseUserModel = mongoose.models.User || mongoose.model("User", UserSchema);
    console.log("🍃 MongoDB Mongoose schemas initialized successfully.");

    const ReportSchema = new mongoose.Schema({
      ownerId: { type: String, required: true },
      findings: { type: String, required: true },
      imageUrl: { type: String, required: true },
      status: { type: String, default: 'completed' },
      createdAt: { type: Date, default: Date.now }
    });
    MongooseReportModel = mongoose.models.Report || mongoose.model("Report", ReportSchema);
    console.log("🍃 MongoDB Mongoose Report schema initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to compile Mongoose models:", error);
  }
}

// ==========================================
// LOCAL FILE BACKED DATABASE ENGINE (FALLBACK)
// ==========================================
const LOCAL_DB_PATH = process.env.VERCEL || process.env.NODE_ENV === "production"
  ? path.join("/tmp", "db_fallback.json")
  : path.join(process.cwd(), "db_fallback.json");

interface LocalDBSchema {
  users: IUser[];
  reports: IReport[];
}

function loadLocalDB(): LocalDBSchema {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    // Generate some default users so it works immediately out of the box!
    const defaultUsers: IUser[] = [
      {
        id: "usr-admin",
        displayName: "Admin Samson",
        email: "admin@agrinovia.tech",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
        createdAt: new Date(),
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        phoneNumber: "+251911000001",
        location: "Addis Ababa Hub",
      },
      {
        id: "usr-expert",
        displayName: "Dr. Helen Kassaye",
        email: "helen@agrinovia.tech",
        passwordHash: bcrypt.hashSync("expert123", 10),
        role: "expert",
        createdAt: new Date(),
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=helen",
        phoneNumber: "+251911000002",
        location: "Jimma Coffee Research",
      },
      {
        id: "usr-farmer",
        displayName: "Farmer Samson Abreham",
        email: "farmer@agrinovia.tech",
        passwordHash: bcrypt.hashSync("farmer123", 10),
        role: "farmer",
        createdAt: new Date(),
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=farmer",
        phoneNumber: "+251911000003",
        location: "North Ridge Estate",
      }
    ];
    const initialDB = { users: defaultUsers, reports: [] };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.reports) parsed.reports = [];
    return parsed;
  } catch (err) {
    return { users: [], reports: [] };
  }
}

function saveLocalDB(data: LocalDBSchema) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Failed to write fallback local DB:", err);
  }
}

// ==========================================
// UNIFIED DATABASE CLIENT INTERFACE
// ==========================================
export const dbClient = {
  async connect() {
    if (!IS_MONGODB_CONFIGURED) {
      console.warn("⚠️ MONGODB_URI is empty or unconfigured. Running in offline fallback JSON file mode.");
      return;
    }
    if (mongoose.connection.readyState === 1) {
      return;
    }
    try {
      console.log("🔌 Attempting to connect to MongoDB...");
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      } as any);
      console.log("✅ Successfully connected to MongoDB Atlas!");
    } catch (error) {
      console.error("❌ MongoDB connection error. Falling back to local JSON engine:", error);
    }
  },

  async findUserByEmail(email: string): Promise<IUser | null> {
    await this.connect();
    const sanitizedEmail = email.toLowerCase().trim();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const doc = await MongooseUserModel.findOne({ email: sanitizedEmail });
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        displayName: doc.displayName,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt,
        phoneNumber: doc.phoneNumber,
        location: doc.location,
        photoURL: doc.photoURL,
      };
    } else {
      const data = loadLocalDB();
      const user = data.users.find(u => u.email.toLowerCase() === sanitizedEmail);
      return user ? { ...user, createdAt: new Date(user.createdAt) } : null;
    }
  },

  async findUserById(id: string): Promise<IUser | null> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const doc = await MongooseUserModel.findById(id);
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        displayName: doc.displayName,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt,
        phoneNumber: doc.phoneNumber,
        location: doc.location,
        photoURL: doc.photoURL,
      };
    } else {
      const data = loadLocalDB();
      const user = data.users.find(u => u.id === id);
      return user ? { ...user, createdAt: new Date(user.createdAt) } : null;
    }
  },

  async createUser(userData: Omit<IUser, "id" | "createdAt">): Promise<IUser> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const newUser = new MongooseUserModel({
        ...userData,
        email: userData.email.toLowerCase().trim(),
        photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.displayName)}`,
      });
      const saved = await newUser.save();
      return {
        id: saved._id.toString(),
        displayName: saved.displayName,
        email: saved.email,
        passwordHash: saved.passwordHash,
        role: saved.role,
        createdAt: saved.createdAt,
        phoneNumber: saved.phoneNumber,
        location: saved.location,
        photoURL: saved.photoURL,
      };
    } else {
      const data = loadLocalDB();
      const newUser: IUser = {
        ...userData,
        id: "usr-" + Math.random().toString(36).substr(2, 9),
        email: userData.email.toLowerCase().trim(),
        createdAt: new Date(),
        photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.displayName)}`,
      };
      data.users.push(newUser);
      saveLocalDB(data);
      return newUser;
    }
  },

  async listUsers(): Promise<IUser[]> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const docs = await MongooseUserModel.find();
      return docs.map((doc: any) => ({
        id: doc._id.toString(),
        displayName: doc.displayName,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt,
        phoneNumber: doc.phoneNumber,
        location: doc.location,
        photoURL: doc.photoURL,
      }));
    } else {
      const data = loadLocalDB();
      return data.users.map(u => ({ ...u, createdAt: new Date(u.createdAt) }));
    }
  },

  async updateUser(id: string, updates: Partial<Omit<IUser, "id" | "createdAt" | "passwordHash">>): Promise<IUser | null> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const updated = await MongooseUserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
      if (!updated) return null;
      return {
        id: updated._id.toString(),
        displayName: updated.displayName,
        email: updated.email,
        passwordHash: updated.passwordHash,
        role: updated.role,
        createdAt: updated.createdAt,
        phoneNumber: updated.phoneNumber,
        location: updated.location,
        photoURL: updated.photoURL,
      };
    } else {
      const data = loadLocalDB();
      const index = data.users.findIndex(u => u.id === id);
      if (index === -1) return null;
      data.users[index] = {
        ...data.users[index],
        ...updates
      } as any;
      saveLocalDB(data);
      return { ...data.users[index], createdAt: new Date(data.users[index].createdAt) };
    }
  },

  async createReport(reportData: Omit<IReport, "id" | "createdAt">): Promise<IReport> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const newReport = new MongooseReportModel({
        ...reportData,
        createdAt: new Date(),
      });
      const saved = await newReport.save();
      return {
        id: saved._id.toString(),
        ownerId: saved.ownerId,
        findings: saved.findings,
        imageUrl: saved.imageUrl,
        status: saved.status,
        createdAt: saved.createdAt,
      };
    } else {
      const data = loadLocalDB();
      const newReport: IReport = {
        ...reportData,
        id: "rep-" + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      data.reports.push(newReport);
      saveLocalDB(data);
      return newReport;
    }
  },

  async listReportsByOwner(ownerId: string): Promise<IReport[]> {
    await this.connect();
    if (IS_MONGODB_CONFIGURED && mongoose.connection.readyState === 1) {
      const docs = await MongooseReportModel.find({ ownerId }).sort({ createdAt: -1 });
      return docs.map((doc: any) => ({
        id: doc._id.toString(),
        ownerId: doc.ownerId,
        findings: doc.findings,
        imageUrl: doc.imageUrl,
        status: doc.status,
        createdAt: doc.createdAt,
      }));
    } else {
      const data = loadLocalDB();
      return data.reports
        .filter(r => r.ownerId === ownerId)
        .map(r => ({ ...r, createdAt: new Date(r.createdAt) }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }
};
