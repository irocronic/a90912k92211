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
      sectionCorporateTitle: "Quick Links",
      sectionContactTitle: "Contact",
      brandDescription:
        "BRAC Spare Parts is a Dubai-based global exporter of heavy vehicle spare parts with over 45 years of industry expertise.",
      productLinks: [
        { label: "Brake Systems", href: "/#urunler" },
        { label: "Suspension & Chassis", href: "/#urunler" },
        { label: "Engine Parts", href: "/#urunler" },
        { label: "Air Systems", href: "/#urunler" },
        { label: "Electrical Components", href: "/#urunler" },
      ],
      corporateLinks: [
        { label: "About Us", href: "/#hakkimizda" },
        { label: "Why BRAC", href: "/#neden-brac" },
        { label: "Global Reach", href: "/#global" },
        { label: "Request Quote", href: "/#iletisim" },
      ],
      addressLines: ["Dubai, UAE", "Global heavy vehicle spare parts export hub"],
      newsletterTitle: "",
      newsletterPlaceholder: "",
      newsletterButton: "",
      copyrightText: "© BRAC Spare Parts. All rights reserved / 2026",
      policyLinks: [
        { label: "Privacy Policy", href: "/politikalar?tab=privacy" },
        { label: "PDPL Clarification Text", href: "/politikalar?tab=kvkk" },
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
          tag: "GLOBAL SUPPLY",
          title: "Global Heavy Vehicle",
          subtitle: "Spare Parts Supplier",
          description: "45+ years of industry experience | Exporting from Dubai to 40+ countries",
          cta: "Request a Quote",
        },
        {
          id: 2,
          tag: "WORLD-CLASS BRANDS",
          title: "Authorized Supply of",
          subtitle: "Trusted Brands",
          description:
            "ZF WABCO • KNORR-BREMSE • HALDEX • PROVIA • and more",
          cta: "View Products",
        },
        {
          id: 3,
          tag: "RELIABLE DELIVERY",
          title: "Stop Losing Time",
          subtitle: "with Unreliable Suppliers",
          description: "Stable supply, consistent quality and fast delivery.",
          cta: "Contact Us",
        },
        {
          id: 4,
          tag: "WHOLESALE VALUE",
          title: "Increase Your Profit",
          subtitle: "with Competitive Pricing",
          description: "Built for distributors, importers and fleet operators.",
          cta: "Become a Partner",
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
    title: "Products",
    content: "Global Spare Parts Solutions",
    metadata: {
      label: "Products",
      heading: "Global Spare Parts Solutions",
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
    title: "45+ Years of Expertise",
    content: "Corporate introduction area",
    metadata: {
      label: "About Us",
      headingMain: "45+ Years of",
      headingHighlight: "Trusted Expertise",
      paragraph1:
        "BRAC Spare Parts is a Dubai-based global exporter of heavy vehicle spare parts with over 45 years of industry experience.",
      paragraph2:
        "We serve the Middle East, Africa, Europe and Asia with a strong supply chain and supply premium brands including ZF WABCO, PROVIA, KNORR-BREMSE and HALDEX.",
      milestones: [
        { year: "45+", text: "Years of specialist spare parts experience" },
        { year: "Dubai", text: "Global export hub for international buyers" },
        { year: "4", text: "Core regions served across the Middle East, Africa, Europe and Asia" },
        { year: "5+", text: "Trusted brands in active supply portfolio" },
      ],
      ctaText: "Request Quote",
      imageAlt: "BRAC Spare Parts",
      quickStats: [
        { value: "45+", label: "Years of Experience" },
        { value: "40+", label: "Countries" },
        { value: "4", label: "Core Regions" },
        { value: "24h", label: "Quote Response" },
      ],
    },
  },

  "home.stats": {
    title: "Why BRAC",
    content: "Trusted Global Supply by the Numbers",
    metadata: {
      label: "Why BRAC",
      heading: "Trusted Global Supply",
      stats: [
        { value: 45, suffix: "+", label: "Years of Experience", description: "Deep market expertise built over decades" },
        { value: 40, suffix: "+", label: "Countries", description: "Exporting from Dubai to multiple global markets" },
        { value: 24, suffix: "h", label: "Quote Turnaround", description: "Fast first response for supply requests" },
        { value: 5, suffix: "+", label: "Core Brands", description: "Reliable premium brands in active supply" },
        { value: 4, suffix: "", label: "Core Regions", description: "Middle East, Africa, Europe and Asia" },
        { value: 1, suffix: "", label: "Global Hub", description: "Dubai-based sourcing and export operation" },
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
    title: "Global Reach",
    content: "Global presence section",
    metadata: {
      label: "Global Reach",
      headingMain: "From Dubai to",
      headingHighlight: "Global Markets",
      description:
        "Serving the Middle East, Africa, Europe and Asia through a strong supply chain and dependable export workflow.",
      mapAlt: "BRAC global supply network",
      stats: [
        {
          icon: "mapPin",
          value: "4",
          label: "Core Regions",
          description: "Middle East, Africa, Europe and Asia.",
        },
        {
          icon: "globe",
          value: "40+",
          label: "Countries",
          description: "Consistent export coverage from Dubai.",
        },
        {
          icon: "languages",
          value: "3",
          label: "Languages",
          description: "Turkish, English and Arabic support.",
        },
        {
          icon: "users",
          value: "B2B",
          label: "Focus",
          description: "Built for distributors, importers and fleet operators.",
        },
        {
          icon: "trendingUp",
          value: "24h",
          label: "Response",
          description: "Fast initial answer to quote and sourcing requests.",
        },
      ],
    },
  },

  "home.contact": {
    title: "Contact",
    content: "Contact form and information cards",
    metadata: {
      label: "Request a Quote",
      heading: "Get Your Quote in 24 Hours",
      successMessage: "Your request has been recorded. We will get back to you as soon as possible.",
      whatsappText: "WhatsApp Us",
      whatsappUrl: "https://wa.me/905344456070",
      contactInfo: [
        {
          icon: "mapPin",
          title: "Head Office",
          lines: ["Dubai, UAE", "Global export hub for heavy vehicle spare parts"],
        },
        {
          icon: "clock",
          title: "Turnaround",
          lines: ["Initial quote within 24 hours", "Fast planning for wholesale supply"],
        },
        {
          icon: "mail",
          title: "Export Support",
          lines: ["Use the form to send your request", "Support for distributors and importers"],
        },
        {
          icon: "phone",
          title: "Markets",
          lines: ["Middle East • Africa", "Europe • Asia"],
        },
      ],
      labels: {
        name: "Full Name *",
        email: "E-mail *",
        phone: "Phone",
        subject: "Subject *",
        message: "Message *",
        submit: "Send Message",
        consent:
          'I declare that I have read the <a href="/politikalar?tab=kvkk" class="underline underline-offset-2">PDPL Clarification Text</a> and the <a href="/politikalar?tab=privacy" class="underline underline-offset-2">Privacy Policy</a> regarding the processing of my personal data and that I expressly consent to being contacted about my request.',
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
      kicker: "BRAC Original Factory Promotional Film",
      headingMain: "Watch Our",
      headingHighlight: "Promotional Film",
      imageAlt: "BRAC Factory Promotional Film",
      videoTitle: "BRAC Original Promotional Film",
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
      contactTitle: "Need a quote for this product?",
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
      pageTitle: "Corporate | BRAC - Heavy Vehicle Spare Parts",
      metaDescription:
        "The success story of BRAC since 1968, our board of directors and quality certifications.",
      metaKeywords:
        "brac corporate, air brake systems, heavy vehicle spare parts, ISO 9001, IATF 16949",
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
        "BRAC has been one of Turkiye's leading brands in air brake systems and automotive spare parts manufacturing since 1968.",
        "We manufacture with more than 1,500 employees and over 600 CNC machines in our 105,000 m² indoor production area in Konya.",
        "Customer focus, confidentiality and security, business ethics and corporate responsibility are at the core of how we work.",
      ],
      milestones: [
        { year: "1968", text: "BRAC Automotive was founded under the name Yildiz Injector and Washer Seals" },
        { year: "1985", text: "Exports started" },
        { year: "2000", text: "ISO 9001 certification obtained" },
        { year: "2007", text: "BRAC ORIGINAL brand launched" },
        { year: "2015", text: "New Konya facility opened" },
        { year: "2018", text: "Entered Turkiye's top 1000 exporter and manufacturer companies list" },
        { year: "2021", text: "Warehouse and showroom opened in Istanbul, joined Turquality Program" },
        { year: "2022", text: "Bursa R&D and rubber factory commissioned" },
        { year: "2024", text: "1 millionth compressor produced" },
        { year: "2025", text: "Company name changed to BRAC Automotive Industry and Trade Inc." },
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
      pageTitle: "Career | BRAC Automotive Job Opportunities",
      metaDescription:
        "Shape your career at BRAC Automotive. Explore open positions and join our team.",
      metaKeywords: "brac career, automotive jobs, Konya jobs, Bursa jobs",
      heroLabel: "Human Resources",
      heroHeadingMain: "Career",
      heroHeadingHighlight: "Opportunities",
      heroDescription:
        "Develop your career at BRAC Automotive. Become part of a dynamic team and shape the future of the industry.",
      benefitsTitle: "Why Work at BRAC?",
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
        "Send your CV and be informed about future opportunities. We are looking for talented professionals at BRAC Automotive.",
      ctaButtonText: "Send CV",
    },
  },

  "pages.policies": {
    title: "Policies & Terms",
    content: "Legal policy content",
    metadata: {
      pageTitle: "Legal Policies | BRAC Spare Parts",
      metaDescription:
        "Review BRAC Spare Parts Privacy Policy, PDPL Clarification Text and Cookie Policy for website, quote requests and commercial communication processes.",
      metaKeywords:
        "privacy policy, PDPL clarification text, cookie policy, personal data, quote form, BRAC Spare Parts",
      heroLabel: "Legal",
      heroHeadingMain: "Policies &",
      heroHeadingHighlight: "Terms",
      heroDescription:
        "Review the legal texts that govern quote requests, contact processes, personal data handling and cookie use on the BRAC Spare Parts website.",
      policies: [
        {
          id: "privacy",
          title: "Privacy Policy",
          content:
            "<h3>1. Scope and Purpose</h3><p>This Privacy Policy explains how BRAC Spare Parts processes personal data collected through its website, quote request forms, contact channels and business communication processes. Our goal is to provide transparent information regarding what data is collected, why it is processed and how it is protected.</p><h3>2. Data We May Collect</h3><ul><li>Identity and contact information such as name, surname, company name, phone number and e-mail address</li><li>Request and transaction data such as subject lines, quote details, OEM codes, product information and message content</li><li>Technical usage data such as IP address, browser information, approximate device data and limited analytics information</li></ul><h3>3. Purposes of Processing</h3><p>Your personal data may be processed to respond to quote requests, communicate about products or supply solutions, improve service quality, maintain website security and fulfill legal or operational obligations.</p><h3>4. Legal Basis</h3><p>Data processing may rely on the necessity to perform pre-contractual processes, the legitimate interests of our company, compliance with legal obligations or your explicit consent where required.</p><h3>5. Data Transfers</h3><p>Your data may be shared, to the extent necessary, with hosting, infrastructure, analytics, communication or legal support providers acting on our instructions and under confidentiality obligations. We do not sell personal data to third parties.</p><h3>6. Retention and Security</h3><p>We retain personal data only for as long as required for the processing purpose or legal retention periods. Reasonable technical and organizational safeguards are implemented to protect personal data against unauthorized access, disclosure, loss or misuse.</p><h3>7. Your Rights</h3><p>You may contact us to request information regarding your personal data, ask for correction of inaccurate information, object to certain processing activities or request deletion where legally permissible.</p>",
        },
        {
          id: "kvkk",
          title: "PDPL Clarification Text",
          content:
            "<h3>1. Data Controller</h3><p>Within the scope of website and commercial communication activities, BRAC Spare Parts acts as the data controller for the personal data collected through the website, quote forms and direct communication channels.</p><h3>2. Categories of Personal Data</h3><p>The categories of personal data that may be processed include identity information, contact data, company data, request content, quote details and limited website usage data.</p><h3>3. Purposes of Processing</h3><ul><li>Evaluating quote and product requests</li><li>Contacting relevant persons regarding supply planning, sales and export operations</li><li>Managing customer relationship and after-sales communication records</li><li>Improving website operation, security and service continuity</li><li>Fulfilling legal obligations and preserving evidential records where necessary</li></ul><h3>4. Collection Methods</h3><p>Personal data may be collected electronically through the website, quote forms, cookies subject to preference, e-mail correspondence, phone communication and operational records created during business interaction.</p><h3>5. Transfers and Storage</h3><p>Where required for the above purposes, personal data may be stored on secure infrastructure and shared with service providers or legally authorized institutions under a need-to-know basis.</p><h3>6. Rights of the Data Subject</h3><p>You may submit requests concerning access, correction, update or deletion of your personal data, as well as other rights provided by the applicable personal data protection legislation.</p>",
        },
        {
          id: "cookies",
          title: "Cookie Policy",
          content:
            "<h3>1. What Are Cookies?</h3><p>Cookies are small text files stored on your device to help websites work properly, remember preferences and measure service performance.</p><h3>2. Types of Cookies We Use</h3><ul><li><strong>Strictly Necessary Cookies:</strong> required for language preferences, security and core site functions</li><li><strong>Analytics Cookies:</strong> used only after consent to understand site performance and improve the user experience</li></ul><h3>3. Consent Management</h3><p>When you first visit the website, you are presented with a cookie notice. You may accept analytics cookies or continue with only strictly necessary cookies. Your choice is stored so it can be respected on future visits.</p><h3>4. Managing Cookies</h3><p>You can change your browser settings to block or delete cookies. However, disabling strictly necessary cookies may affect site functionality.</p><h3>5. Additional Information</h3><p>If you would like more information regarding our cookie practices or privacy commitments, please contact us through the communication channels published on this website.</p>",
        },
      ],
      contactTitle: "Do you have questions?",
      contactDescription:
        "If you need clarification regarding privacy, cookies or personal data processing, you may contact us through our website communication channels.",
      contactButtonText: "Contact Us",
      contactButtonHref: "/#iletisim-bilgileri",
    },
  },
};
