/* =============================================================
   gold-monthly-data.js — gold's monthly price, July 2010 onward
   (shared; first used by /bitcoin-in-gold, 2026-10-18)

   GOLD_MONTHLY: ["YYYY-MM", USD per troy ounce], the World Bank
   Commodity Price Data ("Pink Sheet") monthly series, column "Gold":
   the average of daily rates (London afternoon fixing, 99.5% fine,
   until May 2025; spot average from June 2025), in whole dollars as
   the Bank publishes it. Read from CMO-Historical-Data-Monthly.xlsx
   (updated 2 October 2026), 195 rows, 2010-07 to 2026-09.
   DATA_AUDIT GLD-1.

   A monthly AVERAGE, not a close: a bitcoin sample is priced in gold
   by dividing by its own month's average, which smooths gold's swings
   inside a month. Refresh: append the new month when the Bank
   publishes it (early each month, for the month before);
   MONTHLY_REFRESH_CHECKLIST §1.

   fetchGoldPrice(cb): today's gold price, keyless, for the page's
   "today" reading. Coinbase's XAU-USD spot first, then PAX Gold (a
   token redeemable for one fine troy ounce) on Kraken; else the latest
   month above, labelled as such. cb(price, source, label). Cached in
   sessionStorage for 10 minutes, like the bitcoin price. Both sources
   send CORS headers this origin accepts (checked 2026-10-18).
   ============================================================= */
var GOLD_MONTHLY = [
  ["2010-07",1193],["2010-08",1216],["2010-09",1271],["2010-10",1342],["2010-11",1370],["2010-12",1391],
  ["2011-01",1360],["2011-02",1375],["2011-03",1423],["2011-04",1481],["2011-05",1513],["2011-06",1529],
  ["2011-07",1573],["2011-08",1759],["2011-09",1772],["2011-10",1666],["2011-11",1739],["2011-12",1640],
  ["2012-01",1654],["2012-02",1745],["2012-03",1676],["2012-04",1649],["2012-05",1589],["2012-06",1599],
  ["2012-07",1594],["2012-08",1630],["2012-09",1745],["2012-10",1747],["2012-11",1722],["2012-12",1685],
  ["2013-01",1672],["2013-02",1628],["2013-03",1593],["2013-04",1488],["2013-05",1414],["2013-06",1343],
  ["2013-07",1286],["2013-08",1352],["2013-09",1349],["2013-10",1317],["2013-11",1276],["2013-12",1222],
  ["2014-01",1244],["2014-02",1300],["2014-03",1336],["2014-04",1298],["2014-05",1289],["2014-06",1279],
  ["2014-07",1311],["2014-08",1295],["2014-09",1237],["2014-10",1222],["2014-11",1175],["2014-12",1201],
  ["2015-01",1251],["2015-02",1227],["2015-03",1179],["2015-04",1199],["2015-05",1199],["2015-06",1182],
  ["2015-07",1128],["2015-08",1118],["2015-09",1125],["2015-10",1159],["2015-11",1086],["2015-12",1076],
  ["2016-01",1098],["2016-02",1200],["2016-03",1245],["2016-04",1242],["2016-05",1261],["2016-06",1276],
  ["2016-07",1337],["2016-08",1340],["2016-09",1327],["2016-10",1267],["2016-11",1238],["2016-12",1157],
  ["2017-01",1192],["2017-02",1234],["2017-03",1231],["2017-04",1267],["2017-05",1246],["2017-06",1260],
  ["2017-07",1237],["2017-08",1283],["2017-09",1314],["2017-10",1280],["2017-11",1282],["2017-12",1264],
  ["2018-01",1331],["2018-02",1331],["2018-03",1325],["2018-04",1335],["2018-05",1303],["2018-06",1282],
  ["2018-07",1238],["2018-08",1202],["2018-09",1198],["2018-10",1215],["2018-11",1221],["2018-12",1250],
  ["2019-01",1292],["2019-02",1320],["2019-03",1301],["2019-04",1286],["2019-05",1284],["2019-06",1359],
  ["2019-07",1413],["2019-08",1500],["2019-09",1511],["2019-10",1495],["2019-11",1471],["2019-12",1479],
  ["2020-01",1561],["2020-02",1597],["2020-03",1592],["2020-04",1683],["2020-05",1716],["2020-06",1732],
  ["2020-07",1847],["2020-08",1969],["2020-09",1922],["2020-10",1900],["2020-11",1866],["2020-12",1858],
  ["2021-01",1867],["2021-02",1808],["2021-03",1718],["2021-04",1760],["2021-05",1850],["2021-06",1835],
  ["2021-07",1808],["2021-08",1785],["2021-09",1775],["2021-10",1777],["2021-11",1822],["2021-12",1790],
  ["2022-01",1816],["2022-02",1856],["2022-03",1948],["2022-04",1937],["2022-05",1849],["2022-06",1837],
  ["2022-07",1733],["2022-08",1765],["2022-09",1681],["2022-10",1664],["2022-11",1725],["2022-12",1798],
  ["2023-01",1898],["2023-02",1855],["2023-03",1913],["2023-04",2000],["2023-05",1992],["2023-06",1943],
  ["2023-07",1951],["2023-08",1919],["2023-09",1916],["2023-10",1916],["2023-11",1984],["2023-12",2026],
  ["2024-01",2034],["2024-02",2023],["2024-03",2158],["2024-04",2331],["2024-05",2351],["2024-06",2326],
  ["2024-07",2398],["2024-08",2470],["2024-09",2571],["2024-10",2690],["2024-11",2651],["2024-12",2648],
  ["2025-01",2710],["2025-02",2895],["2025-03",2983],["2025-04",3218],["2025-05",3309],["2025-06",3353],
  ["2025-07",3340],["2025-08",3368],["2025-09",3668],["2025-10",4058],["2025-11",4087],["2025-12",4309],
  ["2026-01",4753],["2026-02",5020],["2026-03",4856],["2026-04",4721],["2026-05",4587],["2026-06",4228],
  ["2026-07",4073],["2026-08",4411],["2026-09",4319]
];

var LCS_GOLD_SOURCES = [
  { id: 'coinbase-xau', name: 'Coinbase gold spot',
    url: 'https://api.coinbase.com/v2/prices/XAU-USD/spot',
    pick: function (d) { return (d && d.data && d.data.currency === 'USD') ? parseFloat(d.data.amount) : NaN; } },
  { id: 'kraken-paxg', name: 'PAX Gold on Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=PAXGUSD',
    pick: function (d) {
      if (!d || (d.error && d.error.length) || !d.result) return NaN;
      for (var k in d.result) { var t = d.result[k]; if (t && t.c && t.c.length) return parseFloat(t.c[0]); }
      return NaN;
    } }
];

function fetchGoldPrice(cb) {
  var last = GOLD_MONTHLY[GOLD_MONTHLY.length - 1];
  var KEY = 'lcs.goldPrice', TTL = 10 * 60 * 1000;
  // Sane: within a factor of two of the latest monthly average.
  function sane(p) { return isFinite(p) && p > last[1] / 2 && p < last[1] * 2; }
  try {
    var c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (c && sane(c.price) && Date.now() - c.ts < TTL) { cb(c.price, 'live', c.label); return; }
  } catch (e) {}
  if (typeof fetch !== 'function') { cb(last[1], 'fallback', null); return; }
  var i = 0;
  function next() {
    if (i >= LCS_GOLD_SOURCES.length) { cb(last[1], 'fallback', null); return; }
    var s = LCS_GOLD_SOURCES[i++], done = false;
    var t = setTimeout(function () { if (!done) { done = true; next(); } }, 5000);
    fetch(s.url).then(function (r) { return r.json(); }).then(function (d) {
      if (done) return; done = true; clearTimeout(t);
      var p = s.pick(d);
      if (!sane(p)) { next(); return; }
      try { sessionStorage.setItem(KEY, JSON.stringify({ price: p, ts: Date.now(), label: s.name })); } catch (e) {}
      cb(p, 'live', s.name);
    }).catch(function () { if (!done) { done = true; clearTimeout(t); next(); } });
  }
  next();
}
