// ═══════════════════════════════════════════════════════════════════════
//  AttendX – Student Attendance Management System
//  app.js – Main Application Logic
// ═══════════════════════════════════════════════════════════════════════

// ─── STATE ──────────────────────────────────────────────────────────────
let state = {
  students: [],
  attendance: {},   // { "YYYY-MM-DD": { studentId: "P"|"A"|"L" } }
  classes: ['Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B', 'Class 11-A', 'Class 12-A'],
  currentView: 'dashboard',
  editingStudentId: null,
  credentials: { username: 'admin', password: 'admin123' }
};

let trendChart = null;
let classChart = null;

// ─── HELPERS ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().split('T')[0];

const COLORS = [
  '#6366f1','#10b981','#f59e0b','#f43f5e','#38bdf8','#a78bfa','#34d399','#fb923c',
  '#e879f9','#22d3ee','#4ade80','#fbbf24'
];

function avatarColor(name) {
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function initials(name) {
  return name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function pct(n, d) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ─── LOCAL STORAGE ───────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('attendx_students',   JSON.stringify(state.students));
  localStorage.setItem('attendx_attendance', JSON.stringify(state.attendance));
  localStorage.setItem('attendx_classes',    JSON.stringify(state.classes));
  localStorage.setItem('attendx_credentials',JSON.stringify(state.credentials));
}

function loadState() {
  try {
    const s  = localStorage.getItem('attendx_students');
    const a  = localStorage.getItem('attendx_attendance');
    const cl = localStorage.getItem('attendx_classes');
    const cr = localStorage.getItem('attendx_credentials');
    if (s)  state.students    = JSON.parse(s);
    if (a)  state.attendance  = JSON.parse(a);
    if (cl) state.classes     = JSON.parse(cl);
    if (cr) state.credentials = JSON.parse(cr);
  } catch(e) { console.error(e); }
}

// ─── SEED DATA ────────────────────────────────────────────────────────
function seedData() {
  if (state.students.length > 0) return;

  const names = [
    'Aarav Sharma','Priya Patel','Rohan Gupta','Sneha Iyer','Vikram Nair',
    'Ananya Reddy','Arjun Mehta','Kavya Singh','Dhruv Joshi','Riya Kapoor',
    'Aditya Kumar','Pooja Malhotra','Karan Verma','Divya Rao','Rahul Bose',
    'Simran Kaur','Tushar Shah','Nisha Pillai','Yash Chandra','Meera Nambiar'
  ];

  names.forEach((name, i) => {
    const cls = state.classes[i % state.classes.length];
    state.students.push({
      id: 'S' + String(i + 1).padStart(4, '0'),
      name,
      roll: '2024' + String(i + 1).padStart(3, '0'),
      class: cls,
      email: name.split(' ')[0].toLowerCase() + '@school.edu',
      phone: '+91 ' + (9800000000 + i)
    });
  });

  // Seed last 14 days of attendance
  for (let d = 13; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    const ds = dt.toISOString().split('T')[0];
    state.attendance[ds] = {};
    state.students.forEach(s => {
      const r = Math.random();
      state.attendance[ds][s.id] = r < 0.75 ? 'P' : r < 0.88 ? 'L' : 'A';
    });
  }
  saveState();
}

// ─── AUTH ─────────────────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const u = $('login-username').value.trim();
  const p = $('login-password').value;
  const err = $('login-error');

  if (u === state.credentials.username && p === state.credentials.password) {
    err.classList.remove('show');
    sessionStorage.setItem('attendx_logged_in', '1');
    $('login-page').classList.add('hidden');
    const app = $('app');
    app.classList.add('visible');
    initApp();
  } else {
    err.classList.add('show');
    $('login-password').value = '';
  }
}

function handleLogout() {
  sessionStorage.removeItem('attendx_logged_in');
  $('app').classList.remove('visible');
  $('login-page').classList.remove('hidden');
  $('login-username').value = '';
  $('login-password').value = '';
  destroyCharts();
}

// ─── NAVIGATION ───────────────────────────────────────────────────────
const viewConfig = {
  dashboard:  { title: 'Dashboard',  subtitle: 'Welcome back, Admin! Here\'s today\'s overview.' },
  students:   { title: 'Students',   subtitle: 'Manage all enrolled students.'                   },
  attendance: { title: 'Attendance', subtitle: 'Mark and manage daily attendance.'                },
  reports:    { title: 'Reports',    subtitle: 'Attendance analytics and summaries.'              },
  settings:   { title: 'Settings',   subtitle: 'Configure your system preferences.'              },
};

function navigate(view) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  $('view-' + view).classList.add('active');
  $('nav-'  + view).classList.add('active');

  const cfg = viewConfig[view];
  $('topbar-title').textContent    = cfg.title;
  $('topbar-subtitle').textContent = cfg.subtitle;
  state.currentView = view;

  if (view === 'dashboard')  renderDashboard();
  if (view === 'students')   renderStudents();
  if (view === 'attendance') renderAttendanceView();
  if (view === 'reports')    renderReports();
  if (view === 'settings')   renderSettings();
}

// ─── INIT APP ─────────────────────────────────────────────────────────
function initApp() {
  $('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  populateClassDropdowns();
  renderDashboard();
  if (window.lucide) lucide.createIcons();
}

function populateClassDropdowns() {
  const selects = ['att-class','student-filter-class','report-filter-class','modal-class'];
  selects.forEach(id => {
    const el = $(id);
    if (!el) return;
    const hasAll = id !== 'modal-class';
    el.innerHTML = (hasAll ? '<option value="">All Classes</option>' : '');
    state.classes.forEach(c => {
      el.innerHTML += `<option value="${c}">${c}</option>`;
    });
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function renderDashboard() {
  destroyCharts();
  const td = today();
  const todayRec = state.attendance[td] || {};
  const total    = state.students.length;
  const present  = state.students.filter(s => todayRec[s.id] === 'P').length;
  const absent   = state.students.filter(s => todayRec[s.id] === 'A').length;
  const late     = state.students.filter(s => todayRec[s.id] === 'L').length;
  const rate     = pct(present + late, total);

  $('stats-grid').innerHTML = `
    <div class="stat-card emerald">
      <div class="stat-header">
        <div class="stat-icon emerald">👨‍🎓</div>
        <span class="stat-badge up">Total</span>
      </div>
      <div class="stat-value">${total}</div>
      <div class="stat-label">Total Students</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon indigo">📊</div>
        <span class="stat-badge ${rate >= 75 ? 'up' : 'down'}">${rate}%</span>
      </div>
      <div class="stat-value">${rate}%</div>
      <div class="stat-label">Today's Attendance</div>
    </div>
    <div class="stat-card emerald">
      <div class="stat-header">
        <div class="stat-icon emerald">✅</div>
        <span class="stat-badge up">Present</span>
      </div>
      <div class="stat-value">${present}</div>
      <div class="stat-label">Present Today</div>
    </div>
    <div class="stat-card rose">
      <div class="stat-header">
        <div class="stat-icon rose">❌</div>
        <span class="stat-badge down">Absent</span>
      </div>
      <div class="stat-value">${absent + late}</div>
      <div class="stat-label">Absent / Late</div>
    </div>
  `;

  // Weekly trend
  const labels = [];
  const data   = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const ds = dt.toISOString().split('T')[0];
    labels.push(dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    const rec = state.attendance[ds] || {};
    const p   = state.students.filter(s => rec[s.id] === 'P' || rec[s.id] === 'L').length;
    data.push(pct(p, total));
  }

  const trendCtx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Attendance %',
        data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#818cf8',
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0', font: { size: 11 }, callback: v => v + '%' }, min: 0, max: 100 }
      }
    }
  });

  // Class chart
  const clsLabels = state.classes;
  const clsData   = state.classes.map(cls => {
    const clsStudents = state.students.filter(s => s.class === cls);
    if (!clsStudents.length) return 0;
    const p = clsStudents.filter(s => todayRec[s.id] === 'P' || todayRec[s.id] === 'L').length;
    return pct(p, clsStudents.length);
  });

  const clsCtx = document.getElementById('classChart').getContext('2d');
  classChart = new Chart(clsCtx, {
    type: 'doughnut',
    data: {
      labels: clsLabels,
      datasets: [{
        data: clsData.length ? clsData : [100],
        backgroundColor: clsData.length ? COLORS : ['rgba(255,255,255,0.1)'],
        borderColor: '#0f1629',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#8892b0', font: { size: 11 }, boxWidth: 12, padding: 12 }
        }
      }
    }
  });

  // Recent records table
  const dates = Object.keys(state.attendance).sort((a, b) => b.localeCompare(a)).slice(0, 5);
  if (!dates.length) {
    $('recent-table-body').innerHTML = '<div class="no-data">No attendance records yet. <a href="#" onclick="navigate(\'attendance\')" style="color:var(--accent-indigo-light);">Mark attendance →</a></div>';
    return;
  }
  let rows = dates.map(d => {
    const rec = state.attendance[d];
    const p = state.students.filter(s => rec[s.id] === 'P').length;
    const a = state.students.filter(s => rec[s.id] === 'A').length;
    const l = state.students.filter(s => rec[s.id] === 'L').length;
    const r = pct(p + l, state.students.length);
    return `<tr>
      <td>${formatDate(d)}</td>
      <td><span class="badge present">✅ ${p} Present</span></td>
      <td><span class="badge absent">❌ ${a} Absent</span></td>
      <td><span class="badge late">⏰ ${l} Late</span></td>
      <td><span class="badge ${r >= 75 ? 'present' : 'absent'}">${r}%</span></td>
    </tr>`;
  }).join('');
  $('recent-table-body').innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);">Date</th>
        <th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);">Present</th>
        <th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);">Absent</th>
        <th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);">Late</th>
        <th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);">Rate</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function destroyCharts() {
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (classChart) { classChart.destroy(); classChart = null; }
}

// ─── STUDENTS ─────────────────────────────────────────────────────────
function renderStudents() {
  const q   = $('student-search').value.toLowerCase();
  const cls = $('student-filter-class').value;
  let filtered = state.students.filter(s => {
    const matchQ   = !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
    const matchCls = !cls || s.class === cls;
    return matchQ && matchCls;
  });

  const tbody = $('students-tbody');
  const empty = $('students-empty');

  if (!filtered.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(s => {
    const attData   = getStudentAttendance(s.id);
    const color     = avatarColor(s.name);
    const rate      = pct(attData.present + attData.late, attData.total);
    const rateColor = rate >= 75 ? 'var(--accent-emerald)' : rate >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';
    return `<tr>
      <td>
        <div class="avatar-cell">
          <div class="avatar" style="background:linear-gradient(135deg,${color},${color}99)">${initials(s.name)}</div>
          <div class="avatar-info">
            <h4>${s.name}</h4>
            <p>${s.phone || '—'}</p>
          </div>
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:13px;">${s.roll}</td>
      <td><span class="badge class">${s.class}</span></td>
      <td style="color:var(--text-secondary);font-size:13px;">${s.email || '—'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;max-width:80px;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${rate}%;background:${rateColor};border-radius:3px;"></div>
          </div>
          <span style="font-size:12px;font-weight:600;color:${rateColor};">${rate}%</span>
        </div>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="openStudentModal('${s.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function getStudentAttendance(id) {
  let total = 0, present = 0, absent = 0, late = 0;
  Object.values(state.attendance).forEach(rec => {
    if (id in rec) {
      total++;
      if (rec[id] === 'P') present++;
      else if (rec[id] === 'A') absent++;
      else if (rec[id] === 'L') late++;
    }
  });
  return { total, present, absent, late };
}

// ─── STUDENT MODAL ────────────────────────────────────────────────────
function openStudentModal(id = null) {
  state.editingStudentId = id;
  $('modal-title').textContent = id ? 'Edit Student' : 'Add Student';
  $('modal-class').innerHTML = state.classes.map(c => `<option value="${c}">${c}</option>`).join('');

  if (id) {
    const s = state.students.find(x => x.id === id);
    $('modal-name').value  = s.name;
    $('modal-roll').value  = s.roll;
    $('modal-class').value = s.class;
    $('modal-email').value = s.email || '';
    $('modal-phone').value = s.phone || '';
  } else {
    $('modal-name').value = $('modal-roll').value = $('modal-email').value = $('modal-phone').value = '';
    $('modal-class').value = state.classes[0];
  }
  $('student-modal').classList.add('open');
}

function closeStudentModal() {
  $('student-modal').classList.remove('open');
  state.editingStudentId = null;
}

function saveStudent() {
  const name  = $('modal-name').value.trim();
  const roll  = $('modal-roll').value.trim();
  const cls   = $('modal-class').value;
  const email = $('modal-email').value.trim();
  const phone = $('modal-phone').value.trim();

  if (!name || !roll || !cls) { showToast('Please fill in all required fields.', 'error'); return; }

  // Check duplicate roll
  const dupRoll = state.students.find(s => s.roll === roll && s.id !== state.editingStudentId);
  if (dupRoll) { showToast('Roll number already exists!', 'error'); return; }

  if (state.editingStudentId) {
    const idx = state.students.findIndex(s => s.id === state.editingStudentId);
    state.students[idx] = { ...state.students[idx], name, roll, class: cls, email, phone };
    showToast('Student updated successfully!', 'success');
  } else {
    state.students.push({
      id: 'S' + Date.now(), name, roll, class: cls, email, phone
    });
    showToast('Student added successfully!', 'success');
  }
  saveState();
  closeStudentModal();
  renderStudents();
}

function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  state.students = state.students.filter(s => s.id !== id);
  // Remove from attendance too
  Object.keys(state.attendance).forEach(d => delete state.attendance[d][id]);
  saveState();
  renderStudents();
  showToast('Student deleted.', 'info');
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────
let currentAttendanceRecord = {};

function renderAttendanceView() {
  const dateEl = $('att-date');
  if (!dateEl.value) dateEl.value = today();

  // Populate class select
  $('att-class').innerHTML = '<option value="">All Classes</option>' + state.classes.map(c => `<option value="${c}">${c}</option>`).join('');
  renderAttendance();
}

function renderAttendance() {
  const date  = $('att-date').value || today();
  const cls   = $('att-class').value;
  const empty = $('att-empty');
  const roster = $('att-roster');

  // Load existing or build fresh
  const savedRec = state.attendance[date] || {};
  currentAttendanceRecord = { ...savedRec };

  const filtered = state.students.filter(s => !cls || s.class === cls);

  if (!filtered.length) {
    roster.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  roster.innerHTML = filtered.map(s => {
    const status = currentAttendanceRecord[s.id] || 'P';
    if (!currentAttendanceRecord[s.id]) currentAttendanceRecord[s.id] = 'P';
    const color = avatarColor(s.name);
    return `<div class="att-card" id="att-card-${s.id}">
      <div class="att-student">
        <div class="avatar" style="background:linear-gradient(135deg,${color},${color}99);width:38px;height:38px;font-size:13px;">${initials(s.name)}</div>
        <div class="att-name">
          <h4>${s.name}</h4>
          <p>${s.roll} · ${s.class}</p>
        </div>
      </div>
      <div class="att-toggle">
        <button class="toggle-btn p ${status === 'P' ? 'active' : ''}" onclick="setStatus('${s.id}','P')">P</button>
        <button class="toggle-btn a ${status === 'A' ? 'active' : ''}" onclick="setStatus('${s.id}','A')">A</button>
        <button class="toggle-btn l ${status === 'L' ? 'active' : ''}" onclick="setStatus('${s.id}','L')">L</button>
      </div>
    </div>`;
  }).join('');
}

function setStatus(studentId, status) {
  currentAttendanceRecord[studentId] = status;
  const card = $('att-card-' + studentId);
  card.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  const map = { P: 0, A: 1, L: 2 };
  card.querySelectorAll('.toggle-btn')[map[status]].classList.add('active');
}

function saveAttendance() {
  const date = $('att-date').value || today();
  if (!state.attendance[date]) state.attendance[date] = {};
  Object.assign(state.attendance[date], currentAttendanceRecord);
  saveState();
  showToast('Attendance saved for ' + formatDate(date) + '!', 'success');
}

function markAllPresent() {
  const cls = $('att-class').value;
  const filtered = state.students.filter(s => !cls || s.class === cls);
  filtered.forEach(s => setStatus(s.id, 'P'));
  showToast('All students marked as Present.', 'success');
}

// ─── REPORTS ──────────────────────────────────────────────────────────
function renderReports() {
  const cls = $('report-filter-class').value;
  $('report-filter-class').innerHTML = '<option value="">All Classes</option>' + state.classes.map(c => `<option value="${c}">${c}</option>`).join('');
  $('report-filter-class').value = cls;

  const filtered = state.students.filter(s => !cls || s.class === cls);

  // Summary cards by class
  const classStats = {};
  state.classes.forEach(c => {
    const clsStudents = state.students.filter(s => s.class === c);
    if (!clsStudents.length) return;
    let totalAtt = 0, presentAtt = 0;
    clsStudents.forEach(s => {
      const d = getStudentAttendance(s.id);
      totalAtt += d.total;
      presentAtt += d.present + d.late;
    });
    classStats[c] = { rate: pct(presentAtt, totalAtt), count: clsStudents.length };
  });

  $('report-grid').innerHTML = Object.entries(classStats).map(([cls, stats]) => {
    const lvl = stats.rate >= 75 ? 'high' : stats.rate >= 50 ? 'medium' : 'low';
    const color = lvl === 'high' ? 'var(--accent-emerald)' : lvl === 'medium' ? 'var(--accent-amber)' : 'var(--accent-rose)';
    return `<div class="report-card">
      <div class="report-card-header">
        <h4>${cls}</h4>
        <span class="badge class">${stats.count} students</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar ${lvl}" style="width:${stats.rate}%"></div>
      </div>
      <div class="progress-label">
        <span>${stats.rate}% Attendance</span>
        <span style="color:${color}">${lvl.toUpperCase()}</span>
      </div>
    </div>`;
  }).join('');

  if (!filtered.length) {
    $('report-tbody').innerHTML = '<tr><td colspan="8" class="no-data">No students found.</td></tr>';
    return;
  }

  $('report-tbody').innerHTML = filtered.map(s => {
    const d    = getStudentAttendance(s.id);
    const rate = pct(d.present + d.late, d.total);
    const color= avatarColor(s.name);
    const lvl  = rate >= 75 ? 'present' : rate >= 50 ? 'late' : 'absent';
    const statusText = rate >= 75 ? '✅ Good' : rate >= 50 ? '⚠️ Average' : '❌ Low';
    return `<tr>
      <td>
        <div class="avatar-cell">
          <div class="avatar" style="background:linear-gradient(135deg,${color},${color}99);width:32px;height:32px;font-size:12px;">${initials(s.name)}</div>
          <span>${s.name}</span>
        </div>
      </td>
      <td><span class="badge class">${s.class}</span></td>
      <td style="color:var(--text-secondary);">${d.total}</td>
      <td style="color:var(--accent-emerald);">${d.present}</td>
      <td style="color:var(--accent-rose);">${d.absent}</td>
      <td style="color:var(--accent-amber);">${d.late}</td>
      <td><span style="font-weight:700;">${rate}%</span></td>
      <td><span class="badge ${lvl}">${statusText}</span></td>
    </tr>`;
  }).join('');
}

function exportCSV() {
  const cls = $('report-filter-class').value;
  const filtered = state.students.filter(s => !cls || s.class === cls);
  const header = ['Name','Roll No','Class','Email','Total Days','Present','Absent','Late','Rate%'];
  const rows = filtered.map(s => {
    const d = getStudentAttendance(s.id);
    return [s.name, s.roll, s.class, s.email, d.total, d.present, d.absent, d.late, pct(d.present+d.late,d.total)];
  });
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'attendance_report_' + today() + '.csv';
  a.click();
  showToast('CSV exported!', 'success');
}

// ─── SETTINGS ─────────────────────────────────────────────────────────
function renderSettings() {
  const list = $('class-list');
  list.innerHTML = state.classes.map(c => `
    <div class="class-tag">
      ${c}
      <span class="class-tag-remove" onclick="removeClass('${c}')">✕</span>
    </div>
  `).join('');
}

function addClass() {
  const val = $('new-class-input').value.trim();
  if (!val) return;
  if (state.classes.includes(val)) { showToast('Class already exists!', 'error'); return; }
  state.classes.push(val);
  saveState();
  $('new-class-input').value = '';
  renderSettings();
  populateClassDropdowns();
  showToast('Class added: ' + val, 'success');
}

function removeClass(cls) {
  if (state.students.some(s => s.class === cls)) {
    showToast('Cannot delete: students are in this class!', 'error');
    return;
  }
  state.classes = state.classes.filter(c => c !== cls);
  saveState();
  renderSettings();
  populateClassDropdowns();
  showToast('Class removed.', 'info');
}

function changePassword() {
  const curr = $('curr-pass').value;
  const newP  = $('new-pass').value;
  if (curr !== state.credentials.password) { showToast('Current password is incorrect!', 'error'); return; }
  if (newP.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
  state.credentials.password = newP;
  saveState();
  $('curr-pass').value = $('new-pass').value = '';
  showToast('Password updated successfully!', 'success');
}

function resetData() {
  if (!confirm('Are you SURE you want to reset ALL data? This cannot be undone!')) return;
  state.students   = [];
  state.attendance = {};
  saveState();
  showToast('All data has been reset.', 'info');
  navigate('dashboard');
}

// ─── TOAST ────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = $('toast-container');
  const toast     = document.createElement('div');
  const icons     = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── BOOTSTRAP ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  seedData();

  // Init topbar date
  $('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Check session
  if (sessionStorage.getItem('attendx_logged_in') === '1') {
    $('login-page').classList.add('hidden');
    $('app').classList.add('visible');
    initApp();
  }

  // Close modal on backdrop click
  $('student-modal').addEventListener('click', e => { if (e.target === $('student-modal')) closeStudentModal(); });
});
