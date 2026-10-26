import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDB, saveDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Setup uploads directory for actual video uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Current simulated session user
let currentUser = {
  id: 'c1',
  name: 'Ali Traders',
  role: 'client', // 'client' or 'editor'
  email: 'ali@traders.pk'
};

/* ================= AUTH ================= */
app.get('/api/auth/me', (req, res) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { role, clientId } = req.body;
  const db = getDB();
  if (role === 'editor') {
    const editor = db.clients.find(c => c.role === 'editor');
    if (editor) currentUser = editor;
  } else {
    // Role is client
    const target = clientId ? db.clients.find(c => c.id === clientId) : db.clients.find(c => c.role === 'client');
    if (target) currentUser = target;
  }
  res.json({ user: currentUser });
});

/* ================= CLIENT MANAGEMENT ================= */
app.get('/api/clients', (req, res) => {
  const db = getDB();
  const clientList = db.clients.filter(c => c.role === 'client');
  res.json(clientList);
});

app.post('/api/clients', (req, res) => {
  const { name, email, phone, projectTitle, shootDaysCount } = req.body;
  if (!name || !projectTitle) {
    return res.status(400).json({ error: 'Name and projectTitle are required' });
  }

  const db = getDB();
  const clientId = 'c_' + Date.now();
  const projectId = 'p_' + Date.now();

  const newClient = {
    id: clientId,
    name: name.trim(),
    email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '')}@agency.pk`,
    phone: phone ? phone.trim() : '+92 300 0000000',
    role: 'client'
  };

  const newProject = {
    id: projectId,
    clientId: clientId,
    title: projectTitle.trim(),
    clientName: newClient.name,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0]
  };

  // Generate shoot days (1 to count)
  const count = Math.min(Math.max(Number(shootDaysCount) || 2, 1), 7);
  const createdShootDays = [];
  for (let i = 1; i <= count; i++) {
    const sd = {
      id: `sd_${Date.now()}_${i}`,
      projectId: projectId,
      dayNumber: i,
      title: `Shoot Day ${i} - ${newClient.name}`,
      date: new Date(Date.now() + (i - 1) * 86400000 * 3).toISOString().split('T')[0],
      deliverablesCount: 0
    };
    createdShootDays.push(sd);
  }

  db.clients.push(newClient);
  db.projects.push(newProject);
  db.shootDays.push(...createdShootDays);

  // In-app welcome notification for the newly added client
  db.notifications.unshift({
    id: 'n_' + Date.now(),
    recipientType: 'client',
    recipientClientId: clientId,
    title: 'Khushamdeed CERAHI Portal par!',
    message: `Salam ${newClient.name}! Aapka project "${newProject.title}" active ho chuka hai. Hamza (Lead Editor) jald deliveries upload karenge.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Log in Delivery Logs
  db.deliveryLogs.unshift({
    id: 'l_' + Date.now(),
    action: 'CLIENT_CREATED',
    title: `New client added: ${newClient.name} (${newProject.title})`,
    userName: currentUser.name,
    timestamp: new Date().toISOString()
  });

  db.deliveryLogs.unshift({
    id: 'l_' + (Date.now() + 1),
    action: 'INVITE_SENT',
    title: `Welcome email & portal login link dispatched to ${newClient.email}`,
    userName: 'CERAHI Auto-Mailer',
    timestamp: new Date().toISOString()
  });

  // Prepare Invite Package (Email + WhatsApp)
  const portalUrl = `http://localhost:3000/?clientId=${clientId}&role=client`;
  const cleanPhone = newClient.phone.replace(/[^0-9]/g, '');
  const whatsappText = encodeURIComponent(
    `Salam ${newClient.name}! Aapka CERAHI Media Delivery portal active ho chuka hai. Apne project "${newProject.title}" ki videos aur shoot days is link se live track karein:\n${portalUrl}`
  );

  const invite = {
    to: newClient.email,
    phone: newClient.phone,
    portalUrl,
    whatsappUrl: `https://wa.me/${cleanPhone}?text=${whatsappText}`,
    subject: `[CERAHI] Access Your Media Project: ${newProject.title}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ff5c35; margin-top: 0;">CERAHI Media Delivery Portal</h2>
        <p>Salam <strong>${newClient.name}</strong>,</p>
        <p>Aapka branding & video campaign <strong>"${newProject.title}"</strong> portal par configure kar diya gaya hai.</p>
        <p>Aap shoot days ke mutabiq cuts dekh sakte hain, timestamped comments de sakte hain, aur approved videos download kar sakte hain.</p>
        <div style="margin: 25px 0;">
          <a href="${portalUrl}" style="background: #ff5c35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Open Client Portal & Track Project &rarr;
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px;">Direct Link: ${portalUrl}</p>
      </div>
    `
  };

  saveDB(db);
  res.status(201).json({
    client: newClient,
    project: newProject,
    shootDays: createdShootDays,
    invite
  });
});

/* ================= PROJECTS & SHOOT DAYS ================= */
app.get('/api/projects', (req, res) => {
  const db = getDB();
  const { clientId } = req.query;
  if (clientId) {
    return res.json(db.projects.filter(p => p.clientId === clientId));
  }
  res.json(db.projects);
});

app.get('/api/projects/:id/shoot-days', (req, res) => {
  const db = getDB();
  const shootDays = db.shootDays.filter(sd => sd.projectId === req.params.id);
  res.json(shootDays);
});

/* ================= DELIVERABLES (VIDEOS) ================= */
app.get('/api/deliverables', (req, res) => {
  const { shootDayId } = req.query;
  const db = getDB();
  let list = db.deliverables;
  if (shootDayId) {
    list = list.filter(d => d.shootDayId === shootDayId);
  }
  res.json(list);
});

app.get('/api/deliverables/:id', (req, res) => {
  const db = getDB();
  const item = db.deliverables.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// Direct Upload simulation (Simulates R2 Presigned PUT or handles multipart)
app.post('/api/deliverables/upload', upload.single('video'), (req, res) => {
  const { shootDayId, title, durationSeconds } = req.body;
  const db = getDB();

  let videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  let fileSizeBytes = 1024 * 1024 * 15;

  if (req.file) {
    videoUrl = `/uploads/${req.file.filename}`;
    fileSizeBytes = req.file.size;
  }

  const newDeliverable = {
    id: 'd_' + Date.now(),
    shootDayId: shootDayId || 'sd2',
    title: title || 'New_Reel_Cut',
    version: 1,
    status: 'Ready for Review',
    videoUrl,
    fileSizeBytes,
    durationSeconds: Number(durationSeconds) || 30,
    uploadedAt: new Date().toISOString(),
    uploadedBy: currentUser.name
  };

  db.deliverables.unshift(newDeliverable);

  // Add delivery log
  db.deliveryLogs.unshift({
    id: 'l_' + Date.now(),
    action: 'UPLOAD',
    title: `${newDeliverable.title} (v1) uploaded`,
    userName: currentUser.name,
    timestamp: new Date().toISOString()
  });

  // Add notification for client
  db.notifications.unshift({
    id: 'n_' + Date.now(),
    recipientType: 'client',
    title: 'Nayi Video Ready Hai!',
    message: `${currentUser.name} ne nayi video "${newDeliverable.title}" review ke liye upload ki hai.`,
    deliverableId: newDeliverable.id,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json(newDeliverable);
});

// Update Status (Approved, Revision Needed, etc.)
app.patch('/api/deliverables/:id/status', (req, res) => {
  const { status } = req.body;
  const db = getDB();
  const item = db.deliverables.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const oldStatus = item.status;
  item.status = status;

  db.deliveryLogs.unshift({
    id: 'l_' + Date.now(),
    action: 'STATUS_CHANGE',
    title: `Status changed from "${oldStatus}" to "${status}" on ${item.title}`,
    userName: currentUser.name,
    timestamp: new Date().toISOString()
  });

  saveDB(db);
  res.json(item);
});

/* ================= COMMENTS WITH TIMESTAMPS ================= */
app.get('/api/deliverables/:id/comments', (req, res) => {
  const db = getDB();
  const comments = db.comments.filter(c => c.deliverableId === req.params.id);
  res.json(comments);
});

app.post('/api/deliverables/:id/comments', (req, res) => {
  const { timestampSeconds, content } = req.body;
  const db = getDB();
  const deliverable = db.deliverables.find(d => d.id === req.params.id);
  if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

  const newComment = {
    id: 'com_' + Date.now(),
    deliverableId: req.params.id,
    authorType: currentUser.role,
    authorName: currentUser.name,
    timestampSeconds: Number(timestampSeconds) || 0,
    content: content || '',
    resolved: false,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Auto trigger: If client comments, set deliverable status to "Revision Needed"
  if (currentUser.role === 'client') {
    deliverable.status = 'Revision Needed';
  }

  // Trigger notification for Editor
  db.notifications.unshift({
    id: 'n_' + Date.now(),
    recipientType: 'editor',
    title: 'Naya Revision Comment',
    message: `${currentUser.name} ne "${deliverable.title}" par comment kiya [${formatTime(newComment.timestampSeconds)}]: "${newComment.content}"`,
    deliverableId: deliverable.id,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Log action
  db.deliveryLogs.unshift({
    id: 'l_' + Date.now(),
    action: 'COMMENT',
    title: `Comment at [${formatTime(newComment.timestampSeconds)}] on ${deliverable.title}`,
    userName: currentUser.name,
    timestamp: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json(newComment);
});

app.patch('/api/comments/:id/resolve', (req, res) => {
  const db = getDB();
  const comment = db.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  comment.resolved = !comment.resolved;
  saveDB(db);
  res.json(comment);
});

/* ================= NOTIFICATIONS & LOGS ================= */
app.get('/api/notifications', (req, res) => {
  const db = getDB();
  const list = db.notifications.filter(n => {
    if (currentUser.role === 'editor') return n.recipientType === 'editor';
    return n.recipientType === 'client' && (!n.recipientClientId || n.recipientClientId === currentUser.id);
  });
  res.json(list);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const db = getDB();
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.isRead = true;
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  const db = getDB();
  res.json(db.deliveryLogs.slice(0, 30));
});

function formatTime(sec) {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
