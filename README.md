# Uni Prog Teat - Task Demo

A small static web app used to demonstrate Firebase Authentication, Cloud Firestore
and Firestore Security Rules for a university field-training discussion.

## Flow

    Login (email + password)
      -> Firebase Authentication
      -> user.uid
      -> users/{uid}
      -> tasks where owner == /users/{uid}
      -> Security Rules decide access

## Files

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `index.html`         | Login card and task dashboard              |
| `style.css`          | Styling                                    |
| `app.js`             | Auth + Firestore logic                     |
| `firebase-config.js` | Firebase Web App configuration             |
| `firestore.rules`    | Security Rules                             |

## Data model

    users/{uid}
      displayName: string
      email: string

    tasks/{taskId}
      title: string
      description: string
      status: string        // pending | in_progress | completed
      dueDate: timestamp
      owner: reference      // -> /users/{uid}

`owner` is a Firestore DocumentReference rather than a copy of the user data, so a
profile change is written in one place only and the Security Rules can compare the
reference directly with the signed-in user.

## Deploying the rules

    firebase deploy --only firestore:rules --project uni-prog-teat

No build step: the app is plain HTML, CSS and JavaScript, served as static files.
