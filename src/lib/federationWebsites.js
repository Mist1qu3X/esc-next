// Официальные сайты национальных федераций (источник: esc-shooting.org/members).
// Ключ — countryCode (МОК-код), как в Strapi. Используется кнопкой VIEW FEDERATION.
// Если в Strapi у федерации появится поле website — оно имеет приоритет над этой картой.
const FEDERATION_WEBSITES = {
  AND: 'http://www.fat.ad',
  ARM: 'http://www.asf.am',
  AUT: 'http://www.schuetzenbund.at',
  AZE: 'https://aze-shooting.az',
  BEL: 'https://rbssf.be/',
  BIH: 'https://streljackisavezfbih.ba',
  BLR: 'http://www.bssf-shooting.by',
  BUL: 'https://bsu.bg',
  CRO: 'https://www.hss-csf.hr/',
  CYP: 'https://cssf-shooting.org/nw/',
  CZE: 'http://www.shooting.cz',
  DEN: 'http://www.skytteunion.dk',
  ESP: 'http://www.tirolimpico.org',
  EST: 'http://www.laskurliit.ee',
  FIN: 'http://www.ampumaurheiluliitto.fi',
  FRA: 'http://www.fftir.org',
  FRO: 'https://skot.fo/',
  GBR: 'http://www.britishshooting.org.uk',
  GER: 'http://www.dsb.de',
  GRE: 'http://www.skoe.gr',
  HUN: 'http://www.hunshooting.hu',
  IRL: 'http://www.targetshooting.ie',
  ISL: 'http://www.sti.is',
  ISR: 'http://www.shooting.org.il/',
  ITA: 'http://www.fitav.it',
  KOS: 'http://www.fshsk.org',
  LAT: 'http://www.saufed.lv/index.php?lng=lLat&current=m13p72i415',
  LIE: 'https://www.schuetzenverband.li/',
  LTU: 'https://www.saudymosajunga.lt',
  LUX: 'http://www.fltas.lu',
  MDA: 'http://www.federatiadetir.md/',
  MKD: 'http://www.mssf.org.mk',
  MLT: 'http://www.mssf.org.mt',
  MNE: 'https://streljackisavez-crnegore.me',
  MON: 'http://www.fmtir.org',
  NED: 'http://www.knsa.nl',
  NOR: 'http://www.skyting.no',
  POL: 'http://www.pzss.org.pl',
  POR: 'http://fptiro.pt',
  ROU: 'http://www.frts.ro',
  RUS: 'http://www.shooting-russia.ru',
  SLO: 'http://www.strelska-zveza.si',
  SMR: 'http://www.fsts.sm/',
  SRB: 'http://www.serbianshooting.rs',
  SUI: 'http://www.swissshooting.ch',
  SVK: 'http://www.shooting.sk',
  SWE: 'http://www.skyttesport.se',
  TUR: 'http://www.taf.gov.tr',
  UKR: 'http://www.shooting-ukraine.com',
};

// Куда ведёт кнопка VIEW FEDERATION. Приоритет: поле из Strapi → карта по коду →
// общий список членов ESC (фолбэк для федераций без своего сайта, напр. ALB, GEO).
export function getFederationWebsite(fed) {
  if (!fed) return 'https://esc-shooting.org/members';
  return (
    fed.website ||
    fed.websiteUrl ||
    FEDERATION_WEBSITES[fed.countryCode] ||
    FEDERATION_WEBSITES[fed.code] ||
    'https://esc-shooting.org/members'
  );
}

export default FEDERATION_WEBSITES;
