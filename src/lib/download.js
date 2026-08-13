// Принудительное скачивание файла (а не предпросмотр в браузере).
// PDF/картинки браузер по умолчанию открывает во вкладке — поэтому качаем
// через blob и <a download>. Если CORS не пускает (или сеть упала) —
// откатываемся на открытие в новой вкладке, чтобы файл всё равно был доступен.
export async function downloadFile(url, filename) {
    if (!url) return;
    const name = filename || url.split('/').pop().split('?')[0] || 'document';
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (e) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
