import { HOME_STATS } from "@/lib/home-static";

export function HomeStats() {
  return (
    <section className="bg-accent-deep py-16 text-white md:py-20">
      <div className="container-site grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
        {HOME_STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-4xl text-secondary md:text-5xl lg:text-6xl">{stat.value}</p>
            <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-white/55 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
