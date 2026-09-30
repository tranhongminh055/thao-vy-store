const JOBS = [
  { id: 'sales', title: 'Nhân viên bán hàng', location: 'Hà Nội', type: 'Toàn thời gian', desc: 'Tư vấn khách hàng, trưng bày sản phẩm, hỗ trợ bán hàng tại cửa hàng.' },
  { id: 'cs', title: 'Nhân viên CSKH', location: 'Đà Nẵng', type: 'Bán thời gian', desc: 'Tiếp nhận cuộc gọi, chat; xử lý đơn hàng và khiếu nại.' },
  { id: 'driver', title: 'Nhân viên giao nhận', location: 'Hồ Chí Minh', type: 'Toàn thời gian', desc: 'Giao hàng nội thành, chịu trách nhiệm về thời gian và an toàn hàng hóa.' }
];

function renderJobs() {
  const container = document.getElementById('jobsContainer');
  container.innerHTML = '';
  JOBS.forEach(job => {
    const el = document.createElement('div');
    el.className = 'job-card';
    el.dataset.id = job.id;
    el.innerHTML = `<div class="job-title"><h4>${job.title}</h4><button class="btn-primary small">Ứng tuyển</button></div><div class="job-meta">${job.location} • ${job.type}</div>`;
    el.addEventListener('click', (e) => {
      // nếu bấm vào nút 'Ứng tuyển' thì mở form
      if (e.target && e.target.tagName === 'BUTTON') {
        openApplyForm(job);
        return;
      }
      showJobDetail(job);
    });
    container.appendChild(el);
  });
}

function showJobDetail(job) {
  document.getElementById('jobTitle').innerText = job.title;
  document.getElementById('jobDesc').innerText = job.desc;
  // hide apply form
  document.getElementById('applyFormWrap').classList.add('hidden');
}

function openApplyForm(job) {
  document.getElementById('applyFormWrap').classList.remove('hidden');
  document.getElementById('applyFor').innerText = job.title;
  document.getElementById('applyForm').dataset.jobId = job.id;
  document.getElementById('applicantName').focus();
}

function loadApplications() {
  return JSON.parse(localStorage.getItem('applications') || '[]');
}

function saveApplication(app) {
  const apps = loadApplications();
  apps.push(app);
  localStorage.setItem('applications', JSON.stringify(apps));
}

function renderApplications() {
  const list = loadApplications();
  const wrap = document.getElementById('applicationsList');
  if (!list.length) { wrap.innerHTML = 'Bạn chưa nộp hồ sơ nào.'; return; }
  wrap.innerHTML = '';
  list.slice().reverse().forEach(a => {
    const el = document.createElement('div');
    el.className = 'app-item';
    el.innerHTML = `<strong>${a.name}</strong> — ${a.email} <div class="muted">Vị trí: ${a.jobTitle} • ${new Date(a.submittedAt).toLocaleString()}</div>`;
    wrap.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderJobs();
  renderApplications();

  document.getElementById('applyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const jobId = e.target.dataset.jobId || '';
    const job = JOBS.find(j => j.id === jobId) || { title: 'N/A' };
    const name = document.getElementById('applicantName').value.trim();
    const email = document.getElementById('applicantEmail').value.trim();
    const phone = document.getElementById('applicantPhone').value.trim();
    const cv = document.getElementById('applicantCv').value.trim();
    if (!name || !email) { alert('Vui lòng nhập tên và email.'); return; }
    const app = { jobId, jobTitle: job.title, name, email, phone, cv, submittedAt: Date.now() };
    saveApplication(app);
    renderApplications();
    e.target.reset();
    document.getElementById('applyFormWrap').classList.add('hidden');
    alert('Gửi hồ sơ thành công. Cảm ơn bạn đã ứng tuyển!');
  });

  document.getElementById('cancelApply').addEventListener('click', () => {
    document.getElementById('applyForm').reset();
    document.getElementById('applyFormWrap').classList.add('hidden');
  });
});
