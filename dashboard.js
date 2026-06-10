const client = supabase.createClient(
"https://nnwfhnrpkdoqianaaemn.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud2ZobnJwa2RvcWlhbmFhZW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTExNjAsImV4cCI6MjA5NTk2NzE2MH0.HE-007YogxoKFh3yyzocUNTPuvg5I-g_JcglGAXFvBk"
);


// ======================
// AUTH CHECK
// ======================

async function checkAuth() {

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  loadReports();
}

// ======================
// GLOBAL STATE
// ======================

let reports = [];

// ======================
// LOAD REPORTS
// ======================

async function loadReports() {

  try {

    const { data, error } =
      await client
        .from("reports")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) throw error;

    reports = data || [];

    updateStats();
    renderReports(reports);

  } catch (error) {

    console.error(error);
    alert("Failed to load reports.");
  }
}

// ======================
// STATS
// ======================

function updateStats() {

  document.getElementById("totalReports").textContent =
    reports.length;

  document.getElementById("pendingReports").textContent =
    reports.filter(r => (r.status || "Pending") === "Pending").length;

  document.getElementById("investigatingReports").textContent =
    reports.filter(r => r.status === "Investigating").length;

  document.getElementById("resolvedReports").textContent =
    reports.filter(r => r.status === "Resolved").length;
}

// ======================
// UPDATE STATUS
// ======================

async function updateStatus(reportId, newStatus) {

  try {

    const { error } =
      await client
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

    if (error) throw error;

    loadReports();

  } catch (error) {

    console.error(error);
    alert("Failed to update status.");
  }
}

window.updateStatus = updateStatus;

// ======================
// RENDER REPORTS
// ======================

function renderReports(data) {

  const table =
    document.getElementById("reportTable");

  table.innerHTML = "";

  if (!data || data.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="6">No reports found</td>
      </tr>
    `;

    return;
  }

  data.forEach(report => {

    table.innerHTML += `
      <tr>

        <td>${report.incident_type || "-"}</td>

        <td>${report.description || "-"}</td>

        <td>${report.location_name || "Unknown Location"}</td>

        <td>
          <span class="status ${(report.status || "Pending").toLowerCase()}">
            ${report.status || "Pending"}
          </span>
        </td>

        <td>

          <select onchange="updateStatus(${report.id}, this.value)">

            <option value="Pending" ${(report.status || "Pending") === "Pending" ? "selected" : ""}>
              Pending
            </option>

            <option value="Investigating" ${report.status === "Investigating" ? "selected" : ""}>
              Investigating
            </option>

            <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>
              Resolved
            </option>

          </select>

        </td>

        <td>
          ${
            report.image_url
              ? `<img src="${report.image_url}" class="report-image"
                  onclick="window.open('${report.image_url}','_blank')">`
              : "No Image"
          }
        </td>

      </tr>
    `;
  });
}

// ======================
// SEARCH
// ======================

document.getElementById("searchInput")
.addEventListener("input", function () {

  const search = this.value.toLowerCase();

  const filtered = reports.filter(report =>
    (report.incident_type || "").toLowerCase().includes(search) ||
    (report.description || "").toLowerCase().includes(search) ||
    (report.location_name || "").toLowerCase().includes(search)
  );

  renderReports(filtered);
});

// ======================
// FILTER STATUS
// ======================

document.getElementById("statusFilter")
.addEventListener("change", function () {

  const status = this.value;

  if (!status) {
    renderReports(reports);
    return;
  }

  const filtered = reports.filter(
    r => (r.status || "Pending") === status
  );

  renderReports(filtered);
});

// ======================
// LOGOUT
// ======================

async function logout() {

  await client.auth.signOut();

  window.location.href = "login.html";
}

window.logout = logout;

// ======================
// REALTIME UPDATES
// ======================

client
.channel("reports-channel")
.on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "reports"
  },
  () => {
    loadReports();
  }
)
.subscribe();

// ======================
// START APP
// ======================

checkAuth();