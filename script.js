document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("container");
  const selectElement = document.getElementById("doc-select");
  const contentDiv = document.getElementById("doc-content");

  const devurl = "http://localhost:3000";
  const produrl = "https://twh-helper.onrender.com";
  // activateDeploy

  async function fetchDocumentNames() {
    try {
      const response = await fetch(`${produrl}/googleDocs/names`);
      if (!response.ok) throw new Error("Failed to fetch document names");
      const names = await response.json();

      // Populate the select element
      names.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        selectElement.appendChild(option);
      });
    } catch (error) {
      contentDiv.textContent = "Error loading document names: " + error.message;
    }
  }

  // Fetch and display content of the selected document
  async function fetchDocumentContent(name) {
    try {
      const response = await fetch(`${produrl}/googleDocs/names/${name}`);
      if (!response.ok) throw new Error("Failed to fetch document content");
      const data = await response.json();

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
        charElem.textContent = `${char.char} - ${char.god} - Nível ${char.level}`;
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
        ].textContent = `${char.char} - ${char.god} - Nível ${char.level} - HP: ${char.hp}`;
      }
    });
  }

  async function calcularHP() {
    try {
      const calculateHPButton = document.getElementById("calcular-hp");
      const originalText = calculateHPButton.textContent;
      // Show loading animation
      calculateHPButton.disabled = true;
      calculateHPButton.textContent = "Calculando...";
      calculateHPButton.classList.add("loading");

      const name = selectElement.value;

      const response = await fetch(`${produrl}/googleDocs/names/${name}`);
      if (!response.ok) throw new Error("Failed to fetch document content");
      const data = await response.json();

      const chars = data.chars; // Extract chars array from the response

      // Send POST request to calculate HP
      const hpResponse = await fetch(
        `${produrl}/googleDocs/chars/calculate-hp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chars }),
        }
      );

      if (!hpResponse.ok) throw new Error("Failed to calculate HP");

      const result = await hpResponse.json();
      updateCharListWithHP(result);
      // Remove loading animation
      calculateHPButton.disabled = false;
      calculateHPButton.textContent = originalText;
      calculateHPButton.classList.remove("loading");
    } catch (error) {
      console.error("Error calculating HP:", error.message);
      alert("Error: " + error.message);
    }
  }

  // Add event listener for selection change
  selectElement.addEventListener("change", (event) => {
    const selectedName = event.target.value;

    if (selectedName) {
      contentDiv.textContent = "";
      fetchDocumentContent(selectedName);

      const calculateHPButton = document.getElementById("calcular-hp");
      if (!calculateHPButton) {
        // Create the button element
        const button = document.createElement("button");
        button.id = "calcular-hp";
        button.textContent = "Calcular HP dos chars";
        button.addEventListener("click", async () => {
          calcularHP();
        });
      }

      // Append the button to the container
      container.appendChild(button);
    } else {
      contentDiv.textContent = "";
    }
  });

  // Initialize
  fetchDocumentNames();
});
