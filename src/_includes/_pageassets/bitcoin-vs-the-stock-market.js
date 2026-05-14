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
    ["2010-01-28",2304.25],["2010-02-28",2338.50],["2010-03-28",2372.75],["2010-04-28",2407.00],
    ["2010-05-28",2441.25],["2010-06-28",2475.50],["2010-07-28",2509.75],["2010-08-28",2544.00],
    ["2010-09-28",2578.25],["2010-10-28",2612.50],["2010-11-28",2646.75],["2010-12-28",2680.83],
    ["2011-01-28",2676.83],["2011-02-28",2672.82],["2011-03-28",2668.82],["2011-04-28",2664.81],
    ["2011-05-28",2660.81],["2011-06-28",2656.80],["2011-07-28",2652.79],["2011-08-28",2648.79],
    ["2011-09-28",2644.78],["2011-10-28",2640.78],["2011-11-28",2636.77],["2011-12-28",2632.83],
    ["2012-01-28",2667.74],["2012-02-28",2702.64],["2012-03-28",2737.55],["2012-04-28",2772.46],
    ["2012-05-28",2807.37],["2012-06-28",2842.28],["2012-07-28",2877.19],["2012-08-28",2912.10],
    ["2012-09-28",2947.01],["2012-10-28",2981.92],["2012-11-28",3016.83],["2012-12-28",3051.51],
    ["2013-01-28",3148.51],["2013-02-28",3245.50],["2013-03-28",3342.50],["2013-04-28",3439.49],
    ["2013-05-28",3536.48],["2013-06-28",3633.48],["2013-07-28",3730.47],["2013-08-28",3827.47],
    ["2013-09-28",3924.46],["2013-10-28",4021.45],["2013-11-28",4118.45],["2013-12-28",4215.79],
    ["2014-01-28",4262.79],["2014-02-28",4309.78],["2014-03-28",4356.78],["2014-04-28",4403.77],
    ["2014-05-28",4450.77],["2014-06-28",4497.77],["2014-07-28",4544.76],["2014-08-28",4591.76],
    ["2014-09-28",4638.75],["2014-10-28",4685.75],["2014-11-28",4732.74],["2014-12-28",4779.86],
    ["2015-01-28",4802.49],["2015-02-28",4825.13],["2015-03-28",4847.76],["2015-04-28",4870.40],
    ["2015-05-28",4893.03],["2015-06-28",4915.67],["2015-07-28",4938.30],["2015-08-28",4960.94],
    ["2015-09-28",4983.57],["2015-10-28",5006.21],["2015-11-28",5028.84],["2015-12-28",5051.36],
    ["2016-01-28",5084.62],["2016-02-28",5117.89],["2016-03-28",5151.15],["2016-04-28",5184.41],
    ["2016-05-28",5217.67],["2016-06-28",5250.93],["2016-07-28",5284.20],["2016-08-28",5317.46],
    ["2016-09-28",5350.72],["2016-10-28",5383.98],["2016-11-28",5417.25],["2016-12-28",5450.91],
    ["2017-01-28",5580.95],["2017-02-28",5710.99],["2017-03-28",5841.03],["2017-04-28",5971.07],
    ["2017-05-28",6101.10],["2017-06-28",6231.14],["2017-07-28",6361.18],["2017-08-28",6491.22],
    ["2017-09-28",6621.26],["2017-10-28",6751.30],["2017-11-28",6881.34],["2017-12-28",7011.41],
    ["2018-01-28",6989.16],["2018-02-28",6966.92],["2018-03-28",6944.67],["2018-04-28",6922.42],
    ["2018-05-28",6900.17],["2018-06-28",6877.92],["2018-07-28",6855.68],["2018-08-28",6833.43],
    ["2018-09-28",6811.18],["2018-10-28",6788.93],["2018-11-28",6766.68],["2018-12-28",6744.27],
    ["2019-01-28",6942.46],["2019-02-28",7140.66],["2019-03-28",7338.85],["2019-04-28",7537.04],
    ["2019-05-28",7735.24],["2019-06-28",7933.43],["2019-07-28",8131.62],["2019-08-28",8329.82],
    ["2019-09-28",8528.01],["2019-10-28",8726.20],["2019-11-28",8924.40],["2019-12-28",9122.59],
    ["2020-01-28",9453.85],["2020-02-28",9785.10],["2020-03-28",10116.36],["2020-04-28",10447.62],
    ["2020-05-28",10778.87],["2020-06-28",11110.13],["2020-07-28",11441.39],["2020-08-28",11772.64],
    ["2020-09-28",12103.90],["2020-10-28",12435.16],["2020-11-28",12766.41],["2020-12-28",13097.58],
    ["2021-01-28",13328.79],["2021-02-28",13560.00],["2021-03-28",13791.21],["2021-04-28",14022.42],
    ["2021-05-28",14253.63],["2021-06-28",14484.85],["2021-07-28",14716.06],["2021-08-28",14947.27],
    ["2021-09-28",15178.48],["2021-10-28",15409.69],["2021-11-28",15640.90],["2021-12-28",15871.92],
    ["2022-01-28",15434.16],["2022-02-28",14996.39],["2022-03-28",14558.63],["2022-04-28",14120.86],
    ["2022-05-28",13683.09],["2022-06-28",13245.33],["2022-07-28",12807.56],["2022-08-28",12369.79],
    ["2022-09-28",11932.03],["2022-10-28",11494.26],["2022-11-28",11056.50],["2022-12-28",10618.91],
    ["2023-01-28",10999.83],["2023-02-28",11380.74],["2023-03-28",11761.66],["2023-04-28",12142.57],
    ["2023-05-28",12523.49],["2023-06-28",12904.40],["2023-07-28",13285.32],["2023-08-28",13666.23],
    ["2023-09-28",14047.15],["2023-10-28",14428.06],["2023-11-28",14808.98],["2023-12-28",15188.45],
    ["2024-01-28",15554.20],["2024-02-28",15919.95],["2024-03-28",16285.70],["2024-04-28",16651.45],
    ["2024-05-28",17017.20],["2024-06-28",17382.95],["2024-07-28",17748.70],["2024-08-28",18114.45],
    ["2024-09-28",18480.20],["2024-10-28",18845.95],["2024-11-28",19211.70],["2024-12-28",19577.18],
    ["2025-01-28",19981.92],["2025-02-28",20386.65],["2025-03-28",20791.39],["2025-04-28",21196.13],
    ["2025-05-28",21600.87],["2025-06-28",22005.60],["2025-07-28",22410.34],["2025-08-28",22815.08],
    ["2025-09-28",23219.82],["2025-10-28",23624.56],["2025-11-28",24029.29],["2025-12-28",24433.97],
    ["2026-01-28",24536.39],["2026-02-28",24638.80],["2026-03-28",24741.21],["2026-04-28",24843.63],
    ["2026-05-28",24946.04]
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
      { label: 'NASDAQ (TR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
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
      { label: 'NASDAQ (TR)', data: ndqSeries, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
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

    var SP_CAGR = 0.10, NDQ_CAGR = 0.12, GOLD_CAGR = 0.07;

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
      { label: 'NASDAQ (12% CAGR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 },
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
