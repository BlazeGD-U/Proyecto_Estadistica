document.getElementById('csvFile').addEventListener('change', handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      analizarDatos(results.data);
    }
  });
}

function analizarDatos(data) {
  // Destruir todos los gráficos existentes antes de procesar nuevos datos
  if (window.histChartA) {
    window.histChartA.destroy();
    window.histChartA = null;
  }
  if (window.histChartB) {
    window.histChartB.destroy();
    window.histChartB = null;
  }

  const grupoKey = "Grupo";
  const valorKey = "Resultado";

  if (!data[0] || !data[0][grupoKey] || !data[0][valorKey]) {
    document.getElementById('output').innerHTML = "⚠️ El archivo CSV debe tener las columnas 'Grupo' y 'Resultado'.";
    return;
  }

  const grupos = {};
  data.forEach(row => {
    const grupo = row[grupoKey];
    const valor = row[valorKey];
    if (!isNaN(Number(valor))) {
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(Number(valor));
    }
  });

  const output = document.getElementById('output');
  output.innerHTML = "<h3>📈 Estadísticas por Grupo</h3>";

  for (const grupo in grupos) {
    const valores = grupos[grupo];
    const media = (valores.reduce((a, b) => a + b, 0)) / valores.length;
    const desv = Math.sqrt(valores.map(v => (v - media) ** 2).reduce((a, b) => a + b, 0) / valores.length);
    output.innerHTML += `<b>${grupo}</b>: n = ${valores.length}, media = ${media.toFixed(2)}, desviación = ${desv.toFixed(2)}<br>`;
  }

  if (Object.keys(grupos).length === 2) {
    const [g1, g2] = Object.keys(grupos);
    const resultado = pruebaT(grupos[g1], grupos[g2]);
    output.innerHTML += `<br><h3>🧪 Prueba t de Student</h3>`;
    output.innerHTML += `Valor t: ${resultado.t.toFixed(3)}<br>p (aprox): ${resultado.p < 0.05 ? "<span style='color:red'>"+resultado.p.toFixed(3)+" → diferencia significativa</span>" : resultado.p.toFixed(3)+" → no significativa"}<br>`;
  } else if (Object.keys(grupos).length > 2) {
    output.innerHTML += `<br><i>⚠️ ANOVA no implementado aún. Solo se muestra análisis descriptivo.</i>`;
  }

  dibujarHistogramas(grupos);
}

function pruebaT(arr1, arr2) {
  const n1 = arr1.length, n2 = arr2.length;
  const m1 = arr1.reduce((a, b) => a + b, 0) / n1;
  const m2 = arr2.reduce((a, b) => a + b, 0) / n2;
  const s1 = Math.sqrt(arr1.map(x => (x - m1) ** 2).reduce((a, b) => a + b, 0) / (n1 - 1));
  const s2 = Math.sqrt(arr2.map(x => (x - m2) ** 2).reduce((a, b) => a + b, 0) / (n2 - 1));
  const se = Math.sqrt((s1 ** 2 / n1) + (s2 ** 2 / n2));
  const t = (m1 - m2) / se;
  const df = Math.min(n1, n2) - 1;
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  return { t, p };
}

function normalCDF(x) {
  return (1 - Math.exp(-x * x / 2)) / Math.sqrt(2 * Math.PI);
}

function quantile(arr, q) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

function calcularDatosHistograma(valores, numBins = 10) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const range = max - min;
  const binWidth = range / numBins;
  const bins = Array(numBins).fill(0);
  const labels = Array(numBins).fill(0).map((_, i) => (min + i * binWidth).toFixed(2));

  valores.forEach(valor => {
    const binIndex = Math.min(Math.floor((valor - min) / binWidth), numBins - 1);
    bins[binIndex]++;
  });

  return { labels, frecuencias: bins };
}

function dibujarHistogramas(grupos) {
  const [g1, g2] = Object.keys(grupos).slice(0, 2);

  if (g1 && grupos[g1]) {
    const { labels, frecuencias } = calcularDatosHistograma(grupos[g1]);
    const ctxA = document.getElementById('histGroupA').getContext('2d');
    window.histChartA = new Chart(ctxA, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `Histograma ${g1}`,
          data: frecuencias,
          backgroundColor: 'rgba(99, 132, 255, 0.5)',
          borderColor: 'rgba(99, 132, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { // Compatible con Chart.js 3.x
            display: true,
            text: `Histograma ${g1}`,
            font: { size: 14 }
          },
          legend: { // Compatible con Chart.js 3.x
            position: 'top'
          }
        },
        scales: {
          x: { // Cambiado de xAxes a x
            title: { // Cambiado de scaleLabel a title
              display: true,
              text: 'Valores'
            }
          },
          y: { // Cambiado de yAxes a y
            title: { // Cambiado de scaleLabel a title
              display: true,
              text: 'Frecuencia'
            },
            ticks: {
              beginAtZero: true
            }
          }
        }
      }
    });
  }

  if (g2 && grupos[g2]) {
    const { labels, frecuencias } = calcularDatosHistograma(grupos[g2]);
    const ctxB = document.getElementById('histGroupB').getContext('2d');
    window.histChartB = new Chart(ctxB, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `Histograma ${g2}`,
          data: frecuencias,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Histograma ${g2}`,
            font: { size: 14 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Valores'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Frecuencia'
            },
            ticks: {
              beginAtZero: true
            }
          }
        }
      }
    });
  }
}