/**
 * API wrapper functions for interacting with Supabase Services (Auth, DB, Storage)
 */

const Api = {
  // Helper to ensure Supabase client is initialized
  getClient() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized. Please configure your credentials.");
    }
    return window.supabaseClient;
  },

  // ==========================================
  // AUTH API
  // ==========================================
  async signUp(email, password, name) {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = this.getClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordResetEmail(email) {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname + '?reset=true'
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword) {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    const supabase = this.getClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  async getSession() {
    const supabase = this.getClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  },

  // ==========================================
  // DATABASE API (CRUD on "students")
  // ==========================================
  async fetchStudents({ search = "", department = "", sortBy = "name", sortOrder = "asc", page = 1, pageSize = 10 }) {
    const supabase = this.getClient();
    
    // Start building query
    let query = supabase
      .from("students")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search.trim() !== "") {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply department filter
    if (department !== "") {
      query = query.eq("department", department);
    }

    // Apply sorting
    const orderDirection = sortOrder === "asc";
    query = query.order(sortBy, { ascending: orderDirection });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      students: data || [],
      totalCount: count || 0
    };
  },

  async checkEmailDuplicate(email, excludeId = null) {
    const supabase = this.getClient();
    let query = supabase.from("students").select("id").eq("email", email);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.length > 0;
  },

  async createStudent(studentData) {
    const supabase = this.getClient();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Unauthenticated request");

    // Add user_id to record
    const record = {
      ...studentData,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from("students")
      .insert([record])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateStudent(id, studentData) {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("students")
      .update(studentData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteStudent(id, imageUrl = null) {
    const supabase = this.getClient();
    
    // First, delete the database record
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Second, if student had a profile image, delete from storage
    if (imageUrl) {
      await this.deleteProfileImageByUrl(imageUrl);
    }
  },

  async deleteStudentsBulk(ids, imageUrls = []) {
    const supabase = this.getClient();

    const { error } = await supabase
      .from("students")
      .delete()
      .in("id", ids);

    if (error) throw error;

    // Delete all associated files
    for (const url of imageUrls) {
      if (url) {
        try {
          await this.deleteProfileImageByUrl(url);
        } catch (err) {
          console.error("Failed to delete image in bulk operation:", url, err);
        }
      }
    }
  },

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    const supabase = this.getClient();
    
    // Fetch total count and departments
    const { data: allStudents, error } = await supabase
      .from("students")
      .select("department, created_at");

    if (error) throw error;

    const total = allStudents.length;

    // Department counts
    const deptCounts = {};
    allStudents.forEach(s => {
      const dept = s.department || "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    // Recently added (last 5)
    const sorted = [...allStudents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentIds = sorted.slice(0, 5).map(s => s.created_at);
    
    // Fetch full records of recent 5
    let recentStudents = [];
    if (total > 0) {
      const { data: recentData, error: recentErr } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (!recentErr) {
        recentStudents = recentData;
      }
    }

    return {
      totalStudents: total,
      departmentStats: deptCounts,
      recentStudents
    };
  },

  // ==========================================
  // STORAGE API (profile-images)
  // ==========================================
  async uploadProfileImage(file, studentId = null) {
    const supabase = this.getClient();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Unauthenticated user");

    const fileExt = file.name.split(".").pop();
    const randomName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    const filePath = `${user.id}/${studentId || "temp"}-${randomName}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("student-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (error) throw error;

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("student-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  },

  async deleteProfileImageByUrl(url) {
    const supabase = this.getClient();
    
    // Parse path out of public URL
    // Public URL format: https://[project-id].supabase.co/storage/v1/object/public/student-images/[user-id]/[file-name]
    try {
      const parts = url.split("/student-images/");
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1]);
        const { error } = await supabase.storage
          .from("student-images")
          .remove([filePath]);
        if (error) throw error;
      }
    } catch (e) {
      console.error("Error parsing/deleting profile image URL:", url, e);
    }
  }
};

window.Api = Api;
