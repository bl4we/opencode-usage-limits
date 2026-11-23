// Local OpenCode Desktop GUI plugin: show the signed-in account's usage limits
// as a pill above the composer, with a detail menu on click.
const { Plugin, Style, TitlebarItem } = require("@opencode/plugin/gui")
const { createEffect, createSignal, onCleanup } = require("solid-js")

const messages = {
  en: {
    title: "Account limits",
    go: "Go",
    console: "Console",
    rolling: "5-hour limit",
    weekly: "Weekly limit",
    monthly: "Monthly limit",
    budget: "Console budget",
    credit: "Credit",
    details: "Open details",
    soon: "very soon",
    unavailable: "Usage limits are unavailable",
  },
  ru: {
    title: "Лимиты аккаунта",
    go: "Go",
    console: "Console",
    rolling: "5 часов",
    weekly: "Неделя",
    monthly: "Месяц",
    budget: "Бюджет Console",
    credit: "Кредит",
    details: "Подробнее",
    soon: "совсем скоро",
    unavailable: "Лимиты сейчас недоступны",
  },
}

// Structurally the same token `Rpc.define` returns; keeping the GUI bundle
// free of the server-only RPC import.
const Balance = {
  id: "usage-limits",
  methods: {
    balance: {
      input: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          availableMicroCents: { type: "number" },
          billingMode: { type: "string" },
          error: { type: "string" },
        },
        required: ["availableMicroCents", "billingMode", "error"],
        additionalProperties: false,
      },
    },
  },
  events: {},
}

// The vertical-tabs footer renders TitlebarItem as an icon-only pill and does
// not render its label. Show the label next to the icon there, so the numbers
// stay visible instead of appearing only on hover.
const css = `
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Go "]),
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Console "]),
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Credit "]),
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Кредит "]) {
  width: auto !important;
  height: 28px !important;
  user-select: none;
}

/* The native label appears on hover next to our always-visible one. Keep one copy. */
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Go "]) [data-slot="titlebar-update-label"],
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Console "]) [data-slot="titlebar-update-label"],
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Credit "]) [data-slot="titlebar-update-label"],
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Кредит "]) [data-slot="titlebar-update-label"] {
  display: none !important;
}

[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Go "]) > button,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Console "]) > button,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Credit "]) > button,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Кредит "]) > button {
  width: auto !important;
  justify-content: flex-start;
  padding-inline-end: 10px;
}

[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Go "]) > button::after,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Console "]) > button::after,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Credit "]) > button::after,
[data-slot="vertical-tabs-footer"] [data-slot="titlebar-update"]:has(> button[aria-label^="Кредит "]) > button::after {
  content: attr(aria-label);
  padding-inline-start: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 530;
  line-height: 16px;
  color: var(--v2-text-text-accent);
  white-space: nowrap;
}
`

function percent(value) {
  return `${Math.round(Number(value) || 0)}%`
}

function money(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(number)
}

function resetText(value) {
  const time = Number(value)
  if (!Number.isFinite(time)) return ""

  const diff = time - Date.now()
  if (diff <= 0) return ""

  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" })
  const minutes = Math.ceil(diff / 60_000)
  if (minutes < 60) return relative.format(minutes, "minute")

  const hours = Math.ceil(minutes / 60)
  if (hours < 36) return relative.format(hours, "hour")

  const days = Math.ceil(hours / 24)
  if (days < 14) return relative.format(days, "day")

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time))
}

function toneFor(meter) {
  if (meter.limited) return "danger"
  if (Number(meter.percent) >= 80) return "warning"
  return undefined
}

function meterRow(t, label, meter) {
  return {
    id: label,
    label,
    detail: `${percent(meter.percent)} · ${resetText(meter.resetsAt)}`,
    tone: toneFor(meter),
  }
}

function meter(go) {
  if (!go || !go.rolling || !go.weekly || !go.monthly) return undefined
  return go
}

function labelFor(t, go, budgets, credit) {
  let base

  if (go) {
    base = `${t("go")} ${percent(go.rolling.percent)} · ${percent(go.weekly.percent)} · ${percent(go.monthly.percent)}`
  } else if (budgets.length > 0) {
    const totals = budgets.reduce(
      (sum, budget) => {
        const spent = Number(budget.spent)
        const limit = Number(budget.limit)
        if (Number.isFinite(spent)) sum.spent += spent
        if (Number.isFinite(limit)) sum.limit += limit
        return sum
      },
      { spent: 0, limit: 0 },
    )

    base = `${t("console")} ${money(totals.spent)} / ${money(totals.limit)}`
  }

  if (!Number.isFinite(credit)) return base
  if (base) return `${base} · ${money(credit)}`
  return `${t("credit")} ${money(credit)}`
}

module.exports = Plugin.define({
  i18n: messages,
  setup(ctx) {
    const t = (key) => ctx.t(key)
    const [credit, setCredit] = createSignal(undefined)

    // Keep the cached limits fresh for the routed session.
    createEffect(() => {
      const session = ctx.sessions.current()
      const location = session?.location
      const data = session?.server?.data

      if (!location || !data?.location?.usage) return

      let stopped = false
      const sync = () => {
        if (stopped) return

        try {
          const result = data.location.usage.sync(location)
          if (result && typeof result.catch === "function") result.catch(() => {})
        } catch {
          // The next refresh may succeed.
        }
      }

      sync()
      const timer = setInterval(sync, 60_000)
      onCleanup(() => {
        stopped = true
        clearInterval(timer)
      })
    })

    // The credit balance is workspace-wide, but refresh it with the routed
    // session so it follows account or server changes.
    createEffect(() => {
      const session = ctx.sessions.current()
      if (!session?.location) return

      let stopped = false
      const refresh = async () => {
        try {
          const client = ctx.client
          let result

          try {
            result = await client.rpc(Balance).balance()
          } catch {
            result = await client.rpc.call({
              rpcID: "usage-limits",
              method: "balance",
              input: {},
              location: session.location,
            })
          }

          const value = result?.output ?? result
          if (!stopped && value && value.availableMicroCents >= 0) {
            // Microcents are millionths of a cent: 100,000,000 per dollar.
            setCredit(value.availableMicroCents / 100_000_000)
          }
        } catch {
          // Leave the last known balance in place.
        }
      }

      void refresh()
      const timer = setInterval(refresh, 60_000)
      onCleanup(() => {
        stopped = true
        clearInterval(timer)
      })
    })

    ctx.add(Style, css)

    // In vertical-tabs mode this is the footer of the left sidebar. The CSS
    // above turns the icon-only pill into a compact text pill with the numbers.
    ctx.add(TitlebarItem, () => {
      const session = ctx.sessions.current()
      const location = session?.location
      const data = session?.server?.data

      if (!location || !data?.location?.usage) return

      const info = data.location.usage.limits(location)
      if (!info) return

      const go = meter(info.go)
      const budgets = Array.isArray(info.budgets) ? info.budgets : []

      return {
        id: "limits",
        label: labelFor(t, go, budgets, credit()),
        icon: "status",
        run: () => {
          if (!ctx.commands.run("usage.view")) {
            ctx.toast.show({ title: t("unavailable") })
          }
        },
      }
    })
  },
})
