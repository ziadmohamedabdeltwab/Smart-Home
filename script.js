const CHANNEL_1 = "PN4LQP0M8HOKCYVH";
const CHANNEL_2 = "OW98YIINEITU8MO1";

// ========== ROOM DATA ==========
async function fetchSensor(channelKey, field, elementId) {
  const url = `https://api.thingspeak.com/channels/${channelKey}/fields/${field}/last.json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    document.getElementById(elementId).textContent = data[`field${field}`] || "--";
  } catch (err) {
    document.getElementById(elementId).textContent = "Error";
  }
}

function loadRoomData() {
  fetchSensor(CHANNEL_1, 1, "master-temp");
  fetchSensor(CHANNEL_1, 2, "master-presence");
  fetchSensor(CHANNEL_2, 5, "master-light");
  fetchSensor(CHANNEL_2, 6, "master-maint");

  fetchSensor(CHANNEL_1, 3, "kids-temp");
  fetchSensor(CHANNEL_1, 4, "kids-presence");
  fetchSensor(CHANNEL_2, 5, "kids-light");
  fetchSensor(CHANNEL_2, 6, "kids-maint");

  fetchSensor(CHANNEL_1, 5, "guest-temp");
  fetchSensor(CHANNEL_1, 6, "guest-presence");
  fetchSensor(CHANNEL_2, 5, "guest-light");
  fetchSensor(CHANNEL_2, 6, "guest-maint");

  fetchSensor(CHANNEL_2, 1, "living-temp");
  fetchSensor(CHANNEL_2, 5, "living-light");
  fetchSensor(CHANNEL_2, 6, "living-maint");

  fetchSensor(CHANNEL_2, 2, "kitchen-smoke");
  fetchSensor(CHANNEL_2, 5, "kitchen-light");
  fetchSensor(CHANNEL_2, 6, "kitchen-maint");
}

// ========== DASHBOARD DATA ==========
const dashboardFields = [
  { label: "Master Temp", channel: CHANNEL_1, field: 1 },
  { label: "Master Smoke", channel: CHANNEL_2, field: 2 },
  { label: "Kids Temp", channel: CHANNEL_1, field: 3 },
  { label: "Guest Temp", channel: CHANNEL_1, field: 5 },
  { label: "Living Temp", channel: CHANNEL_2, field: 1 },
  { label: "Kitchen Smoke", channel: CHANNEL_2, field: 2 }
];

async function fetchFieldData(channel, field) {
  const url = `https://api.thingspeak.com/channels/${channel}/fields/${field}/last.json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return {
      value: data[`field${field}`],
      date: data.created_at
    };
  } catch {
    return { value: "Error", date: "N/A" };
  }
}

async function loadDashboardData() {
  const dataList = document.getElementById("data-list");
  if (!dataList) return;

  dataList.innerHTML = "";

  const labels = [];
  const tempValues = [];
  const smokeValues = [];

  for (const item of dashboardFields) {
    const result = await fetchFieldData(item.channel, item.field);
    const listItem = document.createElement("li");
    listItem.textContent = `${item.label}: ${result.value} (at ${new Date(result.date).toLocaleString()})`;
    dataList.appendChild(listItem);

    labels.push(item.label);
    if (item.label.includes("Temp")) {
      tempValues.push(parseFloat(result.value));
      smokeValues.push(0);
    } else {
      smokeValues.push(parseFloat(result.value));
      tempValues.push(0);
    }
  }

  renderChart(labels, tempValues, smokeValues);
}

function renderChart(labels, tempData, smokeData) {
  const ctx = document.getElementById("chart");
  if (!ctx) return;

  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: tempData,
          backgroundColor: "#007bff"
        },
        {
          label: "Smoke (ppm)",
          data: smokeData,
          backgroundColor: "#ff5252"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Smart Home Dashboard Summary", 10, 10);

  const items = document.querySelectorAll("#data-list li");
  items.forEach((li, i) => {
    pdf.text(li.textContent, 10, 20 + i * 10);
  });

  pdf.save("smart-home-dashboard.pdf");
}

// ========== LDR PAGE ==========
async function fetchLDR(field, elementId) {
  const url = `https://api.thingspeak.com/channels/${CHANNEL_2}/fields/${field}/last.json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    document.getElementById(elementId).textContent = data[`field${field}`] || "--";
  } catch (err) {
    document.getElementById(elementId).textContent = "Error";
  }
}

// ========== PAGE LOADING ==========
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (document.getElementById("master-temp")) {
    loadRoomData();
    setInterval(loadRoomData, 15000);
  }

  if (path.includes("dashboard.html")) {
    loadDashboardData();
    setInterval(loadDashboardData, 15000);
  }

  if (path.includes("ldr.html")) {
    fetchLDR(3, "ldr1");
    fetchLDR(4, "ldr2");
    setInterval(() => {
      fetchLDR(3, "ldr1");
      fetchLDR(4, "ldr2");
    }, 15000);
  }
});
