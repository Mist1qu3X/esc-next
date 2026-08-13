// «Мёртвые» ролики: их YouTube-id отдают 403 в oEmbed — удалены, приватны или
// запрещено встраивание. Проверено 2026-08-13 по всем видео из Strapi.
// Скрываем их из списков на сайте. Это временная мера на фронте — сами записи
// остаются в Strapi, их нужно удалить в админке (public API удалять не даёт).
// Когда записи удалят в Strapi — этот список можно убрать.
export const DEAD_VIDEO_IDS = new Set([
    '0SRdUl-ellc',
    '2IRvQ_aUjfQ',
    '5IDKZy6pDmY',
    '9pvSGL9T4Dc',
    'BMxaFWwwmo0',
    'EBnq7tAZXGg',
    'HhiXRerIKOA',
    'Q-mighOho_M',
    'VjR8aB5m8Us',
    'W3w-ympFQfQ',
    '_G88pIARxRY',
    'cvskgKB7cuE',
    'dnJHfndbktc',
    'fXb03P6V834',
    'hKePGNWGDT0',
    'q_SzxILwTyk',
    'spf7B5jGUQg',
    'tLiqJmcuDs8',
    'vmueIc3ZHJs',
]);

const ytId = (v) => {
    const m = (v?.videoUrl || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
    return m ? m[1] : null;
};

// true — ролик мёртвый, не показываем
export const isDeadVideo = (v) => {
    const id = ytId(v);
    return !!id && DEAD_VIDEO_IDS.has(id);
};

// Убрать мёртвые ролики из массива
export const dropDeadVideos = (list) => (Array.isArray(list) ? list.filter((v) => !isDeadVideo(v)) : list);
