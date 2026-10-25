const input = document.getElementById("nameInput");
input.addEventListener("focus", () => {
  input.value = "";
});
const themeToggle = document.getElementById("themeToggle");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const scrabblePoints = {
  A: 1,
  B: 3,
  C: 4,
  D: 1,
  E: 1,
  F: 4,
  G: 2,
  H: 2,
  I: 1,
  J: 6,
  K: 4,
  L: 3,
  M: 3,
  N: 1,
  O: 2,
  P: 4,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 6,
  W: 3,
  X: 8,
  Y: 10,
  Z: 3,
  Ä: 6,
  Ö: 8,
  Ü: 6,
};

const meanings = {
  0: {
    title: "Der leere Ausgangspunkt",
    text: "Die Summe ist null. In dieser spielerischen Deutung steht das für einen offenen Raum voller Möglichkeiten.",
  },
  1: {
    title: "Unabhängigkeit & Initiative",
    text: "Die Eins symbolisiert Neuanfang, Eigenständigkeit und den Mut, einen eigenen Weg einzuschlagen.",
  },
  2: {
    title: "Harmonie & Zusammenarbeit",
    text: "Die Zwei steht symbolisch für Ausgleich, Einfühlungsvermögen und die Verbindung zwischen Menschen.",
  },
  3: {
    title: "Kreativität & Ausdruck",
    text: "Die Drei wird mit Fantasie, Kommunikation, Leichtigkeit und dem Wunsch verbunden, Ideen auszudrücken.",
  },
  4: {
    title: "Stabilität & Struktur",
    text: "Die Vier symbolisiert Ordnung, Ausdauer und den Aufbau eines verlässlichen Fundaments.",
  },
  5: {
    title: "Freiheit & Veränderung",
    text: "Die Fünf steht für Neugier, Bewegung, Abenteuer und die Bereitschaft, neue Erfahrungen zu machen.",
  },
  6: {
    title: "Fürsorge & Verantwortung",
    text: "Die Sechs wird mit Fürsorge, Gemeinschaft, Verantwortung und einem Sinn für Schönheit verbunden.",
  },
  7: {
    title: "Reflexion & Erkenntnis",
    text: "Die Sieben symbolisiert Nachdenken, Wissbegierde, Intuition und die Suche nach tieferem Verständnis.",
  },
  8: {
    title: "Gestaltung & Zielstrebigkeit",
    text: "Die Acht steht für Organisation, Entschlossenheit und die Fähigkeit, Ideen in konkrete Ziele zu verwandeln.",
  },
  9: {
    title: "Mitgefühl & Weitblick",
    text: "Die Neun symbolisiert Großzügigkeit, Mitgefühl und den Blick über die eigenen Interessen hinaus.",
  },
};

function normalizeName(name) {
  return name
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ẞ/g, "SS")
    .replace(/ß/g, "SS");
}

function getLetters(name) {
  return normalizeName(name).replace(/[^A-Z]/g, "");
}

function letterValue(letter) {
  return letter.charCodeAt(0) - 64;
}

function digitSum(number) {
  return String(number)
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

function getDigitalRoot(number) {
  const steps = [number];
  let current = number;

  while (current >= 10) {
    current = digitSum(current);
    steps.push(current);
  }

  return { value: current, steps };
}

function getPrimeFactors(number) {
  const factors = [];
  let n = number;

  for (let divisor = 2; divisor * divisor <= n; divisor++) {
    while (n % divisor === 0) {
      factors.push(divisor);
      n /= divisor;
    }
  }

  if (n > 1) factors.push(n);
  return factors;
}

function getScrabbleScore(rawName) {
  let score = 0;

  for (const char of rawName.toUpperCase()) {
    if (scrabblePoints[char] !== undefined) {
      score += scrabblePoints[char];
    } else if (char === "ß" || char === "ẞ") {
      score += 2 * scrabblePoints.S;
    } else if (alphabet.includes(char)) {
      score += scrabblePoints[char] || 0;
    }
  }

  return score;
}

function animatePath(path) {
  const length = path.node().getTotalLength();

  path
    .interrupt()
    .attr("stroke-dasharray", `${length} ${length}`)
    .attr("stroke-dashoffset", length);

  return path
    .transition()
    .duration(2000) // Jeder Bogen wird in 2 Sekunden gezeichnet
    .ease(d3.easeCubicInOut)
    .attr("stroke-dashoffset", 0)
    .end()
    .then(() => {
      path
        .attr("stroke-dasharray", null)
        .attr("stroke-dashoffset", null);
    });
}

function renderVisualization(letters) {
  const container = document.getElementById("visualization");
  container.replaceChildren();

  if (!window.d3) {
    container.textContent =
      "D3.js konnte nicht geladen werden. Bitte prüfe deine Internetverbindung.";
    return;
  }

  const width = 1000;
  const height = 200;
  const left = 30;
  const right = width - 30;
  const baseline = 160;

  const css = getComputedStyle(document.body);
  const accent = css.getPropertyValue("--accent").trim();
  const muted = css.getPropertyValue("--muted").trim();
  const line = css.getPropertyValue("--line").trim();
  const textColor = css.getPropertyValue("--text").trim();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Animierte Alphabetgrafik für den eingegebenen Namen");

  const x = d3
    .scalePoint()
    .domain([...alphabet])
    .range([left, right]);

  svg
    .append("line")
    .attr("x1", left)
    .attr("x2", right)
    .attr("y1", baseline)
    .attr("y2", baseline)
    .attr("stroke", line)
    .attr("stroke-width", 1.5);

  const arcs = svg.append("g");

  // Source - https://stackoverflow.com/a/44476626
  // Posted by Jonas Wilms, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-10-25, License - CC BY-SA 4.0

  // Returns a Promise that resolves after "ms" Milliseconds
  //const timer = (ms) => new Promise((res) => setTimeout(res, ms));

  async function load() {
    // We need to wrap the loop into an async function for this to work

    // Zeichnet die Bögen in der Reihenfolge der Buchstaben.
    for (let i = 1; i < letters.length; i++) {
      console.log(i);
      //await timer(600); // then the created Promise can be awaited

      const previous = letters[i - 1];
      const current = letters[i];

      const x1 = x(previous);
      const x2 = x(current);
      const arcHeight = Math.min(35 + i * 18, 210);
      const middleX = (x1 + x2) / 2;
      const controlY = baseline - arcHeight;

      let pathData;

      if (x1 === x2) {
        const loopWidth = 22;
        pathData = `M ${x1} ${baseline}
        C ${x1 - loopWidth} ${baseline - arcHeight},
          ${x1 + loopWidth} ${baseline - arcHeight},
          ${x1} ${baseline}`;
      } else {
        pathData = `M ${x1} ${baseline}
        Q ${middleX} ${controlY} ${x2} ${baseline}`;
      }

      const path = arcs
        .append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", accent)
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.9);

      await animatePath(path);
    }
  }
  load();

  const usedLetters = new Set(letters);

  svg
    .selectAll(".letter-dot")
    .data([...alphabet])
    .join("circle")
    .attr("class", "letter-dot")
    .attr("cx", (letter) => x(letter))
    .attr("cy", baseline)
    .attr("r", (letter) => (usedLetters.has(letter) ? 4 : 2))
    .attr("fill", (letter) => (usedLetters.has(letter) ? accent : line));

  svg
    .selectAll(".letter-label")
    .data([...alphabet])
    .join("text")
    .attr("class", "letter-label")
    .attr("x", (letter) => x(letter))
    .attr("y", baseline + 28)
    .attr("text-anchor", "middle")
    .attr("font-size", 19)
    .attr("font-weight", (letter) => (usedLetters.has(letter) ? 750 : 400))
    .attr("fill", (letter) => (usedLetters.has(letter) ? accent : muted))
    .text((letter) => letter);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 700)
    .attr("fill", textColor)
    .text(letters || "Gib einen Namen ein");
}

function updateNumerology(sum, root) {
  const meaning = meanings[root.value];

  document.getElementById("numberOrb").textContent = root.value;
  document.getElementById("meaningTitle").textContent = meaning.title;
  document.getElementById("meaningText").textContent = meaning.text;

  const steps = document.getElementById("numberSteps");
  steps.replaceChildren();

  root.steps.forEach((number, index) => {
    if (index > 0) {
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "→";
      steps.appendChild(arrow);
    }

    const chip = document.createElement("span");
    chip.className = "step";
    chip.textContent = number;
    steps.appendChild(chip);
  });

  if (root.steps.length === 1 && sum === 0) {
    const note = document.createElement("span");
    note.className = "step";
    note.textContent = "Keine Buchstabenwerte";
    steps.appendChild(note);
  }
}

function update() {
  const rawName = input.value;
  const letters = getLetters(rawName);
  const values = [...letters].map(letterValue);
  const sum = values.reduce((total, value) => total + value, 0);

  const root = getDigitalRoot(sum);
  const factors = getPrimeFactors(sum);
  const distinctFactors = [...new Set(factors)];

  document.getElementById("sumValue").textContent = sum;
  document.getElementById("sumDetail").textContent = values.length
    ? values.join(" + ")
    : "Noch keine Buchstaben";

  document.getElementById("rootValue").textContent = root.value;
  document.getElementById("rootDetail").textContent =
    root.steps.length > 1
      ? root.steps.join(" → ")
      : "Keine weitere Reduktion nötig";

  document.getElementById("scrabbleValue").textContent =
    getScrabbleScore(rawName);

  document.getElementById("scrabbleDetail").textContent =
    "Summe im deutschen Scrabble";

  document.getElementById("primeValue").textContent = distinctFactors.length
    ? distinctFactors.join(", ")
    : "Keine";

  document.getElementById("factorDetail").textContent =
    sum < 2
      ? "Für Werte unter 2 gibt es keine Primfaktorzerlegung."
      : `${sum} = ${factors.join(" × ")}`;

  document.getElementById("letterDetails").textContent = letters
    ? [...letters]
        .map((letter) => `${letter} = ${letterValue(letter)}`)
        .join(" · ")
    : "Gib einen Namen ein, um die Buchstabenwerte zu sehen.";

  updateNumerology(sum, root);
  renderVisualization(letters);
}

function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeToggle.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";

  try {
    localStorage.setItem("alphabet-arcs-theme", dark ? "dark" : "light");
  } catch (error) {
    // Die Seite funktioniert auch, wenn localStorage gesperrt ist.
  }

  // Die Grafikfarben an das neue Theme anpassen.
  renderVisualization(getLetters(input.value));
}

themeToggle.addEventListener("click", () => {
  applyTheme(!document.body.classList.contains("dark"));
});

input.addEventListener("input", update);

// Gespeichertes Theme beim Start wiederherstellen.
let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("alphabet-arcs-theme") || "light";
} catch (error) {
  // Standardmäßig helles Theme.
}

document.body.classList.toggle("dark", savedTheme === "dark");
themeToggle.textContent =
  savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

update();
