import axios from 'axios';

// Глобальный счётчик активных axios-запросов — чтобы гейт загрузки знал,
// когда данные со Strapi реально пришли (сеть «затихла»).
let pending = 0;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(pending));

let installed = false;
export function installAxiosTracker() {
  if (installed) return;
  installed = true;
  axios.interceptors.request.use((cfg) => { pending += 1; notify(); return cfg; });
  axios.interceptors.response.use(
    (res) => { pending = Math.max(0, pending - 1); notify(); return res; },
    (err) => { pending = Math.max(0, pending - 1); notify(); return Promise.reject(err); }
  );
}

export function pendingCount() { return pending; }

export function onPending(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Ставим перехватчик сразу при загрузке модуля — раньше, чем смонтируются и
// начнут слать запросы дочерние компоненты (их эффекты выполняются до эффекта гейта).
installAxiosTracker();
