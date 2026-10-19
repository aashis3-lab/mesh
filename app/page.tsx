import { Card3D } from "@/components/card3d";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";
import { Wordmark } from "@/components/Wordmark";
import { WovenLattice } from "@/components/WovenLattice";
import { site } from "@/site.config";

export default function Home() {
  return (
    <div className="fade-in overflow-x-hidden">
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-8 md:min-h-[100svh]">
        <header className="flex items-center justify-between py-5">
          <Wordmark className="text-lg" />
          {/* A label, so clicking it focuses the email field below. */}
          <label
            htmlFor="email"
            className="cursor-pointer text-[13px] text-ink/70 underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Early access
          </label>
        </header>

        <main className="grid flex-1 grid-cols-1 items-center gap-2 pt-8 pb-4 md:grid-cols-[1fr_1.1fr] md:gap-6 md:py-0">
          <div className="flex flex-col items-start">
            <h1 className="text-[2.75rem] leading-[1.02] font-medium tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Your profile,
              <br />
              <em className="font-normal whitespace-nowrap text-gold">one tap</em> away.
            </h1>
            <p className="mt-5 text-[15px] text-ink/65">A card for students. Tap any phone. No app.</p>
            <div className="mt-8 w-full">
              <EarlyAccessForm />
            </div>
          </div>

          <div className="-mx-4 h-[340px] sm:mx-0 sm:h-[420px] md:h-[min(560px,72svh)]">
            <Card3D />
          </div>
        </main>
      </div>

      <footer className="relative overflow-hidden">
        <WovenLattice className="absolute inset-0 h-full w-full opacity-45 [mask-image:linear-gradient(to_top,black_35%,transparent)]" />
        <div className="relative px-4 pt-14 text-center sm:pt-28">
          <p className="text-[11px] text-muted">
            © 2026 Mesh <span aria-hidden="true">·</span>{" "}
            <a href={`mailto:${site.contactEmail}`} className="transition-colors hover:text-ink">
              Contact
            </a>
          </p>
          {/* Sized in vw so it spans the page at any width; the negative margin crops the bottom. */}
          <p
            aria-hidden="true"
            className="-mb-[0.07em] text-[33vw] leading-[0.82] font-semibold tracking-[-0.065em] whitespace-nowrap select-none"
          >
            mesh<span className="text-gold">.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
