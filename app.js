import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const userLabel = document.getElementById("user-label");
const taskForm = document.getElementById("task-form");
const submitButton = document.getElementById("submit-button");
const refreshButton = document.getElementById("refresh-button");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

let supabase;
let currentUser = null;
let tasks = [];
let isSubmitting = false;
let isLoadingTasks = false;

function setError(message = "") {
  errorMessage.textContent = message;
  errorMessage.hidden = message.length === 0;
}

function setLoading(loading, text = "Loading...") {
  loadingMessage.textContent = text;
  loadingMessage.hidden = !loading;
}

function updateSubmitState() {
  submitButton.disabled = isSubmitting || !currentUser;
  submitButton.textContent = isSubmitting ? "Creating..." : "Create Task";
}

function disableApp() {
  taskForm.querySelectorAll("input, textarea, select, button").forEach((element) => {
    element.disabled = true;
  });
  refreshButton.disabled = true;
}

function formatDate(dateInput, withTime = false) {
  if (!dateInput) return null;
  let date;
  if (!withTime && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateInput);
  }
  if (Number.isNaN(date.getTime())) return null;
  const options = withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" };
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function buildMetaPill(text, className = "") {
  const span = document.createElement("span");
  span.className = `pill ${className}`.trim();
  span.textContent = text;
  return span;
}

function renderTasks() {
  taskList.innerHTML = "";
  emptyState.hidden = tasks.length > 0 || isLoadingTasks;

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item ${task.is_complete ? "complete" : ""}`.trim();

    const taskTop = document.createElement("div");
    taskTop.className = "task-top";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = Boolean(task.is_complete);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      await toggleTask(task.id, checkbox.checked);
      checkbox.disabled = false;
    });

    const taskText = document.createElement("div");
    taskText.className = "task-text";

    const title = document.createElement("h3");
    title.className = `task-title ${task.is_complete ? "complete" : ""}`.trim();
    title.textContent = task.title;
    taskText.appendChild(title);

    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;
      taskText.appendChild(description);
    }

    taskTop.appendChild(checkbox);
    taskTop.appendChild(taskText);

    const metaRow = document.createElement("div");
    metaRow.className = "meta-row";
    metaRow.appendChild(buildMetaPill(`Priority: ${task.priority || "normal"}`, `priority-${task.priority || "normal"}`));

    if (task.due_date) {
      const dueDate = formatDate(task.due_date);
      if (dueDate) {
        metaRow.appendChild(buildMetaPill(`Due: ${dueDate}`));
      }
    }

    const createdAt = formatDate(task.created_at, true);
    if (createdAt) {
      metaRow.appendChild(buildMetaPill(`Created: ${createdAt}`));
    }

    item.appendChild(taskTop);
    item.appendChild(metaRow);
    taskList.appendChild(item);
  });
}

async function fetchTasks() {
  if (!currentUser) return;
  isLoadingTasks = true;
  setLoading(true, "Loading tasks...");
  setError("");

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, priority, due_date, is_complete, created_at, user_id")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    tasks = data ?? [];
    renderTasks();
  } catch (error) {
    setError(`Could not load tasks: ${error.message}`);
  } finally {
    isLoadingTasks = false;
    setLoading(false);
    emptyState.hidden = tasks.length > 0;
  }
}

async function createTask(event) {
  event.preventDefault();
  if (!currentUser || isSubmitting) return;

  isSubmitting = true;
  updateSubmitState();
  setError("");

  try {
    const formData = new FormData(taskForm);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "normal");
    const dueDate = String(formData.get("due_date") || "").trim();

    if (!title) {
      throw new Error("Title is required.");
    }

    const payload = {
      user_id: currentUser.id,
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
    };

    const { error } = await supabase.from("tasks").insert(payload);
    if (error) throw error;

    taskForm.reset();
    const priorityInput = taskForm.querySelector("#priority");
    if (priorityInput) priorityInput.value = "normal";
    await fetchTasks();
  } catch (error) {
    setError(`Could not create task: ${error.message}`);
  } finally {
    isSubmitting = false;
    updateSubmitState();
  }
}

async function toggleTask(taskId, isComplete) {
  if (!currentUser) return;
  setError("");

  try {
    const { error } = await supabase
      .from("tasks")
      .update({ is_complete: isComplete })
      .eq("id", taskId)
      .eq("user_id", currentUser.id);

    if (error) throw error;

    tasks = tasks.map((task) => {
      if (task.id !== taskId) return task;
      return { ...task, is_complete: isComplete };
    });
    renderTasks();
  } catch (error) {
    setError(`Could not update task: ${error.message}`);
    await fetchTasks();
  }
}

async function ensureGuestSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (session?.user) return session.user;

  const { data, error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) throw signInError;
  if (!data.user) throw new Error("Anonymous sign-in failed to return a user.");
  return data.user;
}

function updateUserLabel() {
  const id = currentUser?.id || "";
  userLabel.textContent = id ? `Guest: ${id.slice(0, 8)}...` : "Guest: not signed in";
}

async function initializeApp() {
  const { APP_CONFIG } = window;

  if (
    !APP_CONFIG?.SUPABASE_URL ||
    !APP_CONFIG?.SUPABASE_ANON_KEY ||
    APP_CONFIG.SUPABASE_URL.includes("REPLACE_ME") ||
    APP_CONFIG.SUPABASE_ANON_KEY.includes("REPLACE_ME")
  ) {
    setError("Update config.js with your Supabase URL and anon key before running the app.");
    disableApp();
    return;
  }

  supabase = createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  setLoading(true, "Starting guest session...");
  setError("");

  try {
    currentUser = await ensureGuestSession();
    updateUserLabel();
    updateSubmitState();
    await fetchTasks();
  } catch (error) {
    setError(`Could not start guest session: ${error.message}`);
    disableApp();
  } finally {
    setLoading(false);
  }
}

taskForm.addEventListener("submit", (event) => {
  void createTask(event);
});

refreshButton.addEventListener("click", () => {
  void fetchTasks();
});

updateSubmitState();
void initializeApp();
