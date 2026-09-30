document.addEventListener('DOMContentLoaded', () => {
  const branches = document.querySelectorAll('.branch');
  const gmaps = document.getElementById('gmaps');
  const info = document.getElementById('branchInfo');

  const branchData = {
    'ThaoVyStore Đà Nẵng': {
      title: 'ThaoVyStore - Đà Nẵng',
      addr: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      hours: '9:00 - 21:00', phone: '090-xxx-0001', q: 'ThaoVyStore Đà Nẵng'
    },
    'ThaoVyStore Hà Nội': {
      title: 'ThaoVyStore - Hà Nội', addr: '456 Trần Phú, Ba Đình, Hà Nội', hours:'9:00 - 21:00', phone:'090-xxx-0002', q:'ThaoVyStore Hà Nội'
    },
    'ThaoVyStore Hồ Chí Minh': {
      title: 'ThaoVyStore - Hồ Chí Minh', addr: '789 Lý Tự Trọng, Quận 1, TP.HCM', hours:'9:00 - 21:00', phone:'090-xxx-0003', q:'ThaoVyStore Hồ Chí Minh'
    },
    'ThaoVyStore Hải Phòng': {
      title: 'ThaoVyStore - Hải Phòng', addr: '12 Lê Lợi, Ngô Quyền, Hải Phòng', hours:'9:00 - 21:00', phone:'090-xxx-0004', q:'ThaoVyStore Hải Phòng'
    }
  };

  function updateMap(key){
    const b = branchData[key];
    if (!b) return;
    const q = encodeURIComponent(b.q);
    gmaps.src = `https://www.google.com/maps?q=${q}&output=embed`;
    info.querySelector('h3').textContent = b.title;
    info.querySelector('p').textContent = `Địa chỉ: ${b.addr}`;
    // append hours and phone
    info.innerHTML = `<h3>${b.title}</h3><p>Địa chỉ: ${b.addr}</p><p>Giờ mở cửa: ${b.hours}</p><p>Hotline: ${b.phone}</p>`;
  }

  branches.forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      // visual active
      branches.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      updateMap(q);
    });
  });
});
