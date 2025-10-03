require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 5000;
const host = process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : `http://localhost:${port}`;
app.use(express.json());
// --- Database Setup ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('DB error', err.message);
  else {
    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT, xp INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS user_anime (user_id TEXT, anime_id TEXT, status TEXT, PRIMARY KEY (user_id, anime_id, status))`);
  }
});
// --- Session + Passport ---
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => done(err, user));
});
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${host}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [profile.id], (err, user) => {
    if (user) {
      db.run('UPDATE users SET name=?, email=? WHERE id=?',
        [profile.displayName, profile.emails[0].value, profile.id],
        () => db.get('SELECT * FROM users WHERE id=?', [profile.id], (e,u)=>done(e,u)));
    } else {
      const newUser = { id: profile.id, name: profile.displayName, email: profile.emails[0].value, xp: 0 };
      db.run('INSERT INTO users (id,name,email,xp) VALUES (?,?,?,?)',
        [newUser.id,newUser.name,newUser.email,newUser.xp],
        ()=>done(null,newUser));
    }
  });
}));
// --- Routes ---
app.use(express.static(__dirname));
// Auth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req,res)=>res.redirect('/profile'));
app.get('/auth/logout', (req,res,next)=>req.logout(()=>res.redirect('/')));
// API
app.get('/api/user', (req,res)=> req.isAuthenticated() ? res.json(req.user) : res.status(401).json({error:"User not authenticated"}));
app.get('/api/user/animelist',(req,res)=>{
  if(!req.isAuthenticated()) return res.status(401).json({error:"User not authenticated"});
  db.all('SELECT anime_id, status FROM user_anime WHERE user_id=?',[req.user.id],(e,rows)=>{
    if(e) return res.status(500).json({error:e.message});
    res.json(rows);
  });
});
app.post('/api/user/animelist',(req,res)=>{
  if(!req.isAuthenticated()) return res.status(401).json({error:"User not authenticated"});
  const { anime_id, status, old_status } = req.body;
  if(status==="none"){
    db.run('DELETE FROM user_anime WHERE user_id=? AND anime_id=? AND status=?',[req.user.id,anime_id,old_status],()=>res.json({success:true}));
  } else {
    db.run('INSERT OR REPLACE INTO user_anime (user_id,anime_id,status) VALUES (?,?,?)',[req.user.id,anime_id,status],()=>res.json({success:true,anime_id,status}));
  }
});
// Pages
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/profile',(req,res)=>res.sendFile(path.join(__dirname,'profile.html')));
app.get('/profile.html',(req,res)=>res.redirect('/profile'));
app.get('/anime-found',(req,res)=>res.sendFile(path.join(__dirname,'Anime Found.html')));
app.get('/anime-found-eng',(req,res)=>res.sendFile(path.join(__dirname,'Anime Found_eng.html')));
app.get('/card',(req,res)=>res.sendFile(path.join(__dirname,'card.html')));
app.get('/choose',(req,res)=>res.sendFile(path.join(__dirname,'choose.html')));
app.get('/chooseeng',(req,res)=>res.sendFile(path.join(__dirname,'chooseeng.html')));
app.get('/randomizer',(req,res)=>res.sendFile(path.join(__dirname,'randomizer.html')));
app.get('/intro',(req,res)=>res.sendFile(path.join(__dirname,'intro.html')));
app.listen(port, '0.0.0.0', ()=>console.log(`✅ Server running on ${host}`));
📄 package.json (Complete file)
{
  "name": "anime-illustration",
  "version": "1.0.0",
  "description": "A web application for tracking anime and user progress.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "anime",
    "tracker",
    "xp"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "googleapis": "^108.0.0",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "sqlite3": "^5.1.2"
  }
}