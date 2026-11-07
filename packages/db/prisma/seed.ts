import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import {
  CategoryStatus,
  ContentStatus,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type PermissionDef = {
  code: string;
  groupName: string;
  description: string;
};

const PERMISSIONS: PermissionDef[] = [
  { code: "user:view", groupName: "User", description: "Xem danh sách / chi tiết user" },
  { code: "user:create", groupName: "User", description: "Tạo user" },
  { code: "user:update", groupName: "User", description: "Sửa user / đổi status / gán role" },
  { code: "user:delete", groupName: "User", description: "Soft delete user" },
  { code: "role:view", groupName: "Role", description: "Xem role" },
  { code: "role:create", groupName: "Role", description: "Tạo role" },
  { code: "role:update", groupName: "Role", description: "Sửa role / gán permission" },
  { code: "role:delete", groupName: "Role", description: "Xóa role" },
  { code: "page:view", groupName: "Page", description: "Xem page" },
  { code: "page:create", groupName: "Page", description: "Tạo page" },
  { code: "page:update", groupName: "Page", description: "Sửa page" },
  { code: "page:delete", groupName: "Page", description: "Soft delete page" },
  { code: "page:publish", groupName: "Page", description: "Publish / Unpublish / Archive page" },
  { code: "service:view", groupName: "Service", description: "Xem service" },
  { code: "service:create", groupName: "Service", description: "Tạo service" },
  { code: "service:update", groupName: "Service", description: "Sửa / reorder service" },
  { code: "service:delete", groupName: "Service", description: "Soft delete service" },
  { code: "service:publish", groupName: "Service", description: "Publish / Unpublish / Archive service" },
  { code: "project:view", groupName: "Project", description: "Xem project" },
  { code: "project:create", groupName: "Project", description: "Tạo project" },
  { code: "project:update", groupName: "Project", description: "Sửa / reorder project" },
  { code: "project:delete", groupName: "Project", description: "Soft delete project" },
  { code: "project:publish", groupName: "Project", description: "Publish / Unpublish / Archive project" },
  { code: "news:view", groupName: "News", description: "Xem news / category / tag" },
  { code: "news:create", groupName: "News", description: "Tạo news" },
  { code: "news:update", groupName: "News", description: "Sửa news" },
  { code: "news:delete", groupName: "News", description: "Soft delete news" },
  { code: "news:publish", groupName: "News", description: "Publish / Unpublish / Archive news" },
  { code: "document:view", groupName: "Document", description: "Xem / download document" },
  { code: "document:create", groupName: "Document", description: "Upload document" },
  { code: "document:update", groupName: "Document", description: "Sửa metadata document" },
  { code: "document:delete", groupName: "Document", description: "Soft delete document" },
  { code: "document:publish", groupName: "Document", description: "Publish / Archive document" },
  { code: "media:view", groupName: "Media", description: "Xem thư viện media" },
  { code: "media:create", groupName: "Media", description: "Upload media" },
  { code: "media:update", groupName: "Media", description: "Sửa metadata media" },
  { code: "media:delete", groupName: "Media", description: "Xóa media" },
  { code: "audit_log:view", groupName: "Audit Log", description: "Xem audit log" },
  { code: "setting:view", groupName: "Settings", description: "Xem settings" },
  { code: "setting:update", groupName: "Settings", description: "Cập nhật settings" },
  { code: "newsletter:view", groupName: "Newsletter", description: "Xem danh sách + export CSV đăng ký nhận tin" },
  { code: "newsletter:delete", groupName: "Newsletter", description: "Hủy đăng ký / xóa subscriber (optional)" },
  { code: "contact:view", groupName: "Contact", description: "Xem tin nhắn liên hệ" },
  { code: "contact:update", groupName: "Contact", description: "Đổi trạng thái tin nhắn liên hệ" },
  { code: "contact:delete", groupName: "Contact", description: "Xóa tin nhắn liên hệ" },
];

const ADMIN_CODES = PERMISSIONS.map((p) => p.code).filter(
  (code) =>
    !code.startsWith("role:create") &&
    !code.startsWith("role:update") &&
    !code.startsWith("role:delete"),
);

const EDITOR_CODES = [
  "page:view",
  "page:create",
  "page:update",
  "page:publish",
  "service:view",
  "service:create",
  "service:update",
  "service:publish",
  "project:view",
  "project:create",
  "project:update",
  "project:publish",
  "news:view",
  "news:create",
  "news:update",
  "news:publish",
  "document:view",
  "document:create",
  "document:update",
  "document:publish",
  "media:view",
  "media:create",
  "media:update",
  "newsletter:view",
  "contact:view",
  "contact:update",
];

const VIEWER_CODES = [
  "page:view",
  "service:view",
  "project:view",
  "news:view",
  "newsletter:view",
  "contact:view",
  "document:view",
  "media:view",
];

const IMG = {
  site: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  service1:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80",
  service2:
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
  service3:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  service4:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  project1:
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=80",
  project2:
    "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80",
  project3:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
  project4:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  project5:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  project6:
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80",
  news1:
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
  news2:
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
  news3:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
  news4:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
} as const;

async function upsertPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        groupName: permission.groupName,
        description: permission.description,
      },
      create: permission,
    });
  }
}

async function upsertRole(name: string, description: string, permissionCodes: string[]) {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description, isSystem: true },
    create: { name, description, isSystem: true },
  });

  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  return role;
}

function findMonorepoRoot(start = process.cwd()) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

async function ensureSeedDocumentFile() {
  const root = findMonorepoRoot();
  const rel = "apps/bo-cms/uploads/documents/seed-ho-so-nang-luc.txt";
  const full = path.join(root, rel);
  await mkdir(path.dirname(full), { recursive: true });
  const body = [
    "HỒ SƠ NĂNG LỰC — TÀI LIỆU MẪU (SEED)",
    "",
    "Đây là file seed phục vụ trang Tài liệu trên website công khai.",
    "Bạn có thể thay bằng PDF thật qua Back Office → Documents.",
    "",
    `Tạo lúc: ${new Date().toISOString()}`,
  ].join("\n");
  await writeFile(full, body, "utf8");
  return {
    fileUrl: "/uploads/documents/seed-ho-so-nang-luc.txt",
    fileName: "seed-ho-so-nang-luc.txt",
    fileType: "text/plain",
    fileSize: Buffer.byteLength(body, "utf8"),
  };
}

async function seedDemoContent(adminId: string, now: Date) {
  // —— Settings brand ——
  const settings = [
    { key: "site_name", value: "SolidBuild", groupName: "general" },
    {
      key: "site_description",
      value:
        "Đơn vị thi công xây dựng dân dụng & công nghiệp — từ khảo sát, thi công đến bàn giao.",
      groupName: "general",
    },
    { key: "logo", value: "", groupName: "general" },
    { key: "favicon", value: "", groupName: "general" },
    { key: "default_language", value: "vi", groupName: "general" },
    { key: "timezone", value: "Asia/Ho_Chi_Minh", groupName: "general" },
    {
      key: "contact_address",
      value: "275 South Poal, 4th Floor Central Plaza, Main Town",
      groupName: "contact",
    },
    { key: "contact_phone", value: "(+84) 0123 456 789", groupName: "contact" },
    { key: "contact_email", value: "info@example.com", groupName: "contact" },
    { key: "default_seo_title", value: "SolidBuild — Xây dựng & Thi công", groupName: "seo" },
    {
      key: "default_seo_description",
      value: "Dịch vụ xây dựng, giám sát và bàn giao công trình chất lượng cao.",
      groupName: "seo",
    },
    { key: "max_upload_size_mb", value: 20, groupName: "media" },
    {
      key: "allowed_image_mimes",
      value: "image/jpeg,image/png,image/webp,image/gif",
      groupName: "media",
    },
    {
      key: "allowed_document_mimes",
      value:
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
      groupName: "media",
    },
    { key: "maintenance_mode", value: false, groupName: "system" },
  ] as const;

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        groupName: setting.groupName,
        updatedById: adminId,
      },
      create: {
        key: setting.key,
        value: setting.value,
        groupName: setting.groupName,
        updatedById: adminId,
      },
    });
  }

  // —— Pages ——
  const pages = [
    {
      slug: "about-us",
      title: "Về chúng tôi",
      summary:
        "Hơn 20 năm đồng hành cùng chủ đầu tư trong thi công dân dụng và công nghiệp.",
      content: `
        <p>SolidBuild là đơn vị thi công chuyên nghiệp, tập trung vào chất lượng kết cấu, an toàn lao động và tiến độ bàn giao.</p>
        <p>Chúng tôi cung cấp giải pháp trọn gói: khảo sát hiện trạng, lập phương án thi công, giám sát kỹ thuật và nghiệm thu.</p>
        <ul>
          <li>Đội ngũ kỹ sư và chỉ huy trưởng giàu kinh nghiệm hiện trường</li>
          <li>Quy trình ATLĐ và kiểm soát vật liệu rõ ràng</li>
          <li>Báo cáo tiến độ minh bạch cho chủ đầu tư</li>
        </ul>
      `,
      featuredImage: IMG.site,
      seoTitle: "Về SolidBuild",
    },
    {
      slug: "chinh-sach-bao-mat",
      title: "Chính sách bảo mật",
      summary: "Cam kết bảo vệ thông tin khách hàng và đối tác.",
      content:
        "<p>Chúng tôi chỉ sử dụng thông tin liên hệ để phản hồi yêu cầu tư vấn và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.</p>",
      featuredImage: null as string | null,
      seoTitle: "Chính sách bảo mật",
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        summary: page.summary,
        content: page.content,
        featuredImage: page.featuredImage,
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        seoTitle: page.seoTitle,
        updatedById: adminId,
        deletedAt: null,
      },
      create: {
        title: page.title,
        slug: page.slug,
        summary: page.summary,
        content: page.content,
        featuredImage: page.featuredImage,
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        seoTitle: page.seoTitle,
        createdById: adminId,
        updatedById: adminId,
      },
    });
  }

  // —— Services ——
  const services = [
    {
      slug: "thi-cong-dan-dung",
      name: "Thi công dân dụng",
      shortDescription: "Nhà phố, biệt thự, chung cư — từ móng đến hoàn thiện.",
      description:
        "<p>Thi công phần thô và hoàn thiện theo hồ sơ thiết kế, kiểm soát chất lượng bê tông, thép và vật liệu hoàn thiện.</p>",
      category: "Dân dụng",
      displayOrder: 1,
      featuredImage: IMG.service1,
      icon: "▣",
    },
    {
      slug: "thi-cong-cong-nghiep",
      name: "Thi công công nghiệp",
      shortDescription: "Nhà xưởng, kho logistics, hạ tầng kỹ thuật.",
      description:
        "<p>Triển khai nhà xưởng khung thép / bê tông, sàn chịu lực và hệ thống kỹ thuật đồng bộ.</p>",
      category: "Công nghiệp",
      displayOrder: 2,
      featuredImage: IMG.service2,
      icon: "⬡",
    },
    {
      slug: "giam-sat-thi-cong",
      name: "Giám sát thi công",
      shortDescription: "Giám sát ATLĐ, chất lượng và tiến độ hiện trường.",
      description:
        "<p>Đội giám sát độc lập hoặc theo hợp đồng EPC phụ, báo cáo định kỳ cho Ban QLDA.</p>",
      category: "Giám sát",
      displayOrder: 3,
      featuredImage: IMG.service3,
      icon: "◎",
    },
    {
      slug: "tu-van-du-toan",
      name: "Tư vấn & dự toán",
      shortDescription: "Lập dự toán, tối ưu vật tư và phương án thi công.",
      description:
        "<p>Hỗ trợ chủ đầu tư đánh giá ngân sách, lựa chọn vật liệu và lịch thi công khả thi.</p>",
      category: "Tư vấn",
      displayOrder: 4,
      featuredImage: IMG.service4,
      icon: "◇",
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        shortDescription: service.shortDescription,
        description: service.description,
        category: service.category,
        displayOrder: service.displayOrder,
        featuredImage: service.featuredImage,
        icon: service.icon,
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        updatedById: adminId,
        deletedAt: null,
      },
      create: {
        name: service.name,
        slug: service.slug,
        shortDescription: service.shortDescription,
        description: service.description,
        category: service.category,
        displayOrder: service.displayOrder,
        featuredImage: service.featuredImage,
        icon: service.icon,
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        createdById: adminId,
        updatedById: adminId,
      },
    });
  }

  // Archive old sample service
  await prisma.service.upsert({
    where: { slug: "tu-van" },
    update: {
      name: "Tư vấn (legacy)",
      status: ContentStatus.ARCHIVED,
      updatedById: adminId,
      deletedAt: null,
    },
    create: {
      name: "Tư vấn (legacy)",
      slug: "tu-van",
      shortDescription: "Archived",
      description: "<p>Archived</p>",
      displayOrder: 99,
      status: ContentStatus.ARCHIVED,
      publishedAt: now,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  // —— Project categories ——
  const catDanDung = await prisma.projectCategory.upsert({
    where: { slug: "dan-dung" },
    update: { name: "Dân dụng", status: CategoryStatus.ACTIVE },
    create: {
      name: "Dân dụng",
      slug: "dan-dung",
      description: "Nhà ở, biệt thự, căn hộ",
      status: CategoryStatus.ACTIVE,
    },
  });
  const catCongNghiep = await prisma.projectCategory.upsert({
    where: { slug: "cong-nghiep" },
    update: { name: "Công nghiệp", status: CategoryStatus.ACTIVE },
    create: {
      name: "Công nghiệp",
      slug: "cong-nghiep",
      description: "Nhà xưởng, kho",
      status: CategoryStatus.ACTIVE,
    },
  });
  const catHaTang = await prisma.projectCategory.upsert({
    where: { slug: "ha-tang" },
    update: { name: "Hạ tầng", status: CategoryStatus.ACTIVE },
    create: {
      name: "Hạ tầng",
      slug: "ha-tang",
      description: "Hạ tầng kỹ thuật",
      status: CategoryStatus.ACTIVE,
    },
  });

  // Keep old slug category for compatibility
  await prisma.projectCategory.upsert({
    where: { slug: "xay-dung" },
    update: { name: "Xây dựng", status: CategoryStatus.ACTIVE },
    create: {
      name: "Xây dựng",
      slug: "xay-dung",
      description: "Danh mục tổng",
      status: CategoryStatus.ACTIVE,
    },
  });

  const projects = [
    {
      slug: "biet-thu-ven-song",
      title: "Biệt thự ven sông",
      summary: "Thi công phần thô và hoàn thiện biệt thự 3 tầng.",
      content: "<p>Công trình dân dụng với yêu cầu hoàn thiện cao, tiến độ 14 tháng.</p>",
      clientName: "Gia đình Nguyễn",
      location: "TP. Thủ Đức, HCM",
      categoryId: catDanDung.id,
      displayOrder: 1,
      featuredImage: IMG.project1,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-03-20"),
    },
    {
      slug: "nha-xuong-logistics",
      title: "Nhà xưởng Logistics",
      summary: "Xưởng khung thép 8.000 m², sàn chịu lực.",
      content: "<p>Thi công kết cấu thép, mái và hệ thống PCCC theo tiêu chuẩn kho.</p>",
      clientName: "Công ty ABC Logistics",
      location: "Bình Dương",
      categoryId: catCongNghiep.id,
      displayOrder: 2,
      featuredImage: IMG.project2,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2024-05-30"),
    },
    {
      slug: "chung-cu-an-phu",
      title: "Block căn hộ An Phú",
      summary: "Giám sát thi công kết cấu và hoàn thiện mặt đứng.",
      content: "<p>Hỗ trợ Ban QLDA giám sát chất lượng bê tông và tiến độ các gói thầu.</p>",
      clientName: "Chủ đầu tư An Phú",
      location: "Quận 2, HCM",
      categoryId: catDanDung.id,
      displayOrder: 3,
      featuredImage: IMG.project3,
      startDate: new Date("2022-09-01"),
      endDate: new Date("2024-12-15"),
    },
    {
      slug: "van-phong-tech-park",
      title: "Tòa văn phòng Tech Park",
      summary: "Hoàn thiện nội thất và hệ thống MEP tầng điển hình.",
      content: "<p>Đồng bộ hoàn thiện văn phòng cho thuê chuẩn Grade B.</p>",
      clientName: "Tech Park JSC",
      location: "Hà Nội",
      categoryId: catDanDung.id,
      displayOrder: 4,
      featuredImage: IMG.project4,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-01-10"),
    },
    {
      slug: "duong-noi-bo-kcn",
      title: "Đường nội bộ KCN",
      summary: "Thi công đường bê tông và thoát nước mưa.",
      content: "<p>Gói hạ tầng nội bộ phục vụ nhà máy giai đoạn 2.</p>",
      clientName: "Ban quản lý KCN",
      location: "Đồng Nai",
      categoryId: catHaTang.id,
      displayOrder: 5,
      featuredImage: IMG.project5,
      startDate: new Date("2023-11-01"),
      endDate: new Date("2024-08-20"),
    },
    {
      slug: "kho-lanh-thuc-pham",
      title: "Kho lạnh thực phẩm",
      summary: "Nhà kho lạnh kết hợp khu vực đóng gói.",
      content: "<p>Thi công cách nhiệt, sàn và hệ panel theo tiêu chuẩn kho lạnh.</p>",
      clientName: "FoodCold Co.",
      location: "Long An",
      categoryId: catCongNghiep.id,
      displayOrder: 6,
      featuredImage: IMG.project6,
      startDate: new Date("2024-05-01"),
      endDate: null as Date | null,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        title: project.title,
        summary: project.summary,
        content: project.content,
        clientName: project.clientName,
        location: project.location,
        categoryId: project.categoryId,
        displayOrder: project.displayOrder,
        featuredImage: project.featuredImage,
        startDate: project.startDate,
        endDate: project.endDate,
        gallery: [],
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        updatedById: adminId,
        deletedAt: null,
      },
      create: {
        title: project.title,
        slug: project.slug,
        summary: project.summary,
        content: project.content,
        clientName: project.clientName,
        location: project.location,
        categoryId: project.categoryId,
        displayOrder: project.displayOrder,
        featuredImage: project.featuredImage,
        startDate: project.startDate,
        endDate: project.endDate,
        gallery: [],
        status: ContentStatus.PUBLISHED,
        publishedAt: now,
        createdById: adminId,
        updatedById: adminId,
      },
    });
  }

  // Remap old sample project if exists
  await prisma.project.upsert({
    where: { slug: "du-an-mau" },
    update: {
      title: "Công trình mẫu (legacy)",
      status: ContentStatus.ARCHIVED,
      deletedAt: null,
      updatedById: adminId,
    },
    create: {
      title: "Công trình mẫu (legacy)",
      slug: "du-an-mau",
      summary: "Bản ghi cũ — đã archive",
      content: "<p>Archived seed.</p>",
      status: ContentStatus.ARCHIVED,
      publishedAt: now,
      gallery: [],
      createdById: adminId,
      updatedById: adminId,
    },
  });

  // —— News ——
  const newsCat = await prisma.newsCategory.upsert({
    where: { slug: "tin-cong-trinh" },
    update: { name: "Tin công trình", status: CategoryStatus.ACTIVE },
    create: {
      name: "Tin công trình",
      slug: "tin-cong-trinh",
      description: "Cập nhật dự án và hiện trường",
      status: CategoryStatus.ACTIVE,
    },
  });
  const newsCatInsight = await prisma.newsCategory.upsert({
    where: { slug: "kien-thuc" },
    update: { name: "Kiến thức", status: CategoryStatus.ACTIVE },
    create: {
      name: "Kiến thức",
      slug: "kien-thuc",
      description: "Kỹ thuật & vật liệu",
      status: CategoryStatus.ACTIVE,
    },
  });
  await prisma.newsCategory.upsert({
    where: { slug: "tin-tuc" },
    update: { name: "Tin tức", status: CategoryStatus.ACTIVE },
    create: {
      name: "Tin tức",
      slug: "tin-tuc",
      description: "Danh mục chung",
      status: CategoryStatus.ACTIVE,
    },
  });

  const tagXayDung = await prisma.newsTag.upsert({
    where: { slug: "xay-dung" },
    update: { name: "Xây dựng" },
    create: { name: "Xây dựng", slug: "xay-dung" },
  });
  const tagAnToan = await prisma.newsTag.upsert({
    where: { slug: "an-toan" },
    update: { name: "An toàn" },
    create: { name: "An toàn", slug: "an-toan" },
  });

  const newsItems = [
    {
      slug: "ban-giao-nha-xuong-logistics",
      title: "Bàn giao nhà xưởng Logistics đúng tiến độ",
      excerpt: "Công trình 8.000 m² hoàn thành nghiệm thu giai đoạn 1.",
      content:
        "<p>Đội ngũ hiện trường đã hoàn tất kết cấu và hệ thống PCCC, sẵn sàng bàn giao cho chủ đầu tư.</p>",
      categoryId: newsCat.id,
      featuredImage: IMG.news1,
      daysAgo: 5,
      tags: [tagXayDung.id],
    },
    {
      slug: "5-luu-y-atld-cong-truong",
      title: "5 lưu ý ATLĐ trên công trường mùa mưa",
      excerpt: "Biện pháp an toàn giúp giảm rủi ro trượt ngã và sự cố điện.",
      content:
        "<p>Kiểm tra giàn giáo, hệ thống chống sét và đường đi tạm thời trước mỗi ca làm việc.</p>",
      categoryId: newsCatInsight.id,
      featuredImage: IMG.news2,
      daysAgo: 12,
      tags: [tagAnToan.id],
    },
    {
      slug: "vat-lieu-be-tong-tieu-chuan",
      title: "Kiểm soát chất lượng bê tông tại hiện trường",
      excerpt: "Quy trình lấy mẫu và bảo dưỡng bê tông đúng quy định.",
      content:
        "<p>SolidBuild áp dụng checklist lấy mẫu, bảo dưỡng và ghi nhận kết quả thí nghiệm.</p>",
      categoryId: newsCatInsight.id,
      featuredImage: IMG.news3,
      daysAgo: 20,
      tags: [tagXayDung.id],
    },
    {
      slug: "khoi-cong-biet-thu-ven-song",
      title: "Khởi công biệt thự ven sông",
      excerpt: "Lễ khởi công và triển khai ép cọc giai đoạn đầu.",
      content: "<p>Dự án dân dụng với yêu cầu hoàn thiện cao bắt đầu thi công phần móng.</p>",
      categoryId: newsCat.id,
      featuredImage: IMG.news4,
      daysAgo: 35,
      tags: [tagXayDung.id],
    },
  ];

  for (const item of newsItems) {
    const publishedAt = new Date(now);
    publishedAt.setDate(publishedAt.getDate() - item.daysAgo);

    const news = await prisma.news.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        categoryId: item.categoryId,
        authorId: adminId,
        featuredImage: item.featuredImage,
        thumbnail: item.featuredImage,
        status: ContentStatus.PUBLISHED,
        publishedAt,
        updatedById: adminId,
        deletedAt: null,
      },
      create: {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        categoryId: item.categoryId,
        authorId: adminId,
        featuredImage: item.featuredImage,
        thumbnail: item.featuredImage,
        status: ContentStatus.PUBLISHED,
        publishedAt,
        createdById: adminId,
        updatedById: adminId,
      },
    });

    for (const tagId of item.tags) {
      await prisma.newsTagRelation.upsert({
        where: { newsId_tagId: { newsId: news.id, tagId } },
        update: {},
        create: { newsId: news.id, tagId },
      });
    }
  }

  // Archive old sample news
  await prisma.news.upsert({
    where: { slug: "bai-viet-mau" },
    update: {
      title: "Bài viết mẫu (legacy)",
      status: ContentStatus.ARCHIVED,
      updatedById: adminId,
      deletedAt: null,
    },
    create: {
      title: "Bài viết mẫu (legacy)",
      slug: "bai-viet-mau",
      excerpt: "Archived",
      content: "<p>Archived</p>",
      authorId: adminId,
      status: ContentStatus.ARCHIVED,
      publishedAt: now,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  // —— Documents ——
  const docCat = await prisma.documentCategory.upsert({
    where: { slug: "ho-so-nang-luc" },
    update: { name: "Hồ sơ năng lực", status: CategoryStatus.ACTIVE },
    create: {
      name: "Hồ sơ năng lực",
      slug: "ho-so-nang-luc",
      description: "Tài liệu giới thiệu năng lực",
      status: CategoryStatus.ACTIVE,
    },
  });
  await prisma.documentCategory.upsert({
    where: { slug: "huong-dan" },
    update: { name: "Hướng dẫn", status: CategoryStatus.ACTIVE },
    create: {
      name: "Hướng dẫn",
      slug: "huong-dan",
      description: "Tài liệu hướng dẫn",
      status: CategoryStatus.ACTIVE,
    },
  });

  const file = await ensureSeedDocumentFile();

  await prisma.document.upsert({
    where: { id: "seed_doc_nang_luc" },
    update: {
      title: "Hồ sơ năng lực SolidBuild",
      description: "Tài liệu giới thiệu năng lực thi công (file seed).",
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      categoryId: docCat.id,
      status: ContentStatus.PUBLISHED,
      uploadedById: adminId,
      deletedAt: null,
    },
    create: {
      id: "seed_doc_nang_luc",
      title: "Hồ sơ năng lực SolidBuild",
      description: "Tài liệu giới thiệu năng lực thi công (file seed).",
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      categoryId: docCat.id,
      status: ContentStatus.PUBLISHED,
      uploadedById: adminId,
    },
  });

  await prisma.document.upsert({
    where: { id: "seed_doc_huong_dan" },
    update: {
      title: "Quy trình ATLĐ công trường (tóm tắt)",
      description: "Bản tóm tắt quy trình an toàn lao động — file seed.",
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      categoryId: docCat.id,
      status: ContentStatus.PUBLISHED,
      uploadedById: adminId,
      deletedAt: null,
    },
    create: {
      id: "seed_doc_huong_dan",
      title: "Quy trình ATLĐ công trường (tóm tắt)",
      description: "Bản tóm tắt quy trình an toàn lao động — file seed.",
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      categoryId: docCat.id,
      status: ContentStatus.PUBLISHED,
      uploadedById: adminId,
    },
  });
}

async function main() {
  await upsertPermissions();

  const superAdminRole = await upsertRole(
    "Super Admin",
    "Toàn quyền hệ thống",
    PERMISSIONS.map((p) => p.code),
  );
  await upsertRole("Admin", "Quản lý vận hành CMS", ADMIN_CODES);
  await upsertRole("Editor", "Quản lý nội dung", EDITOR_CODES);
  await upsertRole("Viewer", "Chỉ xem nội dung", VIEWER_CODES);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      name,
      passwordHash,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
    create: {
      email,
      username,
      name,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superAdminRole.id,
    },
  });

  const now = new Date();
  await seedDemoContent(admin.id, now);

  console.log("Seed completed.");
  console.log(`Super Admin: ${email} / ${password}`);
  console.log(
    "Demo content: 4 services, 6 projects, 4 news, 2 pages, 2 documents (Published).",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
