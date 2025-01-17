const env = "prod";

const devurl = "http://localhost:3000";
const produrl = "https://twh-helper.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("container");
  container.style.display = "none"; // Don't show the main content yet
  const loading = document.getElementById("loading");

  const selectElement = document.getElementById("doc-select");
  const contentDiv = document.getElementById("doc-content");
  // Create the button element
  const calculateHPButton = document.createElement("button");
  calculateHPButton.id = "calcular-hp";
  calculateHPButton.classList.add("buttons");
  calculateHPButton.textContent = "Calcular HP dos chars";
  calculateHPButton.addEventListener("click", async () => {
    calcularHP();
  });
  // Append the button to the container
  container.appendChild(calculateHPButton);

  async function getPlayerNames() {
    try {
      const response =
        env == "prod"
          ? await fetch(`${produrl}/googleDocs/names`)
          : await fetch(`${devurl}/googleDocs/names`);
      console.log("response 1 :>> ", response);
      if (!response.ok) throw new Error("Failed to fetch document names");
      const names = await response.json();
      localStorage.setItem("playerNames", names);

      // Populate the select element
      names.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        selectElement.appendChild(option);
      });

      loading.style.display = "none"; // Hide the loading animation
      container.style.display = "block"; // Show the main content
    } catch (error) {
      contentDiv.textContent = "Error loading document names: " + error.message;
    }
  }

  // Fetch and display content of the selected document
  async function getCharsByPlayer(name) {
    try {
      const response =
        env == "prod"
          ? await fetch(`${produrl}/googleDocs/names/${name}`)
          : await fetch(`${devurl}/googleDocs/names/${name}`);
      console.log("response 2 :>> ", response);
      if (!response.ok) throw new Error("Failed to fetch document content");
      const data = await response.json();
      localStorage.setItem("playersChars", JSON.stringify(data.chars));

      const playerBank = document.createElement("div");
      playerBank.classList.add("player-bank");

      const playerPoints = document.createElement("p");
      playerPoints.textContent = "Pontos: " + data.playerPoints;
      const dracmas = document.createElement("p");
      dracmas.textContent = "Dracmas: " + data.dracmas;
      const kleos = document.createElement("p");
      kleos.textContent = "Kleos: " + data.kleos;

      playerBank.appendChild(playerPoints);
      playerBank.appendChild(dracmas);
      playerBank.appendChild(kleos);

      contentDiv.appendChild(playerBank);

      const playersChars = document.createElement("div");

      const charList = document.createElement("ul");
      data.chars.forEach((char) => {
        const charElem = document.createElement("li");
        charElem.textContent = `${char.name} - ${char.god} - Nível ${char.level}`;
        charList.appendChild(charElem);
      });

      playersChars.appendChild(charList);
      contentDiv.appendChild(playersChars);
      playersChars.classList.add("chars-list");
    } catch (error) {
      contentDiv.textContent =
        "Error loading document content: " + error.message;
    }
  }

  function updateCharListWithHP(chars) {
    // Select the list container
    const charList = document.querySelector(".chars-list ul");
    if (!charList) {
      console.error("Character list not found.");
      return;
    }

    // Update each <li> with the corresponding char.hp value
    const listItems = charList.querySelectorAll("li");
    chars.forEach((char, index) => {
      if (listItems[index]) {
        // Update text content to include char.hp
        listItems[
          index
        ].textContent = `${char.name} - ${char.god} - Nível ${char.level} - HP: ${char.hp}`;
      }
    });
  }

  async function calcularHP() {
    try {
      const originalText = calculateHPButton.textContent;
      // Show loading animation
      calculateHPButton.disabled = true;
      calculateHPButton.textContent = "Calculando...";
      calculateHPButton.classList.add("loading");

      const name = selectElement.value;
      if (!name) {
        alert("Selecione um player");
        // Remove loading animation
        calculateHPButton.disabled = false;
        calculateHPButton.textContent = originalText;
        calculateHPButton.classList.remove("loading");
      } else {
        let chars = localStorage.getItem("playersChars");
        chars = JSON.parse(chars);

        if (!chars || chars.length == 0) {
          const response =
            env == "prod"
              ? await fetch(`${produrl}/googleDocs/names/${name}`)
              : await fetch(`${devurl}/googleDocs/names/${name}`);
          if (!response.ok) throw new Error("Failed to fetch document content");
          const data = await response.json();
          chars = data.chars;
        }

        // Send POST request to calculate HP
        const hpResponse =
          env == "prod"
            ? await fetch(`${produrl}/googleDocs/chars/calculate-hp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ chars }),
              })
            : await fetch(`${devurl}/googleDocs/chars/calculate-hp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ chars }),
              });

        if (!hpResponse.ok) throw new Error("Failed to calculate HP");

        const result = await hpResponse.json();
        localStorage.setItem("playersChars", JSON.stringify(result));

        updateCharListWithHP(result);

        // Create the simulate evolution button
        const simulateEvolution = document.createElement("button");
        simulateEvolution.id = "simulate-evolution";
        simulateEvolution.classList.add("buttons");
        simulateEvolution.classList.add("simulate-evolution");
        simulateEvolution.textContent = "Simular evolução";
        simulateEvolution.addEventListener("click", async () => {
          simularEvolucao();
        });
        // Append the button to the container
        container.appendChild(simulateEvolution);

        // Remove loading animation
        calculateHPButton.disabled = false;
        calculateHPButton.textContent = originalText;
        calculateHPButton.classList.remove("loading");

        calculateHPButton.disabled = true;
      }
    } catch (error) {
      console.error("Error calculating HP:", error.message);
      alert("Error: " + error.message);
    }
  }

  function extractConsValue(atributos) {
    const consIndex = atributos.findIndex((atri) => atri == "CONSTITUIÇÃO\n");
    let cons = atributos[consIndex + 1];
    let consAdd = "0";
    if (cons && cons.includes(" ")) {
      [cons, consAdd] = cons.split(" ");
      consAdd = consAdd.split("(")[1].split(")")[0];
    }
    return Number(cons) + Number(consAdd);
  }

  function simular(chars) {
    chars = chars.map((char) => {
      const cons = extractConsValue(char.atributos);
      const base = (10 + cons) * 2;
      const nivel = char.level * (5 + cons);

      return { ...char, hpSimulated: base + nivel + char.vigor };
    });

    return chars;
  }

  async function simularEvolucao() {
    let chars = localStorage.getItem("playersChars");
    chars = JSON.parse(chars);

    if (!chars || chars.length == 0) {
      const response =
        env == "prod"
          ? await fetch(`${produrl}/googleDocs/names/${name}`)
          : await fetch(`${devurl}/googleDocs/names/${name}`);
      if (!response.ok) throw new Error("Failed to fetch document content");
      const data = await response.json();
      chars = data.chars;
    }

    chars = simular(chars);

    // colocar para aparecer na linha debaixo
    // Select the list container
    const charList = document.querySelector(".chars-list ul");
    if (!charList) {
      console.error("Character list not found.");
      return;
    }

    // Update each <li> adding simulation
    const listItems = charList.querySelectorAll("li");
    chars.forEach((char, index) => {
      if (listItems[index]) {
        listItems[index].textContent = "";

        // Create container div
        const container = document.createElement("div");

        // Create first paragraph
        const para1 = document.createElement("p");
        para1.textContent = `${char.name} - ${char.god} - Nível ${char.level} - HP: ${char.hp}`;

        // Create second paragraph with editable CONS
        const para2 = document.createElement("p");
        para2.textContent = `Próximo nível: ${char.level + 1} - CONS: `;

        // Add HP information text node
        const hpInfo = document.createTextNode(` - HP: ${char.hpSimulated}`);

        // Create input for CONS
        const consInput = document.createElement("input");
        consInput.type = "number";
        consInput.value = extractConsValue(char.atributos);
        consInput.style.width = "30px";
        consInput.addEventListener("input", (e) => {
          // Update cons value as the user edits
          const newCons = parseInt(e.target.value, 10) || 0; // Default to 0 if input is invalid

          const base = (10 + newCons) * 2;
          const nivel = char.level * (5 + newCons);

          char.hpSimulated = base + nivel + char.vigor;

          // Update the HP info text node
          hpInfo.nodeValue = ` - HP: ${char.hpSimulated}`;
        });

        // Append input and text to para2
        para2.appendChild(consInput);
        para2.appendChild(hpInfo);

        // Append paragraphs to the container
        container.appendChild(para1);
        container.appendChild(para2);

        // Append the container to the <li>
        listItems[index].appendChild(container);
      }
    });
  }

  // Add event listener for selection change
  selectElement.addEventListener("change", (event) => {
    const selectedName = event.target.value;
    calculateHPButton.disabled = false;
    const simulateEvolution = document.getElementById("simulate-evolution");
    console.log("simulateEvolution :>> ", simulateEvolution);
    if (simulateEvolution) simulateEvolution.remove();

    if (selectedName) {
      contentDiv.textContent = "";
      getCharsByPlayer(selectedName);
    } else {
      contentDiv.textContent = "";
    }
  });

  // Initialize
  getPlayerNames();
});
