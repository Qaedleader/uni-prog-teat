import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const STATUSES = ["pending", "in_progress", "completed"];

const loadingView = document.getElementById("loading-view");
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const taskEmpty = document.getElementById("task-empty");

// Reference to /users/{uid} of the signed-in user. Every task points at it.
let owner = null;

function show(view) {
  for (const section of document.querySelectorAll("main > section")) {
    section.classList.add("hidden");
  }
  view.classList.remove("hidden");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    owner = null;
    show(loginView);
    return;
  }

  owner = doc(db, "users", user.uid);
  const profile = await getDoc(owner);

  document.getElementById("user-name").textContent =
    profile.exists() ? profile.data().displayName : user.email;
  document.getElementById("user-uid").textContent = user.uid;

  show(dashboardView);
  loadTasks();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginError.textContent = "Login failed. Check your email and password.";
  }
});

document.getElementById("logout-button").addEventListener("click", () => signOut(auth));

async function loadTasks() {
  const snapshot = await getDocs(query(collection(db, "tasks"), where("owner", "==", owner)));

  const tasks = snapshot.docs
    .map((task) => ({ id: task.id, ...task.data() }))
    .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());

  taskList.replaceChildren(...tasks.map(renderTask));
  taskEmpty.classList.toggle("hidden", tasks.length > 0);
}

function renderTask(task) {
  const item = document.createElement("li");
  item.className = "task";

  const title = document.createElement("h3");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description;

  const due = document.createElement("p");
  due.className = "muted";
  due.textContent = "Due: " + task.dueDate.toDate().toLocaleDateString();

  const status = document.createElement("select");
  for (const value of STATUSES) {
    status.add(new Option(value, value, false, value === task.status));
  }
  status.addEventListener("change", () =>
    updateDoc(doc(db, "tasks", task.id), { status: status.value })
  );

  const remove = document.createElement("button");
  remove.className = "secondary";
  remove.textContent = "Delete";
  remove.addEventListener("click", async () => {
    await deleteDoc(doc(db, "tasks", task.id));
    loadTasks();
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(status, remove);

  item.append(title, description, due, actions);
  return item;
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addDoc(collection(db, "tasks"), {
    title: document.getElementById("task-title").value,
    description: document.getElementById("task-description").value,
    status: document.getElementById("task-status").value,
    dueDate: Timestamp.fromDate(new Date(document.getElementById("task-due").value)),
    owner: owner
  });
  taskForm.reset();
  loadTasks();
});

show(loadingView);
