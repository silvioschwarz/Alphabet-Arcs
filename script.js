const input = document.getElementById("nameInput");
const themeToggle = document.getElementById("themeToggle");
const visualizationToggle = document.getElementById("visualizationToggle");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let visualizationMode = "linear";
let visualizationRun = 0;

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

  if (n > 1) {
    factors.push(n);
  }

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

function getArcColorScale() {
    return () => "#7863e9";

//    return d3
//    .scaleLinear()
//    .domain([0, 0.33, 0.66, 1])
//    .range(["#22c55e", "#eab308", "#f97316", "#ef4444"])
//    .interpolate(d3.interpolateRgb);
//    -->
}

async function animatePath(path, runId) {
  if (runId !== visualizationRun) {
    return;
  }

  const node = path.node();

  if (!node) {
    return;
  }

  const length = node.getTotalLength();

  path
    .attr("stroke-dasharray", `${length} ${length}`)
    .attr("stroke-dashoffset", length);

  try {
    await path
      .transition()
      .duration(1800)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0)
      .end();
  } catch (error) {
    // A newer render may interrupt this transition.
    return;
  }

  if (runId === visualizationRun) {
    path.attr("stroke-dasharray", null).attr("stroke-dashoffset", null);
  }
}

function renderVisualization(letters) {
  const container = document.getElementById("visualization");

  container.classList.toggle("circular-mode", visualizationMode === "circle");

  if (!container) {
    return;
  }

  const runId = ++visualizationRun;

  container.replaceChildren();

  if (!window.d3) {
    container.textContent =
      "D3.js konnte nicht geladen werden. Bitte prüfe deine Internetverbindung.";
    return;
  }

  const css = getComputedStyle(document.body);

  const accent = css.getPropertyValue("--accent").trim() || "#64748b";

  const muted = css.getPropertyValue("--muted").trim() || "#64748b";

  const line = css.getPropertyValue("--line").trim() || "#cbd5e1";

  const textColor = css.getPropertyValue("--text").trim() || "#111827";

  const colorScale = getArcColorScale();

  if (visualizationMode === "circle") {
    renderCircularVisualization({
      container,
      letters,
      runId,
      accent,
      muted,
      line,
      textColor,
      colorScale,
    });
  } else {
    renderLinearVisualization({
      container,
      letters,
      runId,
      accent,
      muted,
      line,
      textColor,
      colorScale,
    });
  }

  if (visualizationToggle) {
    visualizationToggle.textContent =
      visualizationMode === "linear"
        ? "Kreisdiagramm anzeigen"
        : "Alphabetlinie anzeigen";

    visualizationToggle.setAttribute(
      "aria-pressed",
      String(visualizationMode === "circle"),
    );
  }
}

// =============================================
// 1. LINEAR ALPHABET VISUALIZATION
// =============================================

function renderLinearVisualization({
  container,
  letters,
  runId,
  accent,
  muted,
  line,
  textColor,
  colorScale,
}) {
  const width = 1200;
  const height = 250;
  const left = 30;
  const right = width - 30;
  const baseline = 180;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Alphabetlinie mit nacheinander animierten Verbindungen der Buchstaben",
    );

  const x = d3
    .scalePoint()
    .domain([...alphabet])
    .range([left, right]);

  // Horizontal baseline
  svg
    .append("line")
    .attr("x1", left)
    .attr("x2", right)
    .attr("y1", baseline)
    .attr("y2", baseline)
    .attr("stroke", line)
    .attr("stroke-width", 1.5);

  const usedLetters = new Set(letters);

  // Alphabet dots
  svg
    .selectAll(".letter-dot")
    .data([...alphabet])
    .join("circle")
    .attr("class", "letter-dot")
    .attr("cx", (letter) => x(letter))
    .attr("cy", baseline)
    .attr("r", (letter) => (usedLetters.has(letter) ? 4 : 2))
    .attr("fill", (letter) => (usedLetters.has(letter) ? accent : line));

  // Alphabet labels
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

  // Name above the alphabet
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 700)
    .attr("fill", textColor)
    .text(letters || "Gib einen Namen ein");

  const paths = svg.append("g");

  // Animate each connection sequentially.
  (async () => {
    for (let i = 1; i < letters.length; i++) {
      if (runId !== visualizationRun) {
        return;
      }

      const previous = letters[i - 1];
      const current = letters[i];

      const x1 = x(previous);
      const x2 = x(current);

      const arcHeight = Math.min(35 + i * (height/letters.length), height);
      const middleX = (x1 + x2) / 2;
      const controlY = baseline - arcHeight;

      let pathData;

      if (x1 === x2) {
        // Draw a loop when the same letter occurs twice in a row.
        const loopWidth = 22;

        pathData =
          `M ${x1} ${baseline} ` +
          `C ${x1 - loopWidth} ${baseline - arcHeight}, ` +
          `${x1 + loopWidth} ${baseline - arcHeight}, ` +
          `${x1} ${baseline}`;
      } else {
        pathData =
          `M ${x1} ${baseline} ` + `Q ${middleX} ${controlY} ${x2} ${baseline}`;
      }

      const t = letters.length <= 2 ? 0 : (i - 1) / (letters.length - 2);

      const path = paths
        .append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colorScale(t))
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.9);

      await animatePath(path, runId);
    }
  })();
}

// =============================================
// 2. CIRCULAR ALPHABET / CHORD VISUALIZATION
// =============================================

function renderCircularVisualization({
  container,
  letters,
  runId,
  accent,
  muted,
  line,
  textColor,
  colorScale,
}) {

const width = 300;
const height = width;

const cx = width / 2;
const cy = height / 2;

const radius = width/2 -15;
const labelRadius = radius +10;

  const pointByLetter = new Map();

  // Place all 26 letters evenly around the circle.
  alphabet.split("").forEach((letter, index) => {
    const angle = -Math.PI / 2 + (index / alphabet.length) * Math.PI * 2;

    pointByLetter.set(letter, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,

      labelX: cx + Math.cos(angle) * labelRadius,

      labelY: cy + Math.sin(angle) * labelRadius,

      angle,
    });
  });

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Kreisförmiges Alphabetdiagramm mit nacheinander animierten Verbindungen der Buchstaben",
    );

  // Outer circle
  svg
    .append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("stroke", line)
    .attr("stroke-width", 1.5);

  // Name in the center
  svg
    .append("text")
    .attr("x", cx)
    .attr("y", cy - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 700)
    .attr("fill", textColor)
    .text(letters || "Dein Name");

  // Number of connections
  svg
    .append("text")
    .attr("x", cx)
    .attr("y", cy + 17)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", muted)
    .text(
      letters
        ? `${Math.max(0, letters.length - 1)} Verbindungen`
        : "Gib einen Namen ein",
    );

  const usedLetters = new Set(letters);

  // Dots around the circle
  svg
    .selectAll(".circle-letter-dot")
    .data([...alphabet])
    .join("circle")
    .attr("class", "circle-letter-dot")
    .attr("cx", (letter) => pointByLetter.get(letter).x)
    .attr("cy", (letter) => pointByLetter.get(letter).y)
    .attr("r", (letter) => (usedLetters.has(letter) ? 4.5 : 2.5))
    .attr("fill", (letter) => (usedLetters.has(letter) ? accent : line));

  // Letters around the circle
  svg
    .selectAll(".circle-letter-label")
    .data([...alphabet])
    .join("text")
    .attr("class", "circle-letter-label")
    .attr("x", (letter) => pointByLetter.get(letter).labelX)
    .attr("y", (letter) => pointByLetter.get(letter).labelY)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-size", 15)
    .attr("font-weight", (letter) => (usedLetters.has(letter) ? 750 : 400))
    .attr("fill", (letter) => (usedLetters.has(letter) ? accent : muted))
    .text((letter) => letter);

  const chords = svg.append("g").attr("class", "sequence-chords");

  // Animate connections in the exact order of the name.
  (async () => {
    for (let i = 1; i < letters.length; i++) {
      if (runId !== visualizationRun) {
        return;
      }

      const previous = pointByLetter.get(letters[i - 1]);
      const current = pointByLetter.get(letters[i]);

      // Each chord passes through the center of the circle.
      const pathData =
        `M ${previous.x} ${previous.y} ` +
        `Q ${cx} ${cy} ${current.x} ${current.y}`;

      const t = letters.length <= 2 ? 0 : (i - 1) / (letters.length - 2);

      const path = chords
        .append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colorScale(t))
        .attr("stroke-width", 2.8)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.82);

      await animatePath(path, runId);
    }
  })();
}

// =============================================
// 3. NUMEROLOGY
// =============================================

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

// =============================================
// 4. UPDATE ALL RESULTS
// =============================================

function update() {
  const rawName = input.value;
  const letters = getLetters(rawName);

  const values = [...letters].map(letterValue);

  const sum = values.reduce((total, value) => total + value, 0);

  const root = getDigitalRoot(sum);
  const factors = getPrimeFactors(sum);

  const distinctFactors = [...new Set(factors)];

  // Total letter value
  document.getElementById("sumValue").textContent = sum;

  document.getElementById("sumDetail").textContent = values.length
    ? values.join(" + ")
    : "Noch keine Buchstaben";

  // Digital root
  document.getElementById("rootValue").textContent = root.value;

  document.getElementById("rootDetail").textContent =
    root.steps.length > 1
      ? root.steps.join(" → ")
      : "Keine weitere Reduktion nötig";

  // Scrabble score
  document.getElementById("scrabbleValue").textContent =
    getScrabbleScore(rawName);

  document.getElementById("scrabbleDetail").textContent =
    "Summe im deutschen Scrabble";

  // Prime factors
  document.getElementById("primeValue").textContent = distinctFactors.length
    ? distinctFactors.join(", ")
    : "Keine";

  document.getElementById("factorDetail").textContent =
    sum < 2
      ? "Für Werte unter 2 gibt es keine Primfaktorzerlegung."
      : `${sum} = ${factors.join(" × ")}`;

  // Individual letter values
  document.getElementById("letterDetails").textContent = letters
    ? [...letters]
        .map((letter) => `${letter} = ${letterValue(letter)}`)
        .join(" · ")
    : "Gib einen Namen ein, um die Buchstabenwerte zu sehen.";

  // Numerology meaning
  updateNumerology(sum, root);

  // Visualization
  renderVisualization(letters);
}

// =============================================
// 5. DARK MODE
// =============================================

function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);

  themeToggle.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";

  try {
    localStorage.setItem("alphabet-arcs-theme", dark ? "dark" : "light");
  } catch (error) {
    // The page also works when localStorage is blocked.
  }

  // Re-render the visualization with the updated theme colors.
  renderVisualization(getLetters(input.value));
}

themeToggle.addEventListener("click", () => {
  applyTheme(!document.body.classList.contains("dark"));
});

// =============================================
// 6. VISUALIZATION TOGGLE BUTTON
// =============================================

if (visualizationToggle) {
  visualizationToggle.addEventListener("click", () => {
    visualizationMode =
      visualizationMode === "linear" ? "circle" : "linear";

    const container = document.getElementById("visualization");
    const metrics = document.querySelector(".metrics");
    const isCircular = visualizationMode === "circle";

    if (container) {
      container.classList.toggle("circular-mode", isCircular);
    }

    if (metrics) {
      metrics.classList.toggle("metrics-hidden", isCircular);
    }

    renderVisualization(getLetters(input.value));
  });
}

// =============================================
// 7. INPUT EVENTS
// =============================================

// Clear the input when the user focuses on it.
input.addEventListener("focus", () => {
  input.value = "";
});

// Update all results when the name changes.
input.addEventListener("input", update);

// =============================================
// 8. RESTORE THEME AND INITIALIZE
// =============================================

let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("alphabet-arcs-theme") || "light";
} catch (error) {
  // Use light mode if localStorage is unavailable.
}

document.body.classList.toggle("dark", savedTheme === "dark");

themeToggle.textContent =
  savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

// Initial render
update();
