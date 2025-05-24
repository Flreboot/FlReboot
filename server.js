const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'supersegretissimo',
  resave: false,
  saveUninitialized: true
}));

// Lista utenti hardcoded (case-insensitive login)
const utenti = [
  { username: 'admin', password: 'p4lermo', ruolo: 'admin' },
  { username: 'ATLETICO VAR', password: 'pass', ruolo: 'giocatore' },
  { username: 'DREAM TEAM', password: 'pass', ruolo: 'giocatore' },
  { username: 'FC SOFIA', password: 'pass', ruolo: 'giocatore' },
  { username: 'STOKE AZZO', password: 'pass', ruolo: 'giocatore' },
  { username: 'IL SIGNOR G', password: 'pass', ruolo: 'giocatore' },
  { username: 'SCOGLIO FFC', password: 'pass', ruolo: 'giocatore' },
  { username: 'SCAGLIONE B', password: 'pass', ruolo: 'giocatore' },
  { username: 'XAMATT FFC', password: 'pass', ruolo: 'giocatore' },
];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const inputUser = req.body.username.trim().toLowerCase();
  const inputPass = req.body.password;

  const utente = utenti.find(u => u.username.toLowerCase() === inputUser && u.password === inputPass);

  if (utente) {
    req.session.user = { username: utente.username, ruolo: utente.ruolo };
    return res.redirect(utente.ruolo === 'admin' ? '/dashboard-admin.html' : '/dashboard.html');
  }

  res.redirect('/?errore=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/utente', (req, res) => {
  if (!req.session.user) return res.status(401).json({ errore: 'Non autorizzato' });
  res.json(req.session.user);
});
const XLSX = require('xlsx'); // Se non l'hai già incluso in alto

app.get('/api/giornata', (req, res) => {
    const label = req.query.label?.trim().toLowerCase();
    if (!label) return res.status(400).json({ label: '', partite: [] });
  
    try {
      const path = require('path');
      const calendarioPath = path.join(__dirname, 'public', 'CALENDARIO.xlsx');
      const wb = XLSX.readFile(calendarioPath);
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
      for (let i = 0; i < sheet.length; i++) {
        const riga = sheet[i];
        const primaCella = riga[0]?.toString().trim().toLowerCase();
        if (primaCella === label) {
          const partite = [];
          for (let j = 1; j <= 4; j++) {
            const match = sheet[i + j];
            if (match && match.length >= 4) {
              const testo = `${match[0]} ${match[1]} ${match[2]} ${match[3]}`;
              partite.push(testo);
            }
          }
          return res.json({ label: req.query.label, partite });
        }
      }
  
      res.json({ label: req.query.label, partite: [] });
    } catch (err) {
      console.error('Errore lettura CALENDARIO.xlsx:', err);
      res.status(500).json({ label: req.query.label, partite: [] });
    }
  });
  const fs = require('fs');

app.post('/api/config', (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const config = JSON.parse(body);
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
      res.sendStatus(200);
    } catch (err) {
      console.error('Errore scrittura config.json:', err);
      res.sendStatus(500);
    }
  });
});

app.get('/api/config', (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json({});
  }
});

app.post('/api/formazione', (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const nuovaFormazione = JSON.parse(body);
      const filePath = path.join(__dirname, 'public', 'formazioni.json');
      let formazioni = [];

      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        try {
          formazioni = JSON.parse(fileData);
        } catch (err) {
          console.error("Errore parsing JSON:", err);
          return res.status(500).send("Errore lettura file formazioni");
        }
      }

      const index = formazioni.findIndex(f => f.utente === nuovaFormazione.utente);
      if (index !== -1) {
        formazioni[index] = nuovaFormazione;
      } else {
        formazioni.push(nuovaFormazione);
      }

      fs.writeFileSync(filePath, JSON.stringify(formazioni, null, 2));
      res.status(200).send("Formazione salvata");
    } catch (err) {
      console.error("Errore nel salvataggio formazione:", err);
      res.status(500).send("Errore nel salvataggio");
    }
  });
});




app.get('/api/formazioni', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'formazioni.json');
  if (fs.existsSync(filePath)) {
    const json = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  } else {
    res.status(404).json({ errore: 'File non trovato' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server avviato sulla porta ${PORT}`);
});
