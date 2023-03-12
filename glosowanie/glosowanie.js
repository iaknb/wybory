const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const path = require('path');


const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wybory'
});

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/glosowanie.html');
});

app.post('/submit', (req, res) => {
  const candidate = req.body.candidate;
  const name = req.body.name;
  const surname = req.body.surname;

  const sql = 'INSERT INTO glosy (id_kandydata, imie_g, nazwisko_g) VALUES (?, ?, ?)';
  db.query(sql, [candidate, name, surname], (err, result) => {
    if (err) throw err;
    console.log(result);
    let html = '<body><h1>Dziękujemy za oddanie głosu!</h1><a href="/wyniki">WYNIKI</a></body>'
    res.send(html);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Konfiguracja połączenia z bazą danych
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wybory'
});
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nodelogin'
});
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));


// Odczytanie danych z bazy
connection.query('SELECT * FROM glosy', function (error, results, fields) {
  if (error) throw error;

  // Utworzenie tablicy z wynikami
  const data = [];
  for (let i = 0; i < results.length; i++) {
      const row = results[i];
      data.push({ id: row.id_kandydata, imie: row.imie_g, nazwisko: row.nazwisko_g });
  }

  // Plik HTML
  app.get('/wyniki', function (req, res) {
      let adam = 0
      let jakub = 0
      let dawid = 0
      let html = '<html><head><title>WYNIKI</title>';
      html += '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
      html += '</head><body><h1>Wyniki</h1><table>';
      html += '<thead><tr><th>Liczba głosów</th><th>Imię kandydata</th><th>Nazwisko kandydata</th></tr></thead>';
      html += '<tbody>';
      data.forEach(function (result) {
          if (result.id == 1) {
              adam++
          } else if (result.id == 2) {
              jakub++
          } else {
              dawid++
          }
      });
      html += '<tr><td>' + adam + '</td><td>' + 'Adam' + '</td><td>' + 'Paska' + '</td></tr>';
      html += '<tr><td>' + jakub + '</td><td>' + 'Jakub' + '</td><td>' + 'Osica' + '</td></tr>';
      html += '<tr><td>' + dawid + '</td><td>' + 'Dawid' + '</td><td>' + 'Muras' + '</td></tr>';
      html += '</tbody></table>';

      // Tworzenie diagramu kołowego
      html += '<canvas id="myChart"></canvas><script>';
      html += 'const ctx = document.getElementById("myChart").getContext("2d");';
      html += 'const myChart = new Chart(ctx, {type: "pie",';
      html += 'data: {labels: ["Adam", "Jakub", "Dawid"],';
      html += 'datasets: [{label: "Liczba głosów",';
      html += 'data: [' + adam + ', ' + jakub + ', ' + dawid + '],';
      html += 'backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],}]}});</script>';
      html += '<style>canvas {max-width: 500px;max-height: 500px;}</style>'
      html += '</body></html>';
      res.send(html);
  });
  app.get('/admin', function (request, response) {
      response.sendFile(path.join(__dirname + '/login.html'));
  });
  app.post('/auth', function (request, response) {
      let username = request.body.username;
      let password = request.body.password;
      if (username && password) {
          con.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
              if (error) throw error;
              if (results.length > 0) {
                  request.session.loggedin = true;
                  request.session.username = username;
                  response.redirect('/home');
              } else {
                  response.send('Incorrect Username and/or Password!');
              }
              response.end()
          });
      } else {
          response.send('Please enter Username and Password!');
          response.end();
      }
  });
  app.get('/home', function (request, response) {
      if (request.session.loggedin) {
          let html = '<html><head><title>Dane użytkowników</title></head><body><h1>Dane użytkowników</h1><table>';
          html += '<thead><tr><th>Kandydat</th><th>Imię głosującego</th><th>Nazwisko głosującego</th></tr></thead>';
          html += '<tbody>';
          data.forEach(function (result) {
              if(result.id == 1) {
                  html += '<tr><td>Adam Paska'
              } else if (result.id == 2) {
                  html += '<tr><td>Jakub Osica'
              } else {
                  html += '<tr><td>Dawid Muras'
              }
              html += '</td><td>' + result.imie + '</td><td>' + result.nazwisko + '</td></tr>';
          });
          html += '</tbody></table></body></html>';
          response.send(html);
      } else {
          response.send('Please login to view this page!')
      }
      response.end();
  });

});