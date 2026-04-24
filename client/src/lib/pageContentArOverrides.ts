import type { PageContentOverride } from "@/lib/pageContentEnOverrides";

export const AR_PAGE_CONTENT_OVERRIDES: Record<string, PageContentOverride> = {
  "layout.navbar": {
    title: "شريط التنقل",
    content: "إعدادات الشريط العلوي والتنقل والبحث",
    metadata: {
      lightModeTitle: "الوضع الفاتح",
      darkModeTitle: "الوضع الداكن",
      searchPlaceholderAr: "ابحث برقم OEM أو باسم المنتج...",
      navItems: [
        { labelTr: "Hakkımızda", labelEn: "About", labelAr: "من نحن", href: "/#hakkimizda" },
        {
          labelTr: "Ürünler",
          labelEn: "Products",
          labelAr: "المنتجات",
          href: "/#urunler",
          children: [
            {
              labelTr: "Fren Sistemleri",
              labelEn: "Brake Systems",
              labelAr: "أنظمة الفرامل",
              href: "/#urunler",
            },
            {
              labelTr: "Süspansiyon ve Şasi",
              labelEn: "Suspension & Chassis",
              labelAr: "التعليق والشاسيه",
              href: "/#urunler",
            },
            {
              labelTr: "Motor Parçaları",
              labelEn: "Engine Parts",
              labelAr: "قطع المحرك",
              href: "/#urunler",
            },
            {
              labelTr: "Hava Sistemleri",
              labelEn: "Air Systems",
              labelAr: "أنظمة الهواء",
              href: "/#urunler",
            },
            {
              labelTr: "Elektrik Bileşenleri",
              labelEn: "Electrical Components",
              labelAr: "المكونات الكهربائية",
              href: "/#urunler",
            },
          ],
        },
        {
          labelTr: "Neden BRAC",
          labelEn: "Why BRAC",
          labelAr: "لماذا BRAC",
          href: "/#neden-brac",
        },
        {
          labelTr: "Global Ağ",
          labelEn: "Global Reach",
          labelAr: "الانتشار العالمي",
          href: "/#global",
        },
        {
          labelTr: "Teklif",
          labelEn: "Quote",
          labelAr: "طلب عرض سعر",
          href: "/#teklif",
        },
        {
          labelTr: "İletişim",
          labelEn: "Contact",
          labelAr: "اتصل بنا",
          href: "/#iletisim-bilgileri",
        },
      ],
    },
  },
  "layout.footer": {
    title: "التذييل",
    content: "روابط سريعة ومعلومات العلامة التجارية",
    metadata: {
      sectionProductsTitle: "المنتجات",
      sectionCorporateTitle: "روابط سريعة",
      sectionContactTitle: "تواصل",
      brandDescription:
        "مورد عالمي من دبي لقطع غيار المركبات الثقيلة بخبرة تتجاوز 45 عاماً وشبكة توريد موثوقة.",
      productLinks: [
        { label: "أنظمة الفرامل", href: "/#urunler" },
        { label: "التعليق والشاسيه", href: "/#urunler" },
        { label: "قطع المحرك", href: "/#urunler" },
        { label: "أنظمة الهواء", href: "/#urunler" },
        { label: "المكونات الكهربائية", href: "/#urunler" },
      ],
      corporateLinks: [
        { label: "من نحن", href: "/#hakkimizda" },
        { label: "لماذا BRAC", href: "/#neden-brac" },
        { label: "الانتشار العالمي", href: "/#global" },
        { label: "اطلب عرض سعر", href: "/#iletisim" },
      ],
      addressLines: ["دبي، الإمارات العربية المتحدة", "مركز تصدير عالمي لقطع غيار المركبات الثقيلة"],
      newsletterTitle: "",
      newsletterPlaceholder: "",
      newsletterButton: "",
      copyrightText: "© BRAC Spare Parts 2026. جميع الحقوق محفوظة.",
      policyLinks: [
        { label: "سياسة الخصوصية", href: "/politikalar?tab=privacy" },
        { label: "بيان توضيح حماية البيانات", href: "/politikalar?tab=kvkk" },
        { label: "سياسة ملفات تعريف الارتباط", href: "/politikalar?tab=cookies" },
      ],
    },
  },
  "home.hero": {
    title: "الشريط الرئيسي",
    content: "رسائل البانر الرئيسية",
    metadata: {
      secondaryCtaText: "من نحن",
      slides: [
        {
          id: 1,
          tag: "توريد عالمي",
          title: "مورد عالمي لقطع غيار",
          subtitle: "المركبات الثقيلة",
          description: "خبرة تزيد عن 45 عاماً | تصدير من دبي إلى أكثر من 40 دولة",
          cta: "اطلب عرض سعر",
        },
        {
          id: 2,
          tag: "علامات عالمية",
          title: "توفير معتمد",
          subtitle: "لأفضل العلامات",
          description: "ZF WABCO • KNORR BREMSE • HALDEX • PROVIA وغيرها",
          cta: "استعرض المنتجات",
        },
        {
          id: 3,
          tag: "توريد موثوق",
          title: "توقف عن إضاعة الوقت",
          subtitle: "مع موردين غير موثوقين",
          description: "توريد ثابت وجودة عالية وتسليم سريع",
          cta: "تواصل معنا",
        },
        {
          id: 4,
          tag: "جملة تنافسية",
          title: "زد أرباحك",
          subtitle: "بأسعار الجملة",
          description: "حلول مخصصة للموزعين والمستوردين ومشغلي الأساطيل",
          cta: "كن شريكاً",
        },
      ],
    },
  },
  "home.products": {
    title: "المنتجات",
    content: "حلول قطع الغيار",
    metadata: {
      label: "المنتجات",
      heading: "حلول قطع غيار عالمية",
      viewAllText: "استعرض جميع المنتجات",
    },
  },
  "home.about": {
    title: "من نحن",
    content: "منطقة التعريف بالشركة",
    metadata: {
      label: "من نحن",
      headingMain: "أكثر من 45 عاماً",
      headingHighlight: "من الخبرة",
      paragraph1:
        "شركة BRAC Spare Parts هي شركة مقرها دبي متخصصة في تصدير قطع غيار المركبات الثقيلة بخبرة تزيد عن 45 عاماً.",
      paragraph2:
        "نخدم أسواق الشرق الأوسط وأفريقيا وأوروبا وآسيا من خلال شبكة توريد قوية ونوفر علامات عالمية مثل ZF WABCO وPROVIA وKNORR BREMSE وHALDEX.",
      milestones: [
        { year: "45+", text: "عاماً من الخبرة المتخصصة في القطاع" },
        { year: "دبي", text: "مركز تصدير عالمي يخدم الأسواق الدولية" },
        { year: "4", text: "مناطق رئيسية: الشرق الأوسط وأفريقيا وأوروبا وآسيا" },
        { year: "5+", text: "علامات موثوقة ضمن محفظة التوريد" },
      ],
      ctaText: "اطلب عرض سعر",
      imageAlt: "BRAC Spare Parts",
      quickStats: [
        { value: "45+", label: "سنة خبرة" },
        { value: "40+", label: "دولة" },
        { value: "4", label: "مناطق رئيسية" },
        { value: "24h", label: "سرعة الرد" },
      ],
    },
  },
  "home.stats": {
    title: "لماذا BRAC",
    content: "أسباب اختيارنا",
    metadata: {
      label: "لماذا BRAC",
      heading: "توريد عالمي يمكن الاعتماد عليه",
      stats: [
        { value: 45, suffix: "+", label: "سنة خبرة", description: "معرفة عميقة بالسوق واحتياجاته" },
        { value: 40, suffix: "+", label: "دولة", description: "تصدير من دبي إلى أسواق متعددة" },
        { value: 24, suffix: "h", label: "سرعة الرد", description: "عرض سعر أولي خلال 24 ساعة" },
        { value: 5, suffix: "+", label: "علامات أساسية", description: "علامات عالمية موثوقة" },
        { value: 4, suffix: "", label: "مناطق رئيسية", description: "الشرق الأوسط وأفريقيا وأوروبا وآسيا" },
        { value: 1, suffix: "", label: "مركز عالمي", description: "قاعدة تشغيلية وتصديرية في دبي" },
      ],
    },
  },
  "home.global": {
    title: "الانتشار العالمي",
    content: "الأسواق والمناطق",
    metadata: {
      label: "الانتشار العالمي",
      headingMain: "من دبي إلى",
      headingHighlight: "الأسواق العالمية",
      description: "نخدم الشرق الأوسط وأفريقيا وأوروبا وآسيا من خلال شبكة توريد قوية وتسليم موثوق.",
      mapAlt: "خريطة الانتشار العالمي",
      stats: [
        {
          icon: "mapPin",
          value: "4",
          label: "مناطق رئيسية",
          description: "الشرق الأوسط وأفريقيا وأوروبا وآسيا",
        },
        {
          icon: "globe",
          value: "40+",
          label: "دولة",
          description: "تغطية تصديرية مستمرة من دبي",
        },
        {
          icon: "languages",
          value: "3",
          label: "لغات الموقع",
          description: "التركية والإنجليزية والعربية",
        },
        {
          icon: "users",
          value: "B2B",
          label: "العملاء",
          description: "للموزعين والمستوردين ومشغلي الأساطيل",
        },
        {
          icon: "trendingUp",
          value: "24h",
          label: "الاستجابة",
          description: "استجابة سريعة لطلبات التسعير والتوريد",
        },
      ],
    },
  },
  "home.contact": {
    title: "اتصل بنا",
    content: "التواصل وطلب العرض",
    metadata: {
      label: "طلب عرض سعر",
      heading: "احصل على عرض سعر خلال 24 ساعة",
      successMessage: "تم تسجيل طلبك. سنعود إليك في أقرب وقت ممكن.",
      whatsappText: "واتساب",
      whatsappUrl: "https://wa.me/905344456070",
      contactInfo: [
        {
          icon: "mapPin",
          title: "المقر",
          lines: ["دبي، الإمارات العربية المتحدة", "مركز تصدير عالمي"],
        },
        {
          icon: "clock",
          title: "سرعة الرد",
          lines: ["عرض سعر أولي خلال 24 ساعة", "متابعة سريعة لطلبات الجملة"],
        },
        {
          icon: "mail",
          title: "دعم التصدير",
          lines: ["استخدم النموذج لإرسال الطلب", "دعم للموزعين والمستوردين"],
        },
        {
          icon: "phone",
          title: "الأسواق",
          lines: ["الشرق الأوسط • أفريقيا", "أوروبا • آسيا"],
        },
      ],
      labels: {
        name: "الاسم *",
        email: "البريد الإلكتروني *",
        phone: "الهاتف",
        subject: "الموضوع *",
        message: "الرسالة *",
        submit: "إرسال الطلب",
        consent:
          'أقر بأنني قرأت <a href="/politikalar?tab=kvkk" class="underline underline-offset-2">بيان توضيح حماية البيانات</a> و<a href="/politikalar?tab=privacy" class="underline underline-offset-2">سياسة الخصوصية</a> المتعلقة بمعالجة بياناتي الشخصية، وأوافق صراحة على التواصل معي بخصوص طلبي.',
      },
      placeholders: {
        name: "اسمك الكامل",
        email: "بريدك الإلكتروني",
        phone: "رقم الهاتف",
        subject: "موضوع الرسالة",
        message: "اكتب طلبك هنا...",
      },
    },
  },
  "pages.productDetail": {
    title: "تفاصيل المنتج",
    content: "تسميات صفحة المنتج",
    metadata: {
      notFoundTitle: "المنتج غير موجود",
      notFoundDescription: "المنتج الذي تبحث عنه غير متاح حالياً.",
      backToHomeText: "العودة إلى الرئيسية",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "المنتجات",
      featuresTitle: "المزايا",
      downloadCatalogText: "تحميل الكتالوج",
      shareText: "مشاركة",
      contactTitle: "هل تحتاج إلى عرض سعر لهذا المنتج؟",
      specsTitle: "المواصفات",
      oemCodesTitle: "أكواد OEM",
      applicationsTitle: "الاستخدامات",
      certificationsTitle: "الاعتمادات",
      relatedProductsTitle: "منتجات ذات صلة",
      catalogDownloadToast: "بدأ تنزيل الكتالوج.",
      linkCopiedToast: "تم نسخ الرابط.",
    },
  },
  "pages.searchResults": {
    title: "نتائج البحث",
    content: "تسميات صفحة البحث",
    metadata: {
      breadcrumbHome: "الرئيسية",
      breadcrumbCurrent: "نتائج البحث",
      pageTitle: "نتائج البحث",
      queryResultPrefix: "للبحث \"{query}\" تم العثور على",
      queryResultSuffix: "منتج",
      noResultsTitle: "لا توجد نتائج",
      noResultsPrefix: "لم يتم العثور على منتجات مطابقة لـ \"{query}\". يمكنك",
      noResultsCtaInline: "استعراض كل المنتجات",
      noResultsSuffix: ".",
      noResultsBackHome: "العودة للرئيسية",
      filtersTitle: "الفلاتر",
      categoryTitle: "الفئة",
      allCategoriesText: "الكل",
      sortTitle: "الترتيب",
      sortRelevance: "الأكثر صلة",
      sortName: "الاسم (أ-ي)",
      oemMatchLabel: "تطابق OEM:",
      oemCodesLabel: "أكواد OEM:",
      moreSuffix: "أخرى",
      detailLinkText: "عرض التفاصيل",
    },
  },
  "pages.policies": {
    title: "السياسات والشروط",
    content: "محتوى السياسات القانونية",
    metadata: {
      pageTitle: "السياسات القانونية | BRAC Spare Parts",
      metaDescription:
        "اطلع على سياسة الخصوصية وبيان توضيح حماية البيانات وسياسة ملفات تعريف الارتباط الخاصة بموقع BRAC Spare Parts.",
      metaKeywords:
        "سياسة الخصوصية، حماية البيانات، ملفات تعريف الارتباط، البيانات الشخصية، نموذج عرض السعر",
      heroLabel: "قانوني",
      heroHeadingMain: "السياسات",
      heroHeadingHighlight: "والشروط",
      heroDescription:
        "توضح هذه الصفحة القواعد القانونية المعتمدة عند استخدام موقع BRAC Spare Parts، وإرسال طلبات التسعير، والتواصل التجاري، ومعالجة البيانات الشخصية.",
      policies: [
        {
          id: "privacy",
          title: "سياسة الخصوصية",
          content:
            "<h3>1. النطاق والغرض</h3><p>توضح هذه السياسة كيفية قيام BRAC Spare Parts بمعالجة البيانات الشخصية التي يتم جمعها من خلال الموقع الإلكتروني ونماذج طلب عرض السعر وقنوات التواصل المختلفة. هدفنا هو تقديم معلومات واضحة وشفافة حول البيانات التي يتم جمعها وأسباب معالجتها وطرق حمايتها.</p><h3>2. البيانات التي قد نجمعها</h3><ul><li>بيانات الهوية والتواصل مثل الاسم واللقب واسم الشركة والهاتف والبريد الإلكتروني</li><li>بيانات الطلبات والمعاملات مثل محتوى الرسائل وتفاصيل عرض السعر وأكواد OEM وبيانات المنتجات</li><li>بيانات تقنية محدودة مثل عنوان IP ونوع المتصفح وبعض بيانات الاستخدام لأغراض الأداء والأمان</li></ul><h3>3. أغراض المعالجة</h3><p>قد تتم معالجة البيانات للرد على طلبات عروض الأسعار، والتواصل بخصوص المنتجات وحلول التوريد، وتحسين جودة الخدمة، وضمان أمن الموقع، والوفاء بالالتزامات القانونية والتشغيلية.</p><h3>4. الأساس القانوني</h3><p>قد تستند المعالجة إلى ضرورة تنفيذ خطوات ما قبل التعاقد، أو المصالح المشروعة للشركة، أو الالتزامات القانونية، أو موافقتك الصريحة عند الحاجة.</p><h3>5. نقل البيانات</h3><p>قد تتم مشاركة البيانات، بالقدر اللازم فقط، مع مزودي خدمات الاستضافة والبنية التحتية والتحليلات والتواصل أو الدعم القانوني العاملين بتعليماتنا وتحت التزامات السرية. نحن لا نبيع البيانات الشخصية لأطراف ثالثة.</p><h3>6. مدة الاحتفاظ والأمان</h3><p>نحتفظ بالبيانات الشخصية فقط بالمدة اللازمة لتحقيق غرض المعالجة أو وفق فترات الاحتفاظ القانونية. كما نطبق تدابير تقنية وتنظيمية معقولة للحماية من الوصول غير المصرح به أو الفقدان أو سوء الاستخدام.</p><h3>7. حقوق صاحب البيانات</h3><p>يمكنك التواصل معنا لطلب معلومات عن بياناتك الشخصية، أو تصحيح البيانات غير الدقيقة، أو الاعتراض على بعض أنشطة المعالجة، أو طلب الحذف متى كان ذلك ممكناً قانوناً.</p>",
        },
        {
          id: "kvkk",
          title: "بيان توضيح حماية البيانات",
          content:
            "<h3>1. مسؤول البيانات</h3><p>في نطاق أنشطة الموقع الإلكتروني والتواصل التجاري، تعمل BRAC Spare Parts بصفتها مسؤول البيانات عن المعلومات الشخصية التي يتم جمعها من خلال الموقع ونماذج طلب عرض السعر وقنوات التواصل المباشر.</p><h3>2. فئات البيانات الشخصية</h3><p>قد تشمل البيانات التي تتم معالجتها معلومات الهوية، وبيانات الاتصال، وبيانات الشركة، ومحتوى الطلب، وتفاصيل عرض السعر، وبيانات الاستخدام المحدودة الخاصة بالموقع.</p><h3>3. أغراض المعالجة</h3><ul><li>تقييم طلبات عرض السعر والمنتجات</li><li>التواصل مع الأشخاص المعنيين بخصوص التخطيط للتوريد والمبيعات وعمليات التصدير</li><li>إدارة سجلات علاقات العملاء وما بعد البيع</li><li>تحسين تشغيل الموقع وأمنه واستمرارية الخدمة</li><li>الوفاء بالالتزامات القانونية والاحتفاظ بالسجلات اللازمة عند الضرورة</li></ul><h3>4. طرق الجمع</h3><p>قد يتم جمع البيانات إلكترونياً من خلال الموقع ونماذج الاتصال وملفات تعريف الارتباط بحسب التفضيل والبريد الإلكتروني والمكالمات الهاتفية والسجلات التشغيلية المرتبطة بالتعامل التجاري.</p><h3>5. التخزين والنقل</h3><p>عند الحاجة وللأغراض المذكورة أعلاه، قد تُخزن البيانات على بنية تحتية آمنة وقد يتم نقلها إلى مزودي الخدمة أو الجهات المخولة قانوناً ضمن حدود الحاجة.</p><h3>6. حقوق صاحب البيانات</h3><p>يمكنك التقدم بطلبات تتعلق بالوصول إلى بياناتك الشخصية أو تصحيحها أو تحديثها أو حذفها، بالإضافة إلى الحقوق الأخرى المنصوص عليها في التشريعات السارية لحماية البيانات الشخصية.</p>",
        },
        {
          id: "cookies",
          title: "سياسة ملفات تعريف الارتباط",
          content:
            "<h3>1. ما هي ملفات تعريف الارتباط؟</h3><p>ملفات تعريف الارتباط هي ملفات نصية صغيرة تُحفظ على جهازك لمساعدة المواقع الإلكترونية على العمل بشكل صحيح، وتذكر التفضيلات، وقياس الأداء.</p><h3>2. أنواع ملفات تعريف الارتباط المستخدمة</h3><ul><li><strong>ملفات ضرورية للغاية:</strong> لازمة لتفضيلات اللغة والأمان والوظائف الأساسية للموقع</li><li><strong>ملفات التحليلات:</strong> تُستخدم فقط بعد الموافقة لفهم أداء الموقع وتحسين تجربة الاستخدام</li></ul><h3>3. إدارة الموافقة</h3><p>عند زيارتك الأولى للموقع، يظهر إشعار بملفات تعريف الارتباط. يمكنك قبول ملفات التحليلات أو الاستمرار باستخدام الملفات الضرورية فقط، ويتم حفظ اختيارك لاحترامه في الزيارات اللاحقة.</p><h3>4. إدارة المتصفح</h3><p>يمكنك تغيير إعدادات المتصفح لحظر ملفات تعريف الارتباط أو حذفها، لكن تعطيل الملفات الضرورية قد يؤثر على عمل بعض أجزاء الموقع.</p><h3>5. معلومات إضافية</h3><p>إذا كنت ترغب في مزيد من المعلومات حول ملفات تعريف الارتباط أو التزامات الخصوصية لدينا، يمكنك التواصل معنا من خلال قنوات الاتصال المنشورة على الموقع.</p>",
        },
      ],
      contactTitle: "هل لديك أي استفسار؟",
      contactDescription:
        "إذا كنت بحاجة إلى توضيح بشأن الخصوصية أو ملفات تعريف الارتباط أو معالجة البيانات الشخصية، يمكنك التواصل معنا عبر قنوات الاتصال الموجودة في الموقع.",
      contactButtonText: "تواصل معنا",
      contactButtonHref: "/#iletisim-bilgileri",
    },
  },
};
