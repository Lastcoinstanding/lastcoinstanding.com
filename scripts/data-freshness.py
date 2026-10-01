#!/usr/bin/env python3
"""
Data freshness report: run it at the start of every monthly refresh.

Reads the site's embedded data series, dated constants and dated strings
straight from the source files (no build, no network) and prints, for each
one, its latest point, the cadence it is refreshed on, and the section of
MONTHLY_REFRESH_CHECKLIST.md that says how. Anything past its cadence prints
DUE or OVERDUE, so the refresh starts from a list rather than from memory.

It covers what can be read mechanically. The judgement items (legal status,
present-tense claims in prose, event-driven copy) are in the checklist's §0
inventory and are not checked here.

Usage
    python3 scripts/data-freshness.py              # as of today
    python3 scripts/data-freshness.py 2026-10-15   # as if on that date

Standard library only. It is a report, not a gate: the exit status is 0.
Added 2026-09-29 with the §0 refresh inventory (the Is Bitcoin a Bubble?
chart had gone six months without a refresh because nothing listed it).
"""
import calendar
import datetime as dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
PA = os.path.join(SRC, '_includes', '_pageassets')
GENESIS = dt.date(2009, 1, 3)
PEAK_2017 = dt.date(2017, 12, 16)
MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_abbr) if m})
MONTHS['sept'] = 9

TODAY = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date.today()
rows = []


def read(*parts):
    with open(os.path.join(*parts), encoding='utf-8') as f:
        return f.read()


def month_end(y, m):
    return dt.date(y, m, calendar.monthrange(y, m)[1])


def add_months(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    return dt.date(d.year + y, m + 1, 1)


def last_tuesday(y, m):
    d = month_end(y, m)
    return d - dt.timedelta(days=(d.weekday() - 1) % 7)


def row(item, latest, status, cadence, section, where, note=''):
    rows.append((status, item, latest, cadence, section, where, note))


def by_age(item, latest_date, ok_days, due_days, cadence, section, where, note=''):
    """OK within ok_days of today, DUE up to due_days, OVERDUE beyond."""
    if latest_date is None:
        row(item, 'not found', 'CHECK', cadence, section, where, 'parser found nothing; read the file')
        return
    age = (TODAY - latest_date).days
    status = 'OK' if age <= ok_days else ('DUE' if age <= due_days else 'OVERDUE')
    row(item, '%s (%d days)' % (latest_date.isoformat(), age), status, cadence, section, where, note)


def by_expected(item, latest, expected, cadence, section, where, note=''):
    """latest and expected are comparable keys (dates or (y, m) tuples)."""
    if latest is None:
        row(item, 'not found', 'CHECK', cadence, section, where, 'parser found nothing; read the file')
        return
    fmt = lambda k: k.isoformat() if isinstance(k, dt.date) else ('%04d-%02d' % k if isinstance(k, tuple) else str(k))
    if isinstance(latest, dt.date):
        gap = (expected - latest).days            # days behind
        status = 'OK' if gap <= 0 else ('DUE' if gap <= 35 else 'OVERDUE')
    elif isinstance(latest, tuple):
        gap = (expected[0] * 12 + expected[1]) - (latest[0] * 12 + latest[1])   # months behind
        status = 'OK' if gap <= 0 else ('DUE' if gap == 1 else 'OVERDUE')
    else:
        gap = expected - latest                   # years behind
        status = 'OK' if gap <= 0 else ('DUE' if gap == 1 else 'OVERDUE')
    row(item, fmt(latest), status, cadence, section, where, (note + ' ' if note else '') + 'expected ' + fmt(expected))


def safe(fn):
    try:
        fn()
    except Exception as e:  # a parser broke: say so rather than stopping the report
        rows.append(('CHECK', fn.__name__, 'error', '', '', '', repr(e)[:120]))


# ── Monthly series ────────────────────────────────────────────────────────────
@safe
def pl_data():
    s = read(PA, 'shared', 'power-law-data.js')
    days = re.findall(r'\[(\d+(?:\.\d+)?),\s*[\d.]+\]', re.search(r'var PL_DATA = \[(.*?)\];', s, re.S).group(1))
    last = GENESIS + dt.timedelta(days=int(float(days[-1])))
    by_age('PL_DATA (Power Law price series)', last, 35, 45, 'monthly', '§1',
           'shared/power-law-data.js', 'the fallback price; the page console warns at 45 days')
    global PL_LAST_DAY
    PL_LAST_DAY = int(float(days[-1]))


@safe
def btc_monthly():
    s = read(PA, 'shared', 'btc-monthly-data.js')
    ks = re.findall(r'\["(\d{4})-(\d{2})"', s)
    last = (int(ks[-1][0]), int(ks[-1][1]))
    prev = add_months(TODAY, -1)
    by_expected('BTC_MONTHLY (month-end closes)', last, (prev.year, prev.month), 'monthly', '§1',
                'shared/btc-monthly-data.js', 'last completed month')


@safe
def tr_comparators():
    s = read(PA, 'shared', 'tr-comparator-data.js')
    for name in ('SP500_TR_DATA', 'NDQ_TR_DATA'):
        body = re.search(name + r'\s*=\s*\[(.*?)\];', s, re.S).group(1)
        last = dt.date.fromisoformat(re.findall(r'"(\d{4}-\d{2}-\d{2})"', body)[-1])
        exp = dt.date(TODAY.year, TODAY.month, 28) if TODAY.day > 28 else add_months(TODAY, -1).replace(day=28)
        by_expected(name + ' (Day-28 total return)', last, exp, 'monthly', '§1',
                    'shared/tr-comparator-data.js')


@safe
def housing():
    s = read(PA, 'shared', 'housing-monthly-data.js')
    def last_of(name):
        body = re.search(r'var ' + name + r'\s*=\s*\[(.*?)\];', s, re.S).group(1)
        y, m = re.findall(r"'(\d{4})-(\d{2})'", body)[-1]
        return (int(y), int(m))
    # Case-Shiller: published the last Tuesday of each month, two months behind.
    lag = 2 if TODAY > last_tuesday(TODAY.year, TODAY.month) else 3
    e = add_months(TODAY, -lag)
    by_expected('CS_NATIONAL (Case-Shiller, FRED CSUSHPINSA)', last_of('CS_NATIONAL'), (e.year, e.month),
                'monthly', '§9.4', 'shared/housing-monthly-data.js', 'FRED can post a day or two late')
    # Zillow: the prior month appears in the third week.
    z = add_months(TODAY, -1 if TODAY.day >= 20 else -2)
    for name in ('ZORI_US', 'ZHVI_US'):
        by_expected(name + ' (Zillow)', last_of(name), (z.year, z.month), 'monthly', '§9.4',
                    'shared/housing-monthly-data.js')


@safe
def bubble_weekly():
    s = read(PA, 'not-a-bubble.js')
    xs = re.findall(r'\{"x":\s*(-?[\d.]+),\s*"y"', re.search(r'const BTC_DATA_2014 = \[(.*?)\];', s, re.S).group(1))
    last = PEAK_2017 + dt.timedelta(days=round(float(xs[-1]) * 365.25))
    by_age('BTC_DATA_2014 (Is Bitcoin a Bubble? weekly line)', last, 35, 45, 'monthly', '§9.7', 'not-a-bubble.js')


@safe
def trend_percentiles():
    s = read(PA, 'shared', 'calculator-helpers.js')
    m = re.search(r'spanning days\s+(\d+)\s*\S+\s*(\d+)', s)
    last_day = int(m.group(2))
    stored = GENESIS + dt.timedelta(days=last_day)
    latest = GENESIS + dt.timedelta(days=PL_LAST_DAY)
    status = 'OK' if last_day >= PL_LAST_DAY else 'DUE'
    row('TREND_RATIO_PERCENTILES (Retirement status line)', 'built to %s' % stored.isoformat(), status,
        'monthly, with PL_DATA', '§9.8', 'shared/calculator-helpers.js', 'PL_DATA now ends %s' % latest.isoformat())


@safe
def strc_data():
    s = read(PA, 'the-strc-mechanism.js')
    as_of = dt.date.fromisoformat(re.search(r'asOf:\s*"(\d{4}-\d{2}-\d{2})"', s).group(1))
    by_age('STRC_DATA (STRC Mechanism dated block)', as_of, 35, 45, 'monthly (8-K)', '§7.5', 'the-strc-mechanism.js')


@safe
def strc_close():
    d = json.loads(read(SRC, '_data', 'strcClose.json'))
    last = dt.date.fromisoformat(d['asOfDate'])
    by_age('strcClose.json (daily-close Action)', last, 4, 7, 'daily (GitHub Action)', '§7.6',
           'src/_data/strcClose.json', 'older than 4 days: the Action may have stopped')


@safe
def yield_rates():
    s = read(PA, 'shared', 'real-estate-model.js')
    body = re.search(r'var YIELD_RATES = \{(.*?)\n  \};', s, re.S).group(1)
    mon, yr = re.search(r"asOf:\s*'(\w+) (\d{4})'", body).groups()   # e.g. 'September 2026'
    by_age('YIELD_RATES (STRC, SATA and the rental page rates)', month_end(int(yr), MONTHS[mon.lower()]),
           35, 45, 'monthly', '§9.3a', 'shared/real-estate-model.js', 'asOf is a month; dated from its last day')


# Bitcoin Fixed Income Tab III "Where we are now" became a dated record of
# June 6, 2026 on 2026-09-30 (JM's ruling), so it is no longer a refresh item.
# The preferreds' rates are checked below (preferredRates.json).
@safe
def preferred_rates():
    s = json.loads(read(SRC, '_data', 'preferredRates.json'))
    by_age('Preferred dividend rates (src/_data/preferredRates.json: STRC, SATA)',
           dt.date.fromisoformat(s['asOf']), 35, 45, 'monthly (8-K)', '§0.7', 'preferredRates.json')


# /bitcoin-lenders: every card carries the date its lender's pages were read.
# Rates move monthly (Ledn +0.5pt between March and September 2026), so the
# oldest card's asOf is the item; the full-card re-read is quarterly (§7.6).
@safe
def lender_cards():
    d = json.loads(read(SRC, '_data', 'lenders.json'))
    oldest = min(dt.date.fromisoformat(l['asOf']) for l in d['lenders'])
    stale = [l['name'] for l in d['lenders'] if dt.date.fromisoformat(l['asOf']) == oldest]
    by_age('Lender cards (src/_data/lenders.json: %d lenders; oldest read)' % len(d['lenders']),
           oldest, 35, 45, 'monthly (rates) / quarterly (full card)', '§7.6', 'lenders.json',
           'oldest: ' + ', '.join(stale[:4]) + ('…' if len(stale) > 4 else ''))


# ── Quarterly ─────────────────────────────────────────────────────────────────
@safe
def metcalfe():
    s = read(PA, 'bitcoin-and-metcalfes-law-data.js')
    pulled = dt.date.fromisoformat(re.search(r'Pulled:\s*(\d{4}-\d{2}-\d{2})', s).group(1))
    by_age('METCALFE_SERIES (Metcalfe fit chart)', pulled, 92, 120, 'quarterly', '§9',
           'bitcoin-and-metcalfes-law-data.js', 'date is the pull date in the header')


@safe
def doubling_ladder():
    s = read(PA, 'the-doubling-ladder.js')
    for name in ('DEVIATION', 'MONTHLY_HIGH'):
        body = re.search(r'var ' + name + r' = \[(.*?)\];', s, re.S).group(1)
        last_day = int(float(re.findall(r'\[(\d+(?:\.\d+)?),', body)[-1]))
        by_age(name + ' (The Doubling Ladder)', GENESIS + dt.timedelta(days=last_day), 92, 120, 'quarterly',
               '§9.9', 'the-doubling-ladder.js', 'also restate the checksum figures in the page text')


# ── Annual ────────────────────────────────────────────────────────────────────
@safe
def annual_real_estate():
    s = read(PA, 'shared', 'bvre-annual-data.js')
    expected = TODAY.year - 1 if TODAY >= dt.date(TODAY.year, 2, 1) else TODAY.year - 2
    for name in ('homeData', 'btcData', 'csData'):
        m = re.search(name + r'\s*=\s*\{(.*?)\}', s, re.S)
        last = max(int(y) for y in re.findall(r'(\d{4})\s*:', m.group(1)))
        by_expected(name + ' (annual, real-estate pair and Gallery)', last, expected, 'annual (January)', '§11',
                    'shared/bvre-annual-data.js')
    b = read(PA, 'bitcoin-vs-real-estate.js')
    for name in ('incomeData', 'mortgageRates'):
        m = re.search(name + r'\s*=\s*\{(.*?)\}', b, re.S)
        if m:
            last = max(int(y) for y in re.findall(r'(\d{4})\s*:', m.group(1)))
            by_expected(name + ' (annual, Bitcoin vs. Real Estate)', last, expected, 'annual (January)', '§11',
                        'bitcoin-vs-real-estate.js')


@safe
def demographia():
    # The edition published each May reports the previous calendar year.
    expected = TODAY.year - 1 if TODAY >= dt.date(TODAY.year, 6, 1) else TODAY.year - 2
    for f, pat in (('bitcoin-vs-real-estate.js', r'globalYears\s*=\s*\[(.*?)\]'), ('the-gallery.js', r'var YEARS\s*=\s*\[(.*?)\]')):
        m = re.search(pat, read(PA, f), re.S)
        last = max(int(y) for y in re.findall(r'\d{4}', m.group(1)))
        by_expected('Demographia affordability series', last, expected, 'annual (May)', 'Annual: Demographia', f,
                    'both files move together')


@safe
def copyright_year():
    s = read(SRC, '_includes', 'layouts', 'base.njk')
    y = int(re.search(r'&copy;\s*(\d{4})', s).group(1))
    by_expected('Footer copyright year', y, TODAY.year, 'annual (January)', '§11', 'layouts/base.njk')


@safe
def year_input_minimums():
    hits = []
    for fn in sorted(os.listdir(SRC)):
        if fn.endswith('.njk'):
            for i, line in enumerate(read(SRC, fn).splitlines(), 1):
                for y in re.findall(r'min="(20\d\d)"', line):
                    if int(y) < TODAY.year:
                        hits.append('%s:%d (min=%s)' % (fn, i, y))
    row('Year inputs whose minimum is a past year', '%d found' % len(hits), 'OK' if not hits else 'DUE',
        'annual (January)', '§11', ', '.join(hits[:6]) + (' …' if len(hits) > 6 else ''))


# ── DATA_AUDIT rows by their "Next due" column ───────────────────────────────
@safe
def data_audit_next_due():
    by_date = {}
    for line in read(ROOT, 'DATA_AUDIT.md').splitlines():
        if not line.startswith('| ') or line.startswith('| #') or line.startswith('|--'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        m = re.fullmatch(r'(\d{4}-\d{2}-\d{2})', cells[-1]) if len(cells) >= 3 else None
        if m:
            by_date.setdefault(dt.date.fromisoformat(m.group(1)), []).append(cells[0])
    for d in sorted(by_date):
        days = (d - TODAY).days
        if days > 30:
            continue
        status = 'OVERDUE' if days < -30 else ('DUE' if days <= 0 else 'SOON')
        ids = by_date[d]
        rows.append((status, 'DATA_AUDIT rows due %s (%d)' % (d.isoformat(), len(ids)), d.isoformat(),
                     'per row (mostly 6-monthly)', 'the row', 'DATA_AUDIT.md', ', '.join(ids[:12]) + (' …' if len(ids) > 12 else '')))


# ── Dated strings in page copy ────────────────────────────────────────────────
# Dated on purpose (a rule's effective date, an essay companion's as-of): not refresh items.
FIXED = [
    ('spend-and-replace.njk', 'January 1, 2025'),
    ('the-gallery.njk', 'as of Jul 2026'),
    ('the-gallery.njk', 'as of July 2026'),
]
DATED = re.compile(r'(?i)\b(?:(?:snapshot|figures)\s+)?(?:as of|through|updated)\s+(?:\w+day,\s+)?'
                   r'(January|February|March|April|May|June|July|August|September|October|November|December|'
                   r'Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(?:(\d{1,2}),\s+)?(\d{4})')


@safe
def dated_strings():
    for fn in sorted(os.listdir(SRC)):
        if not fn.endswith('.njk'):
            continue
        for i, line in enumerate(read(SRC, fn).splitlines(), 1):
            text = re.sub(r'<[^>]+>', '', line)
            for m in DATED.finditer(text):
                if any(fn == f and pat in text for f, pat in FIXED) or 'This snapshot is refreshed monthly' in text:
                    continue
                y, mo = int(m.group(3)), MONTHS[m.group(1).lower()]
                d = dt.date(y, mo, int(m.group(2))) if m.group(2) else month_end(y, mo)
                age = (TODAY - d).days
                status = 'OK' if age <= 35 else ('DUE' if age <= 75 else 'OVERDUE')
                rows.append((status, 'Dated text: "%s"' % m.group(0).strip()[:60], d.isoformat(), 'monthly',
                             '§3', '%s:%d' % (fn, i), 'a future date: a deadline to watch, not an as-of' if age < 0 else ''))


# ── Report ────────────────────────────────────────────────────────────────────
ORDER = {'OVERDUE': 0, 'DUE': 1, 'SOON': 2, 'CHECK': 3, 'OK': 4}
rows.sort(key=lambda r: (ORDER.get(r[0], 9), r[4], r[1]))
print('Data freshness report, %s (MONTHLY_REFRESH_CHECKLIST §0)' % TODAY.isoformat())
print()
w = max(len(r[1]) for r in rows)
for status, item, latest, cadence, section, where, note in rows:
    print('%-8s %-*s  %-24s %-22s %-20s %s%s' % (status, w, item, latest, cadence, section, where,
                                                ('  [' + note + ']') if note else ''))
counts = {k: sum(1 for r in rows if r[0] == k) for k in ORDER}
print()
print('%d OVERDUE, %d DUE, %d SOON (within 30 days), %d CHECK, %d OK. Judgement items (legal status, present-tense '
      'prose, event-driven copy) are in the checklist §0, not here.' % (counts['OVERDUE'], counts['DUE'], counts['SOON'],
                                                                     counts['CHECK'], counts['OK']))
