# EduTrack: Student Management System (Supabase Backend)

A premium, fully responsive full-stack sample Student Management System. Built using pure HTML5, CSS3 (with dynamic variables, dark mode, glassmorphism templates, and animations), and modular JavaScript. 

This application connects directly to your Supabase project in the client, enabling full secure authentication, CRUD, and file uploads out of the box.

---

## Features

1. **Elegant Glassmorphism UI**: High-fidelity dark and light theme toggle with modern typography (`Outfit`), subtle animations, and skeleton loaders.
2. **Robust Authentication**: Email sign-up, sign-in, forgot-password reset flow, and session persistence.
3. **Protected Views**: Router blocks unauthenticated access and redirects visitors to login.
4. **CRUD Records**: Create, View, Search, Filter, Sort, Paginate, and Delete (single/bulk) student records.
5. **Form Validation**: Strict client-side email format check, phone validation, check for duplicate emails, and active error warnings.
6. **Profile Image Storage**: Integrates with Supabase Storage. Supports image preview before uploads, and automatic file cleanup in the storage bucket on record delete.
7. **CSV Operations**: Easily Export entire student rosters to a CSV file or Import records in bulk from a CSV.
8. **Keyboard Navigation & Accessibility**: Custom keyboard shortcuts (`Ctrl + N` for new student, `Ctrl + F` to search, `Esc` to exit modals), and full ARIA styling.

---

## Quick Setup Instructions

### 1. Database & Policy Setup (in Supabase)
Log in to your [Supabase Dashboard](https://supabase.com), choose your project, navigate to **SQL Editor**, and run the commands from [schema.sql](schema.sql). 

This script will set up:
- The `students` table.
- Row-Level Security (RLS) policies allowing users to view, update, and delete only records they registered.
- A public bucket `student-images` in Supabase Storage with security policies restricting uploads/deletions of images to the owner's credentials.

### 2. Configure Credentials
There are two ways to connect your Supabase credentials:

#### Option A: Connection Setup Wizard (Recommended)
When you launch the website for the first time, a setup card will appear asking you to input your `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Paste the values, click **Connect & Launch**, and they will save securely to your browser's local storage.

#### Option B: Configuration File
Rename the `config.example.js` file in the root directory to `config.js`, and replace the placeholders with your actual details:
```javascript
const SUPABASE_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-public-key"
};
```

---

## How to Run Locally

Since this is a client-side Single Page Application, it does not require compilation or npm servers.
1. Simply double-click `index.html` to open it directly in any modern web browser.
2. Alternatively, serve the folder using any simple local server (e.g. VS Code Live Server extension, or Python's `python -m http.server`).

---

## Keyboard Shortcuts

- `Ctrl + N`: Instantly open the **Add Student** page.
- `Ctrl + F`: Focuses the student directory search bar.
- `Esc`: Close any active confirmation modals or setup overlays.

---

## File Structure

```text
├── index.html            # Main HTML layout and view router
├── styles.css            # Stylesheets, themes, animations
├── config.example.js     # Config template file
├── supabase-client.js    # Supabase Client initializations
├── api.js                # Core API interactions (Auth, Storage, Database)
├── app.js                # Main router, form validations, & user interactions
├── schema.sql            # Database schema migration script
└── README.md             # Project documentation
```
