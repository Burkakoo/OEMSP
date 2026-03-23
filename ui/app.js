/* app.js — EduSphere Dashboard Interactions */

/* =========================================
   SIDEBAR TOGGLE
   ========================================= */
const sidebar   = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

menuToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 900 &&
      !sidebar.contains(e.target) &&
      !menuToggle.contains(e.target) &&
      sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
});

/* =========================================
   NAV ITEM ACTIVE STATE
   ========================================= */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

/* =========================================
   ANIMATED STAT COUNTERS
   ========================================= */
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  counterObserver.observe(el);
});

/* =========================================
   QUIZ MODAL
   ========================================= */
const quizModal  = document.getElementById('quizModal');
const closeModal = document.getElementById('closeModal');
const modalDesc  = document.getElementById('modalDesc');
const modalStart = document.getElementById('modalStart');

const quizData = {
  quiz1: { title: 'React Hooks Deep Dive', questions: 10, time: 30 },
  quiz2: { title: 'MongoDB Aggregations',  questions: 8,  time: 20 },
};

function openQuizModal(key) {
  const q = quizData[key];
  if (!q) return;
  modalDesc.textContent = `${q.title} — ${q.questions} questions, ${q.time} minutes. Good luck!`;
  quizModal.classList.add('open');
}

document.getElementById('startQuiz1')?.addEventListener('click', () => openQuizModal('quiz1'));
document.getElementById('startQuiz2')?.addEventListener('click', () => openQuizModal('quiz2'));
closeModal?.addEventListener('click', () => quizModal.classList.remove('open'));
quizModal?.addEventListener('click', (e) => {
  if (e.target === quizModal) quizModal.classList.remove('open');
});
modalStart?.addEventListener('click', () => {
  quizModal.classList.remove('open');
  showToast('🚀 Quiz started! Good luck, Abebe!');
});

/* =========================================
   TOAST NOTIFICATIONS
   ========================================= */
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(message, duration = 3500) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* =========================================
   HERO CTA BUTTONS
   ========================================= */
document.getElementById('continueBtn')?.addEventListener('click', () => {
  showToast('▶ Resuming React Mastery — Module 5');
});
document.getElementById('exploreBtn')?.addEventListener('click', () => {
  showToast('🔍 Opening course catalog…');
});

/* =========================================
   ENROLL BUTTONS
   ========================================= */
const enrollMessages = {
  'enroll-ts':     '🎓 Enrolled in TypeScript for React Developers!',
  'enroll-devops': '🎓 Enrolled in Docker & Kubernetes Essentials!',
  'enroll-ai':     '🎓 Enrolled in Python for Machine Learning!',
};
Object.entries(enrollMessages).forEach(([id, msg]) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.textContent = '✓ Enrolled!';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    btn.disabled = true;
    showToast(msg);
  });
});

/* =========================================
   PLAY BUTTONS (COURSE CONTINUE)
   ========================================= */
const courseMessages = {
  'course-react': '▶ Continuing React Mastery — Lesson 17',
  'course-node':  '▶ Continuing Node.js APIs — Lesson 9',
  'course-mongo': '▶ Continuing MongoDB Design — Lesson 14',
  'course-ui':    '▶ Continuing UI/UX Principles — Lesson 5',
};
Object.entries(courseMessages).forEach(([id, msg]) => {
  document.querySelectorAll(`#${id} .play-btn`).forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast(msg);
    });
  });
});

/* =========================================
   NOTIFICATION BELL
   ========================================= */
document.getElementById('notifBtn')?.addEventListener('click', () => {
  showToast('🔔 You have 3 new notifications');
});

/* =========================================
   SEARCH INTERACTION
   ========================================= */
const search = document.getElementById('globalSearch');
let searchTimer;
search?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  if (search.value.length > 2) {
    searchTimer = setTimeout(() => {
      showToast(`🔍 Searching for "${search.value}"…`);
    }, 600);
  }
});

/* =========================================
   KEYBOARD SHORTCUT: ESC closes modal
   ========================================= */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') quizModal.classList.remove('open');
});

/* =========================================
   PROGRESS BAR ENTRANCE ANIMATION
   ========================================= */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.transition = 'width 1.2s cubic-bezier(.4,0,.2,1)';
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.progress-fill').forEach(el => barObserver.observe(el));
