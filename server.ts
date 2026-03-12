import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const db = new Database("database.sqlite");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    indexNumber TEXT,
    dob TEXT,
    gender TEXT,
    class TEXT,
    division TEXT,
    assignedClasses TEXT, -- JSON array of {class, division} for teachers
    points INTEGER DEFAULT 0,
    address TEXT,
    parentName TEXT,
    parentContact TEXT,
    phone TEXT,
    photoUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade TEXT NOT NULL,
    division TEXT NOT NULL,
    teacherId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade, division)
  );

  CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    height REAL,
    weight REAL,
    bmi REAL,
    category TEXT,
    date TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    type TEXT,
    name TEXT,
    date TEXT,
    duration INTEGER,
    performance TEXT,
    remarks TEXT,
    points INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    imageUrl TEXT,
    link TEXT,
    category TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    reply TEXT,
    repliedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(studentId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacherId TEXT NOT NULL,
    class TEXT NOT NULL,
    division TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(teacherId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS student_sports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT NOT NULL,
    sportId INTEGER NOT NULL,
    FOREIGN KEY(studentId) REFERENCES users(id),
    FOREIGN KEY(sportId) REFERENCES sports(id),
    UNIQUE(studentId, sportId)
  );

  CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sportId INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(sportId) REFERENCES sports(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    studentId TEXT NOT NULL,
    status TEXT NOT NULL, -- Present, Absent, Excused
    FOREIGN KEY(sessionId) REFERENCES training_sessions(id),
    FOREIGN KEY(studentId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sports_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT NOT NULL,
    sportId INTEGER NOT NULL,
    type TEXT,
    duration INTEGER,
    performance TEXT,
    notes TEXT,
    date TEXT,
    points INTEGER,
    FOREIGN KEY(studentId) REFERENCES users(id),
    FOREIGN KEY(sportId) REFERENCES sports(id)
  );

  CREATE TABLE IF NOT EXISTS sports_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sportId INTEGER NOT NULL,
    date TEXT NOT NULL,
    results TEXT,
    FOREIGN KEY(sportId) REFERENCES sports(id)
  );

  CREATE TABLE IF NOT EXISTS sports_event_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId INTEGER NOT NULL,
    studentId TEXT NOT NULL,
    result TEXT,
    FOREIGN KEY(eventId) REFERENCES sports_events(id),
    FOREIGN KEY(studentId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS vegetables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    imageUrl TEXT,
    description TEXT,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    harvestDate TEXT,
    sellingDay TEXT,
    nutritionBenefits TEXT,
    isOrganic INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS breakfast_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    imageUrl TEXT,
    description TEXT,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    sellingDate TEXT NOT NULL,
    category TEXT,
    nutritionInfo TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS breakfast_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    itemId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    totalPrice REAL NOT NULL,
    status TEXT DEFAULT 'Reserved',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(itemId) REFERENCES breakfast_items(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    vegetableId INTEGER NOT NULL,
    quantity REAL NOT NULL,
    totalPrice REAL NOT NULL,
    status TEXT DEFAULT 'Reserved',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(vegetableId) REFERENCES vegetables(id)
  );
`);

// Seed Admin User
const seedAdmin = () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@jaffnahindu.com";
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare(`
      INSERT INTO users (id, email, password, fullName, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), adminEmail, hashedPassword, "System Admin", "admin");
    console.log("Admin user seeded successfully.");
  }
};

seedAdmin();

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = db.prepare("SELECT id, email, role, fullName FROM users WHERE id = ?").get(decoded.id);
      if (!user) return res.status(401).json({ error: "User not found" });
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  const isTeacher = (req: any, res: any, next: any) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  const isTeacherOrAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "teacher" && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // Run migrations
  try { db.prepare("ALTER TABLE users ADD COLUMN division TEXT;").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN assignedClasses TEXT;").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN phone TEXT;").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE announcements ADD COLUMN division TEXT;").run(); } catch (e) {}

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
  });

  app.get("/api/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.put("/api/me", authenticate, (req: any, res) => {
    const { address, parentName, parentContact, photoUrl } = req.body;
    db.prepare(`
      UPDATE users 
      SET address = ?, parentName = ?, parentContact = ?, photoUrl = ?
      WHERE id = ?
    `).run(address, parentName, parentContact, photoUrl, req.user.id);
    
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json(updatedUser);
  });

  // Teachers (Admin)
  app.get("/api/teachers", authenticate, isAdmin, (req, res) => {
    const teachers = db.prepare("SELECT * FROM users WHERE role = 'teacher' ORDER BY createdAt DESC").all();
    res.json(teachers);
  });

  app.post("/api/teachers", authenticate, isAdmin, (req, res) => {
    const { email, password, fullName, class: assignedClass, division, phone, indexNumber } = req.body;
    const id = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password || "teacher123", 10);

    try {
      db.prepare(`
        INSERT INTO users (id, email, password, fullName, class, division, phone, indexNumber, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'teacher')
      `).run(id, email, hashedPassword, fullName, assignedClass, division, phone, indexNumber);
      
      const newTeacher = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(newTeacher);
    } catch (error: any) {
      res.status(400).json({ error: "Username/Email already exists" });
    }
  });

  app.put("/api/teachers/:id", authenticate, isAdmin, (req, res) => {
    const { fullName, class: assignedClass, division, phone, indexNumber } = req.body;
    db.prepare(`
      UPDATE users 
      SET fullName = ?, class = ?, division = ?, phone = ?, indexNumber = ?
      WHERE id = ? AND role = 'teacher'
    `).run(fullName, assignedClass, division, phone, indexNumber, req.params.id);
    
    const updatedTeacher = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(updatedTeacher);
  });

  app.delete("/api/teachers/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'teacher'").run(req.params.id);
    res.json({ success: true });
  });

  // Coach Dashboard Endpoints
  app.get("/api/coach/dashboard", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    
    // Get sports managed by this coach
    const sportsManaged = JSON.parse(req.user.assignedClasses || '[]');
    
    // Get stats for these sports
    const stats = sportsManaged.map((sportName: string) => {
      const sport = db.prepare("SELECT id FROM sports WHERE name = ?").get(sportName) as any;
      if (!sport) return { sport: sportName, athletes: 0, activities: 0 };
      
      const athletes = (db.prepare("SELECT COUNT(*) as count FROM student_sports WHERE sportId = ?").get(sport.id) as any).count;
      const activities = (db.prepare("SELECT COUNT(*) as count FROM sports_activities WHERE sportId = ?").get(sport.id) as any).count;
      
      return { sport: sportName, athletes, activities };
    });
    
    res.json(stats);
  });

  app.get("/api/coach/athletes", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    
    const sportsManaged = JSON.parse(req.user.assignedClasses || '[]');
    const athletes = db.prepare(`
      SELECT u.*, s.name as sportName
      FROM users u
      JOIN student_sports ss ON u.id = ss.studentId
      JOIN sports s ON ss.sportId = s.id
      WHERE s.name IN (${sportsManaged.map(() => '?').join(',')})
    `).all(...sportsManaged);
    
    res.json(athletes);
  });

  app.post("/api/coach/attendance", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    const { sportId, date, attendance } = req.body; // attendance: [{studentId, status}]
    
    const session = db.prepare("INSERT INTO training_sessions (sportId, date) VALUES (?, ?)").run(sportId, date);
    const sessionId = session.lastInsertRowid;
    
    const stmt = db.prepare("INSERT INTO attendance (sessionId, studentId, status) VALUES (?, ?, ?)");
    attendance.forEach((a: any) => {
      stmt.run(sessionId, a.studentId, a.status);
      if (a.status === 'Present') {
        db.prepare("UPDATE users SET points = points + 5 WHERE id = ?").run(a.studentId);
      }
    });
    
    res.json({ success: true });
  });

  app.post("/api/coach/activities", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    const { studentId, sportId, type, duration, performance, notes, date } = req.body;
    
    const points = 10; // Completion points
    db.prepare(`
      INSERT INTO sports_activities (studentId, sportId, type, duration, performance, notes, date, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, sportId, type, duration, performance, notes, date, points);
    
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, studentId);
    
    res.json({ success: true });
  });

  // Training Attendance
  app.get("/api/coach/attendance/:sessionId", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    const attendance = db.prepare(`
      SELECT a.*, u.fullName as studentName
      FROM attendance a
      JOIN users u ON a.studentId = u.id
      WHERE a.sessionId = ?
    `).all(req.params.sessionId);
    res.json(attendance);
  });

  // Sports Events
  app.get("/api/coach/events", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    const events = db.prepare("SELECT * FROM sports_events").all();
    res.json(events);
  });

  app.post("/api/coach/events", authenticate, (req: any, res) => {
    if (req.user.role !== 'coach') return res.status(403).json({ error: "Forbidden" });
    const { name, sportId, date } = req.body;
    const result = db.prepare("INSERT INTO sports_events (name, sportId, date) VALUES (?, ?, ?)").run(name, sportId, date);
    res.json({ id: result.lastInsertRowid });
  });

  // Leaderboard
  app.get("/api/leaderboard/sports", authenticate, (req, res) => {
    const leaderboard = db.prepare(`
      SELECT u.fullName, SUM(sa.points) as totalPoints
      FROM users u
      JOIN sports_activities sa ON u.id = sa.studentId
      GROUP BY u.id
      ORDER BY totalPoints DESC
      LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  // Student Sports Profile
  app.get("/api/student/sports-profile/:studentId", authenticate, (req, res) => {
    const profile = db.prepare(`
      SELECT s.name as sportName, sa.type, sa.duration, sa.performance, sa.date, sa.points
      FROM student_sports ss
      JOIN sports s ON ss.sportId = s.id
      LEFT JOIN sports_activities sa ON ss.studentId = sa.studentId AND ss.sportId = sa.sportId
      WHERE ss.studentId = ?
    `).all(req.params.studentId);
    res.json(profile);
  });

  // Sports Management
  app.get("/api/sports", authenticate, isAdmin, (req, res) => {
    const sports = db.prepare(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM student_sports ss WHERE ss.sportId = s.id) as studentCount
      FROM sports s
    `).all();
    res.json(sports);
  });

  // Breakfast Club Marketplace
  app.get("/api/breakfast-items", authenticate, (req, res) => {
    const items = db.prepare("SELECT * FROM breakfast_items WHERE sellingDate >= date('now')").all();
    res.json(items);
  });

  app.post("/api/breakfast-items", authenticate, isAdmin, (req, res) => {
    const { name, imageUrl, description, price, quantity, sellingDate, category, nutritionInfo } = req.body;
    const result = db.prepare(`
      INSERT INTO breakfast_items (name, imageUrl, description, price, quantity, sellingDate, category, nutritionInfo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, imageUrl, description, price, quantity, sellingDate, category, nutritionInfo);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/breakfast-reservations", authenticate, (req: any, res) => {
    const { itemId, quantity } = req.body;
    const userId = req.user.id;

    const item: any = db.prepare("SELECT * FROM breakfast_items WHERE id = ?").get(itemId);
    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const totalPrice = quantity * item.price;
    
    db.prepare("UPDATE breakfast_items SET quantity = quantity - ? WHERE id = ?").run(quantity, itemId);
    db.prepare("INSERT INTO breakfast_reservations (userId, itemId, quantity, totalPrice) VALUES (?, ?, ?, ?)").run(userId, itemId, quantity, totalPrice);
    
    // Add health points (e.g., 10 points per Rs 100 spent)
    const points = Math.floor(totalPrice / 100) * 10;
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);

    res.json({ success: true });
  });

  app.get("/api/my-breakfast-reservations", authenticate, (req: any, res) => {
    const reservations = db.prepare(`
      SELECT r.*, i.name as itemName, i.sellingDate
      FROM breakfast_reservations r
      JOIN breakfast_items i ON r.itemId = i.id
      WHERE r.userId = ?
    `).all(req.user.id);
    res.json(reservations);
  });

  app.get("/api/admin/breakfast-reservations", authenticate, isAdmin, (req, res) => {
    const reservations = db.prepare(`
      SELECT r.*, i.name as itemName, u.fullName as userName
      FROM breakfast_reservations r
      JOIN breakfast_items i ON r.itemId = i.id
      JOIN users u ON r.userId = u.id
    `).all();
    res.json(reservations);
  });

  app.put("/api/admin/breakfast-reservations/:id/collect", authenticate, isAdmin, (req, res) => {
    db.prepare("UPDATE breakfast_reservations SET status = 'Collected' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/breakfast-analytics", authenticate, isAdmin, (req, res) => {
    const totalReservations = db.prepare("SELECT COUNT(*) as count FROM breakfast_reservations").get() as any;
    const totalRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM breakfast_reservations").get() as any;
    const popularItems = db.prepare(`
      SELECT i.name, SUM(r.quantity) as totalQuantity
      FROM breakfast_reservations r
      JOIN breakfast_items i ON r.itemId = i.id
      GROUP BY i.id
      ORDER BY totalQuantity DESC
      LIMIT 5
    `).all();
    
    res.json({
      totalReservations: totalReservations.count,
      totalRevenue: totalRevenue.total || 0,
      popularItems
    });
  });

  app.get("/api/leaderboard", authenticate, (req, res) => {
    const leaderboard = db.prepare(`
      SELECT fullName, points
      FROM users
      WHERE role = 'student'
      ORDER BY points DESC
      LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  app.post("/api/reservations", authenticate, (req: any, res) => {
    const { vegetableId, quantity } = req.body;
    const userId = req.user.id;

    const vegetable: any = db.prepare("SELECT * FROM vegetables WHERE id = ?").get(vegetableId);
    if (!vegetable || vegetable.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const totalPrice = quantity * vegetable.price;
    
    // Reserve
    db.prepare("UPDATE vegetables SET quantity = quantity - ? WHERE id = ?").run(quantity, vegetableId);
    db.prepare("INSERT INTO reservations (userId, vegetableId, quantity, totalPrice) VALUES (?, ?, ?, ?)").run(userId, vegetableId, quantity, totalPrice);
    
    // Add points
    const points = Math.floor(totalPrice / 100) * 10;
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);

    res.json({ success: true });
  });

  app.get("/api/my-reservations", authenticate, (req: any, res) => {
    const reservations = db.prepare(`
      SELECT r.*, v.name as vegetableName
      FROM reservations r
      JOIN vegetables v ON r.vegetableId = v.id
      WHERE r.userId = ?
    `).all(req.user.id);
    res.json(reservations);
  });

  app.get("/api/my-badges", authenticate, (req: any, res) => {
    const activities = db.prepare("SELECT COUNT(*) as count FROM activities WHERE userId = ?").get(req.user.id) as any;
    const healthRecords = db.prepare("SELECT category FROM health_records WHERE userId = ? ORDER BY date DESC LIMIT 1").get(req.user.id) as any;
    
    const badges = [];
    if (activities.count >= 5) badges.push({ name: 'Active Learner', icon: '🏃' });
    if (activities.count >= 20) badges.push({ name: 'Fitness Enthusiast', icon: '🔥' });
    if (healthRecords && healthRecords.category === 'Normal') badges.push({ name: 'Health Champion', icon: '🏆' });
    
    res.json(badges);
  });

  app.get("/api/admin/reservations", authenticate, isAdmin, (req, res) => {
    const reservations = db.prepare(`
      SELECT r.*, v.name as vegetableName, u.fullName as userName
      FROM reservations r
      JOIN vegetables v ON r.vegetableId = v.id
      JOIN users u ON r.userId = u.id
    `).all();
    res.json(reservations);
  });

  app.put("/api/admin/reservations/:id/collect", authenticate, isAdmin, (req, res) => {
    db.prepare("UPDATE reservations SET status = 'Collected' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Admin Analytics
  app.get("/api/admin/analytics", authenticate, isAdmin, (req, res) => {
    const totalReservations = db.prepare("SELECT COUNT(*) as count FROM reservations").get() as any;
    const totalRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM reservations").get() as any;
    const popularVegetables = db.prepare(`
      SELECT v.name, SUM(r.quantity) as totalQuantity
      FROM reservations r
      JOIN vegetables v ON r.vegetableId = v.id
      GROUP BY v.id
      ORDER BY totalQuantity DESC
      LIMIT 5
    `).all();
    
    res.json({
      totalReservations: totalReservations.count,
      totalRevenue: totalRevenue.total || 0,
      popularVegetables
    });
  });

  // Database Migration Support
  app.get("/api/admin/dump-db", authenticate, isAdmin, (req, res) => {
    const tables = [
      'users', 'classrooms', 'health_records', 'activities', 
      'modules', 'queries', 'announcements', 'sports', 
      'student_sports', 'training_sessions', 'attendance', 
      'sports_activities', 'sports_events', 'sports_event_participants',
      'vegetables', 'breakfast_items', 'breakfast_reservations', 'reservations'
    ];
    
    const dump: any = {};
    for (const table of tables) {
      try {
        dump[table] = db.prepare(`SELECT * FROM ${table}`).all();
      } catch (e) {
        dump[table] = [];
      }
    }
    
    res.json(dump);
  });

  app.post("/api/sports", authenticate, isAdmin, (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO sports (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid, name, studentCount: 0 });
    } catch (e) {
      res.status(400).json({ error: "Sport already exists" });
    }
  });

  app.delete("/api/sports/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM sports WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Coach Management
  app.get("/api/coaches", authenticate, isAdmin, (req, res) => {
    const coaches = db.prepare("SELECT * FROM users WHERE role = 'coach'").all();
    res.json(coaches);
  });

  app.post("/api/coaches", authenticate, isAdmin, (req, res) => {
    const { fullName, email, password, phone, indexNumber, sportsManaged } = req.body;
    const id = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password || "coach123", 10);

    try {
      db.prepare(`
        INSERT INTO users (id, email, password, fullName, phone, indexNumber, role, assignedClasses)
        VALUES (?, ?, ?, ?, ?, ?, 'coach', ?)
      `).run(id, email, hashedPassword, fullName, phone, indexNumber, JSON.stringify(sportsManaged));
      
      const newCoach = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(newCoach);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  // Student Enrollment
  app.post("/api/student-sports", authenticate, (req, res) => {
    const { studentId, sportId } = req.body;
    try {
      db.prepare("INSERT INTO student_sports (studentId, sportId) VALUES (?, ?)").run(studentId, sportId);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Enrollment failed" });
    }
  });

  // Classrooms (Admin)
  app.get("/api/classrooms", authenticate, isAdmin, (req, res) => {
    const classrooms = db.prepare(`
      SELECT c.*, u.fullName as teacherName,
             (SELECT COUNT(*) FROM users s WHERE s.class = c.grade AND s.division = c.division AND s.role = 'student') as studentCount
      FROM classrooms c
      LEFT JOIN users u ON c.teacherId = u.id
      ORDER BY c.grade, c.division
    `).all();
    res.json(classrooms);
  });

  app.post("/api/classrooms", authenticate, isAdmin, (req, res) => {
    const { grade, division, teacherId } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO classrooms (grade, division, teacherId)
        VALUES (?, ?, ?)
      `).run(grade, division, teacherId || null);
      
      const newClassroom = db.prepare(`
        SELECT c.*, u.fullName as teacherName, 0 as studentCount
        FROM classrooms c
        LEFT JOIN users u ON c.teacherId = u.id
        WHERE c.id = ?
      `).get(result.lastInsertRowid);
      res.json(newClassroom);
    } catch (error: any) {
      res.status(400).json({ error: "Classroom already exists" });
    }
  });

  app.put("/api/classrooms/:id", authenticate, isAdmin, (req, res) => {
    const { grade, division, teacherId } = req.body;
    try {
      db.prepare(`
        UPDATE classrooms 
        SET grade = ?, division = ?, teacherId = ?
        WHERE id = ?
      `).run(grade, division, teacherId || null, req.params.id);
      
      const updatedClassroom = db.prepare(`
        SELECT c.*, u.fullName as teacherName,
               (SELECT COUNT(*) FROM users s WHERE s.class = c.grade AND s.division = c.division AND s.role = 'student') as studentCount
        FROM classrooms c
        LEFT JOIN users u ON c.teacherId = u.id
        WHERE c.id = ?
      `).get(req.params.id);
      res.json(updatedClassroom);
    } catch (error: any) {
      res.status(400).json({ error: "Failed to update classroom" });
    }
  });

  app.delete("/api/classrooms/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM classrooms WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Students (Admin)
  app.get("/api/students", authenticate, isAdmin, (req, res) => {
    const students = db.prepare("SELECT * FROM users WHERE role = 'student' ORDER BY createdAt DESC").all();
    res.json(students);
  });

  app.post("/api/students", authenticate, isAdmin, (req, res) => {
    const { email, password, fullName, indexNumber, dob, gender, class: studentClass, division, address, parentName, parentContact } = req.body;
    const id = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password || "student123", 10);

    try {
      db.prepare(`
        INSERT INTO users (id, email, password, fullName, indexNumber, dob, gender, class, division, address, parentName, parentContact, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student')
      `).run(id, email, hashedPassword, fullName, indexNumber, dob, gender, studentClass, division, address, parentName, parentContact);
      
      const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(newUser);
    } catch (error: any) {
      res.status(400).json({ error: "Username/Email already exists" });
    }
  });

  // Health Records
  app.get("/api/health-records/:userId", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const records = db.prepare("SELECT * FROM health_records WHERE userId = ? ORDER BY date DESC").all(req.params.userId);
    res.json(records);
  });

  app.post("/api/health-records", authenticate, isAdmin, (req, res) => {
    const { userId, height, weight, date } = req.body;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    const result = db.prepare(`
      INSERT INTO health_records (userId, height, weight, bmi, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, height, weight, bmi, category, date);

    const newRecord = db.prepare("SELECT * FROM health_records WHERE id = ?").get(result.lastInsertRowid);
    res.json(newRecord);
  });

  // Activities
  app.get("/api/activities/:userId", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const activities = db.prepare("SELECT * FROM activities WHERE userId = ? ORDER BY date DESC").all(req.params.userId);
    res.json(activities);
  });

  app.post("/api/activities", authenticate, (req: any, res) => {
    const { type, name, date, duration, performance, remarks } = req.body;
    const userId = req.user.id;
    
    let points = 10;
    if (type === 'sport') points = 50;
    if (type === 'exercise') points = 20;

    const result = db.prepare(`
      INSERT INTO activities (userId, type, name, date, duration, performance, remarks, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, type, name, date, duration, performance, remarks, points);

    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
    
    const newActivity = db.prepare("SELECT * FROM activities WHERE id = ?").get(result.lastInsertRowid);
    res.json(newActivity);
  });

  // Teacher Endpoints
  app.get("/api/teacher/students", authenticate, isTeacher, (req: any, res) => {
    const students = db.prepare("SELECT * FROM users WHERE role = 'student' AND class = ? AND division = ? ORDER BY createdAt DESC").all(req.user.class, req.user.division);
    
    // Get latest BMI and total points for each student
    const studentsWithStats = students.map((student: any) => {
      const latestHealth = db.prepare("SELECT bmi, category FROM health_records WHERE userId = ? ORDER BY date DESC LIMIT 1").get(student.id) as any;
      return {
        ...student,
        latestBmi: latestHealth?.bmi || null,
        healthCategory: latestHealth?.category || 'Unknown',
      };
    });
    
    res.json(studentsWithStats);
  });

  app.post("/api/teacher/health-records", authenticate, isTeacher, (req: any, res) => {
    const { userId, height, weight, date, notes } = req.body;
    
    // Verify student is in teacher's class
    const student = db.prepare("SELECT class, division FROM users WHERE id = ?").get(userId) as any;
    if (!student || student.class !== req.user.class || student.division !== req.user.division) {
      return res.status(403).json({ error: "Student not in your class/division" });
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    const result = db.prepare(`
      INSERT INTO health_records (userId, height, weight, bmi, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, height, weight, bmi, category, date);

    const newRecord = db.prepare("SELECT * FROM health_records WHERE id = ?").get(result.lastInsertRowid) as any;
    res.json({ ...newRecord, notes }); // Notes are not stored in db currently, but we return them for UI
  });

  app.post("/api/teacher/activities", authenticate, isTeacher, (req: any, res) => {
    const { userId, type, name, date, duration, performance, remarks } = req.body;
    
    // Verify student is in teacher's class
    const student = db.prepare("SELECT class, division FROM users WHERE id = ?").get(userId) as any;
    if (!student || student.class !== req.user.class || student.division !== req.user.division) {
      return res.status(403).json({ error: "Student not in your class/division" });
    }

    let points = 10;
    if (type === 'sport') points = 50;
    if (type === 'exercise') points = 20;

    const result = db.prepare(`
      INSERT INTO activities (userId, type, name, date, duration, performance, remarks, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, type, name, date, duration, performance, remarks, points);

    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
    
    const newActivity = db.prepare("SELECT * FROM activities WHERE id = ?").get(result.lastInsertRowid);
    res.json(newActivity);
  });

  app.get("/api/teacher/analytics", authenticate, isTeacher, (req: any, res) => {
    const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND class = ? AND division = ?").get(req.user.class, req.user.division) as any).count;
    
    const bmiStats = db.prepare(`
      SELECT h.category, COUNT(*) as count 
      FROM health_records h
      JOIN users u ON h.userId = u.id
      WHERE u.class = ? AND u.division = ? AND h.id IN (
        SELECT MAX(id) FROM health_records GROUP BY userId
      )
      GROUP BY h.category
    `).all(req.user.class, req.user.division);

    const activityStats = db.prepare(`
      SELECT a.type, COUNT(*) as count 
      FROM activities a
      JOIN users u ON a.userId = u.id
      WHERE u.class = ? AND u.division = ?
      GROUP BY a.type
    `).all(req.user.class, req.user.division);

    res.json({
      totalStudents,
      bmiStats,
      activityStats,
    });
  });

  app.get("/api/teacher/announcements", authenticate, isTeacher, (req: any, res) => {
    const announcements = db.prepare("SELECT * FROM announcements WHERE class = ? AND division = ? ORDER BY createdAt DESC").all(req.user.class, req.user.division);
    res.json(announcements);
  });

  app.post("/api/teacher/announcements", authenticate, isTeacher, (req: any, res) => {
    const { title, content } = req.body;
    const result = db.prepare(`
      INSERT INTO announcements (teacherId, class, division, title, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, req.user.class, req.user.division, title, content);
    
    const newAnnouncement = db.prepare("SELECT * FROM announcements WHERE id = ?").get(result.lastInsertRowid);
    res.json(newAnnouncement);
  });

  app.get("/api/teacher/queries", authenticate, isTeacher, (req: any, res) => {
    const queries = db.prepare(`
      SELECT q.*, u.fullName as studentName 
      FROM queries q
      JOIN users u ON q.studentId = u.id
      WHERE u.class = ? AND u.division = ?
      ORDER BY q.createdAt DESC
    `).all(req.user.class, req.user.division);
    res.json(queries);
  });

  app.put("/api/teacher/queries/:id/reply", authenticate, isTeacher, (req: any, res) => {
    const { reply } = req.body;
    
    // Verify query belongs to a student in teacher's class
    const query = db.prepare(`
      SELECT q.id 
      FROM queries q
      JOIN users u ON q.studentId = u.id
      WHERE q.id = ? AND u.class = ? AND u.division = ?
    `).get(req.params.id, req.user.class, req.user.division);

    if (!query) {
      return res.status(403).json({ error: "Query not found or student not in your class/division" });
    }

    db.prepare(`
      UPDATE queries 
      SET reply = ?, status = 'resolved', repliedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reply, req.params.id);
    res.json({ success: true });
  });

  // Modules
  app.get("/api/modules", (req, res) => {
    const modules = db.prepare("SELECT * FROM modules ORDER BY createdAt DESC").all();
    res.json(modules);
  });

  app.get("/api/public/breakfast-items", (req, res) => {
    const items = db.prepare("SELECT * FROM breakfast_items WHERE quantity > 0").all();
    res.json(items);
  });

  app.get("/api/public/vegetables", (req, res) => {
    const vegetables = db.prepare("SELECT * FROM vegetables WHERE quantity > 0").all();
    res.json(vegetables);
  });

  app.post("/api/modules", authenticate, isAdmin, (req, res) => {
    const { title, description, imageUrl, link, category } = req.body;
    const result = db.prepare(`
      INSERT INTO modules (title, description, imageUrl, link, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, imageUrl, link, category);
    
    const newModule = db.prepare("SELECT * FROM modules WHERE id = ?").get(result.lastInsertRowid);
    res.json(newModule);
  });

  app.delete("/api/modules/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM modules WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Public Leaderboard
  app.get("/api/public/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT id, fullName as name, points, photoUrl as avatar
      FROM users 
      WHERE role = 'student' 
      ORDER BY points DESC 
      LIMIT 10
    `).all();
    
    const formattedLeaderboard = leaderboard.map((user: any, index: number) => ({
      ...user,
      rank: index + 1,
      avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`
    }));
    res.json(formattedLeaderboard);
  });

  // Announcements (Student)
  app.get("/api/announcements", authenticate, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: "Forbidden" });
    const announcements = db.prepare(`
      SELECT a.*, u.fullName as teacherName 
      FROM announcements a
      JOIN users u ON a.teacherId = u.id
      WHERE a.class = ? AND a.division = ?
      ORDER BY a.createdAt DESC
    `).all(req.user.class, req.user.division);
    res.json(announcements);
  });

  // Queries
  app.get("/api/queries", authenticate, (req: any, res) => {
    let queries;
    if (req.user.role === 'admin') {
      queries = db.prepare("SELECT * FROM queries ORDER BY createdAt DESC").all();
    } else {
      queries = db.prepare("SELECT * FROM queries WHERE studentId = ? ORDER BY createdAt DESC").all(req.user.id);
    }
    res.json(queries);
  });

  app.post("/api/queries", authenticate, (req: any, res) => {
    const { subject, message } = req.body;
    const result = db.prepare(`
      INSERT INTO queries (studentId, subject, message)
      VALUES (?, ?, ?)
    `).run(req.user.id, subject, message);
    
    const newQuery = db.prepare("SELECT * FROM queries WHERE id = ?").get(result.lastInsertRowid);
    res.json(newQuery);
  });

  app.post("/api/queries/:id/reply", authenticate, isAdmin, (req, res) => {
    const { reply } = req.body;
    db.prepare(`
      UPDATE queries 
      SET reply = ?, status = 'resolved', repliedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reply, req.params.id);
    res.json({ success: true });
  });

  // Analytics
  app.get("/api/analytics", authenticate, isAdmin, (req, res) => {
    const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number }).count;
    
    const bmiStats = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM health_records 
      GROUP BY category
    `).all();

    const activityStats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM activities 
      GROUP BY type
    `).all();

    res.json({
      totalStudents,
      bmiStats,
      activityStats,
      classStats: []
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.get("/api/health", (req, res) => res.send("OK"));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
