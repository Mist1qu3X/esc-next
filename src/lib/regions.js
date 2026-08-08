// Фильтр федераций по регионам — единый источник для DiscoverPage и MembersPage,
// чтобы кнопки на обеих страницах были одинаковыми.
// label — подпись кнопки, value — значение поля `region` в Strapi.
// (Кавказ отдельной кнопкой не выделен: ARM/AZE/GEO видны только под «All Regions».)
export const REGIONS = [
  { label: 'All Regions', value: 'ALL' },
  { label: 'Central Europe', value: 'C.EUROPE' },
  { label: 'Southern Europe', value: 'S.EUROPE' },
  { label: 'Northern Europe', value: 'SCANDINAVIA' },
  { label: 'Western Europe', value: 'W.EUROPE' },
  { label: 'Eastern Europe', value: 'E.EUROPE' },
];
