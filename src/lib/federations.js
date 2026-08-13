// Показываем по одной карточке на страну. В Strapi у части стран заведено по две
// федерации (винтовка/пистолет + дробовик) или дубликаты — на сайте это выглядит
// как повтор. Оставляем первую по коду страны.
export const dedupeFederations = (list) => {
    if (!Array.isArray(list)) return list;
    const seen = new Set();
    return list.filter((f) => {
        const key = (f.code || f.countryCode || f.country || '').trim().toUpperCase();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
