export type PageContentOverride = {
  title?: string;
  content?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
};

export const EN_PAGE_CONTENT_OVERRIDES: Record<string, PageContentOverride> = {
  "layout.footer": {
    title: "Footer Area",
    content: "Footer texts, links and contact area",
    metadata: {
      sectionProductsTitle: "Products",
      sectionCorporateTitle: "Corporate",
      sectionContactTitle: "Contact",
      brandDescription:
        "A global leader in air brake systems and automotive spare parts manufacturing with 56 years of experience.",
      productLinks: [
        { label: "Air Processing Unit (E-APU)", href: "/#urunler" },
        { label: "Air Brake Compressors", href: "/#urunler" },
        { label: "Air Brake Systems", href: "/#urunler" },
        { label: "Transmission Solenoid Valves", href: "/#urunler" },
        { label: "Engine Exhaust Brake Valves", href: "/#urunler" },
        { label: "Air Brake System Valves", href: "/#urunler" },
        { label: "Engine Flywheel Housing", href: "/#urunler" },
      ],
      corporateLinks: [
        { label: "About Us", href: "/kurumsal?tab=about" },
        { label: "History", href: "/kurumsal?tab=history" },
        { label: "Production Facilities", href: "/#uretim" },
        { label: "R&D", href: "/#arge" },
        { label: "Sustainability", href: "/#global" },
        { label: "Awards & Achievements", href: "/#oduller" },
        { label: "Careers", href: "/kariyer" },
        { label: "News", href: "/#haberler" },
      ],
      addressLines: ["Vaden Automotive Industry & Trade Inc.", "Konya, Turkiye"],
      newsletterTitle: "Newsletter Subscription",
      newsletterPlaceholder: "Your email address",
      newsletterButton: "SUBSCRIBE",
      copyrightText: "© Vaden Automotive Industry & Trade Inc. All rights reserved / 2026",
      policyLinks: [
        { label: "Privacy Policy", href: "/politikalar?tab=privacy" },
        { label: "PDPL", href: "/politikalar?tab=kvkk" },
        { label: "Cookie Policy", href: "/politikalar?tab=cookies" },
      ],
    },
  },

  "home.hero": {
    title: "Main Slider",
    content: "Homepage hero slider texts",
    metadata: {
      secondaryCtaText: "About Us",
      slides: [
        {
          id: 1,
          tag: "NEW PRODUCT",
          title: "Air Processing Unit",
          subtitle: "(E-APU)",
          description: "Safe and Efficient Air Management",
          cta: "View Product",
        },
        {
          id: 2,
          tag: "LEADING TECHNOLOGY",
          title: "Air Brake",
          subtitle: "Compressors",
          description:
            "Reliable and high-performance air brake compressors equipped with advanced technology.",
          cta: "Explore",
        },
        {
          id: 3,
          tag: "QUALITY STANDARD",
          title: "Air Brake",
          subtitle: "Systems",
          description: "Clean Air, Superior Quality Standards!",
          cta: "Product Catalog",
        },
      ],
    },
  },

  "home.oemSearch": {
    title: "OEM Search",
    content: "OEM search module texts",
    metadata: {
      tag: "Quick Search",
      title: "Search by OEM Code",
      placeholder: "Enter OEM code or product name...",
      buttonText: "SEARCH",
      autocompleteOemLabel: "OEM Codes",
      autocompleteProductLabel: "Products",
      autocompleteCategoryLabel: "Categories",
      samplePrefix: "Example:",
      sampleOne: "K013872",
      sampleTwo: "Compressor",
    },
  },

  "home.newsTicker": {
    title: "Announcement Ticker",
    content: "News ticker helper texts",
    metadata: {
      labelText: "ANNOUNCEMENTS",
      readMoreText: "Read More",
    },
  },

  "home.products": {
    title: "Product Categories",
    content: "Our Products",
    metadata: {
      label: "Product Categories",
      heading: "Our Products",
      viewAllText: "View All Products",
    },
  },

  "home.news": {
    title: "Latest News",
    content: "News & Announcements",
    metadata: {
      label: "Latest News",
      headingMain: "News &",
      headingHighlight: "Announcements",
      viewAllText: "View All News",
    },
  },

  "home.about": {
    title: "56 Years of Excellence",
    content: "Corporate introduction area",
    metadata: {
      label: "Corporate",
      headingMain: "56 Years of",
      headingHighlight: "Excellence",
      paragraph1:
        "Since 1968, Vaden Original has been one of Turkiye's leading brands in air brake systems and automotive spare parts manufacturing.",
      paragraph2:
        "We manufacture with more than 1,500 employees and over 600 CNC machines in our 105,000 m² indoor production area in Konya.",
      milestones: [
        { year: "1968", text: "Vaden Automotive was founded" },
        { year: "1985", text: "Exports started" },
        { year: "2000", text: "ISO 9001 certification obtained" },
        { year: "2015", text: "New Konya facility opened" },
        { year: "2024", text: "1 millionth compressor produced" },
      ],
      ctaText: "Learn More",
      imageAlt: "Vaden Production",
      quickStats: [
        { value: "56+", label: "Years of Experience" },
        { value: "110+", label: "Export Countries" },
        { value: "1M+", label: "Compressors Produced" },
        { value: "ISO 500", label: "Industrial Ranking" },
      ],
    },
  },

  "home.stats": {
    title: "Global Leadership",
    content: "Vaden by the Numbers",
    metadata: {
      label: "Vaden by the Numbers",
      heading: "Global Leadership",
      stats: [
        { value: 56, suffix: "+", label: "Years of Experience", description: "A trusted name in the industry" },
        { value: 110, suffix: "+", label: "Export Countries", description: "Global presence across 5 continents" },
        { value: 500, suffix: "+", label: "Customers", description: "A trusted brand worldwide" },
        { value: 1500, suffix: "+", label: "Employees", description: "Expert and experienced team" },
        { value: 105000, suffix: " m²", label: "Indoor Production Area", description: "Modern manufacturing facilities" },
        { value: 600, suffix: "+", label: "CNC Machines", description: "Advanced technology machine park" },
      ],
    },
  },

  "home.facilities": {
    title: "Production Facilities",
    content: "Production power section",
    metadata: {
      label: "Our Manufacturing Power",
      headingMain: "Production",
      headingHighlight: "Facilities",
      description:
        "For 56 years, we have continuously improved and renewed what we do best, manufacturing with superior quality standards.",
      tabs: ["Konya Facility", "Bursa Facility"],
      ctaText: "Learn More",
      imageAlt: "Konya Production Facility",
      badgeLine1: "Years of",
      badgeLine2: "Experience",
      stats: [
        { icon: "users", value: "1,200+", label: "Employees" },
        { icon: "zap", value: "6.5 mW", label: "Solar Energy" },
        { icon: "factory", value: "105K+", label: "m² Indoor Area" },
        { icon: "cpu", value: "600+", label: "CNC Machines" },
      ],
    },
  },

  "home.awards": {
    title: "Awards & Achievements",
    content: "Achievement cards area",
    metadata: {
      label: "Our Achievements",
      headingMain: "Awards &",
      headingHighlight: "Achievements",
      awards: [
        {
          id: 1,
          icon: "trophy",
          rank: "401st",
          list: "ISO 500",
          title: "We are among Turkiye's Top 500 Industrial Enterprises!",
          description: "We achieved a significant rise in the ISO 500-2024 ranking.",
          href: "#",
        },
        {
          id: 2,
          icon: "trendingUp",
          rank: "365th",
          list: "TIM 1000",
          title: "We are 365th in Turkiye Exporters Ranking!",
          description: "We climbed to 365th place in the Turkish Exporters Assembly list.",
          href: "#",
        },
        {
          id: 3,
          icon: "award",
          rank: "85th",
          list: "R&D 500",
          title: "We are 85th in the R&D 500 List!",
          description: "We ranked 85th among the top 500 companies with the highest R&D spending in 2024.",
          href: "#",
        },
      ],
      tabs: ["ISO 500", "TIM 1000", "R&D 500"],
      readMoreText: "Read More",
    },
  },

  "home.rd": {
    title: "The Heart of Innovation: R&D",
    content: "R&D and innovation area",
    metadata: {
      label: "Research & Development",
      headingMain: "The Heart of",
      headingHighlight: "Innovation: R&D",
      description:
        "Our R&D activities drive the sector forward with innovative solutions and cutting-edge technologies shaping the future.",
      imageAlt: "R&D Department",
      badgeTitle: "R&D 500 List",
      badgeDescription: "Turkiye's Top R&D Spending Companies",
      ctaText: "R&D Department",
      features: [
        {
          icon: "lightbulb",
          title: "Innovation Center",
          description: "R&D initiatives advancing the industry with innovative solutions and latest technologies",
        },
        {
          icon: "flask",
          title: "Testing Laboratories",
          description: "Advanced testing infrastructure for maximum quality and reliability",
        },
        {
          icon: "cpu",
          title: "Digital Engineering",
          description: "Product development processes with CAD/CAM and simulation technologies",
        },
        {
          icon: "shield",
          title: "Quality Assurance",
          description: "Production and quality control in compliance with international standards",
        },
      ],
    },
  },

  "home.sustainability": {
    title: "Sustainable Manufacturing",
    content: "Sustainability texts",
    metadata: {
      label: "Green Future",
      headingMain: "Sustainable",
      headingHighlight: "Production",
      items: [
        {
          icon: "sun",
          title: "Solar Energy",
          value: "6.5 mW",
          description: "We generate 6.5 megawatts of clean energy with rooftop solar panels.",
        },
        {
          icon: "leaf",
          title: "Carbon Reduction",
          value: "30%",
          description: "We reduced our carbon footprint by 30% over the last 5 years.",
        },
        {
          icon: "recycle",
          title: "Recycling",
          value: "95%",
          description: "We recycle or reuse 95% of our production waste.",
        },
        {
          icon: "wind",
          title: "Clean Production",
          value: "ISO 14001",
          description: "Our environmental management system is certified with ISO 14001.",
        },
      ],
    },
  },

  "home.global": {
    title: "Leading the World",
    content: "Global presence section",
    metadata: {
      label: "Global Presence",
      headingMain: "Leading the",
      headingHighlight: "World",
      description:
        "We are writing a success story by exporting to more than 110 countries, operating across 5 continents, and serving over 500 customers.",
      mapAlt: "Global Export Network",
      stats: [
        {
          icon: "mapPin",
          value: "110+",
          label: "Export Countries",
          description: "We deliver quality and trust through our export network spanning more than 110 countries.",
        },
        {
          icon: "globe",
          value: "5",
          label: "Continents",
          description: "We provide world-class service through our global network across 5 continents.",
        },
        {
          icon: "languages",
          value: "9",
          label: "Languages",
          description: "We collaborate with global partners through communication in 9 different languages.",
        },
        {
          icon: "users",
          value: "500+",
          label: "Customers",
          description: "We build strong partnerships with our customers.",
        },
        {
          icon: "trendingUp",
          value: "Top 500",
          label: "Exporter",
          description: "We are among Turkiye's top 500 exporters.",
        },
      ],
    },
  },

  "home.contact": {
    title: "Contact",
    content: "Contact form and information cards",
    metadata: {
      label: "Contact Us",
      heading: "Contact",
      successMessage: "Your message has been received! We will get back to you as soon as possible.",
      contactInfo: [
        {
          icon: "mapPin",
          title: "Address",
          lines: ["Vaden Automotive Industry & Trade Inc.", "Konya Organized Industrial Zone", "Konya, Turkiye"],
        },
        {
          icon: "phone",
          title: "Phone",
          lines: ["444 9 184", "+90 332 239 00 00"],
        },
        {
          icon: "mail",
          title: "E-mail",
          lines: ["info@vaden.com.tr", "export@vaden.com.tr"],
        },
        {
          icon: "clock",
          title: "Working Hours",
          lines: ["Monday - Friday: 08:00 - 17:30", "Saturday: 08:00 - 13:00"],
        },
      ],
      labels: {
        name: "Full Name *",
        email: "E-mail *",
        phone: "Phone",
        subject: "Subject *",
        message: "Message *",
        submit: "Send Message",
      },
      placeholders: {
        name: "Your full name",
        email: "Your e-mail address",
        phone: "Your phone number",
        subject: "Subject of your message",
        message: "Write your message here...",
      },
    },
  },

  "home.video": {
    title: "Our Promotional Film",
    content: "Video section texts",
    metadata: {
      kicker: "Vaden Original Factory Promotional Film",
      headingMain: "Watch Our",
      headingHighlight: "Promotional Film",
      imageAlt: "Vaden Factory Promotional Film",
      videoTitle: "Vaden Original Promotional Film",
    },
  },

  "pages.productDetail": {
    title: "Product Detail Texts",
    content: "Product detail page labels and CTA texts",
    metadata: {
      notFoundTitle: "Product Not Found",
      notFoundDescription: "The product you are looking for is not available.",
      backToHomeText: "Back to Home",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Products",
      featuresTitle: "Features",
      downloadCatalogText: "Download Catalog",
      shareText: "Share",
      contactTitle: "Do you have any questions?",
      specsTitle: "Specifications",
      oemCodesTitle: "OEM Codes",
      applicationsTitle: "Applications",
      certificationsTitle: "Certifications",
      relatedProductsTitle: "Related Products",
      catalogDownloadToast: "Catalog download started!",
      linkCopiedToast: "Link copied!",
    },
  },

  "pages.searchResults": {
    title: "Search Results Page",
    content: "Search results labels and filters",
    metadata: {
      breadcrumbHome: "Home",
      breadcrumbCurrent: "Search Results",
      pageTitle: "Search Results",
      queryResultPrefix: "for \"{query}\"",
      queryResultSuffix: "products found",
      noResultsTitle: "No Results Found",
      noResultsPrefix: "No matching products were found for \"{query}\". Please check your query or",
      noResultsCtaInline: "view all products",
      noResultsSuffix: ".",
      noResultsBackHome: "Back to Home",
      filtersTitle: "Filters",
      categoryTitle: "Category",
      allCategoriesText: "All",
      sortTitle: "Sort",
      sortRelevance: "Relevance",
      sortName: "Name (A-Z)",
      oemMatchLabel: "OEM Code Match:",
      oemCodesLabel: "OEM Codes:",
      moreSuffix: "more",
      detailLinkText: "View Details",
    },
  },

  "pages.corporate": {
    title: "Corporate Information",
    content: "Corporate page texts and tab content",
    metadata: {
      pageTitle: "Corporate | Vaden Original - Heavy Vehicle Spare Parts",
      metaDescription:
        "The success story of Vaden Original since 1968, our board of directors and quality certifications.",
      metaKeywords:
        "vaden corporate, air brake systems, heavy vehicle spare parts, ISO 9001, IATF 16949",
      heroLabel: "Corporate",
      heroHeadingMain: "Corporate",
      heroHeadingHighlight: "Information",
      heroDescription: "We create value in the industry with 56 years of experience, innovation and quality commitment.",
      tabs: [
        { id: "about", label: "About Us", title: "About Us" },
        { id: "history", label: "History", title: "History" },
        { id: "board", label: "Board of Directors", title: "Board of Directors" },
        { id: "certifications", label: "Certifications", title: "Certifications" },
      ],
      aboutParagraphs: [
        "Vaden Original has been one of Turkiye's leading brands in air brake systems and automotive spare parts manufacturing since 1968.",
        "We manufacture with more than 1,500 employees and over 600 CNC machines in our 105,000 m² indoor production area in Konya.",
        "Customer focus, confidentiality and security, business ethics and corporate responsibility are at the core of how we work.",
      ],
      milestones: [
        { year: "1968", text: "Vaden Automotive was founded under the name Yildiz Injector and Washer Seals" },
        { year: "1985", text: "Exports started" },
        { year: "2000", text: "ISO 9001 certification obtained" },
        { year: "2007", text: "VADEN ORIGINAL brand launched" },
        { year: "2015", text: "New Konya facility opened" },
        { year: "2018", text: "Entered Turkiye's top 1000 exporter and manufacturer companies list" },
        { year: "2021", text: "Warehouse and showroom opened in Istanbul, joined Turquality Program" },
        { year: "2022", text: "Bursa R&D and rubber factory commissioned" },
        { year: "2024", text: "1 millionth compressor produced" },
        { year: "2025", text: "Company name changed to Vaden Automotive Industry and Trade Inc." },
      ],
      boardMembers: [
        { name: "Chairman of the Board", title: "Chairman" },
        { name: "General Manager", title: "General Manager" },
        { name: "Finance Manager", title: "Finance" },
        { name: "Production Manager", title: "Production" },
      ],
      certifications: [
        { name: "ISO 9001:2015", description: "Quality Management System", alt: "ISO 9001 Quality Management System Certificate" },
        { name: "IATF 16949:2016", description: "Automotive Quality Management System", alt: "IATF 16949 Automotive Quality Management System Certificate" },
        { name: "ISO 14001", description: "Environmental Management System", alt: "ISO 14001 Environmental Management System Certificate" },
        { name: "ISO 45001", description: "Occupational Health and Safety Management System", alt: "ISO 45001 Occupational Health and Safety Management System Certificate" },
      ],
    },
  },

  "pages.career": {
    title: "Career Opportunities",
    content: "Career page contents",
    metadata: {
      pageTitle: "Career | Vaden Automotive Job Opportunities",
      metaDescription:
        "Shape your career at Vaden Automotive. Explore open positions and join our team.",
      metaKeywords: "vaden career, automotive jobs, Konya jobs, Bursa jobs",
      heroLabel: "Human Resources",
      heroHeadingMain: "Career",
      heroHeadingHighlight: "Opportunities",
      heroDescription:
        "Develop your career at Vaden Automotive. Become part of a dynamic team and shape the future of the industry.",
      benefitsTitle: "Why Work at Vaden?",
      jobsTitle: "Open Positions",
      benefits: [
        { icon: "💼", title: "Competitive Salary", description: "Above-industry salary and benefits package" },
        { icon: "🏥", title: "Health Insurance", description: "Comprehensive health and life insurance" },
        { icon: "📚", title: "Training Programs", description: "Continuous learning and professional development opportunities" },
        { icon: "🎯", title: "Career Growth", description: "Clear career paths and advancement opportunities" },
        { icon: "⚖️", title: "Work-Life Balance", description: "Flexible working hours and leave policies" },
        { icon: "🌱", title: "Social Responsibility", description: "Participation in social and environmental projects" },
      ],
      jobs: [
        {
          id: 1,
          title: "CNC Operator",
          department: "Production",
          location: "Konya",
          type: "Full Time",
          description: "We are looking for an experienced operator to work with modern CNC machines.",
        },
        {
          id: 2,
          title: "Quality Control Engineer",
          department: "Quality",
          location: "Konya",
          type: "Full Time",
          description: "Engineer responsible for quality control and product tests in line with ISO standards.",
        },
        {
          id: 3,
          title: "R&D Engineer",
          department: "R&D",
          location: "Bursa",
          type: "Full Time",
          description: "Engineer to work in product development and innovation projects.",
        },
        {
          id: 4,
          title: "Sales Representative",
          department: "Sales",
          location: "Istanbul",
          type: "Full Time",
          description: "Representative to manage corporate customer relations and achieve sales targets.",
        },
      ],
      ctaTitle: "No Suitable Position for You?",
      ctaDescription:
        "Send your CV and be informed about future opportunities. We are looking for talented professionals at Vaden Automotive.",
      ctaButtonText: "Send CV",
    },
  },

  "pages.policies": {
    title: "Policies & Terms",
    content: "Legal policy content",
    metadata: {
      pageTitle: "Legal Policies | Vaden Original PDPL and Privacy",
      metaDescription:
        "Information about Vaden Automotive Privacy Policy, PDPL Clarification Text and Cookie Policy.",
      metaKeywords: "privacy policy, PDPL, cookie policy, data security, personal data",
      heroLabel: "Legal",
      heroHeadingMain: "Policies &",
      heroHeadingHighlight: "Terms",
      heroDescription:
        "Learn about the policies and legal terms that apply when using the Vaden Automotive website.",
      policies: [
        {
          id: "privacy",
          title: "Privacy Policy",
          content:
            "<h3>1. Introduction</h3><p>Vaden Automotive Industry & Trade Inc. (\"Company\") attaches importance to protecting the personal data of website visitors.</p><h3>2. Information Collected</h3><ul><li>Name, surname and contact information</li><li>E-mail address</li><li>Phone number</li></ul>",
        },
        {
          id: "kvkk",
          title: "PDPL Clarification Text",
          content:
            "<h3>Personal Data Protection Law Clarification Text</h3><h3>1. Data Controller</h3><p>Vaden Automotive Industry & Trade Inc., Konya Organized Industrial Zone, Konya, Turkiye</p><h3>2. Purposes of Processing Personal Data</h3><ul><li>Providing customer services</li><li>Providing information about products and services</li></ul>",
        },
        {
          id: "cookies",
          title: "Cookie Policy",
          content:
            "<h3>1. What are Cookies?</h3><p>Cookies are small text files stored in the browsers of website visitors.</p><h3>2. Types of Cookies We Use</h3><ul><li><strong>Necessary Cookies:</strong> Required for proper functioning of the website</li><li><strong>Analytics Cookies:</strong> Used to analyze website visitor behavior</li></ul>",
        },
      ],
      contactTitle: "Do you have questions?",
      contactDescription:
        "If you have any questions about our policies, please contact us.",
      contactButtonText: "Go to Contact Page",
    },
  },
};
