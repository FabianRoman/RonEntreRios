// Ron Entre Ríos - Script optimizado para móviles (SIN BUGS DE SCROLL)
// Detectar si es dispositivo móvil
const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;

// Variables globales para controlar scroll
let isTextareaFocused = false;
let originalScrollY = 0;
let preventScrollReset = false;

// Update slider values in real time
const sliders = document.querySelectorAll('.slider');
sliders.forEach(slider => {
  const valueDisplay = document.getElementById(slider.id + 'Value');
  
  slider.addEventListener('input', function() {
    if (valueDisplay) {
      valueDisplay.textContent = this.value;
    }
  });
});

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
  
  // Check if at least some evaluation has been made
  const sliderValues = [];
  sliders.forEach(slider => {
    sliderValues.push(parseInt(slider.value));
  });
  
  // If all sliders are at default value (3), ask for confirmation
  const allDefault = sliderValues.every(value => value === 3);
  if (allDefault) {
    if (!confirm('Parece que no has modificado ninguna evaluación sensorial. ¿Deseas continuar?')) {
      return false;
    }
  }
  
  return true;
}

// CAPTURA DE DATOS Y ENVIO A LA HOJA DE EXCEL ONLINE
document.addEventListener('DOMContentLoaded', function() {
  const formulario = document.getElementById('formulario');
  const submitBtn = document.getElementById('submitBtn');
  
  if (formulario) {
    formulario.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Validar formulario
      if (!validateForm()) {
        return;
      }

      // Cambiar estado del botón
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="loading"></span>Enviando...';
      submitBtn.disabled = true;

      // Agregar estilos para loading spinner si no existen
      if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
          .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Recopilar datos del formulario
      const data = {
        timestamp: new Date().toISOString(),
        color: document.getElementById('color')?.value || '3',
        aromaInicial: document.getElementById('aromaInicial')?.value || '3',
        aromasBoca: document.getElementById('aromasBoca')?.value || '3',
        saborEntrada: document.getElementById('saborEntrada')?.value || '3',
        saborRetrogusto: document.getElementById('saborRetrogusto')?.value || '3',
        persistencia: document.getElementById('persistencia')?.value || '3',
        notas: document.getElementById('notas')?.value.trim() || '',
        artesanal: document.querySelector('input[name="artesanal"]:checked')?.value || 'No especificado',
        habitual: document.querySelector('input[name="habitual"]:checked')?.value || 'No especificado',
        preferencia: document.getElementById('preferencia')?.value || 'No especificado'
      };

      // Validación de notas
      if (!data.notas) {
        if (!confirm('¿Estás seguro de enviar la evaluación sin notas del catador?')) {
          // Restaurar botón
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          document.getElementById('notas')?.focus();
          return;
        }
      }

      // URL de tu Google Apps Script
      const url = 'https://script.google.com/macros/s/AKfycbw8Zn4QBeMWAwQSmr82LEahHooPq6gxUHMznr9GlxQwHfuvx3d-XR3WFU-EAR66cHuMfw/exec';

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
        
        // Mostrar mensaje de éxito
        showMessage('<strong>¡Evaluación enviada exitosamente!</strong><br>Gracias por tu participación 🥃');
        
        // Limpiar formulario
        formulario.reset();
        
        // Resetear sliders a valor por defecto
        sliders.forEach(slider => {
          slider.value = 3;
          const valueDisplay = document.getElementById(slider.id + 'Value');
          if (valueDisplay) {
            valueDisplay.textContent = '3';
          }
        });
        
        // Limpiar datos guardados si los hay
        try {
          sessionStorage.removeItem('ronEvaluationDraft');
        } catch (e) {
          console.log('No se pudo limpiar el borrador:', e);
        }

      } catch (error) {
        console.error('Error al enviar:', error);
        showMessage('<strong>Error al enviar la evaluación</strong><br>Por favor, inténtalo de nuevo', true);
      } finally {
        // Restaurar botón
        setTimeout(() => {
          submitBtn.textContent = originalText;
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

// Características específicas para móviles - CORREGIDO
function initializeMobileFeatures() {
  // NO modificar el viewport de manera tan restrictiva
  // Esto podría estar causando problemas
  
  // Manejo CORREGIDO del textarea en móviles
  const textarea = document.getElementById('notas');
  if (textarea) {
    
    textarea.addEventListener('focus', function() {
      isTextareaFocused = true;
      originalScrollY = window.scrollY;
      preventScrollReset = true;
      
      // Scroll más suave y controlado
      setTimeout(() => {
        if (isTextareaFocused) {
          const rect = this.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Solo hacer scroll si realmente es necesario
          if (rect.top < 50 || rect.bottom > windowHeight - 50) {
            const targetY = window.scrollY + rect.top - (windowHeight * 0.3);
            
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth'
            });
          }
        }
      }, 150); // Reducido el tiempo de espera
    });
    
    textarea.addEventListener('blur', function() {
      isTextareaFocused = false;
      
      // NO hacer scroll automático al perder foco
      // Esto era una de las causas principales del problema
      setTimeout(() => {
        preventScrollReset = false;
      }, 300);
    });
    
    // Prevenir scroll no deseado en cambios de input
    textarea.addEventListener('input', function(e) {
      e.stopPropagation();
    });
  }
  
  // Elementos sin animaciones para evitar problemas de rendimiento
  document.querySelectorAll('.section, .slider-group').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  
  // Prevenir scroll accidental en iOS
  document.addEventListener('touchmove', function(e) {
    if (isTextareaFocused && e.target !== textarea) {
      // Solo prevenir si no es el textarea que está siendo usado
      if (!e.target.closest('#notas')) {
        e.preventDefault();
      }
    }
  }, { passive: false });
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
  
  // Indicador de foco para select
  const select = document.getElementById('preferencia');
  if (select) {
    select.addEventListener('focus', function() {
      this.style.outline = '2px solid var(--primary-brown)';
      this.style.outlineOffset = '2px';
    });
    
    select.addEventListener('blur', function() {
      this.style.outline = 'none';
    });
  }
  
  // Agregar enlace de salto para usuarios de teclado
  addSkipLink();
}

// Agregar enlace de salto para navegación por teclado
function addSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Saltar al contenido principal';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary-brown);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', function() {
    this.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', function() {
    this.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
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
        const valueDisplay = document.getElementById(slider.id + 'Value');
        if (valueDisplay) {
          valueDisplay.textContent = slider.value;
        }
      });
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

// Prevenir scroll automático no deseado en móviles
if (isMobile()) {
  // Interceptar intentos de scroll automático problemáticos
  let isScrolling = false;
  
  window.addEventListener('scroll', function() {
    if (!isScrolling && !isTextareaFocused && !preventScrollReset) {
      isScrolling = true;
      setTimeout(() => {
        isScrolling = false;
      }, 100);
    }
  }, { passive: true });
  
  // Prevenir scroll a la parte superior por defecto en algunos eventos
  document.addEventListener('focusin', function(e) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
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
    color: document.getElementById('color')?.value || '3',
    aromaInicial: document.getElementById('aromaInicial')?.value || '3',
    aromasBoca: document.getElementById('aromasBoca')?.value || '3',
    saborEntrada: document.getElementById('saborEntrada')?.value || '3',
    saborRetrogusto: document.getElementById('saborRetrogusto')?.value || '3',
    persistencia: document.getElementById('persistencia')?.value || '3',
    notas: document.getElementById('notas')?.value || '',
    artesanal: document.querySelector('input[name="artesanal"]:checked')?.value || '',
    habitual: document.querySelector('input[name="habitual"]:checked')?.value || '',
    preferencia: document.getElementById('preferencia')?.value || ''
  };
  
  // Usar sessionStorage (funciona en el navegador)
  try {
    sessionStorage.setItem('ronEvaluationDraft', JSON.stringify(formData));
  } catch (e) {
    console.log('No se pudo guardar el borrador:', e);
  }
}

// Cargar datos guardados del formulario
function loadFormData() {
  try {
    const savedData = sessionStorage.getItem('ronEvaluationDraft');
    if (savedData) {
      const formData = JSON.parse(savedData);
      
      // Restaurar valores de sliders
      Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element && element.type === 'range') {
          element.value = formData[key];
          element.dispatchEvent(new Event('input'));
        } else if (element && element.tagName === 'TEXTAREA') {
          element.value = formData[key];
        } else if (element && element.tagName === 'SELECT') {
          element.value = formData[key];
        }
      });
      
      // Restaurar valores de radio buttons
      if (formData.artesanal) {
        const artesanalRadio = document.querySelector(`input[name="artesanal"][value="${formData.artesanal}"]`);
        if (artesanalRadio) artesanalRadio.checked = true;
      }
      
      if (formData.habitual) {
        const habitualRadio = document.querySelector(`input[name="habitual"][value="${formData.habitual}"]`);
        if (habitualRadio) habitualRadio.checked = true;
      }
    }
  } catch (e) {
    console.log('No se pudo cargar el borrador:', e);
  }
}

// Función global para enviar evaluación (mantener compatibilidad)
function submitEvaluation() {
  const form = document.getElementById('formulario');
  if (form) {
    form.dispatchEvent(new Event('submit'));
  }
}

// Hacer funciones disponibles globalmente si es necesario
window.submitEvaluation = submitEvaluation;