/* =====================================================
   state.js — global application state
   ===================================================== */

/**
 * S  — reactive filter state for the Mentions view
 *   tab : active sentiment tab key ("T" | "P" | "N" | "NE")
 *   th  : map of { keyword: boolean } — selected theme pills
 *   q   : free-text search query string
 *
 * CV — currently visible top-level view
 *      ("mentions" | "stats" | "network" | "info")
 */
var S  = { tab: "T", th: {}, q: "" };
var CV = "mentions";