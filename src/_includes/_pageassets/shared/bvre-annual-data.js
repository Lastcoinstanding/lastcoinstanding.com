/* ============================================================
   Bitcoin vs. Real Estate annual data — canonical homeData / btcData
   ============================================================
   Single source of truth for annual U.S. median home price
   (homeData, 23 entries: 1965-2025) and annual bitcoin average price
   (btcData, 13 entries: 2013-2025). Both are year-keyed objects with
   numeric values.

   homeData sources: Census/HUD national median sales price series,
   sparse pre-1985 (decadal samples) and annual from 1990 forward.
   btcData sources: annual mean of monthly closes from the canonical
   BTC_MONTHLY series (see shared/btc-monthly-data.js).

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
   §7 documents the annual cadence.

   Naming: lowercase `homeData` / `btcData` preserves BvRE's
   existing convention (the original site of both arrays). The
   uppercase site-wide convention for shared data globals
   (PL_DATA, SP500_TR_DATA, BTC_MONTHLY) is not applied here to
   minimize the rename surface on BvRE; ~30 in-file references to
   homeData/btcData would otherwise need touching for purely
   stylistic reasons.

   ============================================================ */

var homeData = {
    1965:20000,1970:23400,1975:39300,1980:64600,1985:82800,1990:122900,1995:133900,2000:169000,2005:240900,2010:222900,2013:268900,2014:282800,2015:294000,2016:306200,2017:323500,2018:326400,2019:321500,2020:336900,2021:401700,2022:454900,2023:426100,2024:420300,2025:416900
};

var btcData = {
    2013:732,2014:530,2015:272,2016:567,2017:4348,2018:7565,2019:7362,2020:11072,2021:47458,2022:19657,2023:28233,2024:62682,2025:88000
};
