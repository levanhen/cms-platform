import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-paper pt-40 pb-24">
      <div className="container-site max-w-xl">
        <p className="section-label">404</p>
        <h1 className="display-title mt-4">Không tìm thấy trang</h1>
        <p className="mt-4 text-muted">
          Nội dung không tồn tại hoặc chưa được xuất bản.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Về trang chủ
        </Link>
      </div>
    </section>
  );
}
