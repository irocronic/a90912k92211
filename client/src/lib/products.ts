/*
  VADEN ORIGINAL - Product Data Model
  Defines product structure with technical specs, OEM codes, and catalogs
*/

export interface Product {
  id: number;
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  fullDescription: string;
  features: string[];
  specifications: {
    label: string;
    value: string;
  }[];
  oemCodes: {
    manufacturer: string;
    codes: string[];
  }[];
  applications: string[];
  certifications: string[];
  catalogUrl?: string;
  relatedProductIds: number[];
}

export const products: Product[] = [
  {
    id: 1,
    slug: "hava-isleme-unitesi-e-apu",
    category: "YENİ",
    title: "Hava İşleme Ünitesi",
    subtitle: "(E-APU)",
    description: "Güvenli ve Verimli Hava Yönetimi",
    image: "https://private-us-east-1.manuscdn.com/sessionFile/GNtGadg2DHthUOVlxRmf9Z/sandbox/zj5v354O1vGB50VA1neK2B-img-1_1772104798000_na1fn_dmFkZW4taGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    fullDescription: "Vaden Original E-APU (Elektrik Hava İşleme Ünitesi), modern araçların artan hava yönetimi gereksinimlerini karşılamak için geliştirilmiştir. Düşük gürültü seviyesi, yüksek verimlilik ve uzun ömür ile tasarlanmıştır.",
    features: [
      "Düşük gürültü seviyesi (<75 dB)",
      "Yüksek verimlilik (%95+)",
      "Kompakt tasarım",
      "Kolay kurulum",
      "Uzun ömür (500.000+ saat)",
    ],
    specifications: [
      { label: "Voltaj", value: "24V / 12V" },
      { label: "Güç", value: "2.5 - 5 kW" },
      { label: "Akış Kapasitesi", value: "150 - 300 m³/h" },
      { label: "Çalışma Sıcaklığı", value: "-20°C ile +60°C" },
      { label: "Ağırlık", value: "12 kg" },
      { label: "Boyutlar", value: "450 x 350 x 200 mm" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["21545047", "21545048", "21545049"],
      },
      {
        manufacturer: "Scania",
        codes: ["2096381", "2096382"],
      },
      {
        manufacturer: "MAN",
        codes: ["51.26500.0160", "51.26500.0161"],
      },
    ],
    applications: [
      "Ağır ticari araçlar",
      "Otobüsler",
      "Kamyonlar",
      "İnşaat makineleri",
    ],
    certifications: ["ISO 9001", "ISO 14001", "IATF 16949"],
    catalogUrl: "#",
    relatedProductIds: [2, 3],
  },
  {
    id: 2,
    slug: "hava-fren-kompresoru",
    category: "KOMPRESÖRLER",
    title: "Hava Fren",
    subtitle: "Kompresörleri",
    description: "Gelişmiş teknolojiyle donatılmış, güvenilir ve yüksek performanslı kompresörler",
    image: "https://private-us-east-1.manuscdn.com/sessionFile/GNtGadg2DHthUOVlxRmf9Z/sandbox/zj5v354O1vGB50VA1neK2B-img-2_1772104793000_na1fn_dmFkZW4tY29tcHJlc3Nvci1oZXJv.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    fullDescription: "Vaden Original hava fren kompresörleri, yüksek basınç ve güvenilirlik gerektiren uygulamalar için tasarlanmıştır. 1 milyondan fazla üretilen kompresörlerimiz dünya çapında güvenilir bir marka olarak tanınmaktadır.",
    features: [
      "Yüksek verimlilik",
      "Düşük bakım gereksinimi",
      "Gürültü kontrolü",
      "Hızlı basınç artışı",
      "Uzun servis ömrü",
    ],
    specifications: [
      { label: "Maksimum Basınç", value: "10 bar" },
      { label: "Deplasman", value: "5.5 - 11 cc/rev" },
      { label: "Akış Kapasitesi", value: "400 - 800 l/min" },
      { label: "Güç Gereksinimi", value: "35 - 75 kW" },
      { label: "Çalışma Sıcaklığı", value: "-10°C ile +70°C" },
      { label: "Ağırlık", value: "45 - 65 kg" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["20545047", "20545048"],
      },
      {
        manufacturer: "Scania",
        codes: ["1406381", "1406382", "1406383"],
      },
      {
        manufacturer: "DAF",
        codes: ["1378160", "1378161"],
      },
      {
        manufacturer: "Iveco",
        codes: ["500060261", "500060262"],
      },
    ],
    applications: [
      "Ağır kamyonlar",
      "Otobüsler",
      "Çimento kamyonları",
      "Beton mikserleri",
    ],
    certifications: ["ISO 9001", "ISO 14001", "IATF 16949", "E-Mark"],
    catalogUrl: "#",
    relatedProductIds: [1, 3],
  },
  {
    id: 3,
    slug: "hava-fren-sistemi",
    category: "FREN SİSTEMLERİ",
    title: "Hava Fren",
    subtitle: "Sistemleri",
    description: "Temiz Hava, Üstün Kalite Standartları!",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    fullDescription: "Vaden Original hava fren sistemleri, araç güvenliğinin en kritik bileşenlerinden biridir. Kompresörden fren aktüatörlerine kadar tam sistem çözümleri sunuyoruz.",
    features: [
      "Tam sistem entegrasyonu",
      "Güvenlik sertifikasyonları",
      "Hızlı tepki süresi",
      "Düşük hava tüketimi",
      "Kolay bakım",
    ],
    specifications: [
      { label: "Sistem Basıncı", value: "8 - 10 bar" },
      { label: "Tepki Süresi", value: "< 200 ms" },
      { label: "Hava Tüketimi", value: "15 - 25 l/fren" },
      { label: "Çalışma Sıcaklığı", value: "-15°C ile +80°C" },
      { label: "Ağırlık", value: "120 - 150 kg (tam sistem)" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["20545047", "20545048", "20545049"],
      },
      {
        manufacturer: "Scania",
        codes: ["1406381", "1406382"],
      },
    ],
    applications: [
      "Ağır ticari araçlar",
      "Otobüsler",
      "Treyler",
      "Yarı römorklar",
    ],
    certifications: ["ISO 9001", "ECE R13", "IATF 16949"],
    catalogUrl: "#",
    relatedProductIds: [2, 4],
  },
  {
    id: 4,
    slug: "sanziman-solenoid-valfler",
    category: "VALFLER",
    title: "Şanzıman, Solenoid",
    subtitle: "Valfler",
    description: "Teknolojik Hassasiyet, Kontrolde Mükemmellik!",
    image: "https://private-us-east-1.manuscdn.com/sessionFile/GNtGadg2DHthUOVlxRmf9Z/sandbox/zj5v354O1vGB50VA1neK2B-img-4_1772104799000_na1fn_dmFkZW4tcHJvZHVjdHMtc2hvd2Nhc2U.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    fullDescription: "Vaden Original solenoid valfler, hassas kontrol ve güvenilir performans sağlayan elektromanyetik valflerdir. Şanzıman ve fren sistemlerinde kullanılır.",
    features: [
      "Hızlı yanıt süresi",
      "Düşük güç tüketimi",
      "Kompakt tasarım",
      "Uzun ömür",
      "Geniş çalışma aralığı",
    ],
    specifications: [
      { label: "Voltaj", value: "12V / 24V DC" },
      { label: "Güç Tüketimi", value: "8 - 15 W" },
      { label: "Yanıt Süresi", value: "< 50 ms" },
      { label: "Maksimum Basınç", value: "10 bar" },
      { label: "Akış Kapasitesi", value: "50 - 150 l/min" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["20545047", "20545048"],
      },
      {
        manufacturer: "Scania",
        codes: ["1406381"],
      },
    ],
    applications: [
      "Otomatik şanzıman",
      "Hava fren sistemi",
      "Klima sistemi",
    ],
    certifications: ["ISO 9001", "IATF 16949"],
    catalogUrl: "#",
    relatedProductIds: [3, 5],
  },
  {
    id: 5,
    slug: "motor-egzoz-fren-valfler",
    category: "MOTOR",
    title: "Motor, Egzoz",
    subtitle: "Fren Valfleri",
    description: "Performansın Kaliteyle Buluştuğu Yer!",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    fullDescription: "Vaden Original motor ve egzoz fren valfleri, araçların performansını optimize ederken yakıt tüketimini azaltır.",
    features: [
      "Yüksek sıcaklık direnci",
      "Düşük emisyon",
      "Verimli kontrol",
      "Uzun ömür",
    ],
    specifications: [
      { label: "Maksimum Sıcaklık", value: "250°C" },
      { label: "Yanıt Süresi", value: "< 100 ms" },
      { label: "Basınç Aralığı", value: "0 - 8 bar" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["20545047"],
      },
    ],
    applications: [
      "Dizel motorlar",
      "Egzoz sistemi",
    ],
    certifications: ["ISO 9001", "Euro 6"],
    catalogUrl: "#",
    relatedProductIds: [4, 6],
  },
  {
    id: 6,
    slug: "motor-volan-muhafazasi",
    category: "MOTOR",
    title: "Motor, Volan",
    subtitle: "Muhafazası",
    description: "Üstün Kalite, Kusursuz Performans!",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    fullDescription: "Vaden Original volan muhafazası, motorun korunması ve titreşim kontrolü için tasarlanmıştır.",
    features: [
      "Titreşim absorpsiyonu",
      "Yüksek dayanıklılık",
      "Hafif ağırlık",
      "Kolay kurulum",
    ],
    specifications: [
      { label: "Malzeme", value: "Alaşımlı çelik" },
      { label: "Ağırlık", value: "8 - 12 kg" },
      { label: "Çalışma Sıcaklığı", value: "-20°C ile +100°C" },
    ],
    oemCodes: [
      {
        manufacturer: "Volvo",
        codes: ["20545047"],
      },
    ],
    applications: [
      "Ağır kamyonlar",
      "Otobüsler",
    ],
    certifications: ["ISO 9001"],
    catalogUrl: "#",
    relatedProductIds: [5],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getRelatedProducts(productId: number, limit: number = 3): Product[] {
  const product = getProductById(productId);
  if (!product) return [];

  return product.relatedProductIds
    .slice(0, limit)
    .map((id) => getProductById(id))
    .filter((p) => p !== undefined) as Product[];
}
