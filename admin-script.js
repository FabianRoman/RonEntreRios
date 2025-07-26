// Global variables
let allData = [];
let charts = {};

// URL de tu Google Apps Script (la misma que usas en el formulario)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8Zn4QBeMWAwQSmr82LEahHooPq6gxUHMznr9GlxQwHfuvx3d-XR3WFU-EAR66cHuMfw/exec';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  loadData();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadData);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('searchInput').addEventListener('input', filterTable);
  document.getElementById('filterSelect').addEventListener('change', filterTable);
}

// Load data from Google Sheets
async function loadData() {
  showLoadingState();
  
  try {
    console.log('Cargando datos desde:', APPS_SCRIPT_URL);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Respuesta recibida:', result);

    if (result.status === 'error') {
      throw new Error(result.message || 'Error del servidor');
    }

    allData = result.data || result || [];
    
    if (!Array.isArray(allData)) {
      console.warn('Los datos no son un array, intentando convertir...');
      allData = [];
    }

    console.log(`Datos cargados: ${allData.length} registros`);
    
    updateSummaryCards();
    createCharts();
    populateTable();
    showDashboard();
    updateLastUpdate();

  } catch (error) {
    console.error('Error al cargar datos:', error);
    showErrorState(error.message);
  }
}

// Show loading state
function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
}

// Show error state
function showErrorState(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('errorMessage').textContent = message;
}

// Show dashboard
function showDashboard() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('dashboard').classList.add('fade-in');
}

// Update summary cards
function updateSummaryCards() {
  const totalResponses = allData.length;
  const todayResponses = getTodayResponses();
  const avgRating = calculateAverageRating();
  const completionRate = calculateCompletionRate();

  document.getElementById('totalResponses').textContent = totalResponses;
  document.getElementById('avgRating').textContent = avgRating.toFixed(1);
  document.getElementById('todayResponses').textContent = todayResponses;
  document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// Get today's responses
function getTodayResponses() {
  const today = new Date().toDateString();
  return allData.filter(item => {
    const itemDate = new Date(item['Fecha y Hora'] || item.timestamp);
    return itemDate.toDateString() === today;
  }).length;
}

// Calculate average rating
function calculateAverageRating() {
  if (allData.length === 0) return 0;
  
  const sensoryFields = ['Color', 'Aroma Inicial', 'Aromas en Boca', 'Sabor Entrada', 'Sabor Retrogusto', 'Persistencia'];
  let totalSum = 0;
  let totalCount = 0;

  allData.forEach(item => {
    sensoryFields.forEach(field => {
      const value = parseInt(item[field]);
      if (!isNaN(value)) {
        totalSum += value;
        totalCount++;
      }
    });
  });

  return totalCount > 0 ? totalSum / totalCount : 0;
}

// Calculate completion rate (responses with notes)
function calculateCompletionRate() {
  if (allData.length === 0) return 0;
  
  const withNotes = allData.filter(item => {
    const notes = item['Notas del Catador'] || item.notas || '';
    return notes.trim().length > 0;
  }).length;

  return Math.round((withNotes / allData.length) * 100);
}

// Create all charts
function createCharts() {
  createSensoryChart();
  createAverageChart();
  createArtesanalChart();
  createHabitalChart();
  createPreferencesChart();
  createTimeSeriesChart();
}

// Create sensory evaluation chart
function createSensoryChart() {
  const ctx = document.getElementById('sensoryChart').getContext('2d');
  
  const sensoryFields = ['Color', 'Aroma Inicial', 'Aromas en Boca', 'Sabor Entrada', 'Sabor Retrogusto', 'Persistencia'];
  const ratings = [1, 2, 3, 4, 5];
  
  const datasets = ratings.map(rating => ({
    label: `${rating} ${getRatingLabel(rating)}`,
    data: sensoryFields.map(field => {
      return allData.filter(item => parseInt(item[field]) === rating).length;
    }),
    backgroundColor: getRatingColor(rating),
    borderColor: getRatingColor(rating, 0.8),
    borderWidth: 1
  }));

  if (charts.sensory) charts.sensory.destroy();
  
  charts.sensory = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sensoryFields.map(field => field.replace(' ', '\n')),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: false
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
}

// Create average scores chart
function createAverageChart() {
  const ctx = document.getElementById('averageChart').getContext('2d');
  
  const sensoryFields = ['Color', 'Aroma Inicial', 'Aromas en Boca', 'Sabor Entrada', 'Sabor Retrogusto', 'Persistencia'];
  const averages = sensoryFields.map(field => {
    const values = allData.map(item => parseInt(item[field])).filter(val => !isNaN(val));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  if (charts.average) charts.average.destroy();
  
  charts.average = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: sensoryFields,
      datasets: [{
        label: 'Promedio',
        data: averages,
        backgroundColor: 'rgba(139, 69, 19, 0.2)',
        borderColor: '#8B4513',
        borderWidth: 3,
        pointBackgroundColor: '#DAA520',
        pointBorderColor: '#8B4513',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// Create artesanal experience chart
function createArtesanalChart() {
  const ctx = document.getElementById('artesanalChart').getContext('2d');
  
  const counts = {
    'Si': 0,
    'No': 0,
    'No especificado': 0
  };

  allData.forEach(item => {
    const value = item['Probo Antes'] || item.artesanal || 'No especificado';
    counts[value] = (counts[value] || 0) + 1;
  });

  if (charts.artesanal) charts.artesanal.destroy();
  
  charts.artesanal = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Create habitual consumer chart
function createHabitalChart() {
  const ctx = document.getElementById('habitualChart').getContext('2d');
  
  const counts = {
    'Si': 0,
    'No': 0,
    'No especificado': 0
  };

  allData.forEach(item => {
    const value = item['Consumidor Habitual'] || item.habitual || 'No especificado';
    counts[value] = (counts[value] || 0) + 1;
  });

  if (charts.habitual) charts.habitual.destroy();
  
  charts.habitual = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#17a2b8', '#ffc107', '#6c757d'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Create preferences chart
function createPreferencesChart() {
  const ctx = document.getElementById('preferencesChart').getContext('2d');
  
  const counts = {
    'Dulce': 0,
    'Seco': 0,
    'Especiado': 0,
    'Indiferente': 0,
    'No especificado': 0
  };

  allData.forEach(item => {
    const value = item['Preferencia'] || item.preferencia || 'No especificado';
    counts[value] = (counts[value] || 0) + 1;
  });

  if (charts.preferences) charts.preferences.destroy();
  
  charts.preferences = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Cantidad de respuestas',
        data: Object.values(counts),
        backgroundColor: [
          '#DAA520', // Dulce - Dorado
          '#8B4513', // Seco - Marrón
          '#dc3545', // Especiado - Rojo
          '#28a745', // Indiferente - Verde
          '#6c757d'  // No especificado - Gris
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// Create time series chart
function createTimeSeriesChart() {
  const ctx = document.getElementById('timeSeriesChart').getContext('2d');
  
  // Group data by date
  const dateGroups = {};
  
  allData.forEach(item => {
    const dateStr = item['Fecha y Hora'] || item.timestamp;
    if (dateStr) {
      const date = new Date(dateStr);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
    }
  });

  // Sort dates and create arrays
  const sortedDates = Object.keys(dateGroups).sort();
  const counts = sortedDates.map(date => dateGroups[date]);

  if (charts.timeSeries) charts.timeSeries.destroy();
  
  charts.timeSeries = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Evaluaciones por día',
        data: counts,
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        borderColor: '#8B4513',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#DAA520',
        pointBorderColor: '#8B4513',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// Populate data table
function populateTable() {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  if (allData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6c757d;">No hay datos disponibles</td></tr>';
    return;
  }

  allData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(item['Fecha y Hora'] || item.timestamp)}</td>
      <td class="rating-cell rating-${item.Color || item.color || 3}">${item.Color || item.color || 3}</td>
      <td class="rating-cell rating-${item['Aroma Inicial'] || item.aromaInicial || 3}">${item['Aroma Inicial'] || item.aromaInicial || 3}</td>
      <td class="rating-cell rating-${item['Aromas en Boca'] || item.aromasBoca || 3}">${item['Aromas en Boca'] || item.aromasBoca || 3}</td>
      <td class="rating-cell rating-${item['Sabor Entrada'] || item.saborEntrada || 3}">${item['Sabor Entrada'] || item.saborEntrada || 3}</td>
      <td class="rating-cell rating-${item['Sabor Retrogusto'] || item.saborRetrogusto || 3}">${item['Sabor Retrogusto'] || item.saborRetrogusto || 3}</td>
      <td class="rating-cell rating-${item['Persistencia'] || item.persistencia || 3}">${item['Persistencia'] || item.persistencia || 3}</td>
      <td class="notes-cell" title="${item['Notas del Catador'] || item.notas || 'Sin notas'}">${truncateText(item['Notas del Catador'] || item.notas || 'Sin notas', 50)}</td>
      <td>${item['Probo Antes'] || item.artesanal || 'N/E'}</td>
      <td>${item['Consumidor Habitual'] || item.habitual || 'N/E'}</td>
      <td>${item['Preferencia'] || item.preferencia || 'N/E'}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Filter table based on search and filter criteria
function filterTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filterValue = document.getElementById('filterSelect').value;
  const tableBody = document.getElementById('tableBody');
  const rows = tableBody.getElementsByTagName('tr');

  Array.from(rows).forEach(row => {
    if (row.cells.length === 1) return; // Skip "no data" row

    let showRow = true;

    // Apply search filter
    if (searchTerm) {
      const notesCell = row.cells[7]; // Notes column
      const notesText = notesCell.textContent.toLowerCase();
      showRow = notesText.includes(searchTerm);
    }

    // Apply date/type filter
    if (showRow && filterValue !== 'all') {
      const dateCell = row.cells[0];
      const dateText = dateCell.textContent;
      const itemDate = parseDateFromText(dateText);

      switch (filterValue) {
        case 'today':
          const today = new Date().toDateString();
          showRow = itemDate && itemDate.toDateString() === today;
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          showRow = itemDate && itemDate >= weekAgo;
          break;
        case 'with-notes':
          const notesCell = row.cells[7];
          showRow = notesCell.textContent.trim() !== 'Sin notas';
          break;
      }
    }

    row.style.display = showRow ? '' : 'none';
  });
}

// Export data to CSV
function exportToCSV() {
  if (allData.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = [
    'Fecha y Hora',
    'Color',
    'Aroma Inicial',
    'Aromas en Boca',
    'Sabor Entrada',
    'Sabor Retrogusto',
    'Persistencia',
    'Notas del Catador',
    'Probo Antes',
    'Consumidor Habitual',
    'Preferencia'
  ];

  const csvContent = [
    headers.join(','),
    ...allData.map(item => [
      `"${item['Fecha y Hora'] || item.timestamp || ''}"`,
      item.Color || item.color || 3,
      item['Aroma Inicial'] || item.aromaInicial || 3,
      item['Aromas en Boca'] || item.aromasBoca || 3,
      item['Sabor Entrada'] || item.saborEntrada || 3,
      item['Sabor Retrogusto'] || item.saborRetrogusto || 3,
      item['Persistencia'] || item.persistencia || 3,
      `"${(item['Notas del Catador'] || item.notas || '').replace(/"/g, '""')}"`,
      `"${item['Probo Antes'] || item.artesanal || 'No especificado'}"`,
      `"${item['Consumidor Habitual'] || item.habitual || 'No especificado'}"`,
      `"${item['Preferencia'] || item.preferencia || 'No especificado'}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `ron_entre_rios_evaluaciones_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility functions
function getRatingLabel(rating) {
  const labels = {
    1: '⭐',
    2: '⭐⭐',
    3: '⭐⭐⭐',
    4: '⭐⭐⭐⭐',
    5: '⭐⭐⭐⭐⭐'
  };
  return labels[rating] || '';
}

function getRatingColor(rating, alpha = 0.7) {
  const colors = {
    1: `rgba(220, 53, 69, ${alpha})`,   // Red
    2: `rgba(253, 126, 20, ${alpha})`,  // Orange
    3: `rgba(255, 193, 7, ${alpha})`,   // Yellow
    4: `rgba(32, 201, 151, ${alpha})`,  // Teal
    5: `rgba(40, 167, 69, ${alpha})`    // Green
  };
  return colors[rating] || `rgba(108, 117, 125, ${alpha})`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function parseDateFromText(dateText) {
  // Try to parse the formatted date back to Date object
  try {
    // This is a simplified parser, you might need to adjust based on your date format
    return new Date(dateText.replace(/(\d{1,2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2})/, '$2 $1, $3 $4:$5'));
  } catch (e) {
    return null;
  }
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateLastUpdate() {
  const now = new Date();
  document.getElementById('lastUpdate').textContent = now.toLocaleString('es-ES');
}

// Auto-refresh every 5 minutes
setInterval(() => {
  console.log('Auto-refresh ejecutándose...');
  loadData();
}, 5 * 60 * 1000);