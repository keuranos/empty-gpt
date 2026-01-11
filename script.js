const reminderForm = document.getElementById("reminder-form");
const emailPreview = document.getElementById("email-preview");
const copyButton = document.getElementById("copy-button");
const copyStatus = document.getElementById("copy-status");
const clientTable = document.getElementById("client-table");
const priceInput = document.getElementById("price");
const clientsInput = document.getElementById("clients");
const mrrOutput = document.getElementById("mrr");
const hoursOutput = document.getElementById("hours");

const STORAGE_KEY = "invoice-nudge-clients";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const renderClients = (clients) => {
  clientTable.innerHTML = "";

  if (!clients.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5" class="muted">No clients saved yet.</td>';
    clientTable.appendChild(row);
    return;
  }

  clients.forEach((client) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${client.name}</td>
      <td>${client.email}</td>
      <td>${formatter.format(client.amount)}</td>
      <td>${client.due}</td>
      <td><button class="secondary" data-email="${client.email}">Copy</button></td>
    `;
    clientTable.appendChild(row);
  });
};

const loadClients = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to load clients", error);
    return [];
  }
};

const saveClients = (clients) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
};

const buildReminder = ({ name, amount, due, link }) => {
  return `Hi ${name},\n\nJust a friendly reminder that invoice (${formatter.format(
    amount
  )}) was due on ${due}. If it already went through, please ignore this note.\n\nYou can pay here: ${link}\n\nThanks so much,\n[Your Name]`;
};

const updateRevenue = () => {
  const price = Number(priceInput.value);
  const clients = Number(clientsInput.value);
  const mrr = price * clients;
  const hours = Math.max(1, Math.round((clients * 5) / 60));

  mrrOutput.textContent = formatter.format(mrr);
  hoursOutput.textContent = `~${hours} hr${hours > 1 ? "s" : ""}`;
};

const updatePreview = (data) => {
  emailPreview.textContent = buildReminder(data);
};

const syncCopyStatus = (message) => {
  copyStatus.textContent = message;
  setTimeout(() => {
    copyStatus.textContent = "";
  }, 2000);
};

reminderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(reminderForm);
  const client = {
    name: formData.get("client"),
    email: formData.get("email"),
    amount: Number(formData.get("amount")),
    due: formData.get("due"),
    link: formData.get("link"),
  };

  updatePreview(client);

  const clients = loadClients();
  clients.unshift(client);
  saveClients(clients);
  renderClients(clients);

  reminderForm.reset();
  syncCopyStatus("Reminder generated and client saved.");
});

copyButton.addEventListener("click", async () => {
  const text = emailPreview.textContent;
  if (!text || text.includes("Fill out")) {
    syncCopyStatus("Generate a reminder first.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    syncCopyStatus("Copied to clipboard.");
  } catch (error) {
    syncCopyStatus("Copy failed. Please copy manually.");
  }
});

clientTable.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLButtonElement)) {
    return;
  }

  const email = event.target.dataset.email;
  if (!email) {
    return;
  }

  try {
    await navigator.clipboard.writeText(email);
    syncCopyStatus("Client email copied.");
  } catch (error) {
    syncCopyStatus("Copy failed.");
  }
});

priceInput.addEventListener("input", updateRevenue);
clientsInput.addEventListener("input", updateRevenue);

const init = () => {
  renderClients(loadClients());
  updateRevenue();
};

init();

const scrollButtons = document.querySelectorAll("[data-scroll]");
scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.scroll;
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
