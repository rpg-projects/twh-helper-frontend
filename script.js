document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("doc-select");
  const contentDiv = document.getElementById("doc-content");

  const devurl = "http://localhost:3000";
  const produrl = "https://twh-helper.onrender.com";

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

  // Add event listener for selection change
  selectElement.addEventListener("change", (event) => {
    const selectedName = event.target.value;
    if (selectedName) {
      contentDiv.textContent = "";
      fetchDocumentContent(selectedName);
    } else {
      contentDiv.textContent = "";
    }
  });

  // Initialize
  fetchDocumentNames();
});
