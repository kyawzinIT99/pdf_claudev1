import type { SectionDefinition, SectionKey } from "./sections";

export const publicLanguages = [
  { code: "en", label: "English" },
  { code: "my", label: "မြန်မာ", latin: "Burmese" },
  { code: "kar", label: "Karen" },
] as const;

export type PublicLanguage = (typeof publicLanguages)[number]["code"];

export const navLabels: Record<PublicLanguage, Record<string, string>> = {
  en: {
    "/": "Home",
    "/about": "About",
    "/our-work": "Our work",
    "/giving": "Giving",
    "/certificates": "Certificates",
    "/stories": "News & stories",
    "/events": "Events",
    "/gallery": "Gallery",
    "/approach": "Our approach",
    "/get-involved": "Get involved",
  },
  my: {
    "/": "ပင်မ",
    "/about": "အကြောင်း",
    "/our-work": "လုပ်ငန်း",
    "/giving": "လှူဒါန်းမှု",
    "/certificates": "လက်မှတ်များ",
    "/stories": "သတင်းများ",
    "/events": "ပွဲများ",
    "/gallery": "ဓာတ်ပုံများ",
    "/approach": "ချဉ်းကပ်ပုံ",
    "/get-involved": "ပါဝင်ရန်",
  },
  kar: {
    "/": "Home",
    "/about": "About",
    "/our-work": "Our work",
    "/giving": "Giving",
    "/certificates": "Certificates",
    "/stories": "News & stories",
    "/events": "Events",
    "/gallery": "Gallery",
    "/approach": "Our approach",
    "/get-involved": "Get involved",
  },
};

export function navLabel(language: PublicLanguage, href: string, fallback: string) {
  return navLabels[language][href] || fallback;
}

export type HomeUiCopy = {
  announcement: string;
  eyebrow: string;
  title: string;
  intro: string;
  helpTitle: string;
  helpIntro: string;
  routes: [string, string, string, string];
  routeNotes: [string, string, string, string];
  latestStories: string;
  choosePath: string;
  getInvolved: string;
  note: string;
  photoCaption: string;
  years: string;
  pages: string;
  workflows: string;
  languages: string;
  dispatch: string;
  storiesHeading: string;
  continueStories: string;
  read: string;
  banner: string;
  index: string;
  mandate: string;
  triadTitle: string;
  triad: [{ title: string; body: string; link: string }, { title: string; body: string; link: string }, { title: string; body: string; link: string }];
  takePart: string;
  takePartTitle: string;
  telegramTraining: string;
  footerTag: string;
  footerNote: string;
};

export const homeUi: Record<PublicLanguage, HomeUiCopy> = {
  en: {
    announcement: "Civilian humanitarian action for people affected by the coup",
    eyebrow: "Dignity • Solidarity • Care",
    title: "Stand with people. Rebuild with care.",
    intro:
      "PDF is a community relief platform for civilians in and from Myanmar. We publish verified stories, transparent giving, events and practical pathways.",
    helpTitle: "How can you take part?",
    helpIntro: "Choose a path. Every public page is updated by authorised administrators.",
    routes: ["Follow verified updates", "Support relief work", "Join an event", "Volunteer or partner"],
    routeNotes: [
      "Read approved news and stories published by the editorial team.",
      "See published appeal figures and how giving is accounted for.",
      "Community gatherings, briefings and solidarity events from the calendar.",
      "Ask privately how you can help with care, translation, logistics or advocacy.",
    ],
    latestStories: "Latest stories",
    choosePath: "Choose a path",
    getInvolved: "Get involved",
    note: "Independent civilian humanitarian organisation. Not a government or armed group.",
    photoCaption: "Photograph published from the Admin Panel",
    years: "Years of civilian solidarity",
    pages: "Pages editors can update",
    workflows: "n8n workflows connected",
    languages: "Languages on this site",
    dispatch: "Dispatch",
    storiesHeading: "Stories from the community",
    continueStories: "Continue in News & stories",
    read: "Read",
    banner: "People first. No rumour. Care that can be shown.",
    index: "Index",
    mandate: "Mandate",
    triadTitle: "Relief. Record. Connection.",
    triad: [
      { title: "Civilian relief", body: "Practical help shaped with trusted community partners.", link: "Our work" },
      { title: "Public record", body: "Stories and figures appear only after administrator review.", link: "News & stories" },
      { title: "Gathering", body: "Events and galleries keep people connected across distance.", link: "Events" },
    ],
    takePart: "Take part",
    takePartTitle: "Bring time, language and local knowledge.",
    telegramTraining: "Open Telegram training",
    footerTag: "Civilian humanitarian community",
    footerNote: "Independent civilian organisation · Admin-published · Accountable",
  },
  my: {
    announcement: "အာဏာသိမ်းမှုကြောင့် ထိခိုက်သော ပြည်သူများအတွက် အရပ်သား ကယ်ဆယ်ရေး",
    eyebrow: "ဂုဏ်သိက္ခာ • စည်းလုံးမှု • စောင့်ရှောက်မှု",
    title: "လူထုနှင့်အတူ ရပ်တည်သည်။ ဂရုစိုက်မှုဖြင့် ပြန်လည်တည်ဆောက်သည်။",
    intro:
      "PDF သည် မြန်မာပြည်သူများအတွက် အရပ်သား လူသားချင်းစာနာမှု ပလက်ဖောင်းဖြစ်သည်။ အတည်ပြုထားသော သတင်းများ၊ ပွင့်လင်းသော လှူဒါန်းမှု၊ ပွဲများနှင့် လက်တွေ့ လမ်းကြောင်းများကို ထုတ်ပြန်သည်။",
    helpTitle: "မည်သို့ ပါဝင်နိုင်သနည်း။",
    helpIntro: "လမ်းကြောင်း ရွေးပါ။ အများပြည်သူ စာမျက်နှာတိုင်းကို ခွင့်ပြုထားသော စီမံခန့်ခွဲသူများက ပြင်ဆင်သည်။",
    routes: ["အတည်ပြုထားသော သတင်းများ", "ကူညီထောက်ပံ့ရန်", "ပွဲတက်ရန်", "စေတနာ့ဝန်ထမ်း"],
    routeNotes: [
      "အယ်ဒီတာအဖွဲ့က ထုတ်ပြန်သော အတည်ပြု သတင်းနှင့် ဇာတ်လမ်းများကို ဖတ်ပါ။",
      "ထုတ်ပြန်ထားသော အကူအညီ ပမာဏနှင့် လှူဒါန်းမှု မှတ်တမ်းကို ကြည့်ပါ။",
      "ပြက္ခဒိန်မှ လူထု စုဝေးပွဲ၊ ရှင်းလင်းပွဲနှင့် စည်းလုံးရေး ပွဲများ။",
      "စောင့်ရှောက်မှု၊ ဘာသာပြန်၊ ထောက်ပံ့ပို့ဆောင်မှု သို့မဟုတ် ထောက်ခံရေးတွင် မည်သို့ ကူညီနိုင်သည်ကို သီးသန့် မေးမြန်းပါ။",
    ],
    latestStories: "နောက်ဆုံး သတင်းများ",
    choosePath: "လမ်းကြောင်း ရွေးရန်",
    getInvolved: "ပါဝင်ရန်",
    note: "လွတ်လပ်သော အရပ်သား လူသားချင်းစာနာမှု အဖွဲ့။ အစိုးရ သို့မဟုတ် လက်နက်ကိုင် အဖွဲ့ မဟုတ်ပါ။",
    photoCaption: "စီမံခန့်ခွဲမှု ဘောင်မှ ထုတ်ပြန်သော ဓာတ်ပုံ",
    years: "အရပ်သား စည်းလုံးမှု နှစ်များ",
    pages: "အယ်ဒီတာများ ပြင်နိုင်သော စာမျက်နှာများ",
    workflows: "ချိတ်ဆက်ထားသော n8n လုပ်ငန်းစဉ်များ",
    languages: "ဤဆိုက်ရှိ ဘာသာစကားများ",
    dispatch: "သတင်းပို့ချက်",
    storiesHeading: "လူထုထဲက ဇာတ်လမ်းများ",
    continueStories: "သတင်းများတွင် ဆက်ဖတ်ရန်",
    read: "ဖတ်ရန်",
    banner: "လူကို ဦးစားပေးသည်။ ကောလဟလ မဟုတ်။ ပြသနိုင်သော စောင့်ရှောက်မှု။",
    index: "အညွှန်း",
    mandate: "တာဝန်",
    triadTitle: "ကယ်ဆယ်ရေး။ မှတ်တမ်း။ ဆက်သွယ်မှု။",
    triad: [
      { title: "အရပ်သား ကယ်ဆယ်ရေး", body: "ယုံကြည်ရသော လူထု မိတ်ဖက်များနှင့် ပုံဖော်သော လက်တွေ့ အကူအညီ။", link: "လုပ်ငန်း" },
      { title: "အများပြည်သူ မှတ်တမ်း", body: "ဇာတ်လမ်းနှင့် ကိန်းဂဏန်းများကို စီမံခန့်ခွဲသူ စစ်ဆေးပြီးမှသာ ပြသည်။", link: "သတင်းများ" },
      { title: "စုဝေးမှု", body: "ပွဲများနှင့် ဓာတ်ပုံများက အဝေးမှ လူများကို ဆက်သွယ်ပေးသည်။", link: "ပွဲများ" },
    ],
    takePart: "ပါဝင်ရန်",
    takePartTitle: "အချိန်၊ ဘာသာစကားနှင့် ဒေသဆိုင်ရာ အသိပညာ ယူလာပါ။",
    telegramTraining: "တယ်လီဂရမ် သင်တန်း ဖွင့်ရန်",
    footerTag: "အရပ်သား လူသားချင်းစာနာမှု အသိုင်းအဝိုင်း",
    footerNote: "လွတ်လပ်သော အရပ်သား အဖွဲ့ · စီမံခန့်ခွဲသူ ထုတ်ပြန် · တာဝန်ယူမှု",
  },
  kar: {
    announcement: "Civilian humanitarian action for people affected by the coup",
    eyebrow: "Dignity • Solidarity • Care",
    title: "Stand with people. Rebuild with care.",
    intro:
      "PDF publishes verified community relief updates for civilians affected by the coup.",
    helpTitle: "How can you take part?",
    helpIntro: "Choose a path. Every public page is updated by authorised administrators.",
    routes: ["Follow verified updates", "Support relief work", "Join an event", "Volunteer or partner"],
    routeNotes: [
      "Read approved news and stories published by the editorial team.",
      "See published appeal figures and how giving is accounted for.",
      "Community gatherings, briefings and solidarity events from the calendar.",
      "Ask privately how you can help with care, translation, logistics or advocacy.",
    ],
    latestStories: "Latest stories",
    choosePath: "Choose a path",
    getInvolved: "Get involved",
    note: "Independent civilian humanitarian organisation. Not a government or armed group.",
    photoCaption: "Photograph published from the Admin Panel",
    years: "Years of civilian solidarity",
    pages: "Pages editors can update",
    workflows: "n8n workflows connected",
    languages: "Languages on this site",
    dispatch: "Dispatch",
    storiesHeading: "Stories from the community",
    continueStories: "Continue in News & stories",
    read: "Read",
    banner: "People first. No rumour. Care that can be shown.",
    index: "Index",
    mandate: "Mandate",
    triadTitle: "Relief. Record. Connection.",
    triad: [
      { title: "Civilian relief", body: "Practical help shaped with trusted community partners.", link: "Our work" },
      { title: "Public record", body: "Stories and figures appear only after administrator review.", link: "News & stories" },
      { title: "Gathering", body: "Events and galleries keep people connected across distance.", link: "Events" },
    ],
    takePart: "Take part",
    takePartTitle: "Bring time, language and local knowledge.",
    telegramTraining: "Open Telegram training",
    footerTag: "Civilian humanitarian community",
    footerNote: "Independent civilian organisation · Admin-published · Accountable",
  },
};

type SectionLocale = Pick<SectionDefinition, "label" | "eyebrow" | "title" | "summary" | "statement" | "features">;

export const sectionLocales: Record<PublicLanguage, Record<SectionKey, SectionLocale>> = {
  en: {
    about: {
      label: "About",
      eyebrow: "Who we are",
      title: "We care for people, and we do not accept the coup.",
      summary:
        "PDF is a civilian humanitarian community standing with people across Myanmar since the military seized power on 1 February 2021. We deliver practical care to families the coup has displaced, injured and impoverished — and we say plainly that military rule has no legitimacy. We are unarmed, we take no part in combat, and we answer to the communities we serve.",
      statement: "Care for people. Refuse the coup. Show the record.",
      features: [
        { number: "01", title: "People before politics", description: "Relief reaches civilians on need alone — never on ethnicity, faith, region or affiliation." },
        { number: "02", title: "Against the coup", description: "We are openly anti-coup: we document what military rule has cost civilians and we refuse to normalise it." },
        { number: "03", title: "Nothing hidden", description: "Every figure, photograph and appeal is published only after review, so our record can be checked." },
      ],
    },
    "our-work": {
      label: "Our work",
      eyebrow: "Relief in motion",
      title: "Care for civilians. Clarity for supporters.",
      summary:
        "Our work covers humanitarian relief, community gatherings, learning, and transparent reporting — not combat. Administrators choose what the public sees.",
      statement: "Help that is named. Help that is followed up.",
      features: [
        { number: "01", title: "Civilian relief", description: "Coordinating practical support with trusted community partners." },
        { number: "02", title: "Public storytelling", description: "Photographs and recaps published with consent and context." },
        { number: "03", title: "Emergency care", description: "Verified appeals and transparent follow-up when communities face urgent need." },
      ],
    },
    stories: {
      label: "News & stories",
      eyebrow: "Current updates",
      title: "News, photographs and community stories.",
      summary:
        "This feed changes when editors publish. Announcements, activity photographs and recaps appear only after administrator approval.",
      statement: "Current updates live here. Our Work explains what we do.",
      features: [
        { number: "01", title: "Community updates", description: "Approved news from activities and conversations." },
        { number: "02", title: "Shared stories", description: "Photographs and reflections published with consent." },
        { number: "03", title: "Notices and recaps", description: "Clear information that helps people understand recent activity." },
      ],
    },
    approach: {
      label: "Our approach",
      eyebrow: "How we serve",
      title: "Civilian-led. Carefully shared. Accountable.",
      summary:
        "We listen to community members, work with trusted partners, protect dignity and consent, and communicate activities clearly.",
      statement: "Welcome people. Respect every story. Serve together.",
      features: [
        { number: "01", title: "Listen and welcome", description: "Make space for families, young people and elders to participate with respect." },
        { number: "02", title: "Serve together", description: "Coordinate volunteers and partners through clear roles." },
        { number: "03", title: "Share responsibly", description: "Publish photos and stories only with context, consent and review." },
      ],
    },
    "get-involved": {
      label: "Get involved",
      eyebrow: "Take part",
      title: "Bring your time, knowledge and care.",
      summary:
        "Ask how you can help with relief, translation, events or responsible partnership. Inquiries stay private until staff follow up.",
      statement: "Reliable information first. Human support when it is needed.",
      features: [
        { number: "01", title: "Volunteer", description: "Offer skills in care, logistics, media or community hosting." },
        { number: "02", title: "Ask privately", description: "Send a confidential enquiry through this website." },
        { number: "03", title: "Support responsibly", description: "Discuss giving or partnership without sending payment details in the form." },
      ],
    },
    giving: {
      label: "Giving",
      eyebrow: "Community support",
      title: "Transparent giving. Shared responsibility.",
      summary:
        "See published appeal figures and yearly totals updated by authorised administrators. Support is welcomed through trusted community channels.",
      statement: "Care given with clarity. Trust kept with open reporting.",
      features: [
        { number: "01", title: "Transparency", description: "Donation amounts and totals shown here are controlled in the Admin Panel." },
        { number: "02", title: "Stewardship", description: "Funds and appeals are handled with committee oversight and clear purpose." },
        { number: "03", title: "Community care", description: "Giving supports civilian relief, gatherings and practical help." },
      ],
    },
    certificates: {
      label: "Certificates",
      eyebrow: "Recognition",
      title: "Certificates and formal recognition.",
      summary:
        "A public gallery of certificates and recognitions published by authorised administrators for community trust and shared history.",
      statement: "Service remembered. Trust made visible.",
      features: [
        { number: "01", title: "Published by Admin", description: "Only approved certificates appear on this page." },
        { number: "02", title: "Community trust", description: "Formal recognition helps supporters see accountable service." },
        { number: "03", title: "Living record", description: "New certificates can be added anytime from the Admin Panel." },
      ],
    },
  },
  my: {
    about: {
      label: "အကြောင်း",
      eyebrow: "ကျွန်ုပ်တို့ ဘယ်သူလဲ",
      title: "ပြည်သူကို စောင့်ရှောက်သည်၊ စစ်အာဏာသိမ်းမှုကို လက်မခံပါ။",
      summary:
        "PDF သည် ၂၀၂၁ ခုနှစ် ဖေဖော်ဝါရီ ၁ ရက်တွင် စစ်တပ်က အာဏာသိမ်းယူပြီးနောက် မြန်မာနိုင်ငံတစ်ဝှမ်းရှိ ပြည်သူများနှင့်အတူ ရပ်တည်နေသော အရပ်သား လူသားချင်းစာနာမှု အသိုက်အဝန်း ဖြစ်သည်။ အာဏာသိမ်းမှုကြောင့် နေရပ်စွန့်ခွာရသူ၊ ဒဏ်ရာရသူနှင့် ဆင်းရဲမွဲတေသွားသော မိသားစုများအတွက် လက်တွေ့ အထောက်အပံ့ ပေးအပ်ပြီး၊ စစ်အုပ်ချုပ်မှုတွင် တရားဝင်မှု မရှိကြောင်း ပွင့်လင်းစွာ ပြောဆိုသည်။ ကျွန်ုပ်တို့သည် လက်နက်မကိုင်ပါ၊ တိုက်ပွဲများတွင် မပါဝင်ပါ။",
      statement: "ပြည်သူကို စောင့်ရှောက်ပါ။ အာဏာသိမ်းမှုကို ငြင်းဆိုပါ။ မှတ်တမ်းကို ပြပါ။",
      features: [
        { number: "01", title: "ပါတီနိုင်ငံရေးထက် ပြည်သူ", description: "ကယ်ဆယ်ရေးသည် လိုအပ်ချက်အပေါ်သာ အခြေခံသည် — လူမျိုး၊ ဘာသာ၊ ဒေသ သို့မဟုတ် နောက်ခံအဖွဲ့အစည်းအပေါ် အခြေမခံပါ။" },
        { number: "02", title: "အာဏာသိမ်းမှုကို ဆန့်ကျင်သည်", description: "စစ်အုပ်ချုပ်မှုက အရပ်သားများအား နစ်နာစေခဲ့သည်များကို မှတ်တမ်းတင်ပြီး ၎င်းကို ပုံမှန်အဖြစ် လက်မခံပါ။" },
        { number: "03", title: "ဖုံးကွယ်မှု မရှိ", description: "ကိန်းဂဏန်း၊ ဓာတ်ပုံနှင့် အလှူခံစာတိုင်းကို စစ်ဆေးပြီးမှသာ ထုတ်ပြန်သဖြင့် ကျွန်ုပ်တို့၏ မှတ်တမ်းကို စစ်ဆေးနိုင်သည်။" },
      ],
    },
    "our-work": {
      label: "လုပ်ငန်း",
      eyebrow: "လှုပ်ရှားနေသော ကယ်ဆယ်ရေး",
      title: "အရပ်သားများအတွက် စောင့်ရှောက်မှု။ ထောက်ခံသူများအတွက် ရှင်းလင်းမှု။",
      summary:
        "ကျွန်ုပ်တို့၏ လုပ်ငန်းသည် လူသားချင်းစာနာမှု ကယ်ဆယ်ရေး၊ လူထု စုဝေးပွဲ၊ သင်ယူမှုနှင့် ပွင့်လင်းသော အစီရင်ခံခြင်း ဖြစ်သည် — တိုက်ပွဲ မဟုတ်ပါ။ အများပြည်သူ မြင်ရသည်ကို စီမံခန့်ခွဲသူများက ရွေးချယ်သည်။",
      statement: "အမည်တပ်ထားသော အကူအညီ။ ဆက်လက် စောင့်ကြည့်သော အကူအညီ။",
      features: [
        { number: "01", title: "အရပ်သား ကယ်ဆယ်ရေး", description: "ယုံကြည်ရသော လူထု မိတ်ဖက်များနှင့် လက်တွေ့ အထောက်အပံ့ကို ညှိနှိုင်းသည်။" },
        { number: "02", title: "အများပြည်သူ ဇာတ်လမ်း", description: "သဘောတူညီချက်နှင့် အကြောင်းအရာနှင့်အတူ ဓာတ်ပုံနှင့် အကျဉ်းချုပ်များကို ထုတ်ပြန်သည်။" },
        { number: "03", title: "အရေးပေါ် စောင့်ရှောက်မှု", description: "လူထု အရေးပေါ် လိုအပ်သည့်အခါ အတည်ပြု တောင်းခံမှုနှင့် ပွင့်လင်းသော နောက်ဆက်တွဲ။" },
      ],
    },
    stories: {
      label: "သတင်းများ",
      eyebrow: "လက်ရှိ အပ်ဒိတ်များ",
      title: "သတင်း၊ ဓာတ်ပုံနှင့် လူထု ဇာတ်လမ်းများ။",
      summary:
        "အယ်ဒီတာများ ထုတ်ပြန်သည့်အခါ ဤစာမျက်နှာ ပြောင်းသည်။ ကြေညာချက်၊ လှုပ်ရှားမှု ဓာတ်ပုံနှင့် အကျဉ်းချုပ်များကို စီမံခန့်ခွဲသူ အတည်ပြုပြီးမှသာ ပြသည်။",
      statement: "လက်ရှိ အပ်ဒိတ်များ ဤနေရာတွင် ရှိသည်။ လုပ်ငန်းက ကျွန်ုပ်တို့ လုပ်သည်ကို ရှင်းပြသည်။",
      features: [
        { number: "01", title: "လူထု အပ်ဒိတ်များ", description: "လှုပ်ရှားမှုနှင့် စကားဝိုင်းများမှ အတည်ပြု သတင်း။" },
        { number: "02", title: "မျှဝေသော ဇာတ်လမ်းများ", description: "သဘောတူညီချက်ဖြင့် ထုတ်ပြန်သော ဓာတ်ပုံနှင့် မှတ်ချက်များ။" },
        { number: "03", title: "ကြေညာချက်နှင့် အကျဉ်းချုပ်", description: "လတ်တလော လှုပ်ရှားမှုကို နားလည်စေသော ရှင်းလင်းသော အချက်အလက်။" },
      ],
    },
    approach: {
      label: "ချဉ်းကပ်ပုံ",
      eyebrow: "မည်သို့ အမှုထမ်းသနည်း",
      title: "အရပ်သား ဦးဆောင်။ သတိထား မျှဝေ။ တာဝန်ယူမှု။",
      summary:
        "လူထု အဖွဲ့ဝင်များကို နားထောင်သည်၊ ယုံကြည်ရသော မိတ်ဖက်များနှင့် အလုပ်လုပ်သည်၊ ဂုဏ်သိက္ခာနှင့် သဘောတူညီချက်ကို ကာကွယ်သည်၊ လှုပ်ရှားမှုများကို ရှင်းလင်းစွာ ဆက်သွယ်သည်။",
      statement: "လူများကို ကြိုဆိုပါ။ ဇာတ်လမ်းတိုင်းကို လေးစားပါ။ အတူတကွ အမှုထမ်းပါ။",
      features: [
        { number: "01", title: "နားထောင်ပြီး ကြိုဆိုသည်", description: "မိသားစု၊ လူငယ်နှင့် သက်ကြီးရွယ်အိုများ လေးစားစွာ ပါဝင်နိုင်ရန် နေရာပေးသည်။" },
        { number: "02", title: "အတူတကွ အမှုထမ်းသည်", description: "စေတနာ့ဝန်ထမ်းနှင့် မိတ်ဖက်များကို ရှင်းလင်းသော တာဝန်များဖြင့် ညှိနှိုင်းသည်။" },
        { number: "03", title: "တာဝန်ယူစွာ မျှဝေသည်", description: "အကြောင်းအရာ၊ သဘောတူညီချက်နှင့် စစ်ဆေးမှုဖြင့်သာ ဓာတ်ပုံနှင့် ဇာတ်လမ်း ထုတ်ပြန်သည်။" },
      ],
    },
    "get-involved": {
      label: "ပါဝင်ရန်",
      eyebrow: "ပါဝင်ပါ",
      title: "သင့်အချိန်၊ အသိပညာနှင့် စောင့်ရှောက်မှု ယူလာပါ။",
      summary:
        "ကယ်ဆယ်ရေး၊ ဘာသာပြန်၊ ပွဲများ သို့မဟုတ် တာဝန်ယူသော မိတ်ဖက်မှုတွင် မည်သို့ ကူညီနိုင်သည်ကို မေးပါ။ ဝန်ထမ်းများ ပြန်လည် ဆက်သွယ်သည်အထိ စုံစမ်းမှုများ သီးသန့် ရှိသည်။",
      statement: "ယုံကြည်ရသော အချက်အလက် အရင်။ လိုအပ်သည့်အခါ လူသားဆန်သော အထောက်အပံ့။",
      features: [
        { number: "01", title: "စေတနာ့ဝန်ထမ်း", description: "စောင့်ရှောက်မှု၊ ထောက်ပံ့ပို့ဆောင်မှု၊ မီဒီယာ သို့မဟုတ် လူထု လက်ခံကျင်းပမှု ကျွမ်းကျင်မှု ပေးပါ။" },
        { number: "02", title: "သီးသန့် မေးမြန်းရန်", description: "ဤဝက်ဘ်ဆိုက်မှတစ်ဆင့် လျှို့ဝှက် စုံစမ်းမှု ပို့ပါ။" },
        { number: "03", title: "တာဝန်ယူစွာ ထောက်ပံ့ရန်", description: "ဖောင်တွင် ငွေပေးချေမှု အသေးစိတ် မထည့်ဘဲ လှူဒါန်းမှု သို့မဟုတ် မိတ်ဖက်မှုကို ဆွေးနွေးပါ။" },
      ],
    },
    giving: {
      label: "လှူဒါန်းမှု",
      eyebrow: "လူထု အထောက်အပံ့",
      title: "ပွင့်လင်းသော လှူဒါန်းမှု။ မျှဝေသော တာဝန်။",
      summary:
        "ခွင့်ပြုထားသော စီမံခန့်ခွဲသူများက ပြင်ဆင်သော တောင်းခံ ပမာဏနှင့် နှစ်စဉ် စုစုပေါင်းကို ကြည့်ပါ။ ယုံကြည်ရသော လူထု လမ်းကြောင်းများမှ ထောက်ပံ့မှုကို ကြိုဆိုသည်။",
      statement: "ရှင်းလင်းစွာ ပေးသော စောင့်ရှောက်မှု။ ပွင့်လင်းသော အစီရင်ခံမှုဖြင့် ထိန်းသိမ်းသော ယုံကြည်မှု။",
      features: [
        { number: "01", title: "ပွင့်လင်းမှု", description: "ဤနေရာတွင် ပြသော လှူဒါန်း ပမာဏနှင့် စုစုပေါင်းများကို စီမံခန့်ခွဲမှု ဘောင်က ထိန်းချုပ်သည်။" },
        { number: "02", title: "ထိန်းသိမ်းမှု", description: "ရန်ပုံငွေနှင့် တောင်းခံမှုများကို ကော်မတီ ကြီးကြပ်မှုနှင့် ရှင်းလင်းသော ရည်ရွယ်ချက်ဖြင့် ကိုင်တွယ်သည်။" },
        { number: "03", title: "လူထု စောင့်ရှောက်မှု", description: "လှူဒါန်းမှုက အရပ်သား ကယ်ဆယ်ရေး၊ စုဝေးပွဲနှင့် လက်တွေ့ အကူအညီကို ထောက်ပံ့သည်။" },
      ],
    },
    certificates: {
      label: "လက်မှတ်များ",
      eyebrow: "အသိအမှတ်ပြုမှု",
      title: "လက်မှတ်များနှင့် တရားဝင် အသိအမှတ်ပြုမှု။",
      summary:
        "လူထု ယုံကြည်မှုနှင့် မျှဝေသော သမိုင်းအတွက် ခွင့်ပြုထားသော စီမံခန့်ခွဲသူများက ထုတ်ပြန်သော လက်မှတ်နှင့် အသိအမှတ်ပြုမှု ပြခန်း။",
      statement: "အမှုထမ်းမှုကို သတိရသည်။ ယုံကြည်မှုကို မြင်သာအောင် ပြသည်။",
      features: [
        { number: "01", title: "စီမံခန့်ခွဲသူ ထုတ်ပြန်", description: "အတည်ပြုထားသော လက်မှတ်များသာ ဤစာမျက်နှာတွင် ပေါ်သည်။" },
        { number: "02", title: "လူထု ယုံကြည်မှု", description: "တရားဝင် အသိအမှတ်ပြုမှုက ထောက်ခံသူများအား တာဝန်ယူသော အမှုထမ်းမှုကို မြင်စေသည်။" },
        { number: "03", title: "အသက်ရှင်သော မှတ်တမ်း", description: "စီမံခန့်ခွဲမှု ဘောင်မှ လက်မှတ်အသစ်များကို အချိန်မရွေး ထည့်နိုင်သည်။" },
      ],
    },
  },
  kar: {
    about: {
      label: "About",
      eyebrow: "Who we are",
      title: "We care for people, and we do not accept the coup.",
      summary:
        "PDF is a civilian humanitarian community standing with people across Myanmar since the military seized power on 1 February 2021. We deliver practical care to families the coup has displaced, injured and impoverished — and we say plainly that military rule has no legitimacy. We are unarmed, we take no part in combat, and we answer to the communities we serve.",
      statement: "Care for people. Refuse the coup. Show the record.",
      features: [
        { number: "01", title: "People before politics", description: "Relief reaches civilians on need alone — never on ethnicity, faith, region or affiliation." },
        { number: "02", title: "Against the coup", description: "We are openly anti-coup: we document what military rule has cost civilians and we refuse to normalise it." },
        { number: "03", title: "Nothing hidden", description: "Every figure, photograph and appeal is published only after review, so our record can be checked." },
      ],
    },
    "our-work": {
      label: "Our work",
      eyebrow: "Relief in motion",
      title: "Care for civilians. Clarity for supporters.",
      summary:
        "Our work covers humanitarian relief, community gatherings, learning, and transparent reporting — not combat. Administrators choose what the public sees.",
      statement: "Help that is named. Help that is followed up.",
      features: [
        { number: "01", title: "Civilian relief", description: "Coordinating practical support with trusted community partners." },
        { number: "02", title: "Public storytelling", description: "Photographs and recaps published with consent and context." },
        { number: "03", title: "Emergency care", description: "Verified appeals and transparent follow-up when communities face urgent need." },
      ],
    },
    stories: {
      label: "News & stories",
      eyebrow: "Current updates",
      title: "News, photographs and community stories.",
      summary:
        "This feed changes when editors publish. Announcements, activity photographs and recaps appear only after administrator approval.",
      statement: "Current updates live here. Our Work explains what we do.",
      features: [
        { number: "01", title: "Community updates", description: "Approved news from activities and conversations." },
        { number: "02", title: "Shared stories", description: "Photographs and reflections published with consent." },
        { number: "03", title: "Notices and recaps", description: "Clear information that helps people understand recent activity." },
      ],
    },
    approach: {
      label: "Our approach",
      eyebrow: "How we serve",
      title: "Civilian-led. Carefully shared. Accountable.",
      summary:
        "We listen to community members, work with trusted partners, protect dignity and consent, and communicate activities clearly.",
      statement: "Welcome people. Respect every story. Serve together.",
      features: [
        { number: "01", title: "Listen and welcome", description: "Make space for families, young people and elders to participate with respect." },
        { number: "02", title: "Serve together", description: "Coordinate volunteers and partners through clear roles." },
        { number: "03", title: "Share responsibly", description: "Publish photos and stories only with context, consent and review." },
      ],
    },
    "get-involved": {
      label: "Get involved",
      eyebrow: "Take part",
      title: "Bring your time, knowledge and care.",
      summary:
        "Ask how you can help with relief, translation, events or responsible partnership. Inquiries stay private until staff follow up.",
      statement: "Reliable information first. Human support when it is needed.",
      features: [
        { number: "01", title: "Volunteer", description: "Offer skills in care, logistics, media or community hosting." },
        { number: "02", title: "Ask privately", description: "Send a confidential enquiry through this website." },
        { number: "03", title: "Support responsibly", description: "Discuss giving or partnership without sending payment details in the form." },
      ],
    },
    giving: {
      label: "Giving",
      eyebrow: "Community support",
      title: "Transparent giving. Shared responsibility.",
      summary:
        "See published appeal figures and yearly totals updated by authorised administrators. Support is welcomed through trusted community channels.",
      statement: "Care given with clarity. Trust kept with open reporting.",
      features: [
        { number: "01", title: "Transparency", description: "Donation amounts and totals shown here are controlled in the Admin Panel." },
        { number: "02", title: "Stewardship", description: "Funds and appeals are handled with committee oversight and clear purpose." },
        { number: "03", title: "Community care", description: "Giving supports civilian relief, gatherings and practical help." },
      ],
    },
    certificates: {
      label: "Certificates",
      eyebrow: "Recognition",
      title: "Certificates and formal recognition.",
      summary:
        "A public gallery of certificates and recognitions published by authorised administrators for community trust and shared history.",
      statement: "Service remembered. Trust made visible.",
      features: [
        { number: "01", title: "Published by Admin", description: "Only approved certificates appear on this page." },
        { number: "02", title: "Community trust", description: "Formal recognition helps supporters see accountable service." },
        { number: "03", title: "Living record", description: "New certificates can be added anytime from the Admin Panel." },
      ],
    },
  },
};

export const aboutUi = {
  en: {
    photoCaption: "Community photo · PDF Myanmar Relief",
    workCaption: "Civilian care, culture and community in public view",
    formed: "Formed",
    incorporated: "Incorporated",
    registered: "Registered name",
    abn: "ABN",
    committeeNote:
      "Meet the people entrusted with serving the community. For privacy, personal contact details are not published.",
    committeeEyebrow: "People who serve",
    committeeTitle: "Public contacts.",
    updated: "Updated",
    leadership: "Community leadership",
    contactEyebrow: "Contact the community",
    contactTitle: "One private starting point.",
    contactBody:
      "Send your enquiry through the secure community form. An authorised administrator can direct it to the appropriate committee member.",
    contactCta: "Contact the community",
    contactSmall: "Messages are recorded privately for responsible follow-up.",
    historyEyebrow: "Why this platform exists",
    historyTitle: "A public home for civilian relief and solidarity.",
    historyBody:
      "After Myanmar’s military coup, communities inside the country and in the diaspora needed a trustworthy place to publish care, not rumour. PDF is a civilian humanitarian website: administrators edit pages, stories, giving figures, events and galleries, and the public site shows only what they approve.\n\nThis platform keeps the same staff Admin Panel, publishing APIs and n8n automations as the shared community template, with a distinct public design for PDF.\n\nReplace this history, legal name, contacts and committee list in Admin → page settings. Nothing here is a live payment or combat channel.",
    focusEyebrow: "What we hold",
    focusTitle: "Dignity, verified updates and practical care.",
    focuses: [
      { title: "Civilian relief", description: "Practical support coordinated with trusted community partners." },
      { title: "Public record", description: "Stories, certificates and figures published with consent and review." },
      { title: "Community gatherings", description: "Events and galleries that keep people connected across distance." },
    ],
    givingEyebrow: "Published figures",
    givingTitle: "Donation amount and yearly total",
    howToGive: "How to give",
    givingCta: "Contact through Get Involved",
    certEyebrow: "Public record",
    certTitle: "Certificates",
    certEmpty: "Approved certificates will appear here after administrators publish them.",
    coming: "COMING INTO VIEW",
    storiesBoundaryEyebrow: "A clear content boundary",
    storiesBoundaryTitle: "This is the changing news and stories feed.",
    storiesBoundaryBody:
      "Recent photographs, announcements and recaps appear here after administrator review. The permanent explanation of the organisation's service remains on Our Work.",
    readWork: "Read about Our Work",
    alsoOnSite: "Also on this site",
    eventsAlbumsTitle: "Events and photo albums stay with their stories.",
    eventsAlbumsBody:
      "Administrators publish events and gallery albums from the same editorial workflow. What you see here is what the Admin Panel approved.",
    openCalendar: "Open the events calendar",
    galleryNote: "Gallery photos are attached to published posts only.",
    lookingActivity: "Looking for current activity?",
    workVsNews: "Our Work explains what we do. News & Stories shows what is happening now.",
    workVsNewsBody:
      "Recent photographs, announcements and community updates belong in one clear feed, separate from this permanent overview of culture and community care.",
    viewNews: "View News & Stories",
    facebook: "Visit the official Facebook group",
    telegramTraining: "Open Telegram training",
    recentUpdates: "Recent approved updates",
    newsFeed: "News & Stories feed",
    emptyUpdates: "Approved public updates for this section will appear here.",
    footer: "Civilian humanitarian action with a clear public purpose.",
  },
  my: {
    photoCaption: "လူထု ဓာတ်ပုံ · PDF မြန်မာ ကယ်ဆယ်ရေး",
    workCaption: "အများပြည်သူ မြင်ကွင်းတွင် အရပ်သား စောင့်ရှောက်မှု၊ ယဉ်ကျေးမှုနှင့် လူထု",
    formed: "ဖွဲ့စည်းခဲ့သည်",
    incorporated: "မှတ်ပုံတင်ခဲ့သည်",
    registered: "မှတ်ပုံတင် အမည်",
    abn: "ABN",
    committeeNote:
      "လူထုကို အမှုထမ်းရန် တာဝန်ပေးထားသော လူများကို တွေ့ပါ။ ကိုယ်ရေး အချက်အလက်များကို ကိုယ်ရေးလုံခြုံမှုအတွက် ထုတ်ပြန်မထားပါ။",
    committeeEyebrow: "အမှုထမ်းသော လူများ",
    committeeTitle: "အများပြည်သူ ဆက်သွယ်ရန်။",
    updated: "ပြင်ဆင်သည့်နေ့",
    leadership: "လူထု ဦးဆောင်မှု",
    contactEyebrow: "လူထုသို့ ဆက်သွယ်ရန်",
    contactTitle: "သီးသန့် စတင်ရာ တစ်ခုတည်း။",
    contactBody:
      "လုံခြုံသော လူထု ဖောင်မှတစ်ဆင့် စုံစမ်းမှု ပို့ပါ။ ခွင့်ပြုထားသော စီမံခန့်ခွဲသူက သင့်လျော်သော ကော်မတီဝင်ထံ လမ်းညွှန်နိုင်သည်။",
    contactCta: "လူထုသို့ ဆက်သွယ်ရန်",
    contactSmall: "တာဝန်ယူသော နောက်ဆက်တွဲအတွက် စာများကို သီးသန့် မှတ်တမ်းတင်သည်။",
    historyEyebrow: "ဤပလက်ဖောင်း ရှိရခြင်း အကြောင်း",
    historyTitle: "အရပ်သား ကယ်ဆယ်ရေးနှင့် စည်းလုံးမှုအတွက် အများပြည်သူ အိမ်။",
    historyBody:
      "မြန်မာ စစ်အာဏာသိမ်းပြီးနောက် ပြည်တွင်းနှင့် ပြည်ပရောက် လူထုများသည် ကောလဟလ မဟုတ်ဘဲ စောင့်ရှောက်မှုကို ထုတ်ပြန်နိုင်သော ယုံကြည်ရသည့် နေရာ လိုအပ်ခဲ့သည်။ PDF သည် အရပ်သား လူသားချင်းစာနာမှု ဝက်ဘ်ဆိုက်ဖြစ်သည်။ စီမံခန့်ခွဲသူများက စာမျက်နှာ၊ ဇာတ်လမ်း၊ လှူဒါန်းမှု ကိန်းဂဏန်း၊ ပွဲနှင့် ဓာတ်ပုံများကို ပြင်ဆင်ပြီး အများပြည်သူဆိုက်က အတည်ပြုထားသည်ကိုသာ ပြသည်။\n\nဤပလက်ဖောင်းသည် ဝန်ထမ်း စီမံခန့်ခွဲမှု ဘောင်၊ ထုတ်ပြန်ရေး API နှင့် n8n အလိုအလျောက် စနစ်များကို ထိန်းသိမ်းထားပြီး PDF အတွက် သီးခြား အများပြည်သူ ဒီဇိုင်း ရှိသည်။\n\nဤသမိုင်း၊ တရားဝင် အမည်၊ ဆက်သွယ်ရန်နှင့် ကော်မတီ စာရင်းကို Admin → page settings တွင် အစားထိုးပါ။ ဤနေရာသည် တိုက်ရိုက် ငွေပေးချေမှု သို့မဟုတ် တိုက်ပွဲ လမ်းကြောင်း မဟုတ်ပါ။",
    focusEyebrow: "ကျွန်ုပ်တို့ ထိန်းသိမ်းသည်များ",
    focusTitle: "ဂုဏ်သိက္ခာ၊ အတည်ပြု အပ်ဒိတ်များနှင့် လက်တွေ့ စောင့်ရှောက်မှု။",
    focuses: [
      { title: "အရပ်သား ကယ်ဆယ်ရေး", description: "ယုံကြည်ရသော လူထု မိတ်ဖက်များနှင့် ညှိနှိုင်းသော လက်တွေ့ အထောက်အပံ့။" },
      { title: "အများပြည်သူ မှတ်တမ်း", description: "သဘောတူညီချက်နှင့် စစ်ဆေးမှုဖြင့် ထုတ်ပြန်သော ဇာတ်လမ်း၊ လက်မှတ်နှင့် ကိန်းဂဏန်းများ။" },
      { title: "လူထု စုဝေးပွဲများ", description: "အဝေးမှ လူများကို ဆက်သွယ်ပေးသော ပွဲများနှင့် ဓာတ်ပုံများ။" },
    ],
    givingEyebrow: "ထုတ်ပြန်ထားသော ကိန်းဂဏန်းများ",
    givingTitle: "လှူဒါန်း ပမာဏနှင့် နှစ်စဉ် စုစုပေါင်း",
    howToGive: "မည်သို့ လှူမည်နည်း",
    givingCta: "ပါဝင်ရန်မှ ဆက်သွယ်ပါ",
    certEyebrow: "အများပြည်သူ မှတ်တမ်း",
    certTitle: "လက်မှတ်များ",
    certEmpty: "စီမံခန့်ခွဲသူများ ထုတ်ပြန်ပြီးနောက် အတည်ပြု လက်မှတ်များ ဤနေရာတွင် ပေါ်မည်။",
    coming: "မကြာမီ မြင်ရမည်",
    storiesBoundaryEyebrow: "ရှင်းလင်းသော အကြောင်းအရာ နယ်နိမိတ်",
    storiesBoundaryTitle: "ဤသည်မှာ ပြောင်းလဲနေသော သတင်းနှင့် ဇာတ်လမ်း ဖိဒ် ဖြစ်သည်။",
    storiesBoundaryBody:
      "လတ်တလော ဓာတ်ပုံ၊ ကြေညာချက်နှင့် အကျဉ်းချုပ်များကို စီမံခန့်ခွဲသူ စစ်ဆေးပြီးနောက် ဤနေရာတွင် ပြသည်။ အဖွဲ့၏ အမြဲတမ်း ရှင်းလင်းချက်မှာ လုပ်ငန်း စာမျက်နှာတွင် ရှိသည်။",
    readWork: "လုပ်ငန်းအကြောင်း ဖတ်ရန်",
    alsoOnSite: "ဤဆိုက်တွင်လည်း",
    eventsAlbumsTitle: "ပွဲများနှင့် ဓာတ်ပုံ အယ်လ်ဘမ်များသည် ၎င်းတို့၏ ဇာတ်လမ်းနှင့်အတူ ရှိသည်။",
    eventsAlbumsBody:
      "စီမံခန့်ခွဲသူများက တူညီသော အယ်ဒီတာ လုပ်ငန်းစဉ်မှ ပွဲများနှင့် ဓာတ်ပုံ အယ်လ်ဘမ်များကို ထုတ်ပြန်သည်။ ဤနေရာတွင် မြင်ရသည်မှာ စီမံခန့်ခွဲမှု ဘောင်က အတည်ပြုထားသည်။",
    openCalendar: "ပွဲ ပြက္ခဒိန် ဖွင့်ရန်",
    galleryNote: "ဓာတ်ပုံများကို ထုတ်ပြန်ထားသော ပို့စ်များနှင့်သာ တွဲထားသည်။",
    lookingActivity: "လက်ရှိ လှုပ်ရှားမှု ရှာနေပါသလား။",
    workVsNews: "လုပ်ငန်းက ကျွန်ုပ်တို့ လုပ်သည်ကို ရှင်းပြသည်။ သတင်းများက ယခု ဖြစ်ပျက်နေသည်ကို ပြသည်။",
    workVsNewsBody:
      "လတ်တလော ဓာတ်ပုံ၊ ကြေညာချက်နှင့် လူထု အပ်ဒိတ်များသည် ယဉ်ကျေးမှုနှင့် လူထု စောင့်ရှောက်မှု၏ အမြဲတမ်း အကျဉ်းချုပ်နှင့် သီးခြား ရှင်းလင်းသော ဖိဒ်တွင် ရှိသည်။",
    viewNews: "သတင်းများ ကြည့်ရန်",
    facebook: "တရားဝင် ဖေ့စ်ဘုတ် အဖွဲ့သို့ သွားရန်",
    telegramTraining: "တယ်လီဂရမ် သင်တန်း ဖွင့်ရန်",
    recentUpdates: "လတ်တလော အတည်ပြု အပ်ဒိတ်များ",
    newsFeed: "သတင်းနှင့် ဇာတ်လမ်း ဖိဒ်",
    emptyUpdates: "ဤအပိုင်းအတွက် အတည်ပြု အများပြည်သူ အပ်ဒိတ်များ ဤနေရာတွင် ပေါ်မည်။",
    footer: "ရှင်းလင်းသော အများပြည်သူ ရည်ရွယ်ချက်ရှိသော အရပ်သား လူသားချင်းစာနာမှု လုပ်ငန်း။",
  },
} as const;

export const eventsUi = {
  en: {
    eyebrow: "Community calendar",
    title: "Upcoming Events",
    subtitle: "Gatherings, relief briefings, youth circles and learning sessions — published from the Admin Panel.",
    upcoming: "Upcoming",
    past: "Past Events",
    all: "All",
    recurring: "Recurring",
    emptyPast: "No past events to show.",
    emptyUpcoming: "No upcoming events scheduled. Check back soon!",
    ctaTitle: "Want to organise an event?",
    ctaBody: "Community leaders can submit events through the admin panel. Reach out to get started.",
    contact: "Contact Us",
    liveNow: "Live now",
    watchFacebook: "Watch on Facebook (same stream)",
    watchTiktok: "Watch on TikTok (same stream)",
    watchYouTube: "Watch on YouTube (same stream)",
    liveNote: "The stream plays here and on Facebook, TikTok or YouTube at the same time. Giving is not taken on this page.",
    categories: {
      mass: "Gathering",
      cultural: "Culture",
      service: "Relief",
      youth: "Youth",
      learning: "Learning",
    },
  },
  my: {
    eyebrow: "လူထု ပြက္ခဒိန်",
    title: "လာမည့် ပွဲများ",
    subtitle: "စုဝေးပွဲ၊ ကယ်ဆယ်ရေး ရှင်းလင်းပွဲ၊ လူငယ် စက်ဝိုင်းနှင့် သင်ယူမှု အစည်းအဝေးများ — စီမံခန့်ခွဲမှု ဘောင်မှ ထုတ်ပြန်သည်။",
    upcoming: "လာမည့်",
    past: "ပြီးခဲ့သော ပွဲများ",
    all: "အားလုံး",
    recurring: "ပုံမှန်",
    emptyPast: "ပြသရန် ပြီးခဲ့သော ပွဲ မရှိပါ။",
    emptyUpcoming: "လာမည့် ပွဲ မရှိသေးပါ။ နောက်မှ ပြန်ကြည့်ပါ။",
    ctaTitle: "ပွဲ စီစဉ်လိုပါသလား။",
    ctaBody: "လူထု ခေါင်းဆောင်များသည် စီမံခန့်ခွဲမှု ဘောင်မှ ပွဲများ တင်နိုင်သည်။ စတင်ရန် ဆက်သွယ်ပါ။",
    contact: "ဆက်သွယ်ရန်",
    liveNow: "ယခု တိုက်ရိုက်",
    watchFacebook: "ဖေ့စ်ဘုတ်တွင် ကြည့်ရန် (တူညီသော စတရီးမ်)",
    watchTiktok: "တစ်တော့တွင် ကြည့်ရန် (တူညီသော စတရီးမ်)",
    watchYouTube: "ယူကျုတွင် ကြည့်ရန် (တူညီသော စတရီးမ်)",
    liveNote: "ဤစတရီးမ်ကို ဤဆိုက်နှင့် ဖေ့စ်ဘုတ်၊ တစ်တော့ သို့မဟုတ် ယူကျုတွင် တစ်ပြိုင်နက် ကြည့်နိုင်သည်။ ဤစာမျက်နှာတွင် လှူဒါန်းမှု မကောက်ပါ။",
    categories: {
      mass: "စုဝေးပွဲ",
      cultural: "ယဉ်ကျေးမှု",
      service: "ကယ်ဆယ်ရေး",
      youth: "လူငယ်",
      learning: "သင်ယူမှု",
    },
  },
} as const;

export const galleryUi = {
  en: {
    eyebrow: "Community gallery",
    title: "Moments that matter",
    subtitle: "Each card is one approved story album. Photos stay with their context — only what Admin published.",
    all: "All albums",
    albums: "albums",
    album: "album",
    photos: "photos",
    empty: "No photos yet. Publish a story with photos in the admin panel to see albums here.",
    ctaTitle: "Have photos to share?",
    ctaBody: "Community members can submit photos through our admin panel. Contact your community leader to contribute.",
    cta: "Get Involved",
  },
  my: {
    eyebrow: "လူထု ဓာတ်ပုံပြခန်း",
    title: "အရေးပါသော အခိုက်အတန့်များ",
    subtitle: "ကတ်တစ်ခုစီသည် အတည်ပြုထားသော ဇာတ်လမ်း အယ်လ်ဘမ် တစ်ခု ဖြစ်သည်။ ဓာတ်ပုံများသည် ၎င်းတို့၏ အကြောင်းအရာနှင့်အတူ ရှိသည် — စီမံခန့်ခွဲသူ ထုတ်ပြန်သည်ကိုသာ။",
    all: "အယ်လ်ဘမ်အားလုံး",
    albums: "အယ်လ်ဘမ်",
    album: "အယ်လ်ဘမ်",
    photos: "ဓာတ်ပုံ",
    empty: "ဓာတ်ပုံ မရှိသေးပါ။ စီမံခန့်ခွဲမှု ဘောင်တွင် ဓာတ်ပုံပါ ဇာတ်လမ်း ထုတ်ပြန်ပါ။",
    ctaTitle: "မျှဝေရန် ဓာတ်ပုံ ရှိပါသလား။",
    ctaBody: "လူထု အဖွဲ့ဝင်များသည် စီမံခန့်ခွဲမှု ဘောင်မှ ဓာတ်ပုံ တင်နိုင်သည်။ ပါဝင်ရန် လူထု ခေါင်းဆောင်ကို ဆက်သွယ်ပါ။",
    cta: "ပါဝင်ရန်",
  },
} as const;

export function localizeSection(
  language: PublicLanguage,
  sectionKey: SectionKey,
  pageCopy: SectionDefinition,
): SectionDefinition {
  const locale = sectionLocales[language][sectionKey];
  if (language === "en") return pageCopy;
  return { ...pageCopy, ...locale };
}
