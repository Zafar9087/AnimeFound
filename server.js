require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

const sqlite3 = require('sqlite3').verbose();

// --- Database Setup ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (\n      id TEXT PRIMARY KEY,\n      name TEXT,\n      email TEXT,\n      xp INTEGER DEFAULT 0\n    )`);
    db.run(`CREATE TABLE IF NOT EXISTS user_anime (\n      user_id TEXT,\n      anime_id TEXT,\n      status TEXT, -- e.g., 'watched', 'favorited'\n      PRIMARY KEY (user_id, anime_id, status)\n    )`);
  }
});

// --- Passport and Session Setup ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${port}/auth/google/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [profile.id], (err, user) => {
      if (err) { return done(err); }
      if (user) {
        // User exists, update their info just in case it changed
        db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', 
          [profile.displayName, profile.emails[0].value, profile.id], 
          (updateErr) => {
            if (updateErr) { return done(updateErr); }
            // After updating, fetch the user again to get the most recent data (including XP)
            db.get('SELECT * FROM users WHERE id = ?', [profile.id], (fetchErr, updatedUser) => {
              return done(fetchErr, updatedUser);
            });
          }
        );
      } else {
        // User doesn't exist, create a new one with default XP
        const newUser = { id: profile.id, name: profile.displayName, email: profile.emails[0].value, xp: 0 };
        db.run('INSERT INTO users (id, name, email, xp) VALUES (?, ?, ?, ?)', 
          [newUser.id, newUser.name, newUser.email, newUser.xp], 
          (insertErr) => {
            if (insertErr) { return done(insertErr); }
            return done(null, newUser);
          }
        );
      }
    });
  }
));

// --- Routes ---

// Serve static files from the root directory
app.use(express.static(__dirname));

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to profile.
    res.redirect('/profile.html');
  });

app.get('/auth/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// API route to get user data
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'User not authenticated' });
  }
});

// API routes for user's anime list
app.get('/api/user/animelist', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  db.all('SELECT anime_id, status FROM user_anime WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/user/animelist', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  const { anime_id, status } = req.body;
  if (!anime_id || !status) {
    return res.status(400).json({ error: 'anime_id and status are required' });
  }

  // Using INSERT OR REPLACE to handle both adding and updating statuses, and removing if status is 'none'
  if (status === 'none') {
      db.run('DELETE FROM user_anime WHERE user_id = ? AND anime_id = ? AND status = ?', 
      [req.user.id, anime_id, req.body.old_status], // old_status should be passed to identify which one to remove
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: `Status for ${anime_id} removed.` });
      });
  } else {
      db.run('INSERT OR REPLACE INTO user_anime (user_id, anime_id, status) VALUES (?, ?, ?)', 
      [req.user.id, anime_id, status], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, anime_id, status });
      });
  }
});


// Main Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Please ensure you have filled in the .env file with your Google credentials.');
});