import { HOME_TESTIMONIALS } from "@/lib/home-static";

export function HomeTestimonials() {
  return (
    <section className="home-section bg-sand">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Testimonials</p>
          <h2 className="display-title mt-4">
            Khách hàng nói gì
            <br />
            về chúng tôi
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {HOME_TESTIMONIALS.map((item) => (
            <blockquote key={item.name + item.quote.slice(0, 12)} className="bg-paper p-8">
              <p className="font-display text-xl leading-relaxed text-ink-soft">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-8 border-t border-line pt-5">
                <p className="text-sm font-semibold tracking-wide">{item.name}</p>
                <p className="mt-1 text-xs tracking-[0.14em] text-accent uppercase">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
