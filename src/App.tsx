import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bell,
  User,
  Calendar,
  X,
  FileVideo,
  Check,
  Eye,
  History,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Film,
  Share2,
  Copy,
  ExternalLink,
  Send,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client';
}

interface ProjectItem {
  id: string;
  clientId: string;
  title: string;
  clientName: string;
  status: string;
  createdAt: string;
}

interface ShootDay {
  id: string;
  projectId: string;
  dayNumber: number;
  title: string;
  date: string;
  deliverablesCount: number;
}

interface Deliverable {
  id: string;
  shootDayId: string;
  title: string;
  version: number;
  status: 'Pending' | 'Editing' | 'Ready for Review' | 'Revision Needed' | 'Approved';
  videoUrl: string;
  fileSizeBytes: number;
  durationSeconds: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface Comment {
  id: string;
  deliverableId: string;
  authorType: 'client' | 'editor';
  authorName: string;
  timestampSeconds: number;
  content: string;
  resolved: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  recipientType: 'client' | 'editor';
  recipientClientId?: string;
  title: string;
  message: string;
  deliverableId?: string;
  isRead: boolean;
  createdAt: string;
}

interface LogItem {
  id: string;
  action: string;
  title: string;
  userName: string;
  timestamp: string;
}

interface InviteData {
  to: string;
  phone: string;
  portalUrl: string;
  whatsappUrl: string;
  subject: string;
  emailHtml: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: 'client' | 'editor'; email: string }>({
    id: 'c1',
    name: 'Ali Traders',
    role: 'client',
    email: 'ali@traders.pk'
  });

  // Client & Project management
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [activeClientId, setActiveClientId] = useState<string>('c1');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  // Shoot Days & Deliverables
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [activeShootDay, setActiveShootDay] = useState<string>('');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Deliverable | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Add Client Modal State
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('+92 300 ');
  const [newProjectTitle, setNewProjectTitle] = useState<string>('');
  const [newShootDaysCount, setNewShootDaysCount] = useState<number>(3);
  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);

  // Onboarding / Invite Modal state
  const [inviteModalData, setInviteModalData] = useState<{ client: ClientItem; project: ProjectItem; invite: InviteData } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Comment input state
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle URL Magic Links (e.g. ?clientId=...&role=client)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qClientId = params.get('clientId');
    const qRole = params.get('role');
    if (qClientId) {
      setActiveClientId(qClientId);
      if (qRole === 'client') {
        handleSwitchRole('client', qClientId);
      }
    }
  }, []);

  // Initial Load: Fetch Clients & Projects
  useEffect(() => {
    fetchClients();
    fetchNotifications();
  }, [currentUser]);

  // When activeClientId changes, fetch their projects
  useEffect(() => {
    if (activeClientId) {
      fetchProjects(activeClientId);
    }
  }, [activeClientId]);

  // When activeProject changes, fetch shoot days
  useEffect(() => {
    if (activeProject) {
      fetchShootDays(activeProject.id);
    }
  }, [activeProject]);

  // When activeShootDay changes, fetch deliverables
  useEffect(() => {
    if (activeShootDay) {
      fetchDeliverables(activeShootDay);
    }
  }, [activeShootDay]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
      if (data.length > 0 && !activeClientId) {
        setActiveClientId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch clients', err);
    }
  };

  const fetchProjects = async (clientId: string) => {
    try {
      const res = await fetch(`/api/projects?clientId=${clientId}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) {
        setActiveProject(data[0]);
      } else {
        setActiveProject(null);
        setShootDays([]);
        setDeliverables([]);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchShootDays = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shoot-days`);
      const data = await res.json();
      setShootDays(data);
      if (data.length > 0) {
        setActiveShootDay(data[0].id);
      } else {
        setActiveShootDay('');
        setDeliverables([]);
      }
    } catch (err) {
      console.error('Failed to fetch shoot days', err);
    }
  };

  const fetchDeliverables = async (dayId: string) => {
    try {
      const res = await fetch(`/api/deliverables?shootDayId=${dayId}`);
      const data = await res.json();
      setDeliverables(data);
    } catch (err) {
      console.error('Failed to fetch deliverables', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
      setShowLogs(true);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  // Switch Role (Client vs Hamza)
  const handleSwitchRole = async (role: 'client' | 'editor', targetClientId?: string) => {
    const cId = targetClientId || activeClientId;
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, clientId: cId })
      });
      const data = await res.json();
      setCurrentUser(data.user);
      setShowNotifications(false);
    } catch (err) {
      console.error('Failed to switch role', err);
    }
  };

  // Handle Switch Client
  const handleSelectClient = (clientId: string) => {
    setActiveClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (currentUser.role === 'client' && client) {
      setCurrentUser(client);
    }
  };

  // Create New Client + Project
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newProjectTitle.trim()) return;

    setIsCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          phone: newClientPhone,
          projectTitle: newProjectTitle,
          shootDaysCount: newShootDaysCount
        })
      });

      const data = await res.json();
      setIsCreatingClient(false);
      setShowAddClientModal(false);

      // Open Onboarding & Invitation Modal
      setInviteModalData({
        client: data.client,
        project: data.project,
        invite: data.invite
      });

      // Reset form
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('+92 300 ');
      setNewProjectTitle('');

      // Refresh clients and switch to new client
      await fetchClients();
      setActiveClientId(data.client.id);
      setActiveProject(data.project);
      setShootDays(data.shootDays);
      if (data.shootDays.length > 0) {
        setActiveShootDay(data.shootDays[0].id);
      }
      fetchNotifications();
    } catch (err) {
      setIsCreatingClient(false);
      console.error('Failed to create client', err);
    }
  };

  // Open Video Inspector
  const openVideoInspector = async (video: Deliverable) => {
    setSelectedVideo(video);
    try {
      const res = await fetch(`/api/deliverables/${video.id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  // Post Timestamped Comment
  const handlePostComment = async () => {
    if (!newCommentText.trim() || !selectedVideo) return;
    const timestamp = Math.floor(videoRef.current ? videoRef.current.currentTime : currentTime);

    try {
      const res = await fetch(`/api/deliverables/${selectedVideo.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestampSeconds: timestamp,
          content: newCommentText
        })
      });
      const addedComment = await res.json();
      setComments(prev => [...prev, addedComment]);
      setNewCommentText('');

      if (currentUser.role === 'client') {
        setSelectedVideo(prev => prev ? { ...prev, status: 'Revision Needed' } : null);
        setDeliverables(prev =>
          prev.map(d => d.id === selectedVideo.id ? { ...d, status: 'Revision Needed' } : d)
        );
      }
      fetchNotifications();
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  // Approve Video (Client)
  const handleApproveVideo = async () => {
    if (!selectedVideo) return;
    try {
      const res = await fetch(`/api/deliverables/${selectedVideo.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      });
      const updated = await res.json();
      setSelectedVideo(updated);
      setDeliverables(prev => prev.map(d => d.id === updated.id ? updated : d));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to approve', err);
    }
  };

  // Handle Video Upload (Editor)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(15);

    const formData = new FormData();
    formData.append('shootDayId', activeShootDay);
    formData.append('title', uploadTitle);
    formData.append('durationSeconds', '30');
    if (selectedFile) {
      formData.append('video', selectedFile);
    }

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    try {
      await fetch('/api/deliverables/upload', {
        method: 'POST',
        body: formData
      });
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(async () => {
        setIsUploading(false);
        setShowUploadModal(false);
        setUploadTitle('');
        setSelectedFile(null);
        setUploadProgress(0);
        fetchDeliverables(activeShootDay);
        fetchNotifications();
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsUploading(false);
      console.error('Upload failed', err);
    }
  };

  const jumpToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStatusBadge = (status: Deliverable['status']) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-approved"><Check size={12} /> Approved</span>;
      case 'Revision Needed':
        return <span className="badge badge-revision"><AlertCircle size={12} /> Revision Needed</span>;
      case 'Ready for Review':
      default:
        return <span className="badge badge-review"><Eye size={12} /> Ready for Review</span>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const currentClientData = clients.find(c => c.id === activeClientId);

  return (
    <div>
      {/* Top Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div className="brand-text">
            <h1>CERAHI</h1>
            <p>Media & Delivery Management Portal</p>
          </div>
        </div>

        {/* Center: Live Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="role-switcher">
            <button
              className={`role-btn ${currentUser.role === 'client' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('client')}
            >
              <User size={14} /> Client View: {currentClientData?.name || 'Client'}
            </button>
            <button
              className={`role-btn ${currentUser.role === 'editor' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('editor')}
            >
              <FileVideo size={14} /> Hamza (Lead Editor)
            </button>
          </div>

          {/* Client Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} color="#94a3b8" />
            <select
              value={activeClientId}
              onChange={e => handleSelectClient(e.target.value)}
              style={{
                background: '#111726',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  Client: {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* + Add New Client Button */}
          <button
            className="btn btn-coral"
            style={{ padding: '7px 13px', fontSize: '12px' }}
            onClick={() => setShowAddClientModal(true)}
          >
            <UserPlus size={14} /> + Add Client
          </button>

          {/* Activity Log */}
          <button
            className="btn btn-outline"
            style={{ padding: '7px 12px', fontSize: '12px' }}
            onClick={fetchLogs}
          >
            <History size={14} /> Activity
          </button>

          {/* Bell Icon */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline"
              style={{ padding: '8px 10px', position: 'relative' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={16} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                background: '#111726',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                zIndex: 60,
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>Notifications ({unreadNotifs})</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentUser.role === 'editor' ? 'Editor View' : 'Client View'}</span>
                </div>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '16px' }}>No new notifications</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        {/* Project Header Banner */}
        <section className="project-banner">
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255,92,53,0.15)', color: '#ff5c35', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
              PAKISTAN MEDIA DELIVERIES
            </div>
            <h2 className="project-title">{activeProject ? activeProject.title : 'No Project Selected'}</h2>
            <div className="project-meta">
              <span>Client: <strong>{currentClientData ? currentClientData.name : 'Ali Traders'}</strong></span>
              <span>Contact: <strong>{currentClientData?.phone || '+92 300 1234567'}</strong></span>
              <span>Lead Editor: <strong>Hamza</strong></span>
              <span>Storage: <strong>Cloudflare R2 Direct</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Share Portal Link Button */}
            <button
              className="btn btn-outline"
              onClick={() => {
                const pUrl = `http://localhost:3000/?clientId=${activeClientId}&role=client`;
                copyToClipboard(pUrl);
              }}
              title="Copy Client Direct Login Link"
            >
              <Share2 size={15} />
              {copiedLink ? 'Portal Link Copied! ✓' : 'Share Client Link'}
            </button>

            {/* Upload Cut Button */}
            {currentUser.role === 'editor' && activeShootDay && (
              <button className="btn btn-coral" onClick={() => setShowUploadModal(true)}>
                <UploadCloud size={16} /> Upload Video Cut
              </button>
            )}
          </div>
        </section>

        {/* Shoot Days Timeline Navigation */}
        {shootDays.length > 0 ? (
          <div className="shoot-days-nav">
            {shootDays.map(day => (
              <button
                key={day.id}
                className={`shoot-day-tab ${activeShootDay === day.id ? 'active' : ''}`}
                onClick={() => setActiveShootDay(day.id)}
              >
                <Calendar size={15} />
                <span>{day.title}</span>
                <span className="tab-badge">{day.date}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ background: '#111726', padding: '30px', borderRadius: '10px', textAlign: 'center', color: '#94a3b8', marginBottom: '24px' }}>
            <Film size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Is client ke liye abhi koi shoot days nahi hain.</p>
          </div>
        )}

        {/* Deliverables Section Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            Video Deliveries ({deliverables.length})
          </h3>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Click on any video to preview, add timestamp comments, or download.
          </span>
        </div>

        {/* Deliverables Grid */}
        {deliverables.length === 0 ? (
          <div style={{ background: '#111726', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <FileVideo size={40} style={{ margin: '0 auto 12px', color: '#64748b' }} />
            <h4 style={{ fontSize: '16px', marginBottom: '6px' }}>Is Shoot Day par abhi koi video upload nahi hui</h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
              Editor mode me switch karke naya video cut upload karein.
            </p>
            {currentUser.role === 'editor' && activeShootDay && (
              <button className="btn btn-coral" onClick={() => setShowUploadModal(true)}>
                <UploadCloud size={16} /> Upload First Video
              </button>
            )}
          </div>
        ) : (
          <div className="deliverables-grid">
            {deliverables.map(video => (
              <div
                key={video.id}
                className="video-card"
                onClick={() => openVideoInspector(video)}
              >
                <div className="video-thumb-container">
                  <video src={video.videoUrl} preload="metadata" muted />
                  <div className="video-play-overlay">
                    <Play size={20} fill="white" />
                  </div>
                  <div className="version-pill">v{video.version}</div>
                  <div className="duration-pill">{formatSeconds(video.durationSeconds)}</div>
                </div>

                <div className="video-info">
                  <div>
                    <div className="video-title">{video.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                      <span>{(video.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                      <span>By {video.uploadedBy}</span>
                    </div>
                  </div>

                  <div className="video-meta-row">
                    {getStatusBadge(video.status)}
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>Review &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Inspector & Commenting Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="inspector-modal" onClick={e => e.stopPropagation()}>
            <div className="inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                  {selectedVideo.title}
                </h3>
                <span className="version-pill" style={{ position: 'static' }}>v{selectedVideo.version}</span>
                {getStatusBadge(selectedVideo.status)}
              </div>

              <button
                className="btn btn-outline"
                style={{ padding: '6px 10px' }}
                onClick={() => setSelectedVideo(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inspector-content">
              {/* Left Player Pane */}
              <div className="player-pane">
                <video
                  ref={videoRef}
                  src={selectedVideo.videoUrl}
                  controls
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                />

                <div className="player-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Current Playback: <strong style={{ color: '#fff' }}>{formatSeconds(currentTime)}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href={selectedVideo.videoUrl}
                      download
                      className="btn btn-outline"
                      style={{ textDecoration: 'none' }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={14} /> Download File
                    </a>

                    {currentUser.role === 'client' && selectedVideo.status !== 'Approved' && (
                      <button className="btn btn-emerald" onClick={handleApproveVideo}>
                        <CheckCircle2 size={16} /> Approve Video
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Comments Pane */}
              <div className="comments-pane">
                <div className="comments-header">
                  <span>Timestamped Feedback ({comments.length})</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Frame-accurate</span>
                </div>

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                      <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p>Abhi tak koi comments nahi hain.</p>
                      <p style={{ fontSize: '11px', marginTop: '4px' }}>Video ko rok kar neeche comment add karein.</p>
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className={`comment-bubble ${c.resolved ? 'resolved' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px' }}>{c.authorName}</span>
                          <span
                            className="timestamp-tag"
                            onClick={() => jumpToTimestamp(c.timestampSeconds)}
                            title="Click to seek to this timestamp"
                          >
                            ⏱️ {formatSeconds(c.timestampSeconds)}
                          </span>
                        </div>
                        <p style={{ color: '#e2e8f0', margin: '4px 0' }}>{c.content}</p>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input Box */}
                <div className="comment-input-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>
                      Commenting as: <strong style={{ color: '#ff5c35' }}>{currentUser.name}</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                      At [{formatSeconds(currentTime)}]
                    </span>
                  </div>

                  <textarea
                    placeholder='Maslan: "0:32 par logo thora chota karein"'
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />

                  <button
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                    onClick={handlePostComment}
                  >
                    Send Comment at [{formatSeconds(currentTime)}]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: + Add New Client Form */}
      {showAddClientModal && (
        <div className="modal-overlay" onClick={() => !isCreatingClient && setShowAddClientModal(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#ff5c35" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                  Add New Client & Project
                </h3>
              </div>
              {!isCreatingClient && (
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowAddClientModal(false)}>
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Client / Brand Name:
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="e.g. Khaadi, Shan Foods, Gul Ahmed"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Client Email:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                    <input
                      type="email"
                      placeholder="marketing@brand.pk"
                      value={newClientEmail}
                      onChange={e => setNewClientEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    WhatsApp / Phone:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Campaign Project Name:
                </label>
                <div style={{ position: 'relative' }}>
                  <Film size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="e.g. Festive Eid Campaign 2026"
                    value={newProjectTitle}
                    onChange={e => setNewProjectTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Number of Shoot Days:
                </label>
                <select
                  value={newShootDaysCount}
                  onChange={e => setNewShootDaysCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value={1}>1 Shoot Day</option>
                  <option value={2}>2 Shoot Days</option>
                  <option value={3}>3 Shoot Days</option>
                  <option value={4}>4 Shoot Days</option>
                  <option value={5}>5 Shoot Days</option>
                </select>
                <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  Auto-generates Shoot Days with separate logs & deliveries.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddClientModal(false)}
                  disabled={isCreatingClient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-coral"
                  disabled={isCreatingClient}
                >
                  {isCreatingClient ? 'Creating & Sending Invite...' : 'Create Client & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Client Invitation, Email & WhatsApp Dispatch Confirmation */}
      {inviteModalData && (
        <div className="modal-overlay" onClick={() => setInviteModalData(null)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                    Client Added & Notification Ready!
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    {inviteModalData.client.name} ke project ki onboarding tayyar hai.
                  </p>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setInviteModalData(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Email Preview Card */}
            <div style={{
              background: '#0a0e17',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff5c35', letterSpacing: '0.5px' }}>
                  AUTOMATED WELCOME EMAIL PREVIEW
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  To: <strong>{inviteModalData.invite.to}</strong>
                </span>
              </div>

              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Subject: {inviteModalData.invite.subject}</p>
                <p style={{ color: '#cbd5e1', margin: '0 0 10px 0' }}>
                  Salam <strong>{inviteModalData.client.name}</strong>, aapka media campaign <strong>"{inviteModalData.project.title}"</strong> CERAHI portal par setup ho gaya hai. Aap is link se apne shoot days aur deliveries live track kar sakte hain:
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#38bdf8',
                  wordBreak: 'break-all'
                }}>
                  {inviteModalData.invite.portalUrl}
                </div>
              </div>
            </div>

            {/* Direct Instant Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* WhatsApp Share Button */}
              <a
                href={inviteModalData.invite.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  padding: '11px 16px'
                }}
              >
                <Smartphone size={16} /> Send 1-Click WhatsApp Invite to {inviteModalData.invite.phone}
              </a>

              {/* Copy Direct Magic Link */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => copyToClipboard(inviteModalData.invite.portalUrl)}
                >
                  <Copy size={14} />
                  {copiedLink ? 'Link Copied to Clipboard! ✓' : 'Copy Client Login Link'}
                </button>

                {/* Login as this client now */}
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    handleSwitchRole('client', inviteModalData.client.id);
                    setInviteModalData(null);
                  }}
                >
                  <User size={14} /> View as {inviteModalData.client.name} &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal (Editor Mode) */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                Upload Video Delivery (Direct R2 Storage)
              </h3>
              {!isUploading && (
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowUploadModal(false)}>
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Video Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Reel_03_Macro_Product_Shot"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div
                className="dropzone"
                onClick={() => document.getElementById('video-file-input')?.click()}
              >
                <UploadCloud size={38} color="#ff5c35" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {selectedFile ? selectedFile.name : 'Select or drop video file here'}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Supports MP4, MOV up to 500MB</p>
                <input
                  id="video-file-input"
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!uploadTitle) {
                        setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                />
              </div>

              {isUploading && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                    <span>Direct Cloudflare R2 Upload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-coral"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Start Direct Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                Delivery Audit Trail
              </h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowLogs(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{log.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>By {log.userName}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
