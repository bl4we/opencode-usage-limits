import { Plugin } from "@opencode/plugin"
import { Rpc } from "@opencode/plugin/rpc"

const Balance = Rpc.define({
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
})

type Credential = {
  access?: string
  token?: string
  value?: string
}

export default Plugin.define({
  id: "usage-limits",
  async setup(ctx) {
    await ctx.rpc.register(Balance, {
      balance: async (_input, context) => {
        try {
          const connection = await ctx.integration.connection.active("opencode")
          if (!connection) {
            return { availableMicroCents: -1, billingMode: "", error: "signed out" }
          }

          const credential = (await ctx.integration.connection.resolve(connection)) as
            | Credential
            | string
            | undefined
          const token =
            typeof credential === "string"
              ? credential
              : credential?.access ?? credential?.token ?? credential?.value

          if (!token) {
            return { availableMicroCents: -1, billingMode: "", error: "no access token" }
          }

          const response = await fetch("https://opencode.ai/console/api/billing/status", {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: context.signal,
          })

          if (!response.ok) {
            return { availableMicroCents: -1, billingMode: "", error: `HTTP ${response.status}` }
          }

          const body = (await response.json()) as {
            availableMicroCents?: string | number
            billingMode?: string
            mode?: string
          }
          const available = Number(body.availableMicroCents)

          return {
            availableMicroCents: Number.isFinite(available) ? available : -1,
            billingMode: body.billingMode ?? body.mode ?? "",
            error: "",
          }
        } catch (error) {
          return {
            availableMicroCents: -1,
            billingMode: "",
            error: error instanceof Error ? error.message : String(error),
          }
        }
      },
    })
  },
})
