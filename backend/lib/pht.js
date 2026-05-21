// Philippine Standard Time helpers (UTC+8, no DST).
//
// Heavenward is a Cebu-rooted family app. EVERY "today" the user sees
// (liturgy, prayer cycle, hearth tallies, candle counts, schedules)
// must be the user's calendar today, not the server's UTC today.
//
// Use phtToday() / phtTodayMMDD() instead of new Date().toISOString().slice(0,10).
// Use sqlDateNow() instead of date('now') in SQL.
// Server timezone is irrelevant - these helpers ALWAYS return PHT.

const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;

// Returns a Date object whose UTC fields equal the wall-clock fields in Manila.
// Use ONLY for extracting yyyy/mm/dd/hour from it via the getUTC* accessors.
function phtDate(ts) {
  return new Date((ts == null ? Date.now() : ts) + PHT_OFFSET_MS);
}

// 'YYYY-MM-DD' in Philippine time. Drop-in replacement for
//   new Date().toISOString().slice(0, 10)
function phtToday(ts) {
  return phtDate(ts).toISOString().slice(0, 10);
}

// 'MM-DD' in Philippine time.
function phtTodayMMDD(ts) {
  return phtDate(ts).toISOString().slice(5, 10);
}

// Hour 0..23 in Philippine time.
function phtHour(ts) {
  return phtDate(ts).getUTCHours();
}

// Day-of-year 1..366 in Philippine time.
function phtYearDay(ts) {
  const d = phtDate(ts);
  const startUTC = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - startUTC) / 86400000);
}

// SQL fragment for "today in PHT" - drop-in replacement for date('now').
// Use as: `date(col) = ${sqlDateNow()}` -> `date(col) = date('now','+8 hours')`
// Returned string is a SQL expression, NOT a parameter value.
function sqlDateNow() {
  return "date('now','+8 hours')";
}

// SQL fragment for "PHT calendar day for a column".
// Use as: `${sqlDate('col')} = ${sqlDateNow()}` -> `date(col,'+8 hours') = date('now','+8 hours')`
function sqlDate(col) {
  return `date(${col},'+8 hours')`;
}

module.exports = {
  PHT_OFFSET_MS,
  phtDate,
  phtToday,
  phtTodayMMDD,
  phtHour,
  phtYearDay,
  sqlDateNow,
  sqlDate
};
