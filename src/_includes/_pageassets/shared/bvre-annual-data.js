/* ============================================================
   Bitcoin vs. Real Estate annual data — canonical homeData / btcData
   ============================================================
   Single source of truth for annual U.S. median home price
   (homeData, 23 entries: 1965-2025) and annual bitcoin average price
   (btcData, 13 entries: 2013-2025). Both are year-keyed objects with
   numeric values.

   homeData: the median sales price of new houses sold in the US, each
   year's average of the four quarterly values (Census/HUD via FRED
   MSPUS, annual average; sparse before 2013). The same definition as the
   housing pages' $415,000 default (DATA_AUDIT RE-6). Restated 2026-10-03
   from FRED's current vintage (JM); the old values were an earlier
   vintage of Census's annual medians, up to 5% off (2021, 2022). To add a
   year: fredgraph.csv?id=MSPUS&fq=Annual&fam=avg, rounded to the dollar.
   btcData: each year's average price, the mean of PL_DATA's samples in
   that calendar year (a ~12-day grid, close to the daily average). This
   is the retrospective's method (DATA_AUDIT RE-20), so the static
   exhibits and the calculator price a year the same way. Restated
   2026-10-03: the old values mixed methods (2013 was near the year-end
   price, 732 against an average of 190; 2022 and 2025 were snapshots,
   19,657 and 88,000 against 27,920 and 102,775). To add a year in
   January, run in the browser console on any page:
     (function(y){var s=0,n=0;PL_DATA.forEach(function(r){if(new Date((GENESIS_TS+r[0]*86400)*1000).getUTCFullYear()===y){s+=r[1];n++;}});return Math.round(s/n);})(2026)

   Consumed by:
     /bitcoin-vs-real-estate (the deep-dive page — Question, Postponed
       Purchase, Cost-of-Ownership, Affordability calculators all
       reference homeData and btcData)
     /the-gallery Chart 3 (BTC Required to Buy the Median US House)
     /the-gallery Chart 4 (The Real Opportunity Cost)
     /the-gallery Chart 7 (4-Year Annualized Returns — previously used
       a separate variable named BTC_ANNUAL that contained identical
       data to btcData; the variable was renamed to btcData at the
       same time as this refactor)

   Promoted to /shared/ on 2026-05-30. TECH_DEBT.md §1 closes this
   item (along with the TR-comparator and BTC monthly refactors).

   Annual refresh: at year-end, append the new year's median home
   price to homeData and the year's BTC average to btcData. This is
   the ONLY place either value lives. MONTHLY_REFRESH_CHECKLIST.md
   §11 (Annual — January) documents the annual cadence.

   Naming: lowercase `homeData` / `btcData` preserves BvRE's
   existing convention (the original site of both arrays). The
   uppercase site-wide convention for shared data globals
   (PL_DATA, SP500_TR_DATA, BTC_MONTHLY) is not applied here to
   minimize the rename surface on BvRE; ~30 in-file references to
   homeData/btcData would otherwise need touching for purely
   stylistic reasons.

   ============================================================ */

var homeData = {
    1965:20125,1970:23475,1975:39275,1980:64750,1985:84275,1990:122300,1995:133475,2000:167550,2005:236550,2010:222700,2013:266225,2014:285775,2015:294150,2016:305125,2017:322425,2018:325275,2019:320250,2020:328150,2021:383000,2022:432950,2023:426525,2024:418975,2025:415400
};

// Case-Shiller National, annual average of the monthly NSA index (FRED
// CSUSHPINSA; the same series as CS_NATIONAL in housing-monthly-data.js).
// The growth-of-$1 and every-starting-year exhibits grow housing by this
// index rather than by the new-house median, whose mix shifts (rulings M11,
// PR 4e). Latest full year only; roll forward each January with homeData.
// Restated 2026-10-01 from FRED's current vintage (S&P's revision moved
// 2022–2025 by 0.01–0.02; the rest unchanged at 2 dp).
var csData = {
    2013:154.51,2014:164.67,2015:172.15,2016:180.89,2017:191.35,2018:202.43,2019:209.4,2020:222.06,2021:259.96,2022:298.31,2023:305.72,2024:321.33,2025:328.5
};

var btcData = {
    2013:190,2014:524,2015:274,2016:553,2017:3967,2018:7599,2019:7313,2020:10962,2021:47158,2022:27920,2023:28693,2024:65153,2025:102775
};

// Bitcoin needed to buy the median new house: a fitted trend through the
// actual years and a Power Law path after them (JM, 2026-10-03). Shared by
// Bitcoin vs. Real Estate and The Gallery chart 3. The fit is least squares
// on the logarithm; the path grows the last year's house at apprPct a year
// and divides by bitcoin's Power Law trend price at mid-year (plPrice). The
// path is the model's trend, not a forecast; today bitcoin trades below it.
function btcHouseTrend(projYears, apprPct) {
    var years = Object.keys(btcData).map(Number), n = years.length;
    var xs = years, ys = years.map(function (y) { return Math.log(homeData[y] / btcData[y]); });
    var mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += xs[i] / n; my += ys[i] / n; }
    var sxy = 0, sxx = 0; for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var b = sxy / sxx, a = my - b * mx, last = years[n - 1];
    var appr = (typeof apprPct === 'number' && isFinite(apprPct)) ? apprPct : 4.68;
    var path = projYears.map(function (y) {
        if (typeof plPrice !== 'function' || typeof GENESIS_TS !== 'number') return null;
        var days = (Date.UTC(y, 6, 1) / 1000 - GENESIS_TS) / 86400;
        return +(homeData[last] * Math.pow(1 + appr / 100, y - last) / plPrice(days)).toFixed(2);
    });
    return {
        years: years,
        actual: years.map(function (y) { return +(homeData[y] / btcData[y]).toFixed(1); }),
        fit: years.map(function (y) { return +Math.exp(a + b * y).toFixed(1); }),
        fitChange: Math.exp(b) - 1,
        path: path
    };
}
