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
  const grupoKey = "Grupo";  // Hardcodea los nombres de las columnas
  const valorKey = "Resultado";

  if (!data[0] || !data[0][grupoKey] || !data[0][valorKey]) {
    document.getElementById('output').innerHTML = "⚠️ El archivo CSV debe tener las columnas 'Grupo' y 'Resultado'.";
    return;
  }

  const grupos = {};
  data.forEach(row => {
    const grupo = row[grupoKey];
    const valor = row[valorKey];
    if (!isNaN(Number(valor))) { // Convierte a número y verifica si es NaN
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

  dibujarBoxplot(grupos);
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

  // aproximación de p con función normal estándar
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  return { t, p };
}

// Función de distribución normal acumulada (aproximada)
function normalCDF(x) {
  return (1 - Math.exp(-x * x / 2)) / Math.sqrt(2 * Math.PI);
}

function dibujarBoxplot(grupos) {
  const labels = Object.keys(grupos);
  const data = labels.map(label => grupos[label]);

  const ctx = document.getElementById('boxplotChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'boxplot',
    data: {
      labels: labels,
      datasets: [{
        label: 'Distribución por Grupo',
        data: data,
        backgroundColor: 'rgba(99, 132, 255, 0.5)',
        borderColor: 'rgba(99, 132, 255, 1)',
        borderWidth: 1,
        outlierBackgroundColor: 'rgba(255,99,132,0.3)',
        outlierBorderColor: 'rgba(255,99,132,1)',
        outlierRadius: 3,
        outlierBorderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Boxplot por Grupo',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const data = context.raw;
              const stats = {
                min: Math.min(...data),
                q1: quantile(data, 0.25),
                median: quantile(data, 0.5),
                q3: quantile(data, 0.75),
                max: Math.max(...data)
              };
              return [
                `Mínimo: ${stats.min.toFixed(2)}`,
                `Q1: ${stats.q1.toFixed(2)}`,
                `Mediana: ${stats.median.toFixed(2)}`,
                `Q3: ${stats.q3.toFixed(2)}`,
                `Máximo: ${stats.max.toFixed(2)}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Valores'
          }
        }
      }
    }
  });
}

// Función auxiliar para calcular cuantiles
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