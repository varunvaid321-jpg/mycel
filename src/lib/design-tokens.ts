// Design Tokens — single source of truth for all UI patterns

// ── Cards & Panels ──
export const CARD = "bg-surface border border-border rounded-lg";
export const CARD_PADDING = "p-4 sm:p-5";
export const CARD_SECTION = "bg-surface border border-border rounded-lg p-5 md:p-6 mb-8 animate-fade-in";
export const CARD_HOVER = "transition-colors hover:border-border/80";

// ── Accent Borders (left stripe on section cards) ──
export const BORDER_NETWORK = "border-l-[3px] border-l-network";
export const BORDER_FRUIT = "border-l-[3px] border-l-fruit/60";

// ── Buttons ──
export const BTN_PRIMARY = "bg-transparent border border-accent text-accent rounded px-4 py-2.5 min-h-[44px] font-mono text-sm tracking-[0.15em] uppercase transition-all hover:bg-accent hover:text-bg disabled:opacity-30";
export const BTN_ACCENT_SOLID = "bg-accent border border-accent rounded px-5 py-3 min-h-[44px] text-bg font-mono text-sm tracking-[0.15em] uppercase transition-opacity hover:opacity-85 disabled:opacity-50";
export const BTN_PILL_INACTIVE = "px-3 py-1.5 min-h-[36px] sm:min-h-0 sm:py-1 rounded-full font-mono text-sm tracking-wider uppercase border transition-all border-border text-text-faint hover:text-text-muted";
export const BTN_PILL_ACTIVE_CATEGORY = "px-3 py-1.5 min-h-[36px] sm:min-h-0 sm:py-1 rounded-full font-mono text-sm tracking-wider uppercase border transition-all border-text-muted text-text-primary bg-surface-hover";
export const BTN_PILL_ACTIVE_TOPIC = "px-3 py-1.5 min-h-[36px] sm:min-h-0 sm:py-1 rounded-full font-mono text-sm tracking-wider uppercase border transition-all border-accent/50 text-accent bg-accent/10";
export const BTN_DELETE_CONFIRM = "px-3 py-2 min-h-[44px] rounded bg-signal/20 border border-signal/40 text-signal font-mono text-sm tracking-wider transition-all hover:bg-signal/30 flex items-center";
export const BTN_DELETE_CANCEL = "px-3 py-2 min-h-[44px] rounded border border-border text-text-faint font-mono text-sm tracking-wider transition-all hover:text-text-muted flex items-center";
export const BTN_ICON_DISMISS = "w-8 h-8 min-w-[44px] min-h-[44px] rounded-full border border-border flex items-center justify-center shrink-0 text-text-muted hover:text-signal hover:border-signal/40 transition-all";
export const BTN_ICON_DELETE = "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 ml-2 border border-border text-text-faint hover:border-signal/40 hover:text-signal transition-all";
export const BTN_SEARCH_GO = "px-4 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-surface border border-accent/40 text-accent rounded font-mono text-sm tracking-wider uppercase transition-all hover:bg-accent hover:text-bg";
export const BTN_SEARCH_CLEAR = "px-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 font-mono text-sm text-text-faint hover:text-signal transition-colors";
export const BTN_TEXT_LINK = "font-mono text-sm text-text-faint hover:text-accent tracking-wider transition-colors";

// ── Inputs ──
export const INPUT_TEXT = "bg-surface border border-border rounded px-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 font-mono text-sm text-text-primary tracking-wide placeholder:text-text-faint outline-none focus:border-accent/50 transition-colors";
export const INPUT_STANDALONE = "w-full bg-surface border border-border rounded-lg px-4 py-3 min-h-[44px] font-mono text-base sm:text-sm text-text-primary tracking-wider placeholder:text-text-faint outline-none transition-colors focus:border-accent";
export const INPUT_PASSWORD = "flex-1 bg-surface border border-border border-r-0 rounded-l px-4 py-3 min-h-[44px] font-mono text-base sm:text-sm text-text-primary tracking-wider placeholder:text-text-faint outline-none transition-colors focus:border-accent";
export const INPUT_TEXTAREA = "w-full bg-transparent text-lg leading-relaxed resize-none outline-none placeholder:italic font-serif text-text-primary placeholder:text-text-faint";

// ── Category Tags ──
export const TAG_STYLES: Record<string, string> = {
  spore: "bg-spore/15 text-spore",
  root: "bg-root/15 text-root",
  signal: "bg-signal/15 text-signal",
  decompose: "bg-decompose/15 text-decompose",
  fruit: "bg-fruit/15 text-fruit",
};
export const TAG_BASE = "font-mono text-sm tracking-[0.12em] uppercase px-2 py-0.5 rounded";
export const TAG_TOPIC = "font-mono text-xs tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent/70";
export const TAG_THEME = "px-2 py-0.5 bg-network/10 text-network/80 rounded font-mono text-sm";

// ── Typography ──
export const TEXT_FORM_LABEL = "block text-sm text-text-muted mb-1";
export const TEXT_ENTRY_CONTENT = "text-[1.05rem] leading-[1.75] whitespace-pre-wrap";
export const TEXT_META = "font-mono text-sm text-text-faint tracking-wide";
export const TEXT_SECTION_HEADER = "font-mono text-sm tracking-[0.2em] uppercase";
export const TEXT_SUBSECTION_HEADER = "font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2";
export const TEXT_LABEL = "font-mono text-sm tracking-[0.15em] uppercase text-text-faint";
export const TEXT_FILTER_LABEL = "font-mono text-sm tracking-[0.15em] uppercase text-text-faint w-14 shrink-0";
export const TEXT_EMPTY = "font-mono text-xs text-text-faint tracking-wider";
export const TEXT_TAGLINE = "text-sm italic text-text-muted";
export const TEXT_FOOTER = "font-mono text-xs text-text-faint tracking-[0.2em]";
export const TEXT_BULLET = "text-sm leading-relaxed";

// ── Layout ──
export const PAGE_CONTAINER = "max-w-2xl mx-auto px-4 py-8 md:py-12";
export const FILTER_ROW = "flex items-center gap-3 flex-wrap";
export const FILTER_SECTION = "mb-5 pb-4 border-b border-border space-y-3";

// ── Alerts ──
export const ALERT_SIGNAL = "bg-signal/10 border border-signal/20 rounded-md";
export const ALERT_SIGNAL_STRONG = "bg-signal/10 border border-signal/30 rounded-lg px-4 py-3";

// ── Compose Box ──
export const COMPOSE_BOX = "bg-surface border rounded-lg p-4 transition-colors focus-within:border-accent/60";
export const COMPOSE_BOX_ACTIVE = "border-signal/40";
export const COMPOSE_BOX_IDLE = "border-border";

// ── Status Text ──
export const TEXT_STATUS_FRUIT = "font-mono text-xs text-fruit tracking-wider";
export const TEXT_STATUS_SIGNAL = "font-mono text-xs text-signal tracking-wider";
export const TEXT_NOTE = "font-mono text-xs text-text-faint tracking-wider pt-2 border-t border-border";

// ── Logout / Text-action Buttons ──
export const BTN_LOGOUT = "font-mono text-sm text-text-faint hover:text-signal tracking-wider transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center";
export const BTN_DECISIONS_INACTIVE = "px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-full font-mono text-sm tracking-wider uppercase border transition-all flex items-center border-border text-text-faint hover:text-text-muted";
export const BTN_DECISIONS_ACTIVE = "px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-full font-mono text-sm tracking-wider uppercase border transition-all flex items-center border-fruit/50 text-fruit bg-fruit/10";
export const BTN_IMPORT = "w-full py-3 min-h-[44px] bg-accent text-bg rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-30";

// ── Mic Button ──
export const MIC_LISTENING = "bg-signal/20 text-signal border border-signal/40 animate-pulse";
export const MIC_IDLE = "bg-surface-hover text-text-muted border border-border hover:text-text-primary";
export const MIC_BASE = "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all";

// ── Date/Time Formatting ──
export const TIMEZONE = "America/Toronto";
export const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric", timeZone: "America/Toronto" };
export const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" };
export const DATE_SHORT: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" };
export const DATE_WEEKDAY: Intl.DateTimeFormatOptions = { weekday: "long", timeZone: "America/Toronto" };
export const DATE_MONTH_DAY: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", timeZone: "America/Toronto" };
