// Update slider values in real time
const sliders = document.querySelectorAll('.slider');
sliders.forEach(slider => {
  const valueDisplay = document.getElementById(slider.id + 'Value');
  
  slider.addEventListener('input', function() {
    valueDisplay.textContent = this.value;
  });
});

// Show message function
function showMessage(message, isError = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isError ? 'error-message' : 'success-message';
  messageDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? 'linear-gradient(135deg, #dc3545, #c82333)' : 'linear-gradient(135deg, #28a745, #20c997)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px ${isError ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'};
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    ">
      ${message}
    </div>
  `;
  
  // Add animation keyframes if not exists
  if (!document.getElementById('message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(messageDiv);
  
  // Remove message after 4 seconds
  setTimeout(() => {
    messageDiv.firstElementChild.style.animation = 'slideOut 0.3s ease-in';
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
        color: document.getElementById('color').value,
        aromaInicial: document.getElementById('aromaInicial').value,
        aromasBoca: document.getElementById('aromasBoca').value,
        saborEntrada: document.getElementById('saborEntrada').value,
        saborRetrogusto: document.getElementById('saborRetrogusto').value,
        persistencia: document.getElementById('persistencia').value,
        notas: document.getElementById('notas').value.trim(),
        artesanal: document.querySelector('input[name="artesanal"]:checked')?.value || 'No especificado',
        habitual: document.querySelector('input[name="habitual"]:checked')?.value || 'No especificado',
        preferencia: document.getElementById('preferencia').value || 'No especificado'
      };

      // Validación de notas
      if (!data.notas) {
        if (!confirm('¿Estás seguro de enviar la evaluación sin notas del catador?')) {
          // Restaurar botón
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          document.getElementById('notas').focus();
          return;
        }
      }

      // URL de tu Google Apps Script
      const url = 'https://script.google.com/macros/s/AKfycbw8Zn4QBeMWAwQSmr82LEahHooPq6gxUHMznr9GlxQwHfuvx3d-XR3WFU-EAR66cHuMfw/exec';

      try {
        console.log('Enviando datos:', data);
        
        const response = await fetch(url, {
          method: 'POST',
          mode: 'no-cors', // Importante para Apps Script
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        // Como usamos no-cors, no podemos leer la respuesta
        // Pero si llegamos aquí sin error, asumimos que fue exitoso
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
});

// Add smooth animations on scroll
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

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Only add animations if user doesn't prefer reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.section, .slider-group').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'all 0.6s ease';
      observer.observe(el);
    });
  }
  
  // Accessibility improvements
  addAccessibilityFeatures();
});

// Accessibility features
function addAccessibilityFeatures() {
  // Add keyboard navigation for sliders
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
    
    // Add ARIA labels for better screen reader support
    const sliderGroup = slider.closest('.slider-group');
    if (sliderGroup) {
      const label = sliderGroup.querySelector('.slider-label').textContent;
      slider.setAttribute('aria-label', label);
      slider.setAttribute('aria-valuemin', slider.min);
      slider.setAttribute('aria-valuemax', slider.max);
      
      // Update aria-valuenow when slider changes
      slider.addEventListener('input', function() {
        this.setAttribute('aria-valuenow', this.value);
      });
      
      // Set initial aria-valuenow
      slider.setAttribute('aria-valuenow', slider.value);
    }
  });
  
  // Add focus indicators for radio buttons
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('focus', function() {
      const radioOption = this.closest('.radio-option');
      if (radioOption) {
        radioOption.style.outline = '2px solid var(--primary-brown)';
      }
    });
    
    radio.addEventListener('blur', function() {
      const radioOption = this.closest('.radio-option');
      if (radioOption) {
        radioOption.style.outline = 'none';
      }
    });
  });
  
  // Add focus indicator for select
  const select = document.getElementById('preferencia');
  if (select) {
    select.addEventListener('focus', function() {
      this.style.outline = '2px solid var(--primary-brown)';
    });
    
    select.addEventListener('blur', function() {
      this.style.outline = 'none';
    });
  }
  
  // Add skip link for keyboard users
  addSkipLink();
}

// Add skip link for keyboard navigation
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
  
  // Add main content ID
  const container = document.querySelector('.container');
  if (container) {
    container.id = 'main-content';
    container.setAttribute('tabindex', '-1');
  }
}

// Handle device orientation changes
function handleOrientationChange() {
  // Force recalculation of viewport on mobile devices
  setTimeout(() => {
    window.scrollTo(0, 0);
    
    // Recalculate slider positions if needed
    sliders.forEach(slider => {
      slider.dispatchEvent(new Event('input'));
    });
  }, 100);
}

// Add event listeners for orientation change
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', debounce(handleOrientationChange, 250));

// Debounce function to limit resize event frequency
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

// Save form data to prevent loss on accidental refresh
function saveFormData() {
  const formData = {
    color: document.getElementById('color').value,
    aromaInicial: document.getElementById('aromaInicial').value,
    aromasBoca: document.getElementById('aromasBoca').value,
    saborEntrada: document.getElementById('saborEntrada').value,
    saborRetrogusto: document.getElementById('saborRetrogusto').value,
    persistencia: document.getElementById('persistencia').value,
    notas: document.getElementById('notas').value,
    artesanal: document.querySelector('input[name="artesanal"]:checked')?.value || '',
    habitual: document.querySelector('input[name="habitual"]:checked')?.value || '',
    preferencia: document.getElementById('preferencia').value
  };
  
  // Using sessionStorage (funciona en el navegador)
  try {
    sessionStorage.setItem('ronEvaluationDraft', JSON.stringify(formData));
  } catch (e) {
    console.log('No se pudo guardar el borrador:', e);
  }
}

// Load saved form data
function loadFormData() {
  try {
    const savedData = sessionStorage.getItem('ronEvaluationDraft');
    if (savedData) {
      const formData = JSON.parse(savedData);
      
      // Restore slider values
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
      
      // Restore radio button values
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