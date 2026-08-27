import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
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
const signupForm = document.getElementById("signup-form");
const loginSwitch = document.getElementById("login-switch");
const signupSwitch = document.getElementById("signup-switch");
const authError = document.getElementById("auth-error");
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

// The same card is used for both modes; only one form is visible at a time.
function showLogin() {
  authError.textContent = "";
  loginForm.classList.remove("hidden");
  signupSwitch.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginSwitch.classList.add("hidden");
  show(loginView);
}

function showSignup() {
  authError.textContent = "";
  loginForm.classList.add("hidden");
  signupSwitch.classList.add("hidden");
  signupForm.classList.remove("hidden");
  loginSwitch.classList.remove("hidden");
  show(loginView);
}

// Short human-readable text for the Firebase error codes we expect here.
function errorMessage(error, fallback) {
  if (error.code === "auth/email-already-in-use") return "That email is already registered.";
  if (error.code === "auth/invalid-email") return "That email address is not valid.";
  if (error.code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (error.code === "auth/network-request-failed") return "Network error. Please try again.";
  return fallback;
}

async function login(event) {
  event.preventDefault();
  authError.textContent = "";
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authError.textContent = errorMessage(error, "Login failed. Check your email and password.");
  }
}

async function signup(event) {
  event.preventDefault();
  authError.textContent = "";

  const displayName = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!displayName) {
    authError.textContent = "Please enter a display name.";
    return;
  }
  if (password.length < 6) {
    authError.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    // Firebase Authentication creates the account and returns the UID.
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // The UID is used as the document ID, so auth and Firestore stay in sync.
    await setDoc(doc(db, "users", user.uid), { displayName: displayName, email: email });

    // The auth listener may have run before the profile existed, so load it again.
    signupForm.reset();
    await loadUser(user);
  } catch (error) {
    authError.textContent = errorMessage(error, "Could not create the account.");
  }
}

function logout() {
  signOut(auth);
}

async function loadUser(user) {
  owner = doc(db, "users", user.uid);
  const profile = await getDoc(owner);

  document.getElementById("user-name").textContent =
    profile.exists() ? profile.data().displayName : user.email;
  document.getElementById("user-uid").textContent = user.uid;

  show(dashboardView);
  loadTasks();
}

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

async function addTask(event) {
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
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUser(user);
  } else {
    owner = null;
    showLogin();
  }
});

loginForm.addEventListener("submit", login);
signupForm.addEventListener("submit", signup);
taskForm.addEventListener("submit", addTask);
document.getElementById("show-signup").addEventListener("click", showSignup);
document.getElementById("show-login").addEventListener("click", showLogin);
document.getElementById("logout-button").addEventListener("click", logout);

show(loadingView);
