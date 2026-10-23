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
  // Запросы с { skipGate: true } в конфиге не задерживают показ страницы
  // (второстепенные проверки, которые можно дорисовать после появления контента).
  const done = (cfg) => { if (!cfg?.skipGate) { pending = Math.max(0, pending - 1); notify(); } };
  axios.interceptors.request.use((cfg) => { if (!cfg.skipGate) { pending += 1; notify(); } return cfg; });
  axios.interceptors.response.use(
    (res) => { done(res.config); return res; },
    (err) => { done(err?.config); return Promise.reject(err); }
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
