// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let playerName = "";
let gameState = "waiting"; // states: waiting, playing
let words = ["whale", "tiger", "elephant", "giraffe"];

function joinGame() {
  playerName = document.getElementById("name").value;
  db.ref('players/' + playerName).set({
    name: playerName,
    points: 0
  });

  db.ref('players').on('value', (snapshot) => {
    const players = snapshot.val();
    const playerNames = Object.keys(players).join(', ');
    document.getElementById("players").innerText = playerNames;

    if (Object.keys(players).length >= 3 && gameState === "waiting") {
      startGame();
    }
  });
}

function startGame() {
  gameState = "playing";
  const currentWord = words[Math.floor(Math.random() * words.length)];
  const playersRef = db.ref('players');
  
  playersRef.once('value', (snapshot) => {
    const players = Object.keys(snapshot.val());
    const imposter = players[Math.floor(Math.random() * players.length)];

    playersRef.update({
      gameState: "playing",
      currentWord,
      imposter
    });

    if (playerName === imposter) {
      document.getElementById("role").innerText = "You are the imposter, act now!";
    } else {
      document.getElementById("role").innerText = "You are a guesser";
      document.getElementById("word").innerText = `Word: ${currentWord}`;
    }
    
    document.getElementById("join").style.display = "none";
    document.getElementById("play").style.display = "block";
  });
}

function vote(vote) {
  db.ref('votes/' + playerName).set(vote);

  db.ref('votes').once('value', (snapshot) => {
    const votes = snapshot.val();
    const voteCounts = {
      skip: 0,
      imposter: 0
    };

    for (let vote in votes) {
      voteCounts[votes[vote]]++;
    }

    db.ref('players').once('value', (snapshot) => {
      const players = snapshot.val();
      const imposter = Object.keys(players).find(player => players[player].role === "imposter");

      if (voteCounts.imposter > voteCounts.skip && voteCounts.imposter >= Object.keys(players).length / 2) {
        for (let player in players) {
          if (player !== imposter) {
            players[player].points++;
          }
        }
      } else {
        players[imposter].points++;
      }

      db.ref('players').set(players);

      db.ref('votes').remove();

      if (words.length === 0) {
        gameState = "finished";
        alert("Game Over!");
      } else {
        startGame();
      }
    });
  });
}
