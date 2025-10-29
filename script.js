const SHEET_DATA_URL = "https://script.google.com/macros/s/AKfycbxdR4dEiKDWG2ESA5lfvTWax4S7WllCjv3NhbhAEJCoxFITVdEFGruHiv_auoAB83_C/exec"; // Replace with your deployed Apps Script URL
let data = [];
let currentPage = 1;
const rowsPerPage = 10;

const table = document.getElementById('dataTable');
const chartCanvas = document.getElementById('dataChart');
const searchInput = document.getElementById('searchInput');

window.onload = function () {
  fetch(SHEET_DATA_URL)
    .then(res => res.json())
    .then(json => {
      data = json;
      renderTable();
      renderChart();
    })
    .catch(err => console.error('Failed to load sheet data:', err));
};

searchInput.addEventListener('input', function () {
  currentPage = 1;
  renderTable(this.value.toLowerCase());
});

document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(searchInput.value.toLowerCase());
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  currentPage++;
  renderTable(searchInput.value.toLowerCase());
});

function renderTable(filter = '') {
  table.innerHTML = '';
  const seen = new Set();

  const filteredData = data.filter(item => {
    const values = [
      item.Serial,
      item.Zone,
      item.Schoolid,
      item.Date,
      item.Complaints
    ].map(v => String(v).toLowerCase());
    return values.some(v => v.includes(filter));
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((item, index) => {
    const key = `${item.Serial}-${item.Schoolid}`;
    const isDuplicate = seen.has(key);
    seen.add(key);

    const row = document.createElement('tr');
    if (isDuplicate) row.classList.add('duplicate');

    row.innerHTML = `
      <td><input value="${item.Serial}" onchange="updateField(${start + index}, 'Serial', this.value)"></td>
      <td><input value="${item.Zone}" onchange="updateField(${start + index}, 'Zone', this.value)"></td>
      <td><input value="${item.Schoolid}" onchange="updateField(${start + index}, 'Schoolid', this.value)"></td>
      <td><input value="${item.Date}" onchange="updateField(${start + index}, 'Date', this.value)"></td>
      <td><input value="${item.Complaints}" onchange="updateField(${start + index}, 'Complaints', this.value)"></td>
      <td>
        <button onclick="editRow(${start + index})">Edit</button>
        <button class="update" onclick="renderChart()">Update</button>
      </td>
    `;
    table.appendChild(row);
  });

  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function updateField(index, field, value) {
  data[index][field] = value;
  sendToGoogleSheet(data[index]);
}

function editRow(index) {
  alert(`Editing row ${index + 1}. You can now modify the fields.`);
}

function renderChart() {
  const ctx = chartCanvas.getContext('2d');
  if (window.myChart) window.myChart.destroy();

  const zoneCounts = {};
  data.forEach(item => {
    const zone = item.Zone;
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });

  const labels = Object.keys(zoneCounts);
  const values = Object.values(zoneCounts);

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Complaints per Zone',
        data: values,
        backgroundColor: 'rgba(0, 119, 204, 0.6)'
      }]
    }
  });
}

function sendToGoogleSheet(entry) {
  fetch("https://script.google.com/macros/s/AKfycbxdR4dEiKDWG2ESA5lfvTWax4S7WllCjv3NhbhAEJCoxFITVdEFGruHiv_auoAB83_C/exec", {
    method: 'POST',
    body: JSON.stringify(entry),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.text())
  .then(msg => console.log('Sheet response:', msg))
  .catch(err => console.error('Sheet error:', err));
}
