/* ═══════════════════════════════════════════════════════════════
   BITCOIN VS. THE STOCK MARKET — calculators + charts

   Three interactive surfaces:
     §1 Lump-sum calculator at cyclical-top presets
     §2 Weekly DCA calculator
     §3 Forward projection (Power Law vs comparator CAGRs)

   Bitcoin price data: site-wide PL_DATA (loaded via shared module).
   Comparator data: embedded monthly closes built from documented
   annual returns with linear interpolation. Approximate for
   prototype use; NotebookLM-verified daily series will refine.
   ═══════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* ───────────── Embedded comparator data ───────────── */
  /* Built from documented annual total-return figures (Damodaran NYU
     Stern, Slickcharts, World Gold Council) with linear interpolation
     between year-ends. Each entry is [iso-date, value-USD].          */

  var SP500_TR_DATA = [
    ["2010-01-28", 1721.34],["2010-02-28", 1742.67],["2010-03-28", 1764.01],["2010-04-28", 1785.34],
    ["2010-05-28", 1806.68],["2010-06-28", 1828.01],["2010-07-28", 1849.35],["2010-08-28", 1870.68],
    ["2010-09-28", 1892.02],["2010-10-28", 1913.35],["2010-11-28", 1934.69],["2010-12-28", 1956.02],
    ["2011-01-28", 1959.46],["2011-02-28", 1962.9],["2011-03-28", 1966.34],["2011-04-28", 1969.78],
    ["2011-05-28", 1973.22],["2011-06-28", 1976.66],["2011-07-28", 1980.1],["2011-08-28", 1983.53],
    ["2011-09-28", 1986.97],["2011-10-28", 1990.41],["2011-11-28", 1993.85],["2011-12-28", 1997.29],
    ["2012-01-28", 2023.92],["2012-02-28", 2050.55],["2012-03-28", 2077.18],["2012-04-28", 2103.81],
    ["2012-05-28", 2130.44],["2012-06-28", 2157.08],["2012-07-28", 2183.71],["2012-08-28", 2210.34],
    ["2012-09-28", 2236.97],["2012-10-28", 2263.6],["2012-11-28", 2290.23],["2012-12-28", 2316.86],
    ["2013-01-28", 2379.39],["2013-02-28", 2441.93],["2013-03-28", 2504.47],["2013-04-28", 2567.0],
    ["2013-05-28", 2629.54],["2013-06-28", 2692.07],["2013-07-28", 2754.61],["2013-08-28", 2817.15],
    ["2013-09-28", 2879.68],["2013-10-28", 2942.22],["2013-11-28", 3004.75],["2013-12-28", 3067.29],
    ["2014-01-28", 3102.28],["2014-02-28", 3137.27],["2014-03-28", 3172.27],["2014-04-28", 3207.26],
    ["2014-05-28", 3242.25],["2014-06-28", 3277.25],["2014-07-28", 3312.24],["2014-08-28", 3347.23],
    ["2014-09-28", 3382.22],["2014-10-28", 3417.22],["2014-11-28", 3452.21],["2014-12-28", 3487.2],
    ["2015-01-28", 3491.21],["2015-02-28", 3495.22],["2015-03-28", 3499.23],["2015-04-28", 3503.24],
    ["2015-05-28", 3507.25],["2015-06-28", 3511.26],["2015-07-28", 3515.27],["2015-08-28", 3519.28],
    ["2015-09-28", 3523.29],["2015-10-28", 3527.3],["2015-11-28", 3531.31],["2015-12-28", 3535.32],
    ["2016-01-28", 3570.56],["2016-02-28", 3605.8],["2016-03-28", 3641.03],["2016-04-28", 3676.27],
    ["2016-05-28", 3711.5],["2016-06-28", 3746.74],["2016-07-28", 3781.97],["2016-08-28", 3817.21],
    ["2016-09-28", 3852.44],["2016-10-28", 3887.68],["2016-11-28", 3922.91],["2016-12-28", 3958.15],
    ["2017-01-28", 4030.15],["2017-02-28", 4102.16],["2017-03-28", 4174.17],["2017-04-28", 4246.17],
    ["2017-05-28", 4318.18],["2017-06-28", 4390.18],["2017-07-28", 4462.19],["2017-08-28", 4534.19],
    ["2017-09-28", 4606.2],["2017-10-28", 4678.2],["2017-11-28", 4750.21],["2017-12-28", 4822.21],
    ["2018-01-28", 4804.61],["2018-02-28", 4787.01],["2018-03-28", 4769.41],["2018-04-28", 4751.81],
    ["2018-05-28", 4734.21],["2018-06-28", 4716.61],["2018-07-28", 4699.01],["2018-08-28", 4681.4],
    ["2018-09-28", 4663.8],["2018-10-28", 4646.2],["2018-11-28", 4628.6],["2018-12-28", 4611.0],
    ["2019-01-28", 4732.0],["2019-02-28", 4853.0],["2019-03-28", 4974.0],["2019-04-28", 5095.0],
    ["2019-05-28", 5216.0],["2019-06-28", 5337.0],["2019-07-28", 5458.0],["2019-08-28", 5579.0],
    ["2019-09-28", 5700.0],["2019-10-28", 5821.0],["2019-11-28", 5942.0],["2019-12-28", 6063.0],
    ["2020-01-28", 6155.97],["2020-02-28", 6248.94],["2020-03-28", 6341.9],["2020-04-28", 6434.87],
    ["2020-05-28", 6527.83],["2020-06-28", 6620.8],["2020-07-28", 6713.77],["2020-08-28", 6806.73],
    ["2020-09-28", 6899.7],["2020-10-28", 6992.67],["2020-11-28", 7085.63],["2020-12-28", 7178.6],
    ["2021-01-28", 7350.35],["2021-02-28", 7522.09],["2021-03-28", 7693.84],["2021-04-28", 7865.59],
    ["2021-05-28", 8037.34],["2021-06-28", 8209.08],["2021-07-28", 8380.83],["2021-08-28", 8552.58],
    ["2021-09-28", 8724.33],["2021-10-28", 8896.08],["2021-11-28", 9067.82],["2021-12-28", 9239.57],
    ["2022-01-28", 9100.13],["2022-02-28", 8960.69],["2022-03-28", 8821.25],["2022-04-28", 8681.81],
    ["2022-05-28", 8542.37],["2022-06-28", 8402.93],["2022-07-28", 8263.49],["2022-08-28", 8124.05],
    ["2022-09-28", 7984.61],["2022-10-28", 7845.17],["2022-11-28", 7705.73],["2022-12-28", 7566.29],
    ["2023-01-28", 7732.05],["2023-02-28", 7897.82],["2023-03-28", 8063.58],["2023-04-28", 8229.34],
    ["2023-05-28", 8395.11],["2023-06-28", 8560.87],["2023-07-28", 8726.64],["2023-08-28", 8892.4],
    ["2023-09-28", 9058.17],["2023-10-28", 9223.93],["2023-11-28", 9389.7],["2023-12-28", 9555.46],
    ["2024-01-28", 9754.69],["2024-02-28", 9953.93],["2024-03-28", 10153.16],["2024-04-28", 10352.39],
    ["2024-05-28", 10551.62],["2024-06-28", 10750.85],["2024-07-28", 10950.08],["2024-08-28", 11149.31],
    ["2024-09-28", 11348.55],["2024-10-28", 11547.78],["2024-11-28", 11747.01],["2024-12-28", 11946.24],
    ["2025-01-28", 12125.43],["2025-02-28", 12304.63],["2025-03-28", 12483.82],["2025-04-28", 12663.01],
    ["2025-05-28", 12842.21],["2025-06-28", 13021.4],["2025-07-28", 13200.59],["2025-08-28", 13379.79],
    ["2025-09-28", 13558.98],["2025-10-28", 13738.18],["2025-11-28", 13917.37],["2025-12-28", 14096.56],
    ["2026-01-28", 14128.98],["2026-02-28", 14161.41],["2026-03-28", 14193.83],["2026-04-28", 14226.25],
    ["2026-05-28", 14258.67]
  ];

  var NDQ_TR_DATA = [
    ["2010-01-28", 2082.82],["2010-02-28", 2115.63],["2010-03-28", 2148.45],["2010-04-28", 2181.27],
    ["2010-05-28", 2214.09],["2010-06-28", 2246.9],["2010-07-28", 2279.72],["2010-08-28", 2312.54],
    ["2010-09-28", 2345.35],["2010-10-28", 2378.17],["2010-11-28", 2410.99],["2010-12-28", 2443.8],
    ["2011-01-28", 2451.32],["2011-02-28", 2458.83],["2011-03-28", 2466.35],["2011-04-28", 2473.86],
    ["2011-05-28", 2481.38],["2011-06-28", 2488.89],["2011-07-28", 2496.41],["2011-08-28", 2503.92],
    ["2011-09-28", 2511.44],["2011-10-28", 2518.95],["2011-11-28", 2526.47],["2011-12-28", 2533.98],
    ["2012-01-28", 2572.27],["2012-02-28", 2610.55],["2012-03-28", 2648.83],["2012-04-28", 2687.12],
    ["2012-05-28", 2725.4],["2012-06-28", 2763.69],["2012-07-28", 2801.97],["2012-08-28", 2840.26],
    ["2012-09-28", 2878.54],["2012-10-28", 2916.82],["2012-11-28", 2955.11],["2012-12-28", 2993.39],
    ["2013-01-28", 3085.54],["2013-02-28", 3177.69],["2013-03-28", 3269.83],["2013-04-28", 3361.98],
    ["2013-05-28", 3454.13],["2013-06-28", 3546.27],["2013-07-28", 3638.42],["2013-08-28", 3730.56],
    ["2013-09-28", 3822.71],["2013-10-28", 3914.86],["2013-11-28", 4007.0],["2013-12-28", 4099.15],
    ["2014-01-28", 4165.42],["2014-02-28", 4231.69],["2014-03-28", 4297.96],["2014-04-28", 4364.23],
    ["2014-05-28", 4430.5],["2014-06-28", 4496.77],["2014-07-28", 4563.04],["2014-08-28", 4629.31],
    ["2014-09-28", 4695.58],["2014-10-28", 4761.85],["2014-11-28", 4828.12],["2014-12-28", 4894.39],
    ["2015-01-28", 4934.15],["2015-02-28", 4973.92],["2015-03-28", 5013.69],["2015-04-28", 5053.45],
    ["2015-05-28", 5093.22],["2015-06-28", 5132.99],["2015-07-28", 5172.75],["2015-08-28", 5212.52],
    ["2015-09-28", 5252.29],["2015-10-28", 5292.06],["2015-11-28", 5331.82],["2015-12-28", 5371.59],
    ["2016-01-28", 5404.13],["2016-02-28", 5436.68],["2016-03-28", 5469.22],["2016-04-28", 5501.76],
    ["2016-05-28", 5534.3],["2016-06-28", 5566.85],["2016-07-28", 5599.39],["2016-08-28", 5631.93],
    ["2016-09-28", 5664.48],["2016-10-28", 5697.02],["2016-11-28", 5729.56],["2016-12-28", 5762.1],
    ["2017-01-28", 5920.51],["2017-02-28", 6078.92],["2017-03-28", 6237.33],["2017-04-28", 6395.74],
    ["2017-05-28", 6554.15],["2017-06-28", 6712.56],["2017-07-28", 6870.97],["2017-08-28", 7029.38],
    ["2017-09-28", 7187.79],["2017-10-28", 7346.2],["2017-11-28", 7504.61],["2017-12-28", 7663.02],
    ["2018-01-28", 7662.58],["2018-02-28", 7662.13],["2018-03-28", 7661.68],["2018-04-28", 7661.23],
    ["2018-05-28", 7660.79],["2018-06-28", 7660.34],["2018-07-28", 7659.89],["2018-08-28", 7659.45],
    ["2018-09-28", 7659.0],["2018-10-28", 7658.55],["2018-11-28", 7658.1],["2018-12-28", 7657.66],
    ["2019-01-28", 7909.47],["2019-02-28", 8161.28],["2019-03-28", 8413.09],["2019-04-28", 8664.9],
    ["2019-05-28", 8916.7],["2019-06-28", 9168.51],["2019-07-28", 9420.32],["2019-08-28", 9672.13],
    ["2019-09-28", 9923.94],["2019-10-28", 10175.75],["2019-11-28", 10427.56],["2019-12-28", 10679.37],
    ["2020-01-28", 11114.38],["2020-02-28", 11549.38],["2020-03-28", 11984.39],["2020-04-28", 12419.4],
    ["2020-05-28", 12854.4],["2020-06-28", 13289.41],["2020-07-28", 13724.41],["2020-08-28", 14159.42],
    ["2020-09-28", 14594.43],["2020-10-28", 15029.43],["2020-11-28", 15464.44],["2020-12-28", 15899.45],
    ["2021-01-28", 16263.94],["2021-02-28", 16628.44],["2021-03-28", 16992.93],["2021-04-28", 17357.42],
    ["2021-05-28", 17721.92],["2021-06-28", 18086.41],["2021-07-28", 18450.91],["2021-08-28", 18815.4],
    ["2021-09-28", 19179.9],["2021-10-28", 19544.39],["2021-11-28", 19908.89],["2021-12-28", 20273.38],
    ["2022-01-28", 19726.34],["2022-02-28", 19179.3],["2022-03-28", 18632.25],["2022-04-28", 18085.21],
    ["2022-05-28", 17538.17],["2022-06-28", 16991.12],["2022-07-28", 16444.08],["2022-08-28", 15897.04],
    ["2022-09-28", 15349.99],["2022-10-28", 14802.95],["2022-11-28", 14255.91],["2022-12-28", 13708.86],
    ["2023-01-28", 14338.67],["2023-02-28", 14968.48],["2023-03-28", 15598.29],["2023-04-28", 16228.09],
    ["2023-05-28", 16857.9],["2023-06-28", 17487.71],["2023-07-28", 18117.52],["2023-08-28", 18747.33],
    ["2023-09-28", 19377.13],["2023-10-28", 20006.94],["2023-11-28", 20636.75],["2023-12-28", 21266.56],
    ["2024-01-28", 21720.24],["2024-02-28", 22173.93],["2024-03-28", 22627.62],["2024-04-28", 23081.3],
    ["2024-05-28", 23534.99],["2024-06-28", 23988.68],["2024-07-28", 24442.36],["2024-08-28", 24896.05],
    ["2024-09-28", 25349.74],["2024-10-28", 25803.42],["2024-11-28", 26257.11],["2024-12-28", 26710.8],
    ["2025-01-28", 27267.27],["2025-02-28", 27823.75],["2025-03-28", 28380.22],["2025-04-28", 28936.7],
    ["2025-05-28", 29493.17],["2025-06-28", 30049.65],["2025-07-28", 30606.12],["2025-08-28", 31162.59],
    ["2025-09-28", 31719.07],["2025-10-28", 32275.54],["2025-11-28", 32832.02],["2025-12-28", 33388.49],
    ["2026-01-28", 33465.29],["2026-02-28", 33542.08],["2026-03-28", 33618.88],["2026-04-28", 33695.67],
    ["2026-05-28", 33772.46]
  ];

  var GOLD_DATA = [
    ["2010-01-28",1127.13],["2010-02-28",1154.26],["2010-03-28",1181.39],["2010-04-28",1208.52],
    ["2010-05-28",1235.65],["2010-06-28",1262.78],["2010-07-28",1289.91],["2010-08-28",1317.04],
    ["2010-09-28",1344.17],["2010-10-28",1371.30],["2010-11-28",1398.43],["2010-12-28",1425.16],
    ["2011-01-28",1437.31],["2011-02-28",1449.45],["2011-03-28",1461.60],["2011-04-28",1473.75],
    ["2011-05-28",1485.89],["2011-06-28",1498.04],["2011-07-28",1510.18],["2011-08-28",1522.33],
    ["2011-09-28",1534.47],["2011-10-28",1546.62],["2011-11-28",1558.76],["2011-12-28",1570.85],
    ["2012-01-28",1580.13],["2012-02-28",1589.41],["2012-03-28",1598.70],["2012-04-28",1607.98],
    ["2012-05-28",1617.26],["2012-06-28",1626.55],["2012-07-28",1635.83],["2012-08-28",1645.11],
    ["2012-09-28",1654.40],["2012-10-28",1663.68],["2012-11-28",1672.96],["2012-12-28",1682.18],
    ["2013-01-28",1642.79],["2013-02-28",1603.40],["2013-03-28",1564.02],["2013-04-28",1524.63],
    ["2013-05-28",1485.25],["2013-06-28",1445.86],["2013-07-28",1406.47],["2013-08-28",1367.08],
    ["2013-09-28",1327.70],["2013-10-28",1288.31],["2013-11-28",1248.92],["2013-12-28",1209.62],
    ["2014-01-28",1207.94],["2014-02-28",1206.25],["2014-03-28",1204.57],["2014-04-28",1202.88],
    ["2014-05-28",1201.19],["2014-06-28",1199.51],["2014-07-28",1197.82],["2014-08-28",1196.14],
    ["2014-09-28",1194.45],["2014-10-28",1192.77],["2014-11-28",1191.08],["2014-12-28",1189.42],
    ["2015-01-28",1179.10],["2015-02-28",1168.77],["2015-03-28",1158.45],["2015-04-28",1148.13],
    ["2015-05-28",1137.81],["2015-06-28",1127.48],["2015-07-28",1117.16],["2015-08-28",1106.84],
    ["2015-09-28",1096.52],["2015-10-28",1086.19],["2015-11-28",1075.87],["2015-12-28",1065.48],
    ["2016-01-28",1073.08],["2016-02-28",1080.68],["2016-03-28",1088.28],["2016-04-28",1095.88],
    ["2016-05-28",1103.48],["2016-06-28",1111.08],["2016-07-28",1118.68],["2016-08-28",1126.28],
    ["2016-09-28",1133.88],["2016-10-28",1141.48],["2016-11-28",1149.08],["2016-12-28",1156.69],
    ["2017-01-28",1169.88],["2017-02-28",1183.07],["2017-03-28",1196.27],["2017-04-28",1209.46],
    ["2017-05-28",1222.65],["2017-06-28",1235.84],["2017-07-28",1249.03],["2017-08-28",1262.22],
    ["2017-09-28",1275.42],["2017-10-28",1288.61],["2017-11-28",1301.80],["2017-12-28",1314.92],
    ["2018-01-28",1313.08],["2018-02-28",1311.24],["2018-03-28",1309.41],["2018-04-28",1307.57],
    ["2018-05-28",1305.73],["2018-06-28",1303.90],["2018-07-28",1302.06],["2018-08-28",1300.22],
    ["2018-09-28",1298.39],["2018-10-28",1296.55],["2018-11-28",1294.71],["2018-12-28",1292.83],
    ["2019-01-28",1312.67],["2019-02-28",1332.51],["2019-03-28",1352.36],["2019-04-28",1372.20],
    ["2019-05-28",1392.04],["2019-06-28",1411.88],["2019-07-28",1431.72],["2019-08-28",1451.56],
    ["2019-09-28",1471.41],["2019-10-28",1491.25],["2019-11-28",1511.09],["2019-12-28",1530.93],
    ["2020-01-28",1561.84],["2020-02-28",1592.75],["2020-03-28",1623.66],["2020-04-28",1654.57],
    ["2020-05-28",1685.48],["2020-06-28",1716.39],["2020-07-28",1747.30],["2020-08-28",1778.21],
    ["2020-09-28",1809.12],["2020-10-28",1840.03],["2020-11-28",1870.94],["2020-12-28",1901.78],
    ["2021-01-28",1895.83],["2021-02-28",1889.87],["2021-03-28",1883.92],["2021-04-28",1877.97],
    ["2021-05-28",1872.01],["2021-06-28",1866.06],["2021-07-28",1860.11],["2021-08-28",1854.15],
    ["2021-09-28",1848.20],["2021-10-28",1842.25],["2021-11-28",1836.29],["2021-12-28",1833.43],
    ["2022-01-28",1832.86],["2022-02-28",1832.30],["2022-03-28",1831.73],["2022-04-28",1831.17],
    ["2022-05-28",1830.61],["2022-06-28",1830.04],["2022-07-28",1829.48],["2022-08-28",1828.91],
    ["2022-09-28",1828.35],["2022-10-28",1827.79],["2022-11-28",1827.22],["2022-12-28",1826.83],
    ["2023-01-28",1846.79],["2023-02-28",1866.74],["2023-03-28",1886.70],["2023-04-28",1906.65],
    ["2023-05-28",1926.61],["2023-06-28",1946.57],["2023-07-28",1966.52],["2023-08-28",1986.48],
    ["2023-09-28",2006.43],["2023-10-28",2026.39],["2023-11-28",2046.35],["2023-12-28",2065.18],
    ["2024-01-28",2111.92],["2024-02-28",2158.65],["2024-03-28",2205.39],["2024-04-28",2252.13],
    ["2024-05-28",2298.86],["2024-06-28",2345.60],["2024-07-28",2392.34],["2024-08-28",2439.07],
    ["2024-09-28",2485.81],["2024-10-28",2532.55],["2024-11-28",2579.29],["2024-12-28",2626.78],
    ["2025-01-28",2703.42],["2025-02-28",2780.06],["2025-03-28",2856.70],["2025-04-28",2933.34],
    ["2025-05-28",3009.99],["2025-06-28",3086.63],["2025-07-28",3163.27],["2025-08-28",3239.91],
    ["2025-09-28",3316.55],["2025-10-28",3393.19],["2025-11-28",3469.83],["2025-12-28",3545.66],
    ["2026-01-28",3580.97],["2026-02-28",3616.27],["2026-03-28",3651.58],["2026-04-28",3686.88],
    ["2026-05-28",3722.19]
  ];

  /* ───────────── Helper functions ───────────── */

  // Power Law BTC price at day d from genesis (PL_A, PL_B from shared module)
  function plBtcPrice(d) {
    if (typeof PL_A !== 'undefined' && typeof PL_B !== 'undefined') {
      return PL_A * Math.pow(d, PL_B);
    }
    return 1.6e-17 * Math.pow(d, 5.77);
  }

  // Days since bitcoin genesis (Jan 3, 2009)
  var GENESIS_TS = 1230940800;
  function daysSinceGenesisFromDate(d) {
    return (d.getTime() / 1000 - GENESIS_TS) / 86400;
  }

  // Get BTC price closest to a given date string (yyyy-mm-dd) from PL_DATA
  function btcPriceOnDate(dateStr) {
    if (typeof PL_DATA === 'undefined' || !PL_DATA.length) {
      // Fallback to Power Law trend
      var d = daysSinceGenesisFromDate(new Date(dateStr));
      return plBtcPrice(d);
    }
    var targetDays = daysSinceGenesisFromDate(new Date(dateStr));
    var closest = PL_DATA[0];
    var minDiff = Math.abs(PL_DATA[0][0] - targetDays);
    for (var i = 1; i < PL_DATA.length; i++) {
      var diff = Math.abs(PL_DATA[i][0] - targetDays);
      if (diff < minDiff) { minDiff = diff; closest = PL_DATA[i]; }
    }
    return closest[1];
  }

  // Find comparator value at a given date (using closest monthly entry)
  function valueOnDate(series, dateStr) {
    var target = new Date(dateStr).getTime();
    var closest = series[0];
    var minDiff = Math.abs(new Date(series[0][0]).getTime() - target);
    for (var i = 1; i < series.length; i++) {
      var diff = Math.abs(new Date(series[i][0]).getTime() - target);
      if (diff < minDiff) { minDiff = diff; closest = series[i]; }
    }
    return closest[1];
  }

  // Map slider index (0-195) to a date string. Index 0 = 2010-01-28, index 195 = 2026-05-28.
  function sliderIndexToDate(idx) {
    return SP500_TR_DATA[Math.max(0, Math.min(idx, SP500_TR_DATA.length - 1))][0];
  }

  // Pretty-format date string yyyy-mm-dd → 'Mon dd, yyyy'
  function fmtDate(isoStr) {
    var d = new Date(isoStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // Format USD with $ prefix and commas / abbreviations
  function fmtUsd(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (abs >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return '$' + Math.round(v).toLocaleString();
    return '$' + v.toFixed(0);
  }

  function fmtMultiple(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(2) + '×';
  }

  // Format date back to ISO for the most-recent comparator entry
  function todayISO() {
    return SP500_TR_DATA[SP500_TR_DATA.length - 1][0];
  }

  /* ───────────── §1: Lump-sum calculator ───────────── */

  var lumpChart = null;

  function recomputeLumpSum() {
    var startEl = document.getElementById('bvsmStartDate');
    var amountEl = document.getElementById('bvsmLumpAmount');
    if (!startEl || !amountEl) return;
    var startDate = sliderIndexToDate(parseInt(startEl.value, 10));
    var amount = parseFloat(amountEl.value);
    document.getElementById('bvsmStartDateVal').textContent = fmtDate(startDate);
    document.getElementById('bvsmLumpAmountVal').textContent = fmtUsd(amount);

    // Initial prices
    var btc0 = btcPriceOnDate(startDate);
    var sp0  = valueOnDate(SP500_TR_DATA, startDate);
    var ndq0 = valueOnDate(NDQ_TR_DATA, startDate);
    var gold0 = valueOnDate(GOLD_DATA, startDate);

    // Final prices (today)
    var today = todayISO();
    var btc1 = btcPriceOnDate(today);
    var sp1  = valueOnDate(SP500_TR_DATA, today);
    var ndq1 = valueOnDate(NDQ_TR_DATA, today);
    var gold1 = valueOnDate(GOLD_DATA, today);

    var btcValue  = amount * (btc1 / btc0);
    var spValue   = amount * (sp1 / sp0);
    var ndqValue  = amount * (ndq1 / ndq0);
    var goldValue = amount * (gold1 / gold0);

    var years = (new Date(today) - new Date(startDate)) / (365.25 * 86400000);
    var btcCagr  = Math.pow(btcValue/amount, 1/years) - 1;
    var spCagr   = Math.pow(spValue/amount, 1/years) - 1;
    var ndqCagr  = Math.pow(ndqValue/amount, 1/years) - 1;
    var goldCagr = Math.pow(goldValue/amount, 1/years) - 1;

    document.getElementById('bvsmBtcValue').textContent  = fmtUsd(btcValue);
    document.getElementById('bvsmSpValue').textContent   = fmtUsd(spValue);
    document.getElementById('bvsmNdqValue').textContent  = fmtUsd(ndqValue);
    document.getElementById('bvsmGoldValue').textContent = fmtUsd(goldValue);

    function rowHtml(label, value) {
      return '<div class="row"><span class="row-label">' + label + '</span><span class="row-val">' + value + '</span></div>';
    }
    document.getElementById('bvsmBtcRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(btcValue/amount)) +
      rowHtml('CAGR', (btcCagr*100).toFixed(1) + '%');
    document.getElementById('bvsmSpRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(spValue/amount)) +
      rowHtml('CAGR', (spCagr*100).toFixed(1) + '%');
    document.getElementById('bvsmNdqRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(ndqValue/amount)) +
      rowHtml('CAGR', (ndqCagr*100).toFixed(1) + '%');
    document.getElementById('bvsmGoldRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(goldValue/amount)) +
      rowHtml('CAGR', (goldCagr*100).toFixed(1) + '%');

    // Verdict
    var btcVsSp = btcValue / spValue;
    var verdictEl = document.getElementById('bvsmLumpVerdict');
    var btcWon = btcValue > spValue && btcValue > ndqValue && btcValue > goldValue;
    var verdictText;
    if (years < 2) {
      verdictText = '<strong>The horizon from this start date is under 2 years</strong> &mdash; the long-horizon argument hasn\'t had time to play out yet. Try one of the older preset dates to see how multi-year holds compared.';
    } else if (btcWon) {
      verdictText = 'Over <strong>' + years.toFixed(1) + ' years</strong> from ' + fmtDate(startDate) + ' to today, the bitcoin position is worth <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong>, despite starting at a cyclical top. Holding through the drawdowns paid off.';
    } else {
      verdictText = 'Over <strong>' + years.toFixed(1) + ' years</strong> from ' + fmtDate(startDate) + ', the bitcoin position has not yet pulled ahead of every comparator. Bitcoin: ' + fmtUsd(btcValue) + '. S&amp;P 500: ' + fmtUsd(spValue) + '.';
    }
    verdictEl.innerHTML = verdictText;

    // Update chart
    renderLumpChart(startDate, amount, btc0, sp0, ndq0, gold0);
  }

  function renderLumpChart(startDate, amount, btc0, sp0, ndq0, gold0) {
    var canvas = document.getElementById('bvsmLumpChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Build wealth-over-time arrays at monthly resolution from startDate to today
    var labels = [];
    var btcData = [], spData = [], ndqData = [], goldData = [];

    var startIdx = -1;
    for (var i = 0; i < SP500_TR_DATA.length; i++) {
      if (SP500_TR_DATA[i][0] === startDate) { startIdx = i; break; }
    }
    if (startIdx === -1) {
      // Find nearest
      var target = new Date(startDate).getTime();
      var minDiff = Infinity;
      for (var i = 0; i < SP500_TR_DATA.length; i++) {
        var diff = Math.abs(new Date(SP500_TR_DATA[i][0]).getTime() - target);
        if (diff < minDiff) { minDiff = diff; startIdx = i; }
      }
    }

    for (var i = startIdx; i < SP500_TR_DATA.length; i++) {
      var dateStr = SP500_TR_DATA[i][0];
      labels.push(dateStr.substring(0,7));  // yyyy-mm
      btcData.push(amount * (btcPriceOnDate(dateStr) / btc0));
      spData.push(amount * (SP500_TR_DATA[i][1] / sp0));
      ndqData.push(amount * (NDQ_TR_DATA[i][1] / ndq0));
      goldData.push(amount * (GOLD_DATA[i][1] / gold0));
    }

    var datasets = [
      { label: 'Bitcoin', data: btcData, borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'S&P 500 (TR)', data: spData, borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'NASDAQ-100 (TR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'Gold', data: goldData, borderColor: '#c9a85a', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 }
    ];

    if (lumpChart) lumpChart.destroy();
    lumpChart = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#9a9080', font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtUsd(ctx.parsed.y); } } }
        },
        scales: {
          x: { ticks: { color: '#6a6256', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { type: 'logarithmic', ticks: { color: '#6a6256', font: { size: 10 }, callback: function(v){ return fmtUsd(v); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  /* ───────────── §2: DCA calculator ───────────── */

  var dcaChart = null;

  function recomputeDca() {
    var startEl = document.getElementById('bvsmDcaStartDate');
    var weeklyEl = document.getElementById('bvsmDcaWeekly');
    if (!startEl || !weeklyEl) return;
    var startDate = sliderIndexToDate(parseInt(startEl.value, 10));
    var weeklyAmt = parseFloat(weeklyEl.value);
    var monthlyAmt = weeklyAmt * 52 / 12;

    document.getElementById('bvsmDcaStartDateVal').textContent = fmtDate(startDate);
    document.getElementById('bvsmDcaWeeklyVal').textContent = fmtUsd(weeklyAmt);

    var startIdx = -1;
    for (var i = 0; i < SP500_TR_DATA.length; i++) {
      if (SP500_TR_DATA[i][0] === startDate) { startIdx = i; break; }
    }
    if (startIdx === -1) {
      var target = new Date(startDate).getTime();
      var minDiff = Infinity;
      for (var i = 0; i < SP500_TR_DATA.length; i++) {
        var diff = Math.abs(new Date(SP500_TR_DATA[i][0]).getTime() - target);
        if (diff < minDiff) { minDiff = diff; startIdx = i; }
      }
    }

    // Simulate monthly DCA: each month buy monthlyAmt at that month's close
    var labels = [];
    var investedSeries = [], btcSeries = [], spSeries = [], ndqSeries = [], goldSeries = [];
    var btcUnits = 0, spUnits = 0, ndqUnits = 0, goldUnits = 0;
    var totalInvested = 0;

    for (var i = startIdx; i < SP500_TR_DATA.length; i++) {
      var dateStr = SP500_TR_DATA[i][0];
      var btcP = btcPriceOnDate(dateStr);
      var spP = SP500_TR_DATA[i][1];
      var ndqP = NDQ_TR_DATA[i][1];
      var goldP = GOLD_DATA[i][1];

      btcUnits  += monthlyAmt / btcP;
      spUnits   += monthlyAmt / spP;
      ndqUnits  += monthlyAmt / ndqP;
      goldUnits += monthlyAmt / goldP;
      totalInvested += monthlyAmt;

      labels.push(dateStr.substring(0,7));
      investedSeries.push(totalInvested);
      btcSeries.push(btcUnits * btcP);
      spSeries.push(spUnits * spP);
      ndqSeries.push(ndqUnits * ndqP);
      goldSeries.push(goldUnits * goldP);
    }

    var btcFinal = btcSeries[btcSeries.length - 1];
    var spFinal = spSeries[spSeries.length - 1];
    var ndqFinal = ndqSeries[ndqSeries.length - 1];
    var goldFinal = goldSeries[goldSeries.length - 1];

    document.getElementById('bvsmDcaBtcValue').textContent  = fmtUsd(btcFinal);
    document.getElementById('bvsmDcaSpValue').textContent   = fmtUsd(spFinal);
    document.getElementById('bvsmDcaNdqValue').textContent  = fmtUsd(ndqFinal);
    document.getElementById('bvsmDcaGoldValue').textContent = fmtUsd(goldFinal);

    function rowHtml(label, value) {
      return '<div class="row"><span class="row-label">' + label + '</span><span class="row-val">' + value + '</span></div>';
    }
    function rowsFor(final) {
      return rowHtml('Total invested', fmtUsd(totalInvested)) +
             rowHtml('Multiple', fmtMultiple(final / totalInvested));
    }
    document.getElementById('bvsmDcaBtcRows').innerHTML  = rowsFor(btcFinal);
    document.getElementById('bvsmDcaSpRows').innerHTML   = rowsFor(spFinal);
    document.getElementById('bvsmDcaNdqRows').innerHTML  = rowsFor(ndqFinal);
    document.getElementById('bvsmDcaGoldRows').innerHTML = rowsFor(goldFinal);

    var verdictText = 'After <strong>' + (labels.length / 12).toFixed(1) + ' years</strong> of weekly DCA from ' + fmtDate(startDate) + ', total invested: ' + fmtUsd(totalInvested) + '. The bitcoin position is worth <strong>' + fmtUsd(btcFinal) + '</strong>, the S&amp;P 500 position <strong>' + fmtUsd(spFinal) + '</strong>. Bitcoin / S&amp;P 500 ratio: <strong>' + fmtMultiple(btcFinal / spFinal) + '</strong>.';
    document.getElementById('bvsmDcaVerdict').innerHTML = verdictText;

    // Render chart
    var canvas = document.getElementById('bvsmDcaChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var datasets = [
      { label: 'Bitcoin', data: btcSeries, borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'S&P 500 (TR)', data: spSeries, borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'NASDAQ-100 (TR)', data: ndqSeries, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'Gold', data: goldSeries, borderColor: '#c9a85a', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'Cumulative invested', data: investedSeries, borderColor: '#bfae97', borderWidth: 1.4, borderDash: [5,4], fill: false, tension: 0.1, pointRadius: 0 }
    ];

    if (dcaChart) dcaChart.destroy();
    dcaChart = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#9a9080', font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtUsd(ctx.parsed.y); } } }
        },
        scales: {
          x: { ticks: { color: '#6a6256', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { type: 'logarithmic', ticks: { color: '#6a6256', font: { size: 10 }, callback: function(v){ return fmtUsd(v); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  /* ───────────── §3: Forward projection ───────────── */

  var projChart = null;

  function recomputeProjection() {
    var horizonEl = document.getElementById('bvsmProjHorizon');
    var investEl = document.getElementById('bvsmProjInvest');
    if (!horizonEl || !investEl) return;
    var horizonYears = parseInt(horizonEl.value, 10);
    var investAmt = parseFloat(investEl.value);
    document.getElementById('bvsmProjHorizonVal').textContent = horizonYears + ' years';
    document.getElementById('bvsmProjInvestVal').textContent = fmtUsd(investAmt);

    var todayDate = new Date(todayISO());
    var btcToday = btcPriceOnDate(todayISO());
    var spToday = SP500_TR_DATA[SP500_TR_DATA.length - 1][1];
    var ndqToday = NDQ_TR_DATA[NDQ_TR_DATA.length - 1][1];
    var goldToday = GOLD_DATA[GOLD_DATA.length - 1][1];

    var SP_CAGR = 0.10, NDQ_CAGR = 0.1626, GOLD_CAGR = 0.07;

    var labels = [];
    var btcData = [], spData = [], ndqData = [], goldData = [];
    for (var y = 0; y <= horizonYears; y++) {
      labels.push('+' + y + 'y');
      // BTC: Power Law at (today_days + y*365.25)
      var d = daysSinceGenesisFromDate(todayDate) + y * 365.25;
      var btcTrendPrice = plBtcPrice(d);
      var btcTrendValue = investAmt * (btcTrendPrice / btcToday);
      btcData.push(btcTrendValue);
      spData.push(investAmt * Math.pow(1 + SP_CAGR, y));
      ndqData.push(investAmt * Math.pow(1 + NDQ_CAGR, y));
      goldData.push(investAmt * Math.pow(1 + GOLD_CAGR, y));
    }

    document.getElementById('bvsmProjBtcValue').textContent  = fmtUsd(btcData[btcData.length-1]);
    document.getElementById('bvsmProjSpValue').textContent   = fmtUsd(spData[spData.length-1]);
    document.getElementById('bvsmProjNdqValue').textContent  = fmtUsd(ndqData[ndqData.length-1]);
    document.getElementById('bvsmProjGoldValue').textContent = fmtUsd(goldData[goldData.length-1]);

    var canvas = document.getElementById('bvsmProjectionChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var datasets = [
      { label: 'Bitcoin (Power Law)', data: btcData, borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'S&P 500 (10% CAGR)', data: spData, borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'NASDAQ-100 (16% CAGR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'Gold (7% CAGR)', data: goldData, borderColor: '#c9a85a', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 }
    ];

    if (projChart) projChart.destroy();
    projChart = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#9a9080', font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtUsd(ctx.parsed.y); } } }
        },
        scales: {
          x: { ticks: { color: '#6a6256', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { type: 'logarithmic', ticks: { color: '#6a6256', font: { size: 10 }, callback: function(v){ return fmtUsd(v); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  /* ───────────── Wire up controls ───────────── */

  function wireUp() {
    // Lump-sum presets
    document.querySelectorAll('.bvsm-preset:not(.bvsm-dca-preset)').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bvsm-preset:not(.bvsm-dca-preset)').forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var dateStr = btn.getAttribute('data-preset-date');
        // Find slider index for this date
        for (var i = 0; i < SP500_TR_DATA.length; i++) {
          if (SP500_TR_DATA[i][0] >= dateStr) {
            document.getElementById('bvsmStartDate').value = i;
            break;
          }
        }
        recomputeLumpSum();
      });
    });
    // DCA presets
    document.querySelectorAll('.bvsm-dca-preset').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bvsm-dca-preset').forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var dateStr = btn.getAttribute('data-preset-date');
        for (var i = 0; i < SP500_TR_DATA.length; i++) {
          if (SP500_TR_DATA[i][0] >= dateStr) {
            document.getElementById('bvsmDcaStartDate').value = i;
            break;
          }
        }
        recomputeDca();
      });
    });

    // Slider listeners
    ['bvsmStartDate','bvsmLumpAmount'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recomputeLumpSum);
    });
    ['bvsmDcaStartDate','bvsmDcaWeekly'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recomputeDca);
    });
    ['bvsmProjHorizon','bvsmProjInvest'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recomputeProjection);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      wireUp();
      recomputeLumpSum();
      recomputeDca();
      recomputeProjection();
    });
  } else {
    wireUp();
    recomputeLumpSum();
    recomputeDca();
    recomputeProjection();
  }

})();
