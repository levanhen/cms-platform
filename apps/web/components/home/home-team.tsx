import { HOME_TEAM } from "@/lib/home-static";

export function HomeTeam() {
  return (
    <section className="home-section bg-paper">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Our Team</p>
          <h2 className="display-title mt-4">
            Đội ngũ
            <br />
            tài năng
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_TEAM.map((member) => (
            <article key={member.name} className="group text-center">
              <div className="media-hover mx-auto aspect-[4/5] max-w-sm overflow-hidden bg-sand-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={member.image} alt={member.name} className="size-full object-cover" />
              </div>
              <h3 className="font-display mt-6 text-2xl transition group-hover:text-accent-deep">
                {member.name}
              </h3>
              <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                {member.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
