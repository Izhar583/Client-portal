# Client-portal

CERAHI - Media & Video Delivery Management Portal for local Pakistan-level branding & media agencies.

### Features
- **Client & Project Management**: Add local clients with automatic Shoot Days generation.
- **Direct Video Delivery Flow**: Cloudflare R2 direct upload simulation with progress indicators.
- **Frame-Accurate Timestamped Feedback**: Video player with live timestamp capture and comment pinning.
- **Client Approval & Revision Loops**: Automated status transitions (Ready for Review, Revision Needed, Approved).
- **Onboarding & Invitations**: Automated Welcome Email Preview & 1-Click WhatsApp Direct Invites.
- **Delivery Audit Trail**: Activity log tracking all uploads, views, comments, and approvals.

### Running Locally
```bash
npm install
npm run server  # Backend API on port 5000
npm run dev:ui  # Vite Frontend on port 3000
```
