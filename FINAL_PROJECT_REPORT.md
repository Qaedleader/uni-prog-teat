# Uni Prog Teat - Final Project Report

## 1. Final Status

**COMPLETE AND VERIFIED**

Every item in section 7 was checked against live systems, not against configuration alone.

## 2. Firebase

| Item | Value |
| --- | --- |
| Display name | Uni Prog Teat |
| Project ID | `uni-prog-teat` |
| Project number | 477893747962 |
| Web App | "Uni Prog Teat Web" - created, config used by the site |
| Cloud Firestore | Created, Native mode, Standard edition, location `nam5` |
| Authentication | Enabled, Email/Password signup + login, 4 test users |
| Email/Password provider | Enabled |
| Collections | `users` (4 documents), `tasks` (5 documents) |
| Security Rules | Written and deployed (`firestore.rules`) |
| Allowed case | PASSED - each user reads their own profile and their own tasks |
| Denied case | PASSED - User B receives `permission-denied` for User A's data |

Four fake demo accounts exist ("Student One", "Student Two", and "Student Three" /
"Student Four" created through the Signup form). No real personal
data was used and no passwords are stored in this repository.

## 3. Firestore Structure

    users/{uid}
      displayName : string
      email       : string

    tasks/{taskId}
      title       : string
      description : string
      status      : string      // pending | in_progress | completed
      dueDate     : timestamp
      owner       : reference   // -> /users/{uid}

The document ID of a user document is the Firebase Authentication UID, so the signed-in
user maps straight onto their Firestore record.

`owner` is a DocumentReference rather than a copy of the user object. Referencing keeps
the user's name and email in exactly one place, so correcting a profile does not require
rewriting every task that person owns. It also keeps each task document small and lets the
Security Rules compare the stored reference directly against the signed-in user's path.
Nesting a full copy of the user inside every task would duplicate the same data five times
and let those copies drift out of sync.

## 4. GitHub

| Item | Value |
| --- | --- |
| Repository | `uni-prog-teat` |
| URL | https://github.com/Qaedleader/uni-prog-teat |
| Visibility | Public |
| Branch | `main` |
| Application source commit | `3791e37718e0a0d9bc332ff52a6ab0cb20e3140d` |
| Final commit | the commit on `main` that adds this report |

Commits were created through GitHub's authenticated web interface because this machine has
no stored git credentials for the account; no new access token or SSH key was created.

## 5. Vercel

| Item | Value |
| --- | --- |
| Project | `uni-prog-teat` |
| Team | Fawran-APPS |
| Source | GitHub `Qaedleader/uni-prog-teat`, branch `main` |
| Framework preset | Other (static HTML/CSS/JS, no build step) |
| Production URL | https://uni-prog-teat.vercel.app |
| Deployment status | Ready |
| Production URL opened | Yes |
| Functionally tested | Yes - login, task list, create/update/delete, logout, refresh |

## 6. Firebase - Vercel Verification

The deployed site was confirmed to use the new `Uni Prog Teat` Firebase project.

Evidence collected on the live production URL:

- `firebase-config.js` served by `uni-prog-teat.vercel.app` reports
  `projectId: "uni-prog-teat"` and `appId: "1:477893747962:web:aada59942dc535b7e79543"`,
  which match the Web App created inside this Firebase project.
- Signing in on the live site returned UID `UeXcPQBZYVXYHH6PHoCPNK02H4o1`, the same UID
  shown in Firebase Console -> Authentication -> Users for `student.one@example.com`.
- The live dashboard rendered the exact task documents stored in this project's Firestore.
- A task created on the live site appeared in this project's `tasks` collection, and
  deleting it removed it again.

## 7. Functional Verification

| Check | Result |
| --- | --- |
| Website opens | VERIFIED |
| Firebase initializes | VERIFIED |
| Valid login works | VERIFIED |
| Invalid login is rejected | VERIFIED |
| Correct user's tasks load | VERIFIED |
| User A allowed to access own tasks | VERIFIED |
| User B denied access to User A's tasks | VERIFIED |
| Logout works | VERIFIED |
| Refresh works | VERIFIED |

The denied case was observed twice: through the Firestore REST API with User B's ID token,
and in the browser on the live site while signed in as User B. Both returned
`PERMISSION_DENIED` for User A's task document, User A's profile document, and a query
filtered on User A's owner reference.

## 8. Signup Flow

Email/Password signup was added to the existing login card. The card toggles between
Login and Signup; Signup asks only for display name, email and password.

    Signup form
      -> createUserWithEmailAndPassword
      -> Firebase Authentication account + user.uid
      -> users/{uid} with displayName and email
      -> user is signed in
      -> dashboard

The Authentication UID is the Firestore document ID, so no second random document is
created. Signup writes only the account and the profile document; no tasks are created
and the five sample tasks are untouched. An empty list shows "No tasks yet.".

Validation is minimal - display name not empty, browser email validation, password at
least 6 characters - plus short messages for the Firebase errors `email-already-in-use`,
`invalid-email`, `weak-password` and `network-request-failed`.

The `/users/{uid}` rule already allowed this: `write` includes `create` and the document
ID must equal `request.auth.uid`. No rule was loosened.

Verified on the production site https://uni-prog-teat.vercel.app:

| Check | Result |
| --- | --- |
| Signup creates a Firebase Authentication account | VERIFIED - `student.four@example.com`, UID `adxgiW7tMUN39B05OM6ugrDMIVm2` |
| UID used as the Firestore document ID | VERIFIED - `users/adxgiW7tMUN39B05OM6ugrDMIVm2` |
| Profile stored | VERIFIED - `displayName: "Student Four"`, `email: "student.four@example.com"` |
| Dashboard after signup, UID matches Authentication | VERIFIED - empty list shows "No tasks yet." |
| No tasks created by signup | VERIFIED - owner query returned no documents |
| Duplicate email rejected | VERIFIED - "That email is already registered." |
| Logout, then login with the new account | VERIFIED |
| Existing accounts still log in | VERIFIED - `student.one@example.com`, same 3 tasks |

A second fake account, `student.three@example.com` (UID `8zFMoiVWuJcXHTBB2nl8kQDAiIr2`),
was created the same way while testing locally.

## 9. University Demonstration Order

1. Open the Vercel website - https://uni-prog-teat.vercel.app
2. Show the login page.
3. Open Firebase Console -> Authentication -> Users and show the two test users.
4. Show the UID of `student.one@example.com`.
5. Open Firestore -> `users` and show the document whose ID is that same UID.
6. Open Firestore -> `tasks` and show the five task documents.
7. Open one task and show that `owner` is a DocumentReference to `/users/{uid}`.
8. Explain nesting versus referencing (section 3 above).
9. Show the status dropdown in the app: only `pending`, `in_progress`, `completed`.
10. Open Firestore -> Rules and read the rule set line by line.
11. Explain the allowed case and the denied case (section 7 above).
12. Log in on the website and show the live task dashboard.

## 10. Important URLs

- GitHub repository: https://github.com/Qaedleader/uni-prog-teat
- Vercel production website: https://uni-prog-teat.vercel.app
- Firebase Console project: `uni-prog-teat` ("Uni Prog Teat")

Demo account emails are `student.one@example.com`, `student.two@example.com`,
`student.three@example.com` and `student.four@example.com`.
Their passwords are deliberately not recorded in this repository.

## 11. Blockers

None.
