// Global variables
let allData = [];
let charts = {};
let isCardView = true;

// URL de tu Google Apps Script (cambia por la URL de tu formulario de especialistas)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzu-8V8G3hv9klYnRhB_b9JQ4XnFWEed4deUf8sgYNRCE0bxoHjzN2QD9DDGhZ6PASv8A/exec';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  loadData();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadData);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('searchInput').addEventListener('input', filterData);
  document.getElementById('filterSelect').addEventListener('change', filterData);
  document.getElementById('viewToggleBtn').addEventListener('click', toggleView);
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
    populateData();
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

// Toggle between card and table view
function toggleView() {
  const toggleBtn = document.getElementById('viewToggleBtn');
  const cardsContainer = document.getElementById('cardsContainer');
  const tableContainer = document.getElementById('tableContainer');
  
  isCardView = !isCardView;
  
  if (isCardView) {
    cardsContainer.style.display = 'grid';
    tableContainer.style.display = 'none';
    toggleBtn.innerHTML = '📋 Vista Tabla';
  } else {
    cardsContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    toggleBtn.innerHTML = '🗂️ Vista Tarjetas';
    populateTable(); // Solo poblar tabla cuando se necesite
  }
  
  filterData(); // Aplicar filtros actuales
}

// Update summary cards
function updateSummaryCards() {
  const totalResponses = allData.length;
  const todayResponses = getTodayResponses();
  const avgScore = calculateAverageScore();
  const avgAge = calculateAverageAge();

  document.getElementById('totalResponses').textContent = totalResponses;
  document.getElementById('avgScore').textContent = avgScore.toFixed(1);
  document.getElementById('todayResponses').textContent = todayResponses;
  document.getElementById('avgAge').textContent = avgAge.toFixed(1) + ' años';
}

// Get today's responses
function getTodayResponses() {
  const today = new Date().toDateString();
  return allData.filter(item => {
    const itemDate = new Date(item.timestamp || item['timestamp']);
    return itemDate.toDateString() === today;
  }).length;
}

// Calculate average total score
function calculateAverageScore() {
  if (allData.length === 0) return 0;
  
  const scores = allData.map(item => {
    const score = parseInt(item.puntaje_total || item['puntaje_total']);
    return isNaN(score) ? 0 : score;
  });

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

// Calculate average age
function calculateAverageAge() {
  if (allData.length === 0) return 0;
  
  const ages = allData.map(item => {
    const age = parseInt(item.edad || item['edad']);
    return isNaN(age) ? 0 : age;
  }).filter(age => age > 0);

  return ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
}

// Main data population function
function populateData() {
  if (isCardView) {
    populateCards();
  } else {
    populateTable();
  }
}

// NEW: Populate cards instead of table
function populateCards() {
  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.innerHTML = '';

  if (allData.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No hay evaluaciones disponibles</h3>
        <p>Aún no se han registrado evaluaciones de especialistas</p>
      </div>
    `;
    return;
  }

  allData.forEach((item, index) => {
    const card = createEvaluationCard(item, index);
    cardsContainer.appendChild(card);
  });
}

// NEW: Create individual evaluation card
function createEvaluationCard(item, index) {
  const card = document.createElement('div');
  card.className = 'evaluation-card';
  card.setAttribute('data-index', index);

  const fecha = formatDate(item.timestamp);
  const nombre = item.nombre || 'Evaluador Anónimo';
  const edad = item.edad || 'N/A';
  const sexo = item.sexo || 'N/E';
  const puntajeTotal = item.puntaje_total || 0;
  const bebidaPreferida = item.bebida_preferida || 'N/E';

  // Ratings para mostrar
  const ratings = [
    { label: 'Aroma', value: item.aroma_general || 3 },
    { label: 'Intensidad', value: item.intensidad_aromatica || 3 },
    { label: '1er Contacto', value: item.primer_contacto || 3 },
    { label: 'Dulzor', value: item.dulzor || 3 },
    { label: 'Retrogusto', value: item.retrogusto || 3 },
    { label: 'Balance', value: item.balance_general || 3 }
  ];

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <h3 class="evaluator-name">${nombre}</h3>
        <div class="total-score">${puntajeTotal}</div>
      </div>
      <div class="basic-info">
        <span>${fecha}</span>
        <span>${edad} años</span>
        <span>${sexo}</span>
        <span>${bebidaPreferida}</span>
      </div>
    </div>
    
    <div class="card-body">
      <div class="ratings-grid">
        ${ratings.map(rating => `
          <div class="rating-item">
            <div class="rating-label">${rating.label}</div>
            <div class="rating-value rating-${rating.value}">${rating.value}</div>
            <div class="rating-stars stars-${rating.value}"></div>
          </div>
        `).join('')}
      </div>
      
      <div class="card-details">
        ${item.sabores_percibidos ? `
          <div class="detail-row">
            <span class="detail-label">Sabores:</span>
            <span class="detail-value">${item.sabores_percibidos}</span>
          </div>
        ` : ''}
        
        ${item.recuerdo_a ? `
          <div class="detail-row">
            <span class="detail-label">Recuerda a:</span>
            <span class="detail-value">${item.recuerdo_a}</span>
          </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">Consumiría de nuevo:</span>
          <span class="detail-value">${item.consumiria_nuevamente || 'N/E'}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Recomendaría:</span>
          <span class="detail-value">${item.recomendaria || 'N/E'}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Rango de precio:</span>
          <span class="detail-value">${item.rango_precio || 'N/E'}</span>
        </div>
        
        ${item.comentarios_adicionales ? `
          <div class="notes-text">
            <strong>Comentarios:</strong> ${item.comentarios_adicionales}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return card;
}

// Populate traditional table (when toggled)
function populateTable() {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  if (allData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="15" style="text-align: center; padding: 2rem; color: #6c757d;">No hay datos disponibles</td></tr>';
    return;
  }

  allData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    row.innerHTML = `
      <td>${formatDate(item.timestamp)}</td>
      <td>${item.nombre || 'N/A'}</td>
      <td>${item.edad || 'N/A'}</td>
      <td>${item.sexo || 'N/A'}</td>
      <td>${item.bebida_preferida || 'N/A'}</td>
      <td class="rating-cell rating-${item.aroma_general || 3}">${item.aroma_general || 3}</td>
      <td class="rating-cell rating-${item.intensidad_aromatica || 3}">${item.intensidad_aromatica || 3}</td>
      <td class="rating-cell rating-${item.primer_contacto || 3}">${item.primer_contacto || 3}</td>
      <td class="rating-cell rating-${item.dulzor || 3}">${item.dulzor || 3}</td>
      <td class="rating-cell rating-${item.retrogusto || 3}">${item.retrogusto || 3}</td>
      <td class="rating-cell rating-${item.balance_general || 3}">${item.balance_general || 3}</td>
      <td title="${item.sabores_percibidos || 'Sin especificar'}">${truncateText(item.sabores_percibidos || 'Sin especificar', 40)}</td>
      <td>${item.consumiria_nuevamente || 'N/E'}</td>
      <td>${item.recomendaria || 'N/E'}</td>
      <td class="score-cell">${item.puntaje_total || 0}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Filter data based on search and filter criteria
function filterData() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filterValue = document.getElementById('filterSelect').value;
  
  if (isCardView) {
    filterCards(searchTerm, filterValue);
  } else {
    filterTable(searchTerm, filterValue);
  }
}

// Filter cards
function filterCards(searchTerm, filterValue) {
  const cards = document.querySelectorAll('.evaluation-card');
  
  cards.forEach(card => {
    const index = parseInt(card.getAttribute('data-index'));
    const item = allData[index];
    let showCard = true;

    // Apply search filter
    if (searchTerm) {
      const searchableText = [
        item.nombre || '',
        item.sabores_percibidos || '',
        item.comentarios_adicionales || '',
        item.recuerdo_a || ''
      ].join(' ').toLowerCase();
      
      showCard = searchableText.includes(searchTerm);
    }

    // Apply filter
    if (showCard && filterValue !== 'all') {
      showCard = applyFilter(item, filterValue);
    }

    card.style.display = showCard ? 'block' : 'none';
  });
}

// Filter table
function filterTable(searchTerm, filterValue) {
  const rows = document.querySelectorAll('#tableBody tr');
  
  rows.forEach(row => {
    if (row.cells.length === 1) return; // Skip "no data" row
    
    const index = parseInt(row.getAttribute('data-index'));
    const item = allData[index];
    let showRow = true;

    // Apply search filter
    if (searchTerm) {
      const searchableText = [
        item.nombre || '',
        item.sabores_percibidos || '',
        item.comentarios_adicionales || '',
        item.recuerdo_a || ''
      ].join(' ').toLowerCase();
      
      showRow = searchableText.includes(searchTerm);
    }

    // Apply filter
    if (showRow && filterValue !== 'all') {
      showRow = applyFilter(item, filterValue);
    }

    row.style.display = showRow ? '' : 'none';
  });
}

// Apply filter logic
function applyFilter(item, filterValue) {
  const itemDate = new Date(item.timestamp);
  
  switch (filterValue) {
    case 'today':
      const today = new Date().toDateString();
      return itemDate.toDateString() === today;
    case 'week':
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    case 'high-scores':
      const score = parseInt(item.puntaje_total);
      return score >= 35;
    default:
      return true;
  }
}

// Export data to CSV
function exportToCSV() {
  if (allData.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = [
    'Fecha y Hora',
    'Email',
    'Nombre',
    'Edad',
    'Sexo',
    'Frecuencia Ron',
    'Bebida Preferida',
    'Teléfono',
    'Aroma General',
    'Intensidad Aromática',
    'Notas Herbales',
    'Primer Contacto',
    'Dulzor',
    'Retrogusto',
    'Cuerpo',
    'Suavidad',
    'Presencia Madera',
    'Balance General',
    'Sabores Percibidos',
    'Recuerdo',
    'Consumiría Nuevamente',
    'Recomendaría',
    'Rango Precio',
    'Puntaje Total',
    'Comentarios Adicionales'
  ];

  const csvContent = [
    headers.join(','),
    ...allData.map(item => [
      `"${item.timestamp || ''}"`,
      `"${item.email || ''}"`,
      `"${item.nombre || ''}"`,
      item.edad || '',
      `"${item.sexo || ''}"`,
      `"${item.frecuencia_ron || ''}"`,
      `"${item.bebida_preferida || ''}"`,
      `"${item.telefono || ''}"`,
      item.aroma_general || 3,
      item.intensidad_aromatica || 3,
      item.notas_herbales || 1,
      item.primer_contacto || 3,
      item.dulzor || 3,
      item.retrogusto || 3,
      item.cuerpo || 3,
      item.suavidad || 3,
      item.presencia_madera || 1,
      item.balance_general || 3,
      `"${(item.sabores_percibidos || '').replace(/"/g, '""')}"`,
      `"${(item.recuerdo_a || '').replace(/"/g, '""')}"`,
      `"${item.consumiria_nuevamente || ''}"`,
      `"${item.recomendaria || ''}"`,
      `"${item.rango_precio || ''}"`,
      item.puntaje_total || 0,
      `"${(item.comentarios_adicionales || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `ron_especialistas_evaluaciones_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Create all charts (same as before)
function createCharts() {
  createAromaChart();
  createSaborChart();
  createPerfilChart();
  createDemographicChart();
  createPreferenciasChart();
  createRecomendacionChart();
  createPrecioChart();
  createTimeSeriesChart();
}

// Chart creation functions (keeping the same as original)
function createAromaChart() {
  const ctx = document.getElementById('aromaChart').getContext('2d');
  
  const aromaFields = ['aroma_general', 'intensidad_aromatica', 'notas_herbales'];
  const labels = ['Aroma General', 'Intensidad Aromática', 'Notas Herbales'];
  
  const ratings = [1, 2, 3, 4, 5];
  
  const datasets = ratings.map(rating => ({
    label: `${rating} ${getRatingLabel(rating)}`,
    data: aromaFields.map(field => {
      return allData.filter(item => parseInt(item[field]) === rating).length;
    }),
    backgroundColor: getRatingColor(rating),
    borderColor: getRatingColor(rating, 0.8),
    borderWidth: 1
  }));

  if (charts.aroma) charts.aroma.destroy();
  
  charts.aroma = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
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
          display: true,
          text: 'Evaluación de Aromas'
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

// Función createSaborChart modificada para incluir leyenda personalizada
function createSaborChart() {
  const ctx = document.getElementById('saborChart').getContext('2d');
  
  const saborFields = ['primer_contacto', 'dulzor', 'retrogusto', 'cuerpo', 'suavidad'];
  const labels = ['Primer Contacto', 'Dulzor', 'Retrogusto', 'Cuerpo', 'Suavidad'];
  
  const averages = saborFields.map(field => {
    const values = allData.map(item => parseInt(item[field])).filter(val => !isNaN(val));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  if (charts.sabor) charts.sabor.destroy();
  
  charts.sabor = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
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
          position: 'right',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            },
            color: '#2C1810',
            generateLabels: function(chart) {
              // Crear leyenda personalizada con la escala de evaluación
              return [
                {
                  text: '5 Excelente',
                  fillStyle: '#28a745',
                  strokeStyle: '#28a745',
                  pointStyle: 'circle',
                  hidden: false
                },
                {
                  text: '4 Muy Bueno', 
                  fillStyle: '#20c997',
                  strokeStyle: '#20c997',
                  pointStyle: 'circle',
                  hidden: false
                },
                {
                  text: '3 Bueno',
                  fillStyle: '#ffc107', 
                  strokeStyle: '#ffc107',
                  pointStyle: 'circle',
                  hidden: false
                },
                {
                  text: '2 Regular',
                  fillStyle: '#fd7e14',
                  strokeStyle: '#fd7e14', 
                  pointStyle: 'circle',
                  hidden: false
                },
                {
                  text: '1 Deficiente',
                  fillStyle: '#dc3545',
                  strokeStyle: '#dc3545',
                  pointStyle: 'circle', 
                  hidden: false
                }
              ];
            }
          }
        },
        title: {
          display: true,
          text: 'Perfil de Sabor Promedio',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#2C1810',
          padding: {
            bottom: 15
          }
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
      },
      layout: {
        padding: {
          right: 20
        }
      }
    }
  });
}

function createPerfilChart() {
  const ctx = document.getElementById('perfilChart').getContext('2d');
  
  const perfilFields = ['presencia_madera', 'balance_general'];
  const labels = ['Presencia de Madera', 'Balance General'];
  
  const averages = perfilFields.map(field => {
    const values = allData.map(item => parseInt(item[field])).filter(val => !isNaN(val));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  if (charts.perfil) charts.perfil.destroy();
  
  charts.perfil = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Promedio',
        data: averages,
        backgroundColor: ['#8B4513', '#DAA520'],
        borderColor: ['#654321', '#B8860B'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Perfil General del Producto'
        }
      },
      scales: {
        y: {
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

function createDemographicChart() {
  const ctx = document.getElementById('demographicChart').getContext('2d');
  
  const genderCounts = {
    'masculino': 0,
    'femenino': 0,
    'otro': 0
  };

  allData.forEach(item => {
    const gender = item.sexo || item['sexo'] || 'otro';
    genderCounts[gender] = (genderCounts[gender] || 0) + 1;
  });

  const total = allData.length;
  const data = [genderCounts.masculino, genderCounts.femenino, genderCounts.otro];
  const labels = ['Masculino', 'Femenino', 'Otro'];

  const labelsWithData = labels.map((label, index) => {
    const value = data[index];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return `${label}: ${value} (${percentage}%)`;
  });

  if (charts.demographic) charts.demographic.destroy();
  
  charts.demographic = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labelsWithData,
      datasets: [{
        data: data,
        backgroundColor: ['#17a2b8', '#dc3545', '#28a745'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            },
            color: '#2C1810'
          }
        },
        title: {
          display: true,
          text: 'Distribución por Género',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#2C1810',
          padding: {
            bottom: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${labels[context.dataIndex]}: ${value} personas (${percentage}%)`;
            }
          }
        }
      },
      layout: {
        padding: {
          right: 20
        }
      }
    }
  });
}

function createPreferenciasChart() {
  const ctx = document.getElementById('preferenciasChart').getContext('2d');
  
  const bebidaCounts = {};

  allData.forEach(item => {
    const bebida = item.bebida_preferida || item['bebida_preferida'] || 'No especificado';
    bebidaCounts[bebida] = (bebidaCounts[bebida] || 0) + 1;
  });

  if (charts.preferencias) charts.preferencias.destroy();
  
  charts.preferencias = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(bebidaCounts),
      datasets: [{
        label: 'Cantidad de evaluadores',
        data: Object.values(bebidaCounts),
        backgroundColor: [
          '#DAA520', '#8B4513', '#dc3545', '#28a745', 
          '#17a2b8', '#ffc107', '#6f42c1', '#fd7e14'
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
        },
        title: {
          display: true,
          text: 'Bebidas Preferidas de los Evaluadores'
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

function createRecomendacionChart() {
  const ctx = document.getElementById('recomendacionChart').getContext('2d');
  
  const recomendacionCounts = {
    'definitivamente_si': 0,
    'probablemente_si': 0,
    'indeciso': 0,
    'probablemente_no': 0,
    'definitivamente_no': 0
  };

  const labels = {
    'definitivamente_si': 'Definitivamente Sí',
    'probablemente_si': 'Probablemente Sí',
    'indeciso': 'Indeciso',
    'probablemente_no': 'Probablemente No',
    'definitivamente_no': 'Definitivamente No'
  };

  allData.forEach(item => {
    const recomendacion = item.recomendaria || item['recomendaria'] || 'indeciso';
    recomendacionCounts[recomendacion] = (recomendacionCounts[recomendacion] || 0) + 1;
  });

  const total = allData.length;
  const data = Object.values(recomendacionCounts);
  const chartLabels = Object.keys(recomendacionCounts).map(key => labels[key]);

  const labelsWithData = chartLabels.map((label, index) => {
    const value = data[index];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return `${label}: ${value} (${percentage}%)`;
  });

  if (charts.recomendacion) charts.recomendacion.destroy();
  
  charts.recomendacion = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labelsWithData,
      datasets: [{
        data: data,
        backgroundColor: ['#28a745', '#20c997', '#ffc107', '#fd7e14', '#dc3545'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            font: {
              size: 11,
              weight: '500'
            },
            color: '#2C1810',
            boxWidth: 12,
            boxHeight: 12
          },
          maxHeight: 120
        },
        title: {
          display: true,
          text: '¿Recomendarías el producto?',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#2C1810',
          padding: {
            bottom: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${chartLabels[context.dataIndex]}: ${value} personas (${percentage}%)`;
            }
          }
        }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      }
    }
  });
}

function createPrecioChart() {
  const ctx = document.getElementById('precioChart').getContext('2d');
  
  const precioCounts = {};
  const precioLabels = {
    'menos_50000': 'Menos de $50,000',
    '50000_100000': '$50,000 - $100,000',
    '100000_150000': '$100,000 - $150,000',
    '150000_200000': '$150,000 - $200,000',
    '200000_300000': '$200,000 - $300,000',
    'mas_300000': 'Más de $300,000'
  };

  allData.forEach(item => {
    const precio = item.rango_precio || item['rango_precio'] || 'no_especificado';
    precioCounts[precio] = (precioCounts[precio] || 0) + 1;
  });

  if (charts.precio) charts.precio.destroy();
  
  charts.precio = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(precioCounts).map(key => precioLabels[key] || key),
      datasets: [{
        label: 'Cantidad de evaluadores',
        data: Object.values(precioCounts),
        backgroundColor: '#8B4513',
        borderColor: '#654321',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Rango de Precio Esperado'
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

function createTimeSeriesChart() {
  const ctx = document.getElementById('timeSeriesChart').getContext('2d');
  
  const dateGroups = {};
  
  allData.forEach(item => {
    const dateStr = item.timestamp || item['timestamp'];
    if (dateStr) {
      const date = new Date(dateStr);
      const dateKey = date.toISOString().split('T')[0];
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
    }
  });

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
        },
        title: {
          display: true,
          text: 'Evaluaciones en el Tiempo'
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