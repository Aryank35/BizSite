/**
 * Development seed. RESETS all application data, then creates a super admin,
 * demo businesses, catalogues, website configurations and enquiries.
 *
 * Credentials come from SEED_* environment variables (see .env.example) and are
 * for local development only. The script refuses to run when NODE_ENV=production.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_OPENING_HOURS } from "@/lib/validators/business";
import type { SectionContent, SectionType } from "@/lib/website/sections";
import { createBusiness, setBusinessStatus } from "@/server/services/businesses";
import { createCategory } from "@/server/services/categories";
import { createProduct } from "@/server/services/products";
import { getPlatformSettings } from "@/server/services/platform";
import { publishWebsite, updateAppearance } from "@/server/services/website";
import { resolveTenantContext, type SessionUser } from "@/server/tenant";
import { defaultTheme, type Theme } from "@/lib/website/theme";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run the development seed with NODE_ENV=production.");
}

const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@bizsite.local";
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD;
const BUSINESS_PASSWORD = process.env.SEED_BUSINESS_ADMIN_PASSWORD;
if (!SUPERADMIN_PASSWORD || !BUSINESS_PASSWORD) {
  throw new Error("Set SEED_SUPERADMIN_PASSWORD and SEED_BUSINESS_ADMIN_PASSWORD in .env before seeding.");
}

async function createUser(params: { name: string; email: string; password: string; role: "SUPER_ADMIN" | "BUSINESS_ADMIN" }) {
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email, role: params.role, emailVerified: true },
  });
  await prisma.account.create({
    data: {
      id: randomBytes(16).toString("hex"),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(params.password),
    },
  });
  return user;
}

async function setSection<T extends SectionType>(
  businessId: string,
  type: T,
  values: { title?: string | null; subtitle?: string | null; content?: SectionContent<T>; isVisible?: boolean; sortOrder?: number },
) {
  await prisma.websiteSection.update({
    where: { businessId_type: { businessId, type } },
    data: { ...values, content: values.content as Prisma.InputJsonValue | undefined },
  });
}

type ProductSeed = {
  name: string;
  category: string;
  short: string;
  description: string;
  price?: string;
  sku?: string;
  featured?: boolean;
  draft?: boolean;
};

type BusinessSeed = {
  name: string;
  slug: string;
  category: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  social: Record<string, string>;
  admin: { name: string; email: string };
  theme: Partial<Theme>;
  categories: { name: string; description: string }[];
  products: ProductSeed[];
  publish: boolean;
  suspend?: boolean;
  sections: (businessId: string) => Promise<void>;
  enquiries: { name: string; email?: string; phone?: string; message: string; product?: string; status?: "NEW" | "IN_PROGRESS" | "RESOLVED" }[];
};

const businesses: BusinessSeed[] = [
  {
    name: "Royal Furniture",
    slug: "royal-furniture",
    category: "furniture",
    description:
      "Family-run furniture showroom in Bhubaneswar since 1998. Solid sheesham and teak furniture, made to order in our own workshop.",
    email: "hello@royal-furniture.example",
    phone: "+91 674 255 0198",
    whatsapp: "919437012345",
    address: "Plot 42, Janpath Road, Saheed Nagar",
    city: "Bhubaneswar",
    state: "Odisha",
    postalCode: "751007",
    social: { instagram: "https://instagram.com/royalfurniture.example", facebook: "https://facebook.com/royalfurniture.example" },
    admin: { name: "Rajesh Mohanty", email: "owner@royal-furniture.example" },
    theme: { template: "MODERN_CATALOGUE", primaryColor: "#7c2d12", secondaryColor: "#1c1917", accentColor: "#d97706", fontFamily: "lora" },
    categories: [
      { name: "Living Room", description: "Sofas, coffee tables and TV units." },
      { name: "Bedroom", description: "Beds, wardrobes and side tables." },
      { name: "Dining", description: "Dining sets for four to eight." },
      { name: "Office", description: "Desks and ergonomic seating." },
    ],
    products: [
      { name: "Heritage Sheesham Three-Seater Sofa", category: "Living Room", short: "Hand-carved sheesham frame with removable cotton cushions.", description: "Crafted from seasoned sheesham wood with traditional hand-carved arms. Cushions use high-resilience foam with washable cotton covers in a choice of six colours.\n\nDimensions: 210 × 85 × 90 cm.", price: "48500", sku: "RF-SOFA-301", featured: true },
      { name: "Teak Coffee Table with Storage", category: "Living Room", short: "Solid teak top with a lift-up storage compartment.", description: "A sturdy teak coffee table with a hidden storage well for remotes and magazines. Finished with a natural melamine polish.", price: "16900", sku: "RF-CT-112", featured: true },
      { name: "Floating TV Unit, 72 inch", category: "Living Room", short: "Wall-mounted TV unit with soft-close drawers.", description: "Engineered wood carcass with a sheesham veneer front. Fits televisions up to 75 inches.", price: "22400", sku: "RF-TV-072" },
      { name: "Maharaja King Bed with Hydraulic Storage", category: "Bedroom", short: "King-size bed with gas-lift storage and a padded headboard.", description: "Solid wood frame with a hydraulic lift that opens the full storage area. Headboard upholstered in premium fabric.\n\nMattress not included.", price: "62000", sku: "RF-BED-K01", featured: true },
      { name: "Three-Door Wardrobe with Mirror", category: "Bedroom", short: "Spacious wardrobe with hanging rail, shelves and locker.", description: "Built with 18 mm BWP plywood and finished in walnut laminate.", price: "38900", sku: "RF-WD-3D" },
      { name: "Six-Seater Dining Set, Sheesham", category: "Dining", short: "Rectangular table with six cushioned chairs.", description: "A classic six-seater for family meals. Table top 180 × 90 cm.", price: "54900", sku: "RF-DIN-6S", featured: true },
      { name: "Custom Dining Table (Made to Order)", category: "Dining", short: "Your size, your wood, your finish.", description: "Tell us your space and we will design a dining table to fit. Typical delivery in three to four weeks." },
      { name: "Executive Office Desk", category: "Office", short: "L-shaped desk with cable management.", description: "Generous work surface with a side return and built-in cable tray.", price: "27500", sku: "RF-OD-L1" },
      { name: "Rattan Lounge Chair", category: "Living Room", short: "New season design — coming soon.", description: "Woven rattan lounge chair with teak legs.", price: "18900", sku: "RF-LC-R01", draft: true },
    ],
    publish: true,
    sections: async (id) => {
      await setSection(id, "ANNOUNCEMENT_BAR", { isVisible: true, content: { text: "Festive offer: free delivery within Bhubaneswar on orders above ₹25,000.", linkLabel: "Enquire", linkTarget: "CONTACT" } });
      await setSection(id, "HERO", { title: "Furniture made to last generations", subtitle: "Solid wood furniture, crafted in our Bhubaneswar workshop and finished to your taste.", content: { primaryCtaLabel: "Browse the collection", primaryCtaTarget: "PRODUCTS", secondaryCtaLabel: "Chat on WhatsApp", secondaryCtaTarget: "WHATSAPP" } });
      await setSection(id, "ABOUT", { title: "Craftsmanship since 1998", content: { body: "Royal Furniture began as a small carpentry workshop run by the Mohanty family. Today our team of 25 craftsmen builds sofas, beds and dining sets from seasoned sheesham and teak, and we still make every custom order by hand.", highlights: ["25+ years of experience", "In-house workshop", "5-year structural warranty", "Custom sizes on request"] } });
      await setSection(id, "TESTIMONIALS", { isVisible: true, content: { items: [{ quote: "Our dining set arrived exactly as promised and the finish is beautiful. Two years on, it still looks new.", author: "Ananya Das", role: "Bhubaneswar" }, { quote: "They made a bed to fit our unusual room size. Very professional team.", author: "Sourav Patnaik", role: "Cuttack" }] } });
      await setSection(id, "CATALOGUE", { isVisible: false });
    },
    enquiries: [
      { name: "Priyanka Sahoo", phone: "+91 98610 11223", message: "Is the Heritage sofa available in a dark grey fabric? I would also like to know the delivery time to Khandagiri.", product: "Heritage Sheesham Three-Seater Sofa" },
      { name: "Amit Kumar", email: "amit.kumar@mail.example", message: "Please share a quote for a custom dining table, 7 feet long, in teak.", product: "Custom Dining Table (Made to Order)", status: "IN_PROGRESS" },
      { name: "Lipsa Mishra", email: "lipsa.m@mail.example", phone: "+91 94370 99887", message: "Do you offer EMI options for the king bed?", status: "RESOLVED" },
    ],
  },
  {
    name: "Odisha Windows & Doors",
    slug: "odisha-windows",
    category: "windows-doors",
    description: "Manufacturer and installer of uPVC and aluminium windows, doors and partitions for homes and commercial projects across Odisha.",
    email: "sales@odisha-windows.example",
    phone: "+91 671 230 4455",
    whatsapp: "919861054321",
    address: "Industrial Estate, Jagatpur",
    city: "Cuttack",
    state: "Odisha",
    postalCode: "754021",
    social: { linkedin: "https://linkedin.com/company/odisha-windows-example", youtube: "https://youtube.com/@odishawindows-example" },
    admin: { name: "Sunita Behera", email: "owner@odisha-windows.example" },
    theme: { template: "PROFESSIONAL_BUSINESS", primaryColor: "#1e3a8a", secondaryColor: "#0f172a", accentColor: "#0ea5e9", fontFamily: "inter" },
    categories: [
      { name: "uPVC Windows", description: "Energy-efficient sliding and casement windows." },
      { name: "Aluminium Systems", description: "Slim-profile doors, windows and facades." },
      { name: "Doors", description: "Entrance, balcony and French doors." },
    ],
    products: [
      { name: "uPVC Sliding Window, Two Track", category: "uPVC Windows", short: "Smooth sliding window with mosquito mesh track.", description: "Lead-free uPVC profiles with steel reinforcement. Includes multipoint locking and an integrated mesh shutter.\n\nPriced per square foot after site measurement.", featured: true },
      { name: "uPVC Casement Window", category: "uPVC Windows", short: "Outward-opening window with excellent sealing against rain and dust.", description: "EPDM gaskets and friction stays keep out monsoon rain and traffic noise.", featured: true },
      { name: "Tilt and Turn Window", category: "uPVC Windows", short: "European hardware for ventilation and easy cleaning.", description: "Opens inwards fully for cleaning or tilts for secure ventilation." },
      { name: "Slim Aluminium Sliding Door", category: "Aluminium Systems", short: "Floor-to-ceiling glass with 20 mm interlock.", description: "Ideal for balconies and living rooms that open to a garden. Toughened double glazing available.", featured: true },
      { name: "Aluminium Office Partition", category: "Aluminium Systems", short: "Glass partitions for offices and showrooms.", description: "Frameless and framed options with acoustic glass." },
      { name: "uPVC French Door", category: "Doors", short: "Double-leaf door with a classic look.", description: "Multi-point locking and a low threshold for easy access.", featured: true },
      { name: "Steel-Reinforced Main Door", category: "Doors", short: "Secure entrance door with a wood-finish foil.", description: "Five-point locking and a solid core for strength and insulation.", price: "38500", sku: "OWD-MD-01" },
    ],
    publish: true,
    sections: async (id) => {
      await setSection(id, "HERO", { title: "Windows and doors engineered for Odisha's climate", subtitle: "uPVC and aluminium systems that keep out rain, dust and noise. Free site survey across Cuttack and Bhubaneswar.", content: { primaryCtaLabel: "Request a free survey", primaryCtaTarget: "CONTACT", secondaryCtaLabel: "View products", secondaryCtaTarget: "PRODUCTS" } });
      await setSection(id, "ABOUT", { title: "Manufacturing excellence since 2009", content: { body: "Our 30,000 sq ft facility in Jagatpur fabricates every window and door we install. Our own installation teams handle the job from survey to final sealing, so one partner is accountable for quality.", highlights: ["1,200+ projects completed", "In-house fabrication", "10-year profile warranty"] } });
      await setSection(id, "WHY_CHOOSE_US", { content: { items: [{ icon: "shield", title: "Built for the monsoon", description: "Multi-chamber profiles and EPDM gaskets keep water out." }, { icon: "ruler", title: "Precise site survey", description: "Laser measurement for a perfect fit." }, { icon: "wrench", title: "Own installation team", description: "Trained installers, not subcontractors." }, { icon: "clock", title: "On-time delivery", description: "Typical turnaround of 15 working days." }] } });
      await setSection(id, "CATALOGUE", { isVisible: true, sortOrder: 6 });
      await setSection(id, "CATEGORIES", { isVisible: false });
      await setSection(id, "TESTIMONIALS", { isVisible: true, content: { items: [{ quote: "The sliding windows completely cut the traffic noise in our flat. Installation was neat and quick.", author: "Dr. R. K. Panda", role: "Homeowner, Cuttack" }, { quote: "They delivered aluminium partitions for our entire office floor on schedule.", author: "Meera Nayak", role: "Facilities Manager" }, { quote: "Professional survey and honest pricing.", author: "Bikash Rout", role: "Builder" }] } });
    },
    enquiries: [
      { name: "Subhashree Pradhan", phone: "+91 90400 12121", message: "Need a quotation for 8 sliding windows for a new house in Naraj. Can someone visit this week?", product: "uPVC Sliding Window, Two Track" },
      { name: "Kalinga Builders", email: "projects@kalinga-builders.example", message: "We have a 40-flat project and would like to discuss bulk pricing for casement windows.", status: "IN_PROGRESS" },
    ],
  },
  {
    name: "Threadline Boutique",
    slug: "threadline-boutique",
    category: "clothing",
    description: "Handloom sarees and contemporary ethnic wear, sourced directly from weavers in Sambalpur and Berhampur.",
    email: "hello@threadline.example",
    phone: "+91 6752 222 333",
    whatsapp: "917008123456",
    address: "Grand Road, near Jagannath Ballav Math",
    city: "Puri",
    state: "Odisha",
    postalCode: "752001",
    social: { instagram: "https://instagram.com/threadline.example" },
    admin: { name: "Ipsita Rath", email: "owner@threadline.example" },
    theme: { template: "MODERN_CATALOGUE", primaryColor: "#9d174d", secondaryColor: "#1f2937", accentColor: "#f59e0b", fontFamily: "playfair" },
    categories: [
      { name: "Sambalpuri Sarees", description: "Ikat sarees woven by hand." },
      { name: "Kurtas", description: "Handloom cotton kurtas." },
    ],
    products: [
      { name: "Sambalpuri Ikat Cotton Saree", category: "Sambalpuri Sarees", short: "Traditional bandha weave in natural cotton.", description: "Handwoven over three weeks. Comes with an unstitched blouse piece.", price: "6800", sku: "TL-SS-001", featured: true },
      { name: "Bomkai Silk Saree", category: "Sambalpuri Sarees", short: "Silk saree with a woven Bomkai border.", description: "Rich silk drape with intricate border motifs.", price: "18500", sku: "TL-BS-002", featured: true },
      { name: "Handloom Cotton Kurta", category: "Kurtas", short: "Breathable everyday kurta.", description: "Available in sizes S to XXL.", price: "1450.50", sku: "TL-KU-010", draft: true },
    ],
    publish: false,
    sections: async () => {},
    enquiries: [],
  },
  {
    name: "Spark Electronics",
    slug: "spark-electronics",
    category: "electronics",
    description: "Consumer electronics and home appliances.",
    email: "info@spark-electronics.example",
    phone: "+91 663 240 1111",
    whatsapp: "919000011111",
    address: "Main Road",
    city: "Sambalpur",
    state: "Odisha",
    postalCode: "768001",
    social: {},
    admin: { name: "Deepak Sahu", email: "owner@spark-electronics.example" },
    theme: {},
    categories: [{ name: "Televisions", description: "Smart TVs." }],
    products: [{ name: "43 inch 4K Smart TV", category: "Televisions", short: "Ultra HD smart TV.", description: "Smart TV with built-in apps.", price: "28990", sku: "SE-TV-43" }],
    publish: true,
    suspend: true,
    sections: async () => {},
    enquiries: [],
  },
];

async function main() {
  console.log("Resetting application data…");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE audit_logs, enquiries, product_images, products, categories, website_sections,
      website_publications, website_configs, media_assets, invitations, business_memberships, businesses,
      sessions, accounts, verifications, users, auth_rate_limits, throttle_buckets, website_requests,
      platform_settings CASCADE`);

  await getPlatformSettings();

  const superAdmin = await createUser({ name: "Platform Admin", email: SUPERADMIN_EMAIL, password: SUPERADMIN_PASSWORD!, role: "SUPER_ADMIN" });
  const actor: SessionUser = { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: "SUPER_ADMIN" };

  for (const seed of businesses) {
    const business = await createBusiness(actor, {
      name: seed.name,
      slug: seed.slug,
      category: seed.category,
      description: seed.description,
      email: seed.email,
      phone: seed.phone,
      whatsappNumber: seed.whatsapp,
      city: seed.city,
      state: seed.state,
    });
    await prisma.business.update({
      where: { id: business.id },
      data: { addressLine: seed.address, postalCode: seed.postalCode, openingHours: DEFAULT_OPENING_HOURS, socialLinks: seed.social },
    });

    const admin = await createUser({ name: seed.admin.name, email: seed.admin.email, password: BUSINESS_PASSWORD!, role: "BUSINESS_ADMIN" });
    await prisma.businessMembership.create({ data: { userId: admin.id, businessId: business.id, role: "OWNER" } });

    const ctx = (await resolveTenantContext(actor, business.id))!;
    const base = defaultTheme(seed.theme.template ?? "MODERN_CATALOGUE");
    await updateAppearance(ctx, {
      ...base,
      ...seed.theme,
      footerSettings: { ...base.footerSettings, tagline: seed.description.split(".")[0] + "." },
      seoSettings: { title: `${seed.name} — ${seed.city}`, description: seed.description.slice(0, 160), ogImageUrl: null },
    });

    const categoryIds = new Map<string, string>();
    for (const c of seed.categories) {
      const created = await createCategory(ctx, { name: c.name, slug: "", description: c.description });
      categoryIds.set(c.name, created.id);
    }

    const productIds = new Map<string, string>();
    // Created in reverse so the first listed product ends up first in the catalogue.
    for (const p of [...seed.products].reverse()) {
      const created = await createProduct(ctx, {
        name: p.name,
        slug: "",
        categoryId: categoryIds.get(p.category) ?? "",
        shortDescription: p.short,
        description: p.description,
        sku: p.sku ?? "",
        price: p.price ?? "",
        priceVisibility: p.price ? "SHOW" : "CONTACT_FOR_PRICE",
        featuredImageUrl: "",
        galleryImages: [],
        status: p.draft ? "DRAFT" : "PUBLISHED",
        isFeatured: Boolean(p.featured),
        seoTitle: "",
        seoDescription: "",
      });
      productIds.set(p.name, created.id);
    }

    await seed.sections(business.id);
    if (seed.publish) await publishWebsite(ctx);
    if (seed.suspend) await setBusinessStatus(actor, business.id, "SUSPENDED");

    for (const [index, e] of seed.enquiries.entries()) {
      await prisma.enquiry.create({
        data: {
          businessId: business.id,
          productId: e.product ? (productIds.get(e.product) ?? null) : null,
          customerName: e.name,
          email: e.email ?? null,
          phone: e.phone ?? null,
          message: e.message,
          status: e.status ?? "NEW",
          createdAt: new Date(Date.now() - (index + 1) * 26 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`  ✓ ${seed.name} (${seed.publish ? "published" : "draft"}${seed.suspend ? ", suspended" : ""})`);
  }

  await prisma.websiteRequest.create({
    data: { name: "Manoj Jena", email: "manoj@jena-interiors.example", phone: "+91 98530 44556", businessName: "Jena Interiors", category: "interior-design", message: "We would like a website to show our completed interior projects." },
  });

  console.log("\nSeed complete. Development sign-in accounts:");
  console.log(`  Super admin:    ${SUPERADMIN_EMAIL}`);
  for (const b of businesses) console.log(`  Business admin: ${b.admin.email}  (${b.name})`);
  console.log("  Passwords: SEED_SUPERADMIN_PASSWORD / SEED_BUSINESS_ADMIN_PASSWORD from your .env");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
