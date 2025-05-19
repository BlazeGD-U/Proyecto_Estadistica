document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    processCSV(text);
  };
  reader.readAsText(file);
}

function processCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data = lines.slice(1).map(line => line.split(',').map(Number));

  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = "";

  headers.forEach((header, colIdx) => {
    const columnData = data.map(row => row[colIdx]);
    const stats = calculateStats(columnData);
    outputDiv.innerHTML += `
      <h3>${header}</h3>
      <ul>
        <li>Media: ${stats.media.toFixed(2)}</li>
        <li>Mediana: ${stats.mediana.toFixed(2)}</li>
        <li>Moda: ${stats.moda.join(', ')}</li>
        <li>Desviación Estándar: ${stats.desviacion.toFixed(2)}</li>
        <li>Rango: ${stats.rango.toFixed(2)}</li>
      </ul>
    `;
  });

  // Graficar la primera columna
  const chartLabels = data.map((_, i) => `Dato ${i+1}`);
  const chartData = data.map(row => row[0]);

  showChart(chartLabels, chartData, headers[0]);
}

function calculateStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const media = values.reduce((a, b) => a + b, 0) / n;
  const mediana = (n % 2 === 0) ?
    (sorted[n / 2 - 1] + sorted[n / 2]) / 2 :
    sorted[Math.floor(n / 2)];

  const freq = {};
  values.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxFreq = Math.max(...Object.values(freq));
  const moda = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);

  const desviacion = Math.sqrt(values.reduce((acc, val) => acc + (val - media) ** 2, 0) / n);
  const rango = Math.max(...values) - Math.min(...values);

  return { media, mediana, moda, desviacion, rango };
}

let chartInstance = null;
function showChart(labels, data, label) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: 'blue',
        fill: false
      }]
    }
  });
}

