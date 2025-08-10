
const scene = document.querySelector('a-scene');
const model = document.getElementById('model');
const loading = document.getElementById('loading');
const tooltip = document.getElementById('model-tooltip');
const arButton = document.getElementById('ar-button');

const modelData = {
  'DIAFRAGMABEYMA': { name: 'DIAFRAGMA BEYMA MOD. R-12KX', path: 'models/DIAFRAGMABEYMA.glb' },
  'FLAUTA4_opt': { name: 'Flauta Yamaha', path: 'models/FLAUTA4_opt.glb' },
  'GUIRO3_opt': { name: 'Güiro', path: 'models/GUIRO3_opt.glb' },
  'pandero': { name: 'Pandero Remo Ta-9208-18', path: 'models/pandero.glb' }
};

// Posiciones y escalas personalizadas para cada modelo en AR
const modelPositions = {
  'DIAFRAGMABEYMA': { x: 0, y: 0, z: 0, scale: 1 },
  'FLAUTA4_opt': { x: 0, y: 0.1, z: 0, scale: 1.2 },
  'GUIRO3_opt': { x: 0.1, y: 0, z: 0, scale: 0.9 },
  'pandero': { x: -0.1, y: 0, z: 0, scale: 1 }
};

// Posiciones y escalas para inspección PC
const fixedPositions = {
  'DIAFRAGMABEYMA': { x: 0, y:1
  , z:-2,
    
    
    scale:0.5}, 
  'FLAUTA4_opt': { x: 0.5, y: 1, z: -2, scale: 1.2 },
  'GUIRO3_opt': { x: -0.5, y: 1, z: -2, scale: 0.9 },
  'pandero': { x: 0, y: 1, z: -2, scale: 1 }
};

let currentModelName = 'DIAFRAGMABEYMA';
let arModeActive = false;
let modelPlaced = false;

function switchSrc(element, name) {
  const modelInfo = modelData[name];
  if (!modelInfo) return;

  currentModelName = name;
  loading.style.display = 'block';

  model.setAttribute('gltf-model', modelInfo.path);
  model.setAttribute('visible', false);

  if (tooltip) tooltip.textContent = modelInfo.name;

  document.querySelectorAll('.slide').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');

  modelPlaced = false;

  if (arModeActive) {
    model.setAttribute('visible', false);
  } else {
    // Posición y escala fija para PC
    const pos = fixedPositions[currentModelName] || { x: 0, y: 1, z: -2, scale: 1 };
    model.object3D.position.set(pos.x, pos.y, pos.z);
    model.object3D.scale.set(pos.scale, pos.scale, pos.scale);
    model.setAttribute('visible', true);
  }
}

window.switchSrc = switchSrc;

model.addEventListener('model-loaded', () => {
  loading.style.display = 'none';

  if (!arModeActive) {
    model.setAttribute('visible', true);
    const pos = fixedPositions[currentModelName] || { x: 0, y: 1, z: -2, scale: 1 };
    model.object3D.position.set(pos.x, pos.y, pos.z);
    model.object3D.scale.set(pos.scale, pos.scale, pos.scale);
  }
});

function placeModelOnHit(hit) {
  const pose = hit.getPose(scene.renderer.xr.getReferenceSpace());
  if (!pose) return;

  const pos = pose.transform.position;
  const offset = modelPositions[currentModelName] || { x: 0, y: 0, z: 0, scale: 1 };

  model.object3D.position.set(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z);
  model.object3D.rotation.set(0, THREE.Math.degToRad(180), 0);
  model.object3D.scale.set(offset.scale, offset.scale, offset.scale);

  model.setAttribute('visible', true);
  modelPlaced = true;
  loading.style.display = 'none';
}

arButton.addEventListener('click', async () => {
  if (!scene.is('ar-mode')) {
    try {
      await scene.enterAR();

      arModeActive = true;
      modelPlaced = false;
      loading.style.display = 'block';

      model.setAttribute('gltf-model', modelData[currentModelName].path);
      model.setAttribute('visible', false);

      const session = scene.renderer.xr.getSession();

      session.addEventListener('select', (event) => {
        if (modelPlaced) return;

        const frame = event.frame;
        const hitTestResults = frame.getHitTestResults(event.inputSource.targetRaySpace);
        if (hitTestResults.length > 0) {
          placeModelOnHit(hitTestResults[0]);
        }
      });

    } catch (e) {
      alert('No se pudo activar AR en este dispositivo.');
      console.error(e);
    }
  } else {
    await scene.exitAR();
    arModeActive = false;
    modelPlaced = false;

    const pos = fixedPositions[currentModelName] || { x: 0, y: 1, z: -2, scale: 1 };
    model.object3D.position.set(pos.x, pos.y, pos.z);
    model.object3D.scale.set(pos.scale, pos.scale, pos.scale);
    model.setAttribute('visible', true);

    if (!sessionStorage.getItem('ratingShown')) {
      const modal = document.getElementById('customRatingModal');
      modal.hidden = false;
      sessionStorage.setItem('ratingShown', 'true');

      gtag('event', 'rating_modal_shown', {
        event_category: 'Modal',
        event_label: 'Modal mostrado al salir de AR',
        source: document.referrer.includes('unisoundimusa.com') ? 'desde_unisoundimusa' : 'directo'
      });
    }
  }
});

// Eventos para modales y botones
document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('backButton');
  const goButton = document.getElementById('goButton');
  const modal = document.getElementById('customRatingModal');
  const closeBtn = document.getElementById('closeCustomModal');
  const cancelBtn = document.getElementById('cancelCustomBtn');
  const submitBtn = document.getElementById('submitCustomBtn');
  const ratingButtons = modal.querySelectorAll('.rating-buttons button');

  let currentRating = 0;
  const referrer = document.referrer;
  const originSource = referrer.includes('unisoundimusa.com') ? 'desde_unisoundimusa' : 'directo';

  if (referrer.includes('unisoundimusa.com')) {
    backButton.style.display = 'block';
    backButton.addEventListener('click', e => {
      e.preventDefault();
      gtag('event', 'back_button_click', {
        event_category: 'Botón',
        event_label: 'Volver al sitio desde experiencia AR',
        source: originSource
      });
      window.location.href = 'https://unisoundimusa.com/';
    });
  }

  if (!referrer || !referrer.includes('unisoundimusa.com')) {
    goButton.style.display = 'block';
    goButton.addEventListener('click', e => {
      e.preventDefault();
      gtag('event', 'go_button_click', {
        event_category: 'Botón',
        event_label: 'Visitar sitio desde experiencia directa',
        source: originSource
      });
      window.location.href = 'https://unisoundimusa.com/';
    });
  }

  function clearRating() {
    currentRating = 0;
    ratingButtons.forEach(btn => btn.classList.remove('selected'));
  }

  closeBtn.addEventListener('click', () => {
    modal.hidden = true;
  });

  cancelBtn.addEventListener('click', () => {
    gtag('event', 'ar_rating_cancelled', {
      event_category: 'Calificación',
      event_label: 'Cancelación sin calificar',
      source: originSource
    });
    modal.hidden = true;
  });

  submitBtn.addEventListener('click', () => {
    if (currentRating === 0) {
      alert('Por favor, selecciona una calificación antes de enviar.');
      return;
    }
    gtag('event', 'ar_rating_submitted', {
      event_category: 'Calificación',
      event_label: `Rating ${currentRating} estrellas`,
      value: currentRating,
      source: originSource
    });
    modal.hidden = true;
  });

  ratingButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedRating = parseInt(button.dataset.rating);
      if (currentRating === selectedRating) {
        button.classList.remove('selected');
        currentRating = 0;
      } else {
        ratingButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        currentRating = selectedRating;
      }
    });
  });
});

// Modal de compatibilidad
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('compatibilityModal');
  const acceptBtn = document.getElementById('acceptCompatibilityBtn');

  if (!sessionStorage.getItem('compatibilityAccepted')) {
    modal.hidden = false;
  }

  acceptBtn.addEventListener('click', () => {
    modal.hidden = true;
    sessionStorage.setItem('compatibilityAccepted', 'true');
  });
});


