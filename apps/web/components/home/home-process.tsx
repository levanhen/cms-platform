import { HOME_PROCESS, HOME_PROCESS_IMAGE } from "@/lib/home-static";

export function HomeProcess() {
  return (
    <section className="home-section bg-paper">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="section-label">Our Work Process</p>
          <h2 className="display-title mt-4">Quy trình thi công</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Bốn bước chuẩn giúp công trình đi từ khảo sát đến bàn giao — kiểm soát chất lượng,
            an toàn và tiến độ.
          </p>
          <div className="mt-8 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HOME_PROCESS_IMAGE} alt="" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
          {HOME_PROCESS.map((item) => (
            <article key={item.step} className="border border-line bg-sand/40 p-6">
              <p className="font-display text-4xl text-accent">{item.step}</p>
              <h3 className="font-display mt-3 text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
