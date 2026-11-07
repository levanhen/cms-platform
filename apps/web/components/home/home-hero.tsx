"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HOME_HERO_SLIDES } from "@/lib/home-static";
import { cn } from "@/lib/utils";

export function HomeHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HOME_HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const slide = HOME_HERO_SLIDES[index] ?? HOME_HERO_SLIDES[0];

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink text-white">
      {HOME_HERO_SLIDES.map((item, i) => (
        <div
          key={item.image}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className={cn("size-full object-cover", i === index && "animate-kenburns")}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        </div>
      ))}

      <div className="container-site relative flex min-h-[100svh] flex-col justify-center pt-36 pb-24 md:pt-44">
        <p key={`eye-${index}`} className="section-label animate-fade">
          {slide.eyebrow}
        </p>
        <h1
          key={`title-${index}`}
          className="font-display mt-6 max-w-4xl text-5xl leading-[1.08] font-medium md:text-7xl lg:text-[5.25rem] animate-rise"
        >
          {slide.titleLine1}
          <br />
          {slide.titleLine2}
        </h1>
        <div className="mt-10 animate-rise delay-1">
          <Link href="/contact" className="btn-primary">
            Liên hệ chúng tôi
          </Link>
        </div>

        <div className="mt-16 flex gap-2">
          {HOME_HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 w-10 transition",
                i === index ? "bg-accent" : "bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
