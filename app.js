/**
 * EduTrack - Student Management System Core Application JavaScript
 */

(function () {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    currentPage: "dashboard",
    currentUser: null,
    students: [],
    selectedStudentIds: new Set(),
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 0
    },
    sorting: {
      sortBy: "name",
      sortOrder: "asc"
    },
    filters: {
      search: "",
      department: ""
    },
    editingStudent: null,
    selectedImageFile: null,
    confirmAction: null // Holds callback for delete confirmation
  };

  // Keyboard shortcut state helper
  let searchInputFocused = false;

  // ==========================================
  // DOM ELEMENT CACHE
  // ==========================================
  const el = {
    // Containers
    authContainer: document.getElementById("auth-container"),
    appContainer: document.getElementById("app-container"),
    toastContainer: document.getElementById("toast-container"),

    // Auth Views & Forms
    loginView: document.getElementById("login-view"),
    signupView: document.getElementById("signup-view"),
    forgotView: document.getElementById("forgot-view"),
    resetPasswordView: document.getElementById("reset-password-view"),
    loginForm: document.getElementById("login-form"),
    signupForm: document.getElementById("signup-form"),
    forgotForm: document.getElementById("forgot-form"),
    resetPasswordForm: document.getElementById("reset-password-form"),

    // Auth Nav Links
    goSignup: document.getElementById("go-signup"),
    goLogin: document.getElementById("go-login"),
    goForgot: document.getElementById("go-forgot"),
    forgotBackLogin: document.getElementById("forgot-back-login"),

    // Layout
    sidebar: document.getElementById("sidebar"),
    toggleSidebar: document.getElementById("toggle-sidebar"),
    mobileSidebarOpen: document.getElementById("mobile-sidebar-open"),
    mobileSidebarClose: document.getElementById("mobile-sidebar-close"),
    breadcrumb: document.getElementById("breadcrumb"),
    themeToggle: document.getElementById("theme-toggle"),
    profileMenuTrigger: document.getElementById("profile-menu-trigger"),
    profileDropdown: document.getElementById("profile-dropdown"),
    logoutBtn: document.getElementById("logout-btn"),

    // User Profile Display
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserEmail: document.getElementById("sidebar-user-email"),
    sidebarUserAvatar: document.getElementById("sidebar-user-avatar"),
    headerUserAvatar: document.getElementById("header-user-avatar"),
    dropdownUserName: document.getElementById("dropdown-user-name"),
    dropdownUserEmail: document.getElementById("dropdown-user-email"),

    // Pages
    pageDashboard: document.getElementById("page-dashboard"),
    pageStudents: document.getElementById("page-students"),
    pageAddStudent: document.getElementById("page-add-student"),
    pageSettings: document.getElementById("page-settings"),

    // Credentials Setup Modal
    credentialsModal: document.getElementById("credentials-modal"),
    credentialsForm: document.getElementById("credentials-form"),

    // Delete Confirm Modal
    confirmModal: document.getElementById("confirm-modal"),
    confirmModalText: document.getElementById("confirm-modal-text"),
    confirmCancel: document.getElementById("confirm-cancel"),
    confirmDeleteBtn: document.getElementById("confirm-delete-btn"),
    closeConfirmModal: document.getElementById("close-confirm-modal"),

    // Dashboard Items
    statTotalStudents: document.getElementById("stat-total-students"),
    statTotalDepts: document.getElementById("stat-total-depts"),
    statRecentAdded: document.getElementById("stat-recent-added"),
    dashRecentTableBody: document.getElementById("dashboard-recent-table-body"),
    deptDistributionList: document.getElementById("dept-distribution-list"),
    dashQuickAdd: document.getElementById("dash-quick-add"),
    dashViewAll: document.getElementById("dash-view-all"),

    // Students Directory
    studentsSearch: document.getElementById("students-search"),
    filterDept: document.getElementById("filter-dept"),
    sortBy: document.getElementById("sort-by"),
    sortOrder: document.getElementById("sort-order"),
    studentsTableBody: document.getElementById("students-table-body"),
    selectAllStudents: document.getElementById("select-all-students"),
    bulkDeleteBtn: document.getElementById("bulk-delete-btn"),
    bulkSelectCount: document.getElementById("bulk-select-count"),
    prevPage: document.getElementById("prev-page"),
    nextPage: document.getElementById("next-page"),
    pageNumbers: document.getElementById("page-numbers"),
    paginationSummary: document.getElementById("pagination-summary"),
    listAddStudent: document.getElementById("list-add-student"),

    // Student Form
    studentForm: document.getElementById("student-form"),
    formPageTitle: document.getElementById("form-page-title"),
    formPageSubtitle: document.getElementById("form-page-subtitle"),
    studentIdField: document.getElementById("student-id-field"),
    studentName: document.getElementById("student-name"),
    studentEmail: document.getElementById("student-email"),
    studentPhone: document.getElementById("student-phone"),
    studentDept: document.getElementById("student-dept"),
    studentYear: document.getElementById("student-year"),
    formImagePreview: document.getElementById("form-image-preview"),
    triggerFileSelect: document.getElementById("trigger-file-select"),
    formFileInput: document.getElementById("form-file-input"),
    formResetBtn: document.getElementById("form-reset-btn"),
    formSubmitBtn: document.getElementById("form-submit-btn"),
    formCancelBtn: document.getElementById("form-cancel-btn"),

    // Settings Page
    settingsProfileForm: document.getElementById("settings-profile-form"),
    profileEmailDisplay: document.getElementById("profile-email-display"),
    settingsNewPassword: document.getElementById("settings-new-password"),
    exportCsvBtn: document.getElementById("export-csv-btn"),
    triggerCsvImport: document.getElementById("trigger-csv-import"),
    csvImportFile: document.getElementById("csv-import-file"),
    clearCredentialsBtn: document.getElementById("clear-credentials-btn")
  };

  // ==========================================
  // INITIALIZATION AND CREDENTIALS RESOLUTION
  // ==========================================
  function initApp() {
    setupTheme();
    setupEventListeners();
    checkDatabaseConnection();
  }

  function checkDatabaseConnection() {
    const creds = window.getSupabaseCredentials();
    if (!creds.isConfigured) {
      el.credentialsModal.classList.add("show");
    } else {
      el.credentialsModal.classList.remove("show");
      setupAuthListener();
    }
  }

  function setupAuthListener() {
    try {
      const client = Api.getClient();
      
      // Handle password reset redirection
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("reset") === "true") {
        showAuthView("reset-password");
        // Remove reset query param from URL bar silently
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      client.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          state.currentUser = session.user;
          updateUserUI(session.user);
          el.authContainer.classList.remove("active");
          el.appContainer.style.display = "flex";
          
          // Switch to dashboard on successful login if we were in login view
          if (el.authContainer.style.display !== "none") {
            showPage("dashboard");
          }
        } else {
          state.currentUser = null;
          el.appContainer.style.display = "none";
          el.authContainer.classList.add("active");
          // If password reset redirect was active, don't override the view
          if (el.resetPasswordView.style.display === "none") {
            showAuthView("login");
          }
        }
      });
    } catch (e) {
      console.error("Auth listener error:", e);
      showToast("Failed to initialize database connection. Check credentials.", "error");
      el.credentialsModal.classList.add("show");
    }
  }

  function updateUserUI(user) {
    const name = user.user_metadata?.full_name || user.email.split("@")[0];
    const initial = name.charAt(0).toUpperCase();

    el.sidebarUserName.textContent = name;
    el.sidebarUserEmail.textContent = user.email;
    el.sidebarUserAvatar.textContent = initial;

    el.dropdownUserName.textContent = name;
    el.dropdownUserEmail.textContent = user.email;
    el.headerUserAvatar.textContent = initial;

    el.profileEmailDisplay.value = user.email;
  }

  // ==========================================
  // ROUTING & VIEW CONTROLLER
  // ==========================================
  function showPage(pageId) {
    state.currentPage = pageId;

    // Toggle View divs
    [el.pageDashboard, el.pageStudents, el.pageAddStudent, el.pageSettings].forEach(p => {
      p.classList.remove("active");
    });

    // Update active class on sidebar items
    document.querySelectorAll(".sidebar-item").forEach(item => {
      if (item.getAttribute("data-page") === pageId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Handle pages specific initialization
    if (pageId === "dashboard") {
      el.pageDashboard.classList.add("active");
      el.breadcrumb.innerHTML = '<i class="fa-solid fa-chart-pie"></i> Dashboard';
      loadDashboardData();
    } else if (pageId === "students") {
      el.pageStudents.classList.add("active");
      el.breadcrumb.innerHTML = '<i class="fa-solid fa-user-graduate"></i> Students Directory';
      loadStudentsDirectory();
    } else if (pageId === "add-student") {
      el.pageAddStudent.classList.add("active");
      el.breadcrumb.innerHTML = '<i class="fa-solid fa-user-plus"></i> ' + (state.editingStudent ? 'Edit Student' : 'Add Student');
      resetStudentForm();
    } else if (pageId === "settings") {
      el.pageSettings.classList.add("active");
      el.breadcrumb.innerHTML = '<i class="fa-solid fa-sliders"></i> Settings & Profile';
      el.settingsNewPassword.value = "";
    }

    // Close sidebar on mobile after clicking
    el.sidebar.classList.remove("mobile-open");
  }

  function showAuthView(viewName) {
    [el.loginView, el.signupView, el.forgotView, el.resetPasswordView].forEach(v => {
      v.style.display = "none";
    });

    if (viewName === "login") el.loginView.style.display = "block";
    else if (viewName === "signup") el.signupView.style.display = "block";
    else if (viewName === "forgot") el.forgotView.style.display = "block";
    else if (viewName === "reset-password") el.resetPasswordView.style.display = "block";
  }

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================
  function setupTheme() {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon(currentTheme);
  }

  function toggleTheme() {
    const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const icon = el.themeToggle.querySelector("i");
    if (theme === "dark") {
      icon.className = "fa-solid fa-sun";
    } else {
      icon.className = "fa-solid fa-moon";
    }
  }

  // ==========================================
  // DASHBOARD RENDER LOGIC
  // ==========================================
  async function loadDashboardData() {
    renderDashboardSkeletons();
    try {
      const stats = await Api.getDashboardStats();
      
      // Set values
      el.statTotalStudents.textContent = stats.totalStudents;
      el.statTotalDepts.textContent = Object.keys(stats.departmentStats).length;
      el.statRecentAdded.textContent = stats.recentStudents.length;

      // Render recent table
      if (stats.recentStudents.length === 0) {
        el.dashRecentTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">
              No students registered yet.
            </td>
          </tr>`;
      } else {
        el.dashRecentTableBody.innerHTML = stats.recentStudents.map(s => `
          <tr>
            <td>
              <div class="student-row-details">
                <img src="${s.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}" class="student-table-avatar" alt="">
                <span>${escapeHtml(s.name)}</span>
              </div>
            </td>
            <td>${escapeHtml(s.department)}</td>
            <td>Year ${s.year}</td>
            <td style="color: var(--text-secondary); font-size: 0.8rem;">
              ${new Date(s.created_at).toLocaleDateString()}
            </td>
          </tr>
        `).join("");
      }

      // Render departments distribution
      const totalStudents = stats.totalStudents || 1; // Prevent div by 0
      const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
      let deptIndex = 0;

      if (Object.keys(stats.departmentStats).length === 0) {
        el.deptDistributionList.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">
            No department data.
          </div>`;
      } else {
        el.deptDistributionList.innerHTML = Object.entries(stats.departmentStats).map(([dept, count]) => {
          const pct = Math.round((count / totalStudents) * 100);
          const color = colors[deptIndex++ % colors.length];
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                <span style="font-weight: 500;">${escapeHtml(dept)}</span>
                <span style="color: var(--text-secondary); font-weight: 600;">${count} (${pct}%)</span>
              </div>
              <div style="background-color: var(--border-color); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background-color: ${color}; width: ${pct}%; height: 100%; border-radius: 3px;"></div>
              </div>
            </div>
          `;
        }).join("");
      }

    } catch (e) {
      console.error("Failed to load dashboard data:", e);
      showToast("Error loading stats: " + e.message, "error");
    }
  }

  function renderDashboardSkeletons() {
    el.statTotalStudents.innerHTML = '<span class="skeleton" style="width: 40px; height: 28px; display: inline-block;"></span>';
    el.statTotalDepts.innerHTML = '<span class="skeleton" style="width: 40px; height: 28px; display: inline-block;"></span>';
    el.statRecentAdded.innerHTML = '<span class="skeleton" style="width: 40px; height: 28px; display: inline-block;"></span>';
    
    el.dashRecentTableBody.innerHTML = Array(3).fill(0).map(() => `
      <tr>
        <td>
          <div class="student-row-details">
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton" style="width: 120px; height: 14px;"></div>
          </div>
        </td>
        <td><div class="skeleton" style="width: 100px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 40px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 80px; height: 14px;"></div></td>
      </tr>
    `).join("");

    el.deptDistributionList.innerHTML = Array(3).fill(0).map(() => `
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
          <div class="skeleton" style="width: 80px; height: 14px;"></div>
          <div class="skeleton" style="width: 30px; height: 14px;"></div>
        </div>
        <div class="skeleton" style="height: 6px; width: 100%;"></div>
      </div>
    `).join("");
  }

  // ==========================================
  // STUDENTS DIRECTORY LOGIC
  // ==========================================
  async function loadStudentsDirectory() {
    renderDirectorySkeletons();
    
    try {
      const { students, totalCount } = await Api.fetchStudents({
        search: state.filters.search,
        department: state.filters.department,
        sortBy: state.sorting.sortBy,
        sortOrder: state.sorting.sortOrder,
        page: state.pagination.page,
        pageSize: state.pagination.pageSize
      });

      state.students = students;
      state.pagination.totalCount = totalCount;

      renderDirectoryTable();
      renderPaginationControls();
    } catch (e) {
      console.error("Failed to load students directory:", e);
      showToast("Error loading students: " + e.message, "error");
    }
  }

  function renderDirectorySkeletons() {
    el.studentsTableBody.innerHTML = Array(4).fill(0).map(() => `
      <tr>
        <td style="text-align: center;"><div class="skeleton" style="width: 16px; height: 16px; margin: auto;"></div></td>
        <td><div class="skeleton skeleton-avatar"></div></td>
        <td><div class="skeleton" style="width: 120px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 150px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 100px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 100px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 40px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 80px; height: 14px;"></div></td>
        <td>
          <div class="action-buttons" style="justify-content: flex-end;">
            <div class="skeleton" style="width: 30px; height: 30px;"></div>
            <div class="skeleton" style="width: 30px; height: 30px;"></div>
          </div>
        </td>
      </tr>
    `).join("");
    el.paginationSummary.textContent = "Loading students data...";
  }

  function renderDirectoryTable() {
    if (state.students.length === 0) {
      el.studentsTableBody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <i class="fa-solid fa-folder-open"></i>
              <h3>No Students Found</h3>
              <p>Try refining your search or add a new student profile to get started.</p>
              <button class="btn btn-primary" id="empty-state-add-btn"><i class="fa-solid fa-plus"></i> Add Student</button>
            </div>
          </td>
        </tr>`;
      
      const addBtn = document.getElementById("empty-state-add-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => showPage("add-student"));
      }
      
      el.selectAllStudents.checked = false;
      updateBulkDeleteButton();
      return;
    }

    el.studentsTableBody.innerHTML = state.students.map(s => {
      const isSelected = state.selectedStudentIds.has(s.id);
      return `
        <tr class="${isSelected ? 'selected' : ''}" data-row-id="${s.id}">
          <td style="text-align: center;">
            <input type="checkbox" class="student-checkbox" data-student-id="${s.id}" ${isSelected ? 'checked' : ''}>
          </td>
          <td>
            <img src="${s.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}" class="student-table-avatar" alt="">
          </td>
          <td style="font-weight: 500;">${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.phone || 'N/A')}</td>
          <td>
            <span style="font-size: 0.85rem; padding: 0.25rem 0.5rem; background-color: var(--primary-light); color: var(--primary); border-radius: 4px; font-weight: 500;">
              ${escapeHtml(s.department)}
            </span>
          </td>
          <td>Year ${s.year}</td>
          <td style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(s.created_at).toLocaleDateString()}</td>
          <td>
            <div class="action-buttons" style="justify-content: flex-end;">
              <button class="action-btn edit" data-edit-id="${s.id}" title="Edit Profile"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="action-btn delete" data-delete-id="${s.id}" data-delete-name="${s.name}" data-delete-image="${s.profile_image_url || ''}" title="Delete Record"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Setup Row Interaction Listeners
    setupTableInteractionEvents();
  }

  function setupTableInteractionEvents() {
    // Row action listeners
    el.studentsTableBody.querySelectorAll(".action-btn.edit").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-edit-id");
        const student = state.students.find(s => s.id === id);
        if (student) {
          state.editingStudent = student;
          showPage("add-student");
        }
      });
    });

    el.studentsTableBody.querySelectorAll(".action-btn.delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-delete-id");
        const name = btn.getAttribute("data-delete-name");
        const image = btn.getAttribute("data-delete-image");
        promptDeleteStudent(id, name, image);
      });
    });

    // Row selection checkboxes
    el.studentsTableBody.querySelectorAll(".student-checkbox").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const id = chk.getAttribute("data-student-id");
        const row = el.studentsTableBody.querySelector(`tr[data-row-id="${id}"]`);
        
        if (chk.checked) {
          state.selectedStudentIds.add(id);
          if (row) row.classList.add("selected");
        } else {
          state.selectedStudentIds.delete(id);
          if (row) row.classList.remove("selected");
        }

        // Handle master checkbox status
        const allCheckedOnPage = state.students.every(s => state.selectedStudentIds.has(s.id));
        el.selectAllStudents.checked = allCheckedOnPage;
        
        updateBulkDeleteButton();
      });
    });

    // Row click checks checkbox
    el.studentsTableBody.querySelectorAll("tbody tr").forEach(row => {
      row.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT" || e.target.closest(".action-btn")) return;
        const chk = row.querySelector(".student-checkbox");
        if (chk) {
          chk.checked = !chk.checked;
          chk.dispatchEvent(new Event("change"));
        }
      });
    });
  }

  function updateBulkDeleteButton() {
    const size = state.selectedStudentIds.size;
    el.bulkSelectCount.textContent = size;
    if (size > 0) {
      el.bulkDeleteBtn.removeAttribute("disabled");
      el.bulkDeleteBtn.classList.remove("btn-secondary");
      el.bulkDeleteBtn.classList.add("btn-danger");
    } else {
      el.bulkDeleteBtn.setAttribute("disabled", "true");
      el.bulkDeleteBtn.classList.remove("btn-danger");
      el.bulkDeleteBtn.classList.add("btn-secondary");
    }
  }

  function renderPaginationControls() {
    const { page, pageSize, totalCount } = state.pagination;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Prev Button State
    el.prevPage.disabled = page === 1;

    // Next Button State
    el.nextPage.disabled = page === totalPages;

    // Show summary text
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);
    el.paginationSummary.textContent = `Showing ${from} to ${to} of ${totalCount} students`;

    // Render Page Numbers
    let pagesHTML = "";
    const delta = 2; // Show current page + 2 surrounding pages
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pagesHTML += `<button class="page-btn ${i === page ? 'active' : ''}" data-to-page="${i}">${i}</button>`;
      } else if (i === page - delta - 1 || i === page + delta + 1) {
        pagesHTML += `<span style="padding: 0 0.5rem; color: var(--text-secondary);">...</span>`;
      }
    }
    el.pageNumbers.innerHTML = pagesHTML;

    // Add pagination click actions
    el.pageNumbers.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const nextPage = parseInt(btn.getAttribute("data-to-page"));
        if (state.pagination.page !== nextPage) {
          state.pagination.page = nextPage;
          loadStudentsDirectory();
        }
      });
    });
  }

  // ==========================================
  // DELETE DIALOG UTILS
  // ==========================================
  function promptDeleteStudent(id, name, imageUrl) {
    el.confirmModalText.innerHTML = `Are you sure you want to permanently delete the profile of student <strong>${escapeHtml(name)}</strong>? This action cannot be undone.`;
    el.confirmModal.classList.add("show");
    
    state.confirmAction = async () => {
      try {
        showLoaderOverlay(true);
        await Api.deleteStudent(id, imageUrl);
        showToast("Student profile successfully deleted.", "success");
        state.selectedStudentIds.delete(id);
        updateBulkDeleteButton();
        
        // Refresh
        const totalPagesBefore = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);
        const totalAfter = state.pagination.totalCount - 1;
        const totalPagesAfter = Math.ceil(totalAfter / state.pagination.pageSize) || 1;
        if (state.pagination.page > totalPagesAfter) {
          state.pagination.page = totalPagesAfter;
        }

        loadStudentsDirectory();
      } catch (err) {
        showToast("Failed to delete student: " + err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    };
  }

  function promptBulkDelete() {
    const size = state.selectedStudentIds.size;
    el.confirmModalText.innerHTML = `Are you sure you want to permanently delete the <strong>${size} selected student records</strong>? This action cannot be undone.`;
    el.confirmModal.classList.add("show");

    state.confirmAction = async () => {
      try {
        showLoaderOverlay(true);
        const ids = Array.from(state.selectedStudentIds);
        
        // Gather all image URLs from selected student objects
        const images = state.students
          .filter(s => state.selectedStudentIds.has(s.id))
          .map(s => s.profile_image_url)
          .filter(url => !!url);

        await Api.deleteStudentsBulk(ids, images);
        showToast(`${size} student profiles deleted successfully.`, "success");
        
        state.selectedStudentIds.clear();
        el.selectAllStudents.checked = false;
        updateBulkDeleteButton();
        
        // Relocate back a page if page was emptied
        state.pagination.page = 1;
        loadStudentsDirectory();
      } catch (err) {
        showToast("Bulk delete failed: " + err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    };
  }

  // ==========================================
  // STUDENT REGISTER / UPDATE FORM LOGIC
  // ==========================================
  function resetStudentForm() {
    el.studentForm.reset();
    
    // Clear validation errors
    document.querySelectorAll("#student-form .error-message").forEach(div => div.textContent = "");
    document.querySelectorAll("#student-form .form-control").forEach(inp => inp.classList.remove("error"));

    state.selectedImageFile = null;

    if (state.editingStudent) {
      el.formPageTitle.textContent = "Edit Student Profile";
      el.formPageSubtitle.textContent = `Modifying records of ${state.editingStudent.name}`;
      el.formSubmitBtn.querySelector("span").textContent = "Save Changes";
      
      // Load data
      el.studentIdField.value = state.editingStudent.id;
      el.studentName.value = state.editingStudent.name;
      el.studentEmail.value = state.editingStudent.email;
      el.studentPhone.value = state.editingStudent.phone || "";
      el.studentDept.value = state.editingStudent.department;
      el.studentYear.value = state.editingStudent.year;
      
      el.formImagePreview.src = state.editingStudent.profile_image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
    } else {
      el.formPageTitle.textContent = "Register New Student";
      el.formPageSubtitle.textContent = "Fill in the fields below to add a student to the roster.";
      el.formSubmitBtn.querySelector("span").textContent = "Register Student";
      el.studentIdField.value = "";
      el.formImagePreview.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
    }
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    if (!validateStudentForm()) return;

    const studentId = el.studentIdField.value || null;
    const name = el.studentName.value.trim();
    const email = el.studentEmail.value.trim();
    const phone = el.studentPhone.value.trim();
    const dept = el.studentDept.value;
    const year = parseInt(el.studentYear.value);

    showLoaderOverlay(true);

    try {
      // 1. Email duplication check
      const duplicate = await Api.checkEmailDuplicate(email, studentId);
      if (duplicate) {
        showFieldError(el.studentEmail, "This email is already in use by another student.");
        showLoaderOverlay(false);
        return;
      }

      // 2. Upload image first if selected
      let profileImageUrl = state.editingStudent ? state.editingStudent.profile_image_url : null;
      if (state.selectedImageFile) {
        // If editing, delete old file to save space
        if (state.editingStudent && state.editingStudent.profile_image_url) {
          try {
            await Api.deleteProfileImageByUrl(state.editingStudent.profile_image_url);
          } catch (e) {
            console.error("Cleanup old profile image failed:", e);
          }
        }
        profileImageUrl = await Api.uploadProfileImage(state.selectedImageFile, studentId);
      }

      // 3. Save student
      const studentData = {
        name,
        email,
        phone,
        department: dept,
        year,
        profile_image_url: profileImageUrl
      };

      if (studentId) {
        await Api.updateStudent(studentId, studentData);
        showToast("Student profile updated successfully.", "success");
      } else {
        await Api.createStudent(studentData);
        showToast("Student registered successfully.", "success");
      }

      state.editingStudent = null;
      showPage("students");
    } catch (err) {
      console.error(err);
      showToast("Operation failed: " + err.message, "error");
    } finally {
      showLoaderOverlay(false);
    }
  }

  function validateStudentForm() {
    let isValid = true;

    // Reset validations
    document.querySelectorAll("#student-form .error-message").forEach(div => div.textContent = "");
    document.querySelectorAll("#student-form .form-control").forEach(inp => inp.classList.remove("error"));

    // Name Validate
    if (el.studentName.value.trim() === "") {
      showFieldError(el.studentName, "Full Name is required.");
      isValid = false;
    }

    // Email Validate
    const email = el.studentEmail.value.trim();
    if (email === "") {
      showFieldError(el.studentEmail, "Email address is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(el.studentEmail, "Invalid email address format.");
      isValid = false;
    }

    // Phone Validate
    const phone = el.studentPhone.value.trim();
    if (phone === "") {
      showFieldError(el.studentPhone, "Phone number is required.");
      isValid = false;
    } else if (!/^\+?[0-9\s\-()]{7,18}$/.test(phone)) {
      showFieldError(el.studentPhone, "Invalid phone number format.");
      isValid = false;
    }

    // Department Validate
    if (el.studentDept.value === "") {
      showFieldError(el.studentDept, "Please select a department.");
      isValid = false;
    }

    // Year Validate
    const year = parseInt(el.studentYear.value);
    if (isNaN(year) || year < 1 || year > 6) {
      showFieldError(el.studentYear, "Academic year must be between 1 and 6.");
      isValid = false;
    }

    return isValid;
  }

  function showFieldError(inputEl, message) {
    inputEl.classList.add("error");
    const errorDiv = document.getElementById(inputEl.id + "-error");
    if (errorDiv) {
      errorDiv.textContent = message;
    }
  }

  // Preview profile picture selected
  function handleImageSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 1MB)
    if (file.size > 1024 * 1024) {
      showToast("Selected image exceeds 1MB limit.", "warning");
      el.formFileInput.value = "";
      return;
    }

    state.selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = function (event) {
      el.formImagePreview.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ==========================================
  // DATA IMPORT & EXPORT LOGIC (CSV)
  // ==========================================
  async function handleExportCSV() {
    try {
      showLoaderOverlay(true);
      // Fetch all students without pagination for backing up
      const client = Api.getClient();
      const { data: allStudents, error } = await client
        .from("students")
        .select("name, email, phone, department, year, created_at")
        .order("name");

      if (error) throw error;

      if (!allStudents || allStudents.length === 0) {
        showToast("No data to export.", "warning");
        showLoaderOverlay(false);
        return;
      }

      // Generate CSV string
      const headers = ["Name", "Email", "Phone", "Department", "Year", "Created At"];
      const rows = allStudents.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.email.replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${s.department.replace(/"/g, '""')}"`,
        s.year,
        s.created_at
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `edutrack_students_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("CSV export completed successfully.", "success");
    } catch (e) {
      console.error(e);
      showToast("CSV export failed: " + e.message, "error");
    } finally {
      showLoaderOverlay(false);
    }
  }

  function handleImportCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        showLoaderOverlay(true);
        const text = evt.target.result;
        const studentsToInsert = parseCSVText(text);

        if (studentsToInsert.length === 0) {
          showToast("No valid student rows found in CSV.", "warning");
          showLoaderOverlay(false);
          return;
        }

        // Validate and insert records one by one or in batch
        const client = Api.getClient();
        const user = await Api.getCurrentUser();
        if (!user) throw new Error("Unauthenticated session");

        let insertedCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        for (const record of studentsToInsert) {
          // Validate structure
          if (!record.name || !record.email || !record.department || !record.year) {
            errorCount++;
            continue;
          }

          // Check duplicate email
          const isDup = await Api.checkEmailDuplicate(record.email);
          if (isDup) {
            duplicateCount++;
            continue;
          }

          // Format details
          const studentPayload = {
            name: record.name,
            email: record.email,
            phone: record.phone || "",
            department: record.department,
            year: parseInt(record.year) || 1,
            user_id: user.id
          };

          const { error } = await client.from("students").insert([studentPayload]);
          if (error) {
            errorCount++;
          } else {
            insertedCount++;
          }
        }

        let summary = `Import Complete: ${insertedCount} added.`;
        if (duplicateCount > 0) summary += ` ${duplicateCount} duplicate emails skipped.`;
        if (errorCount > 0) summary += ` ${errorCount} invalid rows failed.`;

        showToast(summary, insertedCount > 0 ? "success" : "warning");
        
        // Refresh directory if currently viewing it
        if (state.currentPage === "students") {
          state.pagination.page = 1;
          loadStudentsDirectory();
        } else {
          showPage("students");
        }

      } catch (err) {
        showToast("CSV import parsing failed: " + err.message, "error");
      } finally {
        showLoaderOverlay(false);
        el.csvImportFile.value = ""; // Clear file
      }
    };
    reader.readAsText(file);
  }

  // Simple CSV parser supporting double quotes
  function parseCSVText(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const result = [];

    // Header index mapping
    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const phoneIdx = headers.indexOf("phone");
    const deptIdx = headers.indexOf("department");
    const yearIdx = headers.indexOf("year");

    if (nameIdx === -1 || emailIdx === -1 || deptIdx === -1 || yearIdx === -1) {
      throw new Error("Missing required headers in CSV: Name, Email, Department, Year");
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = parseCSVLine(line);
      if (columns.length < headers.length) continue;

      result.push({
        name: columns[nameIdx],
        email: columns[emailIdx],
        phone: phoneIdx !== -1 ? columns[phoneIdx] : "",
        department: columns[deptIdx],
        year: columns[yearIdx]
      });
    }

    return result;
  }

  function parseCSVLine(line) {
    const result = [];
    let curVal = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') {
          curVal += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(curVal.trim());
        curVal = "";
      } else {
        curVal += c;
      }
    }
    result.push(curVal.trim());
    return result;
  }

  // ==========================================
  // SYSTEM EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // 1. Sidebar Links & Hamburger
    document.querySelectorAll(".sidebar-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.getAttribute("data-page");
        state.editingStudent = null; // Clear edit buffer
        showPage(page);
      });
    });

    el.toggleSidebar.addEventListener("click", () => {
      el.sidebar.classList.toggle("collapsed");
    });
    
    el.mobileSidebarOpen.addEventListener("click", () => {
      el.sidebar.classList.add("mobile-open");
    });

    el.mobileSidebarClose.addEventListener("click", () => {
      el.sidebar.classList.remove("mobile-open");
    });

    // Check if resize changes responsive state
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        el.sidebar.classList.remove("mobile-open");
        el.mobileSidebarOpen.style.display = "none";
      } else {
        el.mobileSidebarOpen.style.display = "block";
      }
    });
    // Trigger immediately
    window.dispatchEvent(new Event("resize"));

    // 2. Profile Dropdown Toggle
    el.profileMenuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      el.profileDropdown.classList.toggle("show");
    });

    document.querySelectorAll("[data-page-link]").forEach(link => {
      link.addEventListener("click", () => {
        showPage(link.getAttribute("data-page-link"));
        el.profileDropdown.classList.remove("show");
      });
    });

    document.addEventListener("click", () => {
      el.profileDropdown.classList.remove("show");
    });

    // 3. Theme switch click
    el.themeToggle.addEventListener("click", toggleTheme);

    // 4. Credentials form submit
    el.credentialsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = document.getElementById("setup-url").value.trim();
      const key = document.getElementById("setup-key").value.trim();

      if (!url || !key) {
        showToast("Both fields are required.", "warning");
        return;
      }

      window.saveSupabaseCredentials(url, key);
      el.credentialsModal.classList.remove("show");
      setupAuthListener();
      showToast("Supabase credentials saved successfully.", "success");
    });

    // 5. Auth submits
    el.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = el.loginEmail.value.trim();
      const password = el.loginPassword.value;

      let valid = true;
      if (!email) { showFieldError(el.loginEmail, "Email is required"); valid = false; }
      if (!password) { showFieldError(el.loginPassword, "Password is required"); valid = false; }
      if (!valid) return;

      try {
        showLoaderOverlay(true);
        await Api.signIn(email, password);
        showToast("Logged in successfully.", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    el.signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signup-name").value.trim();
      const email = el.signupEmail.value.trim();
      const password = el.signupPassword.value;

      let valid = true;
      if (!name) { showFieldError(document.getElementById("signup-name"), "Full Name is required"); valid = false; }
      if (!email) { showFieldError(el.signupEmail, "Email is required"); valid = false; }
      if (!password || password.length < 6) { showFieldError(el.signupPassword, "Password must be at least 6 characters"); valid = false; }
      if (!valid) return;

      try {
        showLoaderOverlay(true);
        await Api.signUp(email, password, name);
        showToast("Registration successful! Check email for confirmation or log in.", "success");
        showAuthView("login");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    el.forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = el.forgotEmail.value.trim();
      if (!email) { showFieldError(el.forgotEmail, "Email is required"); return; }

      try {
        showLoaderOverlay(true);
        await Api.sendPasswordResetEmail(email);
        showToast("Password reset link has been dispatched to your inbox.", "success");
        showAuthView("login");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    el.resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pwd = el.resetPasswordInput.value;
      if (!pwd || pwd.length < 6) {
        showFieldError(el.resetPasswordInput, "Password must be at least 6 characters.");
        return;
      }

      try {
        showLoaderOverlay(true);
        await Api.updatePassword(pwd);
        showToast("Password updated successfully. Please log in.", "success");
        await Api.signOut();
        showAuthView("login");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    // Auth Page Navigation
    el.goSignup.addEventListener("click", (e) => { e.preventDefault(); showAuthView("signup"); });
    el.goLogin.addEventListener("click", (e) => { e.preventDefault(); showAuthView("login"); });
    el.goForgot.addEventListener("click", (e) => { e.preventDefault(); showAuthView("forgot"); });
    el.forgotBackLogin.addEventListener("click", (e) => { e.preventDefault(); showAuthView("login"); });

    // 6. Logout Button
    el.logoutBtn.addEventListener("click", async () => {
      try {
        showLoaderOverlay(true);
        await Api.signOut();
        showToast("Logged out successfully.", "success");
      } catch (err) {
        showToast("Logout failed: " + err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    // 7. Clear Credentials / Disconnect Database
    el.clearCredentialsBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to disconnect? All localStorage configuration will be cleared.")) {
        window.clearSupabaseCredentials();
        location.reload();
      }
    });

    // 8. Settings Profile Form Update Password
    el.settingsProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pwd = el.settingsNewPassword.value;
      if (!pwd || pwd.length < 6) {
        showFieldError(el.settingsNewPassword, "Password must be at least 6 characters.");
        return;
      }

      try {
        showLoaderOverlay(true);
        await Api.updatePassword(pwd);
        showToast("Password updated successfully.", "success");
        el.settingsNewPassword.value = "";
      } catch (err) {
        showToast("Update failed: " + err.message, "error");
      } finally {
        showLoaderOverlay(false);
      }
    });

    // 9. Dashboard Shortcuts
    el.dashQuickAdd.addEventListener("click", () => {
      state.editingStudent = null;
      showPage("add-student");
    });
    el.dashViewAll.addEventListener("click", () => showPage("students"));

    // 10. Students Page Toolbar Controls
    let searchTimeout = null;
    el.studentsSearch.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.filters.search = el.studentsSearch.value;
        state.pagination.page = 1; // reset page
        loadStudentsDirectory();
      }, 400); // Debounce
    });

    el.studentsSearch.addEventListener("focus", () => searchInputFocused = true);
    el.studentsSearch.addEventListener("blur", () => searchInputFocused = false);

    el.filterDept.addEventListener("change", () => {
      state.filters.department = el.filterDept.value;
      state.pagination.page = 1;
      loadStudentsDirectory();
    });

    el.sortBy.addEventListener("change", () => {
      state.sorting.sortBy = el.sortBy.value;
      loadStudentsDirectory();
    });

    el.sortOrder.addEventListener("change", () => {
      state.sorting.sortOrder = el.sortOrder.value;
      loadStudentsDirectory();
    });

    // Master checkbox logic
    el.selectAllStudents.addEventListener("change", () => {
      const checked = el.selectAllStudents.checked;
      state.students.forEach(s => {
        const row = el.studentsTableBody.querySelector(`tr[data-row-id="${s.id}"]`);
        const chk = row ? row.querySelector(".student-checkbox") : null;
        
        if (checked) {
          state.selectedStudentIds.add(s.id);
          if (chk) chk.checked = true;
          if (row) row.classList.add("selected");
        } else {
          state.selectedStudentIds.delete(s.id);
          if (chk) chk.checked = false;
          if (row) row.classList.remove("selected");
        }
      });
      updateBulkDeleteButton();
    });

    // Bulk Delete Click
    el.bulkDeleteBtn.addEventListener("click", promptBulkDelete);

    // Prev / Next Page Directory Pagination
    el.prevPage.addEventListener("click", () => {
      if (state.pagination.page > 1) {
        state.pagination.page--;
        loadStudentsDirectory();
      }
    });

    el.nextPage.addEventListener("click", () => {
      const totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);
      if (state.pagination.page < totalPages) {
        state.pagination.page++;
        loadStudentsDirectory();
      }
    });

    // Directory top actions
    el.listAddStudent.addEventListener("click", () => {
      state.editingStudent = null;
      showPage("add-student");
    });

    // 11. Student Form Controls
    el.triggerFileSelect.addEventListener("click", () => el.formFileInput.click());
    el.formFileInput.addEventListener("change", handleImageSelected);
    el.studentForm.addEventListener("submit", handleStudentSubmit);
    el.formResetBtn.addEventListener("click", resetStudentForm);
    el.formCancelBtn.addEventListener("click", () => showPage("students"));

    // 12. Modal Confirm Deletion events
    el.confirmDeleteBtn.addEventListener("click", async () => {
      el.confirmModal.classList.remove("show");
      if (state.confirmAction) {
        await state.confirmAction();
        state.confirmAction = null;
      }
    });

    const hideConfirmModal = () => {
      el.confirmModal.classList.remove("show");
      state.confirmAction = null;
    };
    el.confirmCancel.addEventListener("click", hideConfirmModal);
    el.closeConfirmModal.addEventListener("click", hideConfirmModal);

    // 13. CSV Transfer Actions
    el.exportCsvBtn.addEventListener("click", handleExportCSV);
    el.triggerCsvImport.addEventListener("click", () => el.csvImportFile.click());
    el.csvImportFile.addEventListener("change", handleImportCSV);

    // 14. Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // Esc key closes modals
      if (e.key === "Escape") {
        el.confirmModal.classList.remove("show");
        el.credentialsModal.classList.remove("show");
        el.profileDropdown.classList.remove("show");
      }

      // Ctrl + N shortcuts to add student
      if (e.ctrlKey && e.key === "n" && state.currentUser) {
        e.preventDefault();
        state.editingStudent = null;
        showPage("add-student");
      }

      // Ctrl + F shortcuts to focus search bar
      if (e.ctrlKey && e.key === "f" && state.currentUser) {
        e.preventDefault();
        showPage("students");
        setTimeout(() => el.studentsSearch.focus(), 100);
      }
    });
  }

  // ==========================================
  // TOAST ALERT ENGINE
  // ==========================================
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-xmark";
    else if (type === "warning") iconClass = "fa-circle-exclamation";

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;

    el.toastContainer.appendChild(toast);

    // Click to dismiss
    toast.querySelector(".toast-close").addEventListener("click", () => {
      dismissToast(toast);
    });

    // Auto dismiss after 4s
    setTimeout(() => {
      dismissToast(toast);
    }, 4500);
  }

  function dismissToast(toast) {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Loader Overlay spinner utility
  function showLoaderOverlay(show) {
    let overlay = document.getElementById("loader-global-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "loader-global-overlay";
      overlay.style = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(9, 13, 22, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      overlay.innerHTML = `
        <div class="glass-panel" style="padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
          <span style="font-size: 0.95rem; font-weight: 500;">Processing request...</span>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = show ? "flex" : "none";
  }

  // HTML escaping for sanitation
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Startup hook
  window.addEventListener("DOMContentLoaded", initApp);
})();
