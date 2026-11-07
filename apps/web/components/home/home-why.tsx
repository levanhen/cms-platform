import { HOME_WHY, HOME_WHY_IMAGE } from "@/lib/home-static";

export function HomeWhy() {
  return (
    <section className="home-section bg-sand">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <div className="order-2 overflow-hidden lg:order-1 lg:col-span-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOME_WHY_IMAGE}
            alt=""
            className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
          />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6">
          <p className="section-label">Why choose us</p>
          <h2 className="display-title mt-4">
            Vì sao chọn
            <br />
            chúng tôi
          </h2>
          <div className="mt-10 space-y-8">
            {HOME_WHY.map((item, i) => (
              <div key={item.title} className="flex gap-5">
                <div className="flex size-12 shrink-0 items-center justify-center bg-accent font-display text-xl text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
