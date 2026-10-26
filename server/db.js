import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

const INITIAL_DATA = {
  clients: [
    { id: 'c1', name: 'Ali Traders', email: 'ali@traders.pk', phone: '+92 300 1234567', role: 'client' },
    { id: 'e1', name: 'Hamza (Lead Editor)', email: 'hamza@media.pk', phone: '+92 321 7654321', role: 'editor' }
  ],
  projects: [
    { id: 'p1', clientId: 'c1', title: 'Winter Brand Campaign 2026', clientName: 'Ali Traders', status: 'active', createdAt: '2026-10-10' }
  ],
  shootDays: [
    { id: 'sd1', projectId: 'p1', dayNumber: 1, title: 'Shoot Day 1 - Factory & Warehouse', date: '2026-10-15', deliverablesCount: 2 },
    { id: 'sd2', projectId: 'p1', dayNumber: 2, title: 'Shoot Day 2 - Karachi Street Showcase', date: '2026-10-18', deliverablesCount: 2 },
    { id: 'sd3', projectId: 'p1', dayNumber: 3, title: 'Shoot Day 3 - Studio Macro Shots', date: '2026-10-22', deliverablesCount: 1 }
  ],
  deliverables: [
    {
      id: 'd1',
      shootDayId: 'sd2',
      title: 'Reel_01_Cinematic_Showcase',
      version: 1,
      status: 'Ready for Review',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      fileSizeBytes: 15400000,
      durationSeconds: 15,
      uploadedAt: '2026-10-26T12:00:00Z',
      uploadedBy: 'Hamza (Lead Editor)'
    },
    {
      id: 'd2',
      shootDayId: 'sd2',
      title: 'Reel_02_Street_Ambience_Cut',
      version: 1,
      status: 'Revision Needed',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      fileSizeBytes: 22100000,
      durationSeconds: 15,
      uploadedAt: '2026-10-25T15:30:00Z',
      uploadedBy: 'Hamza (Lead Editor)'
    },
    {
      id: 'd3',
      shootDayId: 'sd1',
      title: 'Main_Commercial_60s',
      version: 2,
      status: 'Approved',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      fileSizeBytes: 65000000,
      durationSeconds: 60,
      uploadedAt: '2026-10-24T18:00:00Z',
      uploadedBy: 'Hamza (Lead Editor)'
    }
  ],
  comments: [
    {
      id: 'com1',
      deliverableId: 'd2',
      authorType: 'client',
      authorName: 'Ali Traders',
      timestampSeconds: 6,
      content: 'Logo thora chota karein aur audio fade-in soft rakhein.',
      resolved: false,
      createdAt: '2026-10-26T14:15:00Z'
    }
  ],
  notifications: [
    {
      id: 'n1',
      recipientType: 'editor',
      title: 'Naya Comment',
      message: 'Ali Traders ne Reel_02 par comment kiya [0:06]',
      deliverableId: 'd2',
      isRead: false,
      createdAt: '2026-10-26T14:15:00Z'
    }
  ],
  deliveryLogs: [
    {
      id: 'l1',
      action: 'UPLOAD',
      title: 'Reel_01_Cinematic_Showcase (v1)',
      userName: 'Hamza (Lead Editor)',
      timestamp: '2026-10-26T12:00:00Z'
    },
    {
      id: 'l2',
      action: 'COMMENT',
      title: 'Comment added on Reel_02 at [0:06]',
      userName: 'Ali Traders',
      timestamp: '2026-10-26T14:15:00Z'
    }
  ]
};

export function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

export function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
