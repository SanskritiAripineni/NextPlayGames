// config.js
window.APP_CONFIG = {
  SUPABASE_URL: window.location.hostname === 'localhost'
    ? "https://bqqsmgvpwysyvtnzgpbl.supabase.co"
    : "https://bqqsmgvpwysyvtnzgpbl.supabase.co",

  SUPABASE_ANON_KEY: window.location.hostname === 'localhost'
    ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcXNtZ3Zwd3lzeXZ0bnpncGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDI1MDYsImV4cCI6MjA4NzIxODUwNn0.s_bu0ErfZCBPt2K1mL0aF700bwLUuJKWLtizwU6Pf_A"
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcXNtZ3Zwd3lzeXZ0bnpncGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDI1MDYsImV4cCI6MjA4NzIxODUwNn0.s_bu0ErfZCBPt2K1mL0aF700bwLUuJKWLtizwU6Pf_A"
};