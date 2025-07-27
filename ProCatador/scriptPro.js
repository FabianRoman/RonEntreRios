// Ron Entre Ríos - Script optimizado para móviles - Versión Especialistas
// Detectar si es dispositivo móvil
const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;

// Variables globales para controlar scroll
let isTextareaFocused = false;
let originalScrollY = 0;
let preventScrollReset = false;

// Update slider values in real time
const sliders = document.querySelectorAll('.slider');
sliders.forEach(slider => {
  const valueDisplay = document.getElementById(slider.id + '_value');
  
  slider.addEventListener('input', function() {
    if (valueDisplay) {
      valueDisplay.textContent = this.value;
    }
    // Calcular puntaje total automáticamente
    calculateTotalScore();
  });
});

// Calcular puntaje total automáticamente
function calculateTotalScore() {
  const sensorySlidersIds = [
    'general_aroma', 'aroma_intensity', 'herbal_notes',
    'first_taste', 'sweetness', 'aftertaste', 
    'body', 'smoothness', 'wood_presence', 'balance'
  ];
  
  let totalScore = 0;
  sensorySlidersIds.forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
      totalScore += parseInt(slider.value);
    }
  });
  
  const totalScoreDisplay = document.getElementById('total_score');
  if (totalScoreDisplay) {
    totalScoreDisplay.textContent = totalScore;
  }
}

// Show message function (optimizada)
function showMessage(message, isError = false) {
  // Remover mensajes existentes
  const existingMessages = document.querySelectorAll('.message-container');
  existingMessages.forEach(msg => msg.remove());
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message-container';
  messageDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      left: 20px;
      max-width: 350px;
      margin: 0 auto;
      background: ${isError ? 'linear-gradient(135deg, #dc3545, #c82333)' : 'linear-gradient(135deg, #28a745, #20c997)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px ${isError ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'};
      z-index: 1000;
      animation: messageSlideIn 0.3s ease-out;
      text-align: center;
    ">
      ${message}
    </div>
  `;
  
  // Add animation keyframes if not exists
  if (!document.getElementById('message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
      @keyframes messageSlideIn {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes messageSlideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(messageDiv);
  
  // Remove message after 4 seconds
  setTimeout(() => {
    messageDiv.firstElementChild.style.animation = 'messageSlideOut 0.3s ease-in';
    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 300);
  }, 4000);
}

// Form validation
function validateForm() {
  const errors = [];
  
  // Validar campos requeridos
  const requiredFields = [
    { id: 'email', name: 'Correo electrónico' },
    { id: 'name', name: 'Nombre' },
    { id: 'age', name: 'Edad' },
    { id: 'preferred_drink', name: 'Bebida preferida' },
    { id: 'price_range', name: 'Rango de precio' }
  ];
  
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      errors.push(`${field.name} es requerido`);
    }
  });
  
  // Validar radio buttons requeridos
  const radioGroups = ['gender', 'rum_frequency', 'would_consume_again', 'would_recommend'];
  radioGroups.forEach(groupName => {
    const checked = document.querySelector(`input[name="${groupName}"]:checked`);
    if (!checked) {
      errors.push(`Debes seleccionar una opción para ${groupName.replace('_', ' ')}`);
    }
  });
  
  // Validar edad
  const age = document.getElementById('age');
  if (age && age.value && (parseInt(age.value) < 18 || parseInt(age.value) > 100)) {
    errors.push('La edad debe estar entre 18 y 100 años');
  }
  
  // Validar email
  const email = document.getElementById('email');
  if (email && email.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      errors.push('El formato del email no es válido');
    }
  }
  
  if (errors.length > 0) {
    showMessage('<strong>Errores encontrados:</strong><br>' + errors.join('<br>'), true);
    return false;
  }
  
  // Check if at least some evaluation has been made
  const sliderValues = [];
  sliders.forEach(slider => {
    sliderValues.push(parseInt(slider.value));
  });
  
  // If most sliders are at default value, ask for confirmation
  const defaultValues = sliderValues.filter(value => value === 3 || value === 1);
  if (defaultValues.length >= sliderValues.length * 0.8) {
    if (!confirm('Parece que no has modificado muchas evaluaciones sensoriales. ¿Deseas continuar?')) {
      return false;
    }
  }
  
  return true;
}

// CAPTURA DE DATOS Y ENVIO A LA HOJA DE EXCEL ONLINE
document.addEventListener('DOMContentLoaded', function() {
  const formulario = document.getElementById('rumEvaluationForm');
  const submitBtn = document.getElementById('submitBtn');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  
  // Calcular puntaje inicial
  calculateTotalScore();
  
  if (formulario) {
    formulario.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Validar formulario
      if (!validateForm()) {
        return;
      }

      // Cambiar estado del botón
      buttonText.style.display = 'none';
      loadingSpinner.style.display = 'inline-block';
      submitBtn.disabled = true;

      // Agregar estilos para loading spinner si no existen
      if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
          .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-left: 10px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Recopilar datos del formulario
      const data = {
        // Información básica
        timestamp: new Date().toISOString(),
        email: document.getElementById('email')?.value?.trim() || '',
        nombre: document.getElementById('name')?.value?.trim() || '',
        edad: document.getElementById('age')?.value || '',
        sexo: document.querySelector('input[name="gender"]:checked')?.value || '',
        frecuencia_ron: document.querySelector('input[name="rum_frequency"]:checked')?.value || '',
        bebida_preferida: document.getElementById('preferred_drink')?.value || '',
        telefono: document.getElementById('phone')?.value?.trim() || '',
        
        // Evaluaciones sensoriales (Aroma)
        aroma_general: document.getElementById('general_aroma')?.value || '3',
        intensidad_aromatica: document.getElementById('aroma_intensity')?.value || '3',
        notas_herbales: document.getElementById('herbal_notes')?.value || '1',
        
        // Evaluaciones sensoriales (Sabor)
        primer_contacto: document.getElementById('first_taste')?.value || '3',
        dulzor: document.getElementById('sweetness')?.value || '3',
        retrogusto: document.getElementById('aftertaste')?.value || '3',
        cuerpo: document.getElementById('body')?.value || '3',
        suavidad: document.getElementById('smoothness')?.value || '3',
        
        // Otras evaluaciones
        presencia_madera: document.getElementById('wood_presence')?.value || '1',
        balance_general: document.getElementById('balance')?.value || '3',
        
        // Campos de texto
        sabores_percibidos: document.getElementById('perceived_flavors')?.value?.trim() || '',
        recordo_a: document.getElementById('reminded_of')?.value?.trim() || '',
        
        // Evaluación final
        consumiria_nuevamente: document.querySelector('input[name="would_consume_again"]:checked')?.value || '',
        recomendaria: document.querySelector('input[name="would_recommend"]:checked')?.value || '',
        rango_precio: document.getElementById('price_range')?.value || '',
        
        // Comentarios
        comentarios_cuestionario: document.getElementById('questionnaire_comments')?.value?.trim() || '',
        comentarios_adicionales: document.getElementById('additional_comments')?.value?.trim() || '',
        
        // Puntaje total
        puntaje_total: document.getElementById('total_score')?.textContent || '0'
      };

      // URL Google Apps Script - CAMBIAR POR LA TUYA
      const url = 'https://script.google.com/macros/s/AKfycbzu-8V8G3hv9klYnRhB_b9JQ4XnFWEed4deUf8sgYNRCE0bxoHjzN2QD9DDGhZ6PASv8A/exec';
      

      try {
        console.log('Enviando datos:', data);
        
        const response = await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        console.log('Respuesta enviada');
        
        // Como usamos no-cors, no podemos leer la respuesta
        // Asumimos que fue exitoso si no hay error
        showMessage('<strong>¡Evaluación enviada exitosamente!</strong><br>Gracias por tu participación como especialista 🥃');
        
        // Limpiar formulario
        formulario.reset();
        
        // Resetear sliders a valor por defecto
        sliders.forEach(slider => {
          const defaultValue = slider.id === 'herbal_notes' || slider.id === 'wood_presence' ? '1' : '3';
          slider.value = defaultValue;
          const valueDisplay = document.getElementById(slider.id + '_value');
          if (valueDisplay) {
            valueDisplay.textContent = defaultValue;
          }
        });
        
        // Recalcular puntaje total
        calculateTotalScore();
        
        // Limpiar datos guardados si los hay
        try {
          sessionStorage.removeItem('rumEvaluationDraft');
        } catch (e) {
          console.log('No se pudo limpiar el borrador:', e);
        }

      } catch (error) {
        console.error('Error al enviar:', error);
        showMessage('<strong>Error al enviar la evaluación</strong><br>Por favor, inténtalo de nuevo', true);
      } finally {
        // Restaurar botón
        setTimeout(() => {
          buttonText.style.display = 'inline';
          loadingSpinner.style.display = 'none';
          submitBtn.disabled = false;
        }, 1000);
      }
    });
  }

  // Cargar datos guardados si existen
  loadFormData();
  
  // Auto-guardar cambios (debounced)
  const debouncedSave = debounce(saveFormData, 1000);
  document.addEventListener('input', debouncedSave);
  document.addEventListener('change', debouncedSave);
  
  // Inicializar características específicas para la plataforma
  if (isMobile()) {
    initializeMobileFeatures();
  } else {
    initializeDesktopFeatures();
  }
  
  // Características universales
  initializeAccessibilityFeatures();
});

// Características específicas para móviles - SOLUCIÓN RADICAL
function initializeMobileFeatures() {
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    
    // SOLUCIÓN RADICAL: NO hacer NINGÚN scroll automático
    textarea.addEventListener('focus', function(e) {
      isTextareaFocused = true;
      preventScrollReset = true;
      
      // Guardar posición actual y MANTENERLA
      const currentScrollY = window.scrollY;
      
      // Prevenir cualquier scroll automático del navegador
      setTimeout(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo(0, currentScrollY);
        }
      }, 0);
      
      setTimeout(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo(0, currentScrollY);
        }
      }, 10);
      
      setTimeout(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo(0, currentScrollY);
        }
      }, 50);
      
      setTimeout(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo(0, currentScrollY);
        }
      }, 100);
    });
    
    textarea.addEventListener('blur', function() {
      isTextareaFocused = false;
      
      setTimeout(() => {
        preventScrollReset = false;
      }, 500);
    });
    
    // Prevenir scroll en todos los eventos del textarea
    textarea.addEventListener('input', function(e) {
      e.stopPropagation();
    });
    
    textarea.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    textarea.addEventListener('touchstart', function(e) {
      e.stopPropagation();
    });
  });
  
  // Elementos sin animaciones
  document.querySelectorAll('.section, .slider-group').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
}

// Características específicas para desktop
function initializeDesktopFeatures() {
  // Animaciones de scroll solo en desktop
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Solo agregar animaciones si el usuario no prefiere movimiento reducido
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.section, .slider-group').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'all 0.6s ease';
      observer.observe(el);
    });
  } else {
    // Mostrar elementos inmediatamente si se prefiere movimiento reducido
    document.querySelectorAll('.section, .slider-group').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }
  
  // Efectos hover más elaborados para desktop
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach(option => {
    option.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    
    option.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
    
    option.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'translateY(-2px)';
      }, 100);
    });
  });
}

// Características de accesibilidad universales
function initializeAccessibilityFeatures() {
  // Mejoras de navegación por teclado para sliders
  sliders.forEach(slider => {
    slider.addEventListener('keydown', function(e) {
      const step = 1;
      const currentValue = parseInt(this.value);
      const min = parseInt(this.min);
      const max = parseInt(this.max);
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          if (currentValue > min) {
            this.value = currentValue - step;
            this.dispatchEvent(new Event('input'));
          }
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          if (currentValue < max) {
            this.value = currentValue + step;
            this.dispatchEvent(new Event('input'));
          }
          break;
        case 'Home':
          e.preventDefault();
          this.value = min;
          this.dispatchEvent(new Event('input'));
          break;
        case 'End':
          e.preventDefault();
          this.value = max;
          this.dispatchEvent(new Event('input'));
          break;
      }
    });
    
    // Agregar etiquetas ARIA para lectores de pantalla
    const sliderGroup = slider.closest('.slider-group');
    if (sliderGroup) {
      const label = sliderGroup.querySelector('.slider-label')?.textContent || 'Slider';
      slider.setAttribute('aria-label', label);
      slider.setAttribute('aria-valuemin', slider.min);
      slider.setAttribute('aria-valuemax', slider.max);
      
      // Actualizar aria-valuenow cuando cambie el slider
      slider.addEventListener('input', function() {
        this.setAttribute('aria-valuenow', this.value);
      });
      
      // Establecer aria-valuenow inicial
      slider.setAttribute('aria-valuenow', slider.value);
    }
  });
  
  // Indicadores de foco para radio buttons
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('focus', function() {
      const radioOption = this.closest('.radio-option');
      if (radioOption) {
        radioOption.style.outline = '2px solid var(--primary-brown)';
        radioOption.style.outlineOffset = '2px';
      }
    });
    
    radio.addEventListener('blur', function() {
      const radioOption = this.closest('.radio-option');
      if (radioOption) {
        radioOption.style.outline = 'none';
      }
    });
  });
  
  // Indicador de foco para selects
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    select.addEventListener('focus', function() {
      this.style.outline = '2px solid var(--primary-brown)';
      this.style.outlineOffset = '2px';
    });
    
    select.addEventListener('blur', function() {
      this.style.outline = 'none';
    });
  });
  
  // Agregar ID de contenido principal
  const container = document.querySelector('.container');
  if (container) {
    container.id = 'main-content';
    container.setAttribute('tabindex', '-1');
  }
}

// Manejar cambios de orientación - CORREGIDO
function handleOrientationChange() {
  if (isMobile() && !preventScrollReset) {
    // Comportamiento más conservador en móviles
    setTimeout(() => {
      // Solo actualizar valores de sliders, NO hacer scroll
      sliders.forEach(slider => {
        const valueDisplay = document.getElementById(slider.id + '_value');
        if (valueDisplay) {
          valueDisplay.textContent = slider.value;
        }
      });
      calculateTotalScore();
    }, 200);
  } else if (!isMobile()) {
    // En desktop, comportamiento normal
    setTimeout(() => {
      sliders.forEach(slider => {
        slider.dispatchEvent(new Event('input'));
      });
    }, 100);
  }
}

// Event listeners para cambios de orientación - CORREGIDO
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', debounce(handleOrientationChange, 300));

// Prevenir scroll automático no deseado en móviles - SOLUCIÓN RADICAL
if (isMobile()) {
  let lastScrollY = 0;
  let isUserScrolling = false;
  let scrollTimer = null;
  
  // Interceptar TODOS los intentos de scroll automático
  window.addEventListener('scroll', function(e) {
    const currentScrollY = window.scrollY;
    
    // Si el scroll cambió y no fue por el usuario
    if (!isUserScrolling && isTextareaFocused) {
      // FORZAR a mantener la posición
      e.preventDefault();
      window.scrollTo(0, lastScrollY);
      return false;
    }
    
    // Si es scroll del usuario, actualizar la posición válida
    if (isUserScrolling) {
      lastScrollY = currentScrollY;
    }
  }, { passive: false });
  
  // Detectar scroll del usuario vs automático
  window.addEventListener('touchstart', function() {
    isUserScrolling = true;
    lastScrollY = window.scrollY;
  }, { passive: true });
  
  window.addEventListener('touchend', function() {
    setTimeout(() => {
      isUserScrolling = false;
    }, 100);
  }, { passive: true });
  
  // Prevenir scroll por teclado virtual
  window.addEventListener('resize', function() {
    if (isTextareaFocused) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        window.scrollTo(0, lastScrollY);
      }, 10);
    }
  });
  
  // Interceptar focusin para prevenir scroll automático del navegador
  document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'TEXTAREA') {
      lastScrollY = window.scrollY;
      
      // Prevenir el comportamiento por defecto de scroll
      setTimeout(() => {
        window.scrollTo(0, lastScrollY);
      }, 0);
    }
  });
  
  // Prevenir comportamientos problemáticos adicionales
  document.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'TEXTAREA') {
      // Mantener posición al perder foco
      setTimeout(() => {
        window.scrollTo(0, lastScrollY);
      }, 10);
    }
  });
}

// Función debounce para limitar frecuencia de eventos
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Guardar datos del formulario para prevenir pérdida en actualización accidental
function saveFormData() {
  const formData = {
    // Información básica
    email: document.getElementById('email')?.value || '',
    name: document.getElementById('name')?.value || '',
    age: document.getElementById('age')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    preferred_drink: document.getElementById('preferred_drink')?.value || '',
    
    // Evaluaciones sensoriales
    general_aroma: document.getElementById('general_aroma')?.value || '3',
    aroma_intensity: document.getElementById('aroma_intensity')?.value || '3',
    herbal_notes: document.getElementById('herbal_notes')?.value || '1',
    first_taste: document.getElementById('first_taste')?.value || '3',
    sweetness: document.getElementById('sweetness')?.value || '3',
    aftertaste: document.getElementById('aftertaste')?.value || '3',
    body: document.getElementById('body')?.value || '3',
    smoothness: document.getElementById('smoothness')?.value || '3',
    wood_presence: document.getElementById('wood_presence')?.value || '1',
    balance: document.getElementById('balance')?.value || '3',
    
    // Campos de texto
    perceived_flavors: document.getElementById('perceived_flavors')?.value || '',
    reminded_of: document.getElementById('reminded_of')?.value || '',
    questionnaire_comments: document.getElementById('questionnaire_comments')?.value || '',
    additional_comments: document.getElementById('additional_comments')?.value || '',
    
    // Radio buttons
    gender: document.querySelector('input[name="gender"]:checked')?.value || '',
    rum_frequency: document.querySelector('input[name="rum_frequency"]:checked')?.value || '',
    would_consume_again: document.querySelector('input[name="would_consume_again"]:checked')?.value || '',
    would_recommend: document.querySelector('input[name="would_recommend"]:checked')?.value || '',
    
    // Select
    price_range: document.getElementById('price_range')?.value || ''
  };
  
  // Usar sessionStorage (funciona en el navegador)
  try {
    sessionStorage.setItem('rumEvaluationDraft', JSON.stringify(formData));
  } catch (e) {
    console.log('No se pudo guardar el borrador:', e);
  }
}

// Cargar datos guardados del formulario
function loadFormData() {
  try {
    const savedData = sessionStorage.getItem('rumEvaluationDraft');
    if (savedData) {
      const formData = JSON.parse(savedData);
      
      // Restaurar valores de campos de texto
      Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
          if (element.type === 'range') {
            element.value = formData[key];
            element.dispatchEvent(new Event('input'));
          } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            element.value = formData[key];
          }
        }
      });
      
      // Restaurar valores de radio buttons
      Object.keys(formData).forEach(key => {
        if (formData[key] && ['gender', 'rum_frequency', 'would_consume_again', 'would_recommend'].includes(key)) {
          const radio = document.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
          if (radio) radio.checked = true;
        }
      });
      
      // Recalcular puntaje total
      calculateTotalScore();
    }
  } catch (e) {
    console.log('No se pudo cargar el borrador:', e);
  }
}

// Función global para enviar evaluación (mantener compatibilidad)
function submitEvaluation() {
  const form = document.getElementById('rumEvaluationForm');
  if (form) {
    form.dispatchEvent(new Event('submit'));
  }
}

// Hacer funciones disponibles globalmente si es necesario
window.submitEvaluation = submitEvaluation;