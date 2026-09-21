const STORAGE_KEY = "saraHelpDeskTickets";

const ticketForm = document.querySelector("#ticket-form");
const ticketList = document.querySelector("#ticket-list");
const emptyState = document.querySelector("#empty-state");
const statusFilter = document.querySelector("#status-filter");
const formMessage = document.querySelector("#form-message");

const totalCount = document.querySelector("#total-count");
const openCount = document.querySelector("#open-count");
const progressCount = document.querySelector("#progress-count");
const resolvedCount = document.querySelector("#resolved-count");

let tickets = loadTickets();

function loadTickets() {
  try {
    const savedTickets = localStorage.getItem(STORAGE_KEY);
    return savedTickets ? JSON.parse(savedTickets) : [];
  } catch (error) {
    console.error("Unable to load saved tickets:", error);
    return [];
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function generateTicketNumber() {
  const timestamp = Date.now().toString().slice(-6);
  return `HD-${timestamp}`;
}

function calculatePriority(impact, urgency) {
  const score = Number(impact) + Number(urgency);

  if (score >= 5) {
    return "High";
  }

  if (score >= 3) {
    return "Medium";
  }

  return "Low";
}

function createTicket(event) {
  event.preventDefault();

  const formData = new FormData(ticketForm);

  const ticket = {
    id: generateTicketNumber(),
    requester: formData.get("requester").trim(),
    department: formData.get("department"),
    category: formData.get("category"),
    impact: Number(formData.get("impact")),
    urgency: Number(formData.get("urgency")),
    description: formData.get("description").trim(),
    priority: calculatePriority(
      formData.get("impact"),
      formData.get("urgency")
    ),
    status: "Open",
    createdAt: new Date().toISOString()
  };

  tickets.unshift(ticket);
  saveTickets();
  ticketForm.reset();

  formMessage.textContent =
    `${ticket.id} was created with ${ticket.priority} priority.`;

  renderTickets();
}

function createTableCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusSelect(ticket) {
  const select = document.createElement("select");
  select.className = "status-select";
  select.setAttribute("aria-label", `Update status for ${ticket.id}`);

  ["Open", "In Progress", "Resolved"].forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = ticket.status === status;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    updateTicketStatus(ticket.id, select.value);
  });

  return select;
}

function createDeleteButton(ticket) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "delete-button";
  button.textContent = "Delete";
  button.setAttribute("aria-label", `Delete ticket ${ticket.id}`);

  button.addEventListener("click", () => {
    deleteTicket(ticket.id);
  });

  return button;
}

function renderTickets() {
  ticketList.textContent = "";

  const selectedStatus = statusFilter.value;

  const visibleTickets = tickets.filter((ticket) => {
    return selectedStatus === "All" || ticket.status === selectedStatus;
  });

  visibleTickets.forEach((ticket) => {
    const row = document.createElement("tr");
    row.title = ticket.description;

    row.appendChild(createTableCell(ticket.id));

    const requesterCell = document.createElement("td");
    const requesterName = document.createElement("strong");
    const department = document.createElement("small");

    requesterName.textContent = ticket.requester;
    department.textContent = ticket.department;
    department.style.display = "block";
    department.style.color = "#aebbd0";

    requesterCell.appendChild(requesterName);
    requesterCell.appendChild(department);
    row.appendChild(requesterCell);

    row.appendChild(createTableCell(ticket.category));

    const priorityCell = document.createElement("td");
    const priorityBadge = document.createElement("span");

    priorityBadge.className =
      `priority priority-${ticket.priority.toLowerCase()}`;
    priorityBadge.textContent = ticket.priority;

    priorityCell.appendChild(priorityBadge);
    row.appendChild(priorityCell);

    const statusCell = document.createElement("td");
    statusCell.appendChild(createStatusSelect(ticket));
    row.appendChild(statusCell);

    row.appendChild(
      createTableCell(new Date(ticket.createdAt).toLocaleString())
    );

    const actionCell = document.createElement("td");
    actionCell.appendChild(createDeleteButton(ticket));
    row.appendChild(actionCell);

    ticketList.appendChild(row);
  });

  emptyState.hidden = visibleTickets.length > 0;

  updateDashboard();
}

function updateTicketStatus(ticketId, newStatus) {
  tickets = tickets.map((ticket) => {
    if (ticket.id === ticketId) {
      return { ...ticket, status: newStatus };
    }

    return ticket;
  });

  saveTickets();
  renderTickets();
}

function deleteTicket(ticketId) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${ticketId}?`
  );

  if (!confirmed) {
    return;
  }

  tickets = tickets.filter((ticket) => ticket.id !== ticketId);
  saveTickets();
  renderTickets();
}

function updateDashboard() {
  totalCount.textContent = tickets.length;

  openCount.textContent = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  progressCount.textContent = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  resolvedCount.textContent = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;
}

ticketForm.addEventListener("submit", createTicket);
statusFilter.addEventListener("change", renderTickets);

renderTickets();
