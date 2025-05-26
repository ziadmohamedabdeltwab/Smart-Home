const CHANNEL_ID_1 = 2972346; // الرقم الصحيح للقناة
const CHANNEL_ID_2 = 2972346; // نفس القناة لـ LDR
const API_KEY_1 = "PN4LQP0M8HOKCYVH";
const API_KEY_2 = "OW98YIINEITU8MO1";

// ========== ROOM DATA ==========
async function fetchSensor(channelId, field, elementId, apiKey) {
  const url = `https://api.thingspeak.com/channels/${channelId}/fields/${field}/last.json?api_key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    document.getElementById(elementId).textContent = data[`field${field}`] || "--";
  } catch (err) {
    document.getElementById(elementId).textContent = "Error";
  }
}

function loadRoomData() {
  fetchSensor(CHANNEL_ID_1, 1, "master-temp", API_KEY_1);
  fetchSensor(CHANNEL_ID_1, 2, "master-presence", API_KEY_1);
  fetchSensor(CHANNEL_ID_2, 5, "master-light", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 6, "master-maint", API_KEY_2);

  fetchSensor(CHANNEL_ID_1, 3, "kids-temp", API_KEY_1);
  fetchSensor(CHANNEL_ID_1, 4, "kids-presence", API_KEY_1);
  fetchSensor(CHANNEL_ID_2, 5, "kids-light", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 6, "kids-maint", API_KEY_2);

  fetchSensor(CHANNEL_ID_1, 5, "guest-temp", API_KEY_1);
  fetchSensor(CHANNEL_ID_1, 6, "guest-presence", API_KEY_1);
  fetchSensor(CHANNEL_ID_2, 5, "guest-light", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 6, "guest-maint", API_KEY_2);

  fetchSensor(CHANNEL_ID_2, 1, "living-temp", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 5, "living-light", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 6, "living-maint", API_KEY_2);

  fetchSensor(CHANNEL_ID_2, 2, "kitchen-smoke", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 5, "kitchen-light", API_KEY_2);
  fetchSensor(CHANNEL_ID_2, 6, "kitchen-maint", API_KEY_2);
}

// ========== DASHBOARD ==========
const dashboardFields = [
  { label: "Master Temp", channel: CHANNEL_ID_1, field: 1, apiKey: API_KEY_1 },
  { label: "Master Smoke", channel: CHANNEL_ID_2, field: 2, apiKey: API_KEY_2 },
  { label: "Kids Temp", channel: CHANNEL_ID_1, field: 3, apiKey: API_KEY_1 },
  { label: "Guest Temp", channel: CHANNEL_ID_1, field: 5, apiKey: API_KEY_1 },
  { label: "Living Temp", channel: CHANNEL_ID_2, field: 1, apiKey: API_KEY_2 },
  { label: "Kitchen Smoke", channel: CHANNEL_ID_2, field: 2, apiKey: API_KEY_2 }
];

async function fetchFieldData(channelId, field, apiKey) {
  const url = `https://api.thingspeak.com/channels/${channelId}/fields/${field}/last.json?api_key=${apiKey}`;
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
    const result = await fetchFieldData(item.channel, item.field, item.apiKey);
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

// ========== LDR ==========
async function fetchLDR(field, elementId) {
  const url = `https://api.thingspeak.com/channels/${CHANNEL_ID_2}/fields/${field}/last.json?api_key=${API_KEY_2}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    document.getElementById(elementId).textContent = data[`field${field}`] || "--";
  } catch (err) {
    document.getElementById(elementId).textContent = "Error";
  }
}

// ========== LOAD ==========
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
