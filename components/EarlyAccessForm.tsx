"use client";

import { useState } from "react";
import { formConfigured, site } from "@/site.config";

type Status = "idle" | "sending" | "done" | "error";

export function EarlyAccessForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formConfigured) {
      setStatus("error");
      setMessage("Sign-ups open soon.");
      console.warn("Set formEndpoint in site.config.ts to collect emails.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(site.formEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.currentTarget),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      setMessage("You're on the list.");
    } catch {
      setStatus("error");
      setMessage("That didn't go through. Try again?");
    }
  }

  if (status === "done") {
    return (
      <p className="flex h-11 items-center text-sm" role="status">
        {message}
      </p>
    );
  }

  return (
    <div className="w-full max-w-[380px]">
      <form
        onSubmit={onSubmit}
        className="flex h-11 w-full items-center rounded-full border border-ink/15 bg-ivory pl-4 pr-1 transition-colors focus-within:border-gold"
      >
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@school.edu"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-9 shrink-0 cursor-pointer rounded-full bg-ink px-4 text-[13px] font-medium text-ivory transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Get early access"}
        </button>
      </form>
      <p className="mt-2 h-4 pl-4 text-xs text-muted" role="status">
        {status === "error" ? message : ""}
      </p>
    </div>
  );
}
