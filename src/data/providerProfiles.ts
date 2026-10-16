/**
 * What each provider publishes about itself, for its page on the site (the
 * owner, 16 October 2026: "yes, go over the information on the sites").
 *
 * Every fact here was read by hand from the provider's own domain on the day
 * in `checkedOn`, and carries the page it came from and the words it said
 * (`quote`, kept for checking; the page shows our summary and links the
 * source). A fact the provider does not publish is left out, and the page
 * says it is not stated — never filled in from what eSIM providers usually
 * do. No prices: those come from the feeds alone.
 */
export const profileFactKeys = [
  'refunds',
  'validityStart',
  'installation',
  'hotspot',
  'topUp',
  'support',
  'app',
  'phoneNumber',
  'company',
] as const;
export type ProfileFactKey = (typeof profileFactKeys)[number];

export type ProfileFact = {
  he: string;
  en: string;
  /** The provider's own pages it was read on, each with their words, verbatim. */
  sources: { url: string; quote: string }[];
};

export type ProviderProfile = {
  providerId: string;
  /** The day the pages were read, `YYYY-MM-DD`. */
  checkedOn: string;
  facts: Partial<Record<ProfileFactKey, ProfileFact>>;
};

export const providerProfiles: readonly ProviderProfile[] = [
  {
    providerId: "alosim",
    checkedOn: '2026-10-16',
    facts: {
      refunds: {
        he: "בדף ההחזרים של aloSIM כתוב שיש להם \"30-day refund guarantee\". לפי התנאים: אם ה־eSIM או החבילה עוד לא הופעלו, אפשר לבקש החזר מלא. אחרי שהחבילה הופעלה אפשר לבקש החזר על החלק שלא נוצל, ו־aloSIM יכולים לקבל, לדחות או להציע החזר חלקי.",
        en: "aloSIM's refund page offers a \"30-day refund guarantee\". Their terms: if the eSIM or the plan has not been activated, a full refund can be requested. Once the plan is active, a refund of the unused part can be requested, which aloSIM may accept, reject or reduce.",
        sources: [
          { url: "https://alosim.com/refund-policy/", quote: "30-day refund guarantee" },
          { url: "https://alosim.com/terms-of-service/", quote: "if you download but do not install and activate an eSIM or install and activate an eSIM but do not activate a related Plan, then you may request a full refund" },
          { url: "https://alosim.com/terms-of-service/", quote: "the Company may accept or reject such a request or may propose a modified refund" },
        ],
      },
      validityStart: {
        he: "החבילה מתחילה מעצמה כשה־eSIM מתחבר לרשת ביעד, לא בקנייה. ב־iPhone, התקנה כשכבר נמצאים ביעד יכולה להפעיל אותה מיד.",
        en: "The plan starts by itself when the eSIM connects to a network at the destination, not at purchase. On an iPhone, installing it once already there can start it straight away.",
        sources: [
          { url: "https://alosim.com/terms-of-service/", quote: "Each Standard Plans will automatically activate when a related eSIM installed in your Device receives a location update on a supported Third Party Network in the country for which you have purchased the related Standard Plan." },
          { url: "https://support.alosim.com/hc/en-us/articles/24042500617229-Can-I-install-my-eSIM-now-and-activate-it-later", quote: "your device may automatically activate your data package during the installation flow if it can reach a supported network." },
        ],
      },
      installation: {
        he: "שלוש דרכים: בלחיצה אחת מהאפליקציה, בסריקת קוד QR, או בהקלדה ידנית. אפשר לקנות ולהתקין גם דרך האתר, בלי האפליקציה.",
        en: "Three ways: one tap in the app, a QR code, or entering the details by hand. You can buy and install through the website too, without the app.",
        sources: [
          { url: "https://support.alosim.com/hc/en-us/articles/26582293995021-How-do-I-install-eSIM-on-my-iPhone-or-iPad", quote: "Automatic eSIM installation (fastest***) QR code eSIM installation Manual eSIM installation" },
          { url: "https://support.alosim.com/hc/en-us/articles/24051083741965-Can-I-buy-an-eSIM-without-using-an-app", quote: "No app required." },
        ],
      },
      hotspot: {
        he: "מותר, למכשירים שלכם ולמי שנוסע איתכם. לפי התנאים אסור לשתף עם מכשירים שפועלים קבוע במקום אחד, או עם אנשים מחוץ לקבוצת הטיול.",
        en: "Allowed, for your own devices and the people travelling with you. The terms forbid sharing with devices running permanently in one place, or with anyone outside your travelling party.",
        sources: [
          { url: "https://support.alosim.com/hc/en-us/articles/24049875531661-Can-I-set-up-a-mobile-hotspot-with-aloSIM", quote: "you can absolutely set up a hotspot with your aloSIM data." },
          { url: "https://alosim.com/terms-of-service/", quote: "you may share your Data with your own Devices and with Devices belonging to other members of your travelling party, whether by way of mobile hotspot or other reasonable and customary means" },
        ],
      },
      topUp: {
        he: "אפשר לקנות חבילה נוספת לאותו eSIM, כל עוד הוא מותקן בטלפון. החבילה החדשה מתחילה כשהנוכחית נגמרת. אין הוספה אוטומטית.",
        en: "You can buy another plan for the same eSIM while it is still installed. The new plan starts when the current one ends. There is no automatic top-up.",
        sources: [
          { url: "https://support.alosim.com/hc/en-us/articles/24035812698125-How-do-I-top-up-my-eSIM", quote: "If you're topping up an eSIM you're already using, the new plan will automatically start working once your current package expires." },
          { url: "https://alosim.com/terms-of-service/", quote: "AS AT OCTOBER 1, 2026, THE COMPANY DOES NOT OFFER ANY AUTO TOP-UP FEATURE FOR PURCHASE" },
        ],
      },
      support: {
        he: "צ׳אט באתר ובאפליקציה, ומייל ל־support@alosim.com. לפי aloSIM הם זמינים 24 שעות ביממה. לא מצאנו וואטסאפ או קו טלפון לתמיכה.",
        en: "Chat on the website and in the app, and email to support@alosim.com. aloSIM say they are available 24 hours a day. We found no WhatsApp or phone support line.",
        sources: [
          { url: "https://alosim.com/contact/", quote: "Our friendly team is available 24 hours a day to provide technical support." },
        ],
      },
      app: {
        he: "יש אפליקציה חינמית ל־iPhone ול־Android.",
        en: "There is a free app for iPhone and Android.",
        sources: [
          { url: "https://alosim.com/how-to-activate-esim/", quote: "Shop for prepaid eSIM data packages in the free aloSIM app (available on the App Store and Google Play) or on alosim.com." },
        ],
      },
      phoneNumber: {
        he: "החבילות לגלישה בלבד, בלי מספר טלפון. בהרבה חבילות מצורף במתנה מספר באפליקציה נפרדת שלהם, Hushed, שעובד דרך האינטרנט כל עוד החבילה בתוקף.",
        en: "Plans are data only, with no phone number. Many come with a free number in their separate Hushed app, which works over the internet for as long as the plan lasts.",
        sources: [
          { url: "https://support.alosim.com/hc/en-us/articles/24049876977677-Does-my-eSIM-data-package-include-a-phone-number", quote: "Phone numbers are not typically associated with eSIMs, so your new data package will not include a phone number." },
          { url: "https://support.alosim.com/hc/en-us/articles/24039867805197-How-does-aloSIM-s-free-eSIM-phone-number-promotion-work", quote: "Your free international phone number will last as long as your data package" },
        ],
      },
      company: {
        he: "AffinityClick Inc., מאוטווה שבקנדה.",
        en: "AffinityClick Inc., of Ottawa, Canada.",
        sources: [
          { url: "https://alosim.com/terms-of-service/", quote: "AffinityClick Inc. (the “Company”) provides “AloSIM” embedded subscriber identity modules" },
        ],
      },
    },
  },
  {
    providerId: "yesim",
    checkedOn: '2026-10-16',
    facts: {
      refunds: {
        he: "אפשר לבקש החזר תוך 30 יום מהקנייה, רק אם החבילה לא הופעלה. התקנת ה־eSIM נחשבת הפעלה, כך ש־eSIM שכבר הותקן לא מוחזר. החזר של עד 10 אירו ניתן כקרדיט אצלם (Ycoins), לא בכסף.",
        en: "A refund can be requested within 30 days of purchase, only if the plan has not been activated. Installing the eSIM counts as activating it, so an installed eSIM is not refunded. Refunds of up to EUR 10 are given as their own credit (Ycoins), not money.",
        sources: [
          { url: "https://yesim.app/refund-policy/", quote: "You can request a refund within 30 calendar days from the date of purchase." },
          { url: "https://yesim.app/refund-policy/", quote: "Activation includes installing the eSIM profile, connecting to a mobile network, or starting VPN/data usage." },
          { url: "https://yesim.app/refund-policy/", quote: "If your approved refund amount is €10 or less, it will be issued exclusively to your internal balance in the form of Ycoins." },
        ],
      },
      validityStart: {
        he: "תלוי בחבילה. לפי מרכז העזרה שלהם, יש חבילות שמתחילות בקנייה, בהתקנה או בחיבור הראשון לרשת, ולכן הם ממליצים לבדוק את תיאור החבילה לפני הקנייה.",
        en: "It depends on the plan. Their help centre says plans may start at purchase, at installation or on first connection, and recommends reading the plan's description before buying.",
        sources: [
          { url: "https://help.yesim.tech/when-does-my-yesim-data-plan-activate/", quote: "That is why we recommend checking the description of the selected eSIM package before purchase." },
        ],
      },
      installation: {
        he: "שלוש דרכים: בלחיצה מהאפליקציה, בסריקת קוד QR שנשלח אחרי הקנייה, או בהקלדה ידנית של הפרטים. האפליקציה לא חובה.",
        en: "Three ways: one tap in the app, scanning the QR code sent after purchase, or entering the details by hand. The app is not required.",
        sources: [
          { url: "https://help.yesim.tech/how-multisim-works-in-yesim/", quote: "No, the Yesim app is not necessary for the eSIM installation itself." },
          { url: "https://help.yesim.tech/how-do-i-purchase-a-yesim-data-plan/", quote: "QR-code will be sent to you as soon as the plan is purchased." },
        ],
      },
      hotspot: {
        he: "מותר ברוב החבילות, בלי תוספת תשלום, והגלישה יורדת מהחבילה. לפי Yesim, בסוף זה תלוי במפעיל המקומי, ובחלק מהמקומות זה עשוי להיות מוגבל.",
        en: "Allowed on most plans at no extra cost; the data comes out of the plan. Yesim say it ultimately depends on the local operator and may be restricted in some places.",
        sources: [
          { url: "https://help.yesim.tech/can-i-tether-use-personal-hotspot/", quote: "The personal Hotspot/tethering feature is available on most Yesim plans*, including those for Apple iOS and Android smartphones." },
          { url: "https://help.yesim.tech/can-i-tether-use-personal-hotspot/", quote: "The availability of Hotspot/tethering feature ultimately depends on the local network operator, and may be restricted in some situations." },
        ],
      },
      topUp: {
        he: "בחבילות שתומכות בזה אפשר להוסיף חבילה לאותו eSIM. החבילה החדשה מחליפה את הקודמת: הנפח והימים שנשארו לא מצטרפים אליה.",
        en: "Plans that support it can be topped up on the same eSIM. The new plan replaces the current one: leftover data and days are not added to it.",
        sources: [
          { url: "https://help.yesim.tech/how-multisim-works-in-yesim/", quote: "When you top up, the new plan replaces your current plan, but the remaining traffic volume and validity period are not added together." },
        ],
      },
      support: {
        he: "צ׳אט באפליקציה ובאתר, ומייל ל־support@yesim.app. לפי Yesim התמיכה זמינה 24/7. לא מצאנו וואטסאפ או טלפון.",
        en: "Chat in the app and on the website, and email to support@yesim.app. Yesim say support is available 24/7. We found no WhatsApp or phone line.",
        sources: [
          { url: "https://help.yesim.tech/how-do-i-get-help-or-contact-support/", quote: "Our dedicated 24/7 Customer Support Team is always ready to assist you with any inquiries you may have in a quick and efficient manner." },
        ],
      },
      app: {
        he: "יש אפליקציה ל־iPhone ול־Android.",
        en: "There is an app for iPhone and Android.",
        sources: [
          { url: "https://yesim.app/download-esim-app/", quote: "Download Yesim from App Store & Google Play" },
        ],
      },
      phoneNumber: {
        he: "החבילות לגלישה בלבד, בלי מספר טלפון, שיחות או SMS. מספר וירטואלי נמכר בנפרד, ולפי התנאים שלהם הוא לא שירות טלפון רגיל.",
        en: "Plans are data only, with no phone number, calls or SMS. A virtual number is sold separately, and their terms say it is not a telephone service.",
        sources: [
          { url: "https://help.yesim.tech/can-i-make-phone-calls-or-send-sms-messages-with-yesim-esim/", quote: "Our eSIMs are for data only solution, so they are not bundled with mobile number." },
          { url: "https://yesim.app/terms-of-service/", quote: "The Virtual Number Service is not a telephone service and does not replace or substitute for a local or domestic telephone service." },
        ],
      },
      company: {
        he: "Genesis Group AG, מבאר שבשווייץ.",
        en: "Genesis Group AG, of Baar, Switzerland.",
        sources: [
          { url: "https://yesim.app/terms-of-service/", quote: "GENESIS GROUP AG, CHE-135.623.633, legal address: Bahnhofstrasse 4, 6340 Baar, Switzerland" },
        ],
      },
    },
  },
  {
    providerId: "zensim",
    checkedOn: '2026-10-16',
    facts: {
      refunds: {
        he: "בדף מדיניות ההחזרים: החזר מלא אם לא נעשה שימוש בגלישה והקנייה הייתה ב־6 החודשים האחרונים, ובדרך כלל גם אם ה־eSIM כבר הותקן. בתנאי השימוש (סעיף 22.5) כתוב משהו מחמיר יותר: אין החזר אחרי התקנה או הפעלה, חוץ מתקלה טכנית שהם אימתו. לא כתוב מה מהשניים קובע.",
        en: "Their refund page: a full refund if no data has been used and the purchase was within the last 6 months, usually even once the eSIM is installed. Their terms (clause 22.5) are stricter: no refund after installation or activation, except for a technical failure they have verified. Neither says which one prevails.",
        sources: [
          { url: "https://zensim.com/refund-policy/", quote: "Even if the eSIM has already been installed on your device, we can usually provide a refund as long as no data usage has occurred." },
          { url: "https://documents.zensim.com.au/terms/zensim-general-terms.pdf", quote: "Refunds are not available after the eSIM is installed or activated, except in cases of technical failure verified by ZenSim." },
        ],
      },
      validityStart: {
        he: "החבילה מתחילה כשה־eSIM מתחבר לרשת ביעד, לא בקנייה ולא בהתקנה. לפי התנאים, זה צריך לקרות עד 12 חודשים מהקנייה.",
        en: "The plan starts when the eSIM connects to the network at the destination, not at purchase or installation. Their terms say this must happen within 12 months of purchase.",
        sources: [
          { url: "https://zensim.com/travel-esims/", quote: "the data plan won’t start until you’ve arrived" },
          { url: "https://documents.zensim.com.au/terms/zensim-general-terms.pdf", quote: "Activation must occur within 12 months of purchase" },
        ],
      },
      installation: {
        he: "קוד QR שנשלח במייל, או התקנה מהאפליקציה שלהם (ב־iPhone בלחיצה אחת). האפליקציה לא חובה כדי להשתמש ב־eSIM.",
        en: "A QR code by email, or installing from their app (one tap on an iPhone). The app is not needed to use the eSIM.",
        sources: [
          { url: "https://zensim.com/travel-esims/", quote: "We'll email you an eSIM QR code for you to scan directly, or you can install it instantly to your device within the ZenSim app." },
          { url: "https://zensim.com/help/how-to-install-an-esim-on-an-iphone/", quote: "you don't even need to use or download our app in order to use the eSIM" },
        ],
      },
      hotspot: {
        he: "מותר, ובעמודי היעדים שלהם כתוב שזה \"ללא הגבלה\". זה כתוב בעמודי השיווק; מסמך השימוש ההוגן שלהם לא מזכיר שיתוף אינטרנט.",
        en: "Allowed, and their destination pages call it unlimited. That is in their marketing pages; their fair use policy does not mention sharing.",
        sources: [
          { url: "https://zensim.com/travel-esims/japan/", quote: "Hotspot to your laptop, tablet, to your friends, to whoever with our limitless hotspotting." },
        ],
      },
      topUp: {
        he: "דרך האפליקציה בלבד: מוסיפים חבילה לאותו eSIM, גם ליעד אחר. כל תוספת מתחילה כשהקודמת נגמרת.",
        en: "Through the app only: add a plan to the same eSIM, for another destination too. Each top-up starts when the previous one ends.",
        sources: [
          { url: "https://zensim.com/help/", quote: "Open the ZenSim app, select your existing eSIM, and add another plan straight onto it - no new QR code, no faffing about with install steps again." },
          { url: "https://zensim.com/travel-esims/", quote: "Each top up will only take effect when the previous eSIM is expired" },
        ],
      },
      support: {
        he: "וואטסאפ, Messenger ומייל. בעמוד העזרה כתוב שהם זמינים \"פחות או יותר כל הזמן\", ובתנאי השימוש כתובות שעות: שני עד שבת, 8:00–17:00 לפי שעון סידני. לא מצאנו קו טלפון לתמיכה.",
        en: "WhatsApp, Messenger and email. Their help page says they are online \"more or less all the time\"; their terms give hours of Monday to Saturday, 8am–5pm Sydney time. We found no phone support line.",
        sources: [
          { url: "https://zensim.com/help/", quote: "Catch us on WhatsApp, Messenger or Email. We're online more or less all the time" },
          { url: "https://documents.zensim.com.au/terms/zensim-general-terms.pdf", quote: "Hours of Operation: Monday to Saturday - 8.00 am – 5.00 pm AEST" },
        ],
      },
      app: {
        he: "יש אפליקציה ל־iPhone ול־Android.",
        en: "There is an app for iPhone and Android.",
        sources: [
          { url: "https://zensim.com/zensim-app/", quote: "Install your new eSim with one click (on IOS)" },
        ],
      },
      phoneNumber: {
        he: "גלישה בלבד: בלי מספר טלפון, שיחות או SMS. שיחות עובדות דרך אפליקציות כמו וואטסאפ.",
        en: "Data only: no phone number, calls or SMS. Calls work through apps such as WhatsApp.",
        sources: [
          { url: "https://zensim.com/help/", quote: "Our Travel eSIMs are data-only, so no traditional calls or SMS will work as there's no phone number attached." },
        ],
      },
      company: {
        he: "Zensim Pty Ltd, מצפון סידני שבאוסטרליה.",
        en: "Zensim Pty Ltd, of North Sydney, Australia.",
        sources: [
          { url: "https://documents.zensim.com.au/terms/zensim-general-terms.pdf", quote: "Zensim Pty Ltd ABN 70 672 777 267" },
        ],
      },
    },
  },
  {
    providerId: "saily",
    checkedOn: '2026-10-16',
    facts: {
      refunds: {
        he: "החזר מלא תוך 30 יום מהקנייה, אם ה־eSIM לא הותקן או שהחבילה עוד לא התחילה. אחרי שהחבילה התחילה היא נחשבת מנוצלת וההחזר לא מובטח; לפי התנאים, שוקלים החזר כשנשאר יותר מ־99% מהנפח.",
        en: "A full refund within 30 days of purchase if the eSIM is not installed or the plan has not started. Once started, the plan counts as used and a refund is not guaranteed; their terms consider one when more than 99% of the data is left.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/16420576170652-What-is-Saily-s-refund-policy", quote: "If the eSIM you have purchased has not been installed or the Data Plan has not been activated, you may request a full refund within 30 days of the purchase." },
          { url: "https://saily.com/legal/terms-of-service/", quote: "more than 99% of the Data Plan balance" },
        ],
      },
      validityStart: {
        he: "החבילה מתחילה מעצמה כשנוחתים ביעד, לא בקנייה. לפי התנאים, אם לא משתמשים בה, היא מופעלת מעצמה 180 יום אחרי הקנייה.",
        en: "The plan starts by itself when you land at the destination, not at purchase. Their terms say an unused plan activates by itself 180 days after purchase.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/21484628749084-Saily-data-plan-management", quote: "your Saily eSIM data package will start working automatically as soon as you land at your destination." },
          { url: "https://saily.com/legal/terms-of-service/", quote: "180-calendar-day activation period" },
        ],
      },
      installation: {
        he: "דרך האפליקציה של Saily, שצריך להוריד כדי להתקין. התקנה ידנית עם קוד הפעלה מהאפליקציה היא דרך חלופית. העמודים שלהם לא מסכימים ביניהם אם נשלח גם קוד QR במייל.",
        en: "Through the Saily app, which you need to install the eSIM. Manual installation with a code from the app is the fallback. Their pages disagree on whether a QR code is also emailed.",
        sources: [
          { url: "https://saily.com/download-esim-app/", quote: "You can buy a Saily eSIM plan without the app, but you’ll need to download the Saily app to install the eSIM." },
        ],
      },
      hotspot: {
        he: "מותר, והגלישה יורדת מהחבילה. בחבילות ללא הגבלה, התנאים אוסרים שיתוף מעבר לשימוש אישי מזדמן.",
        en: "Allowed; the data comes out of the plan. On unlimited plans, their terms forbid sharing beyond occasional personal use.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/12822169782812-How-to-set-up-a-hotspot-with-Saily-eSIM", quote: "Saily's fair use policy applies to hotspot use." },
          { url: "https://saily.com/legal/terms-of-service/", quote: "Excessive tethering or sharing of data via hotspot with multiple devices or users beyond occasional personal use" },
        ],
      },
      topUp: {
        he: "אפשר להוסיף גלישה לאותו eSIM מהאפליקציה, פעם אחת או בהוספה אוטומטית שמפעילים לבד.",
        en: "Data can be added to the same eSIM from the app, once or with an automatic top-up you switch on yourself.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/12823216658204-Can-I-top-up-an-eSIM", quote: "Yes, you can top up a Saily data plan when you run low on the mobile data." },
        ],
      },
      support: {
        he: "צ׳אט 24/7 באפליקציה בלבד, ומייל. אין להם תמיכה בטלפון, ולא מצאנו וואטסאפ.",
        en: "24/7 chat in the app only, and email. They have no phone support, and we found no WhatsApp.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/17770364559516-How-to-contact-Saily-customer-support", quote: "Saily provides 24/7 assistance through live Chat and email" },
          { url: "https://support.saily.com/hc/en-us/articles/17770364559516-How-to-contact-Saily-customer-support", quote: "Saily does not offer phone support" },
        ],
      },
      app: {
        he: "יש אפליקציה ל־iPhone ול־Android.",
        en: "There is an app for iPhone and Android.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/16927103076892-How-do-I-install-the-Saily-App-on-my-device", quote: "Saily is available for both iOS and Android platforms" },
        ],
      },
      phoneNumber: {
        he: "החבילות לגלישה בלבד. מספר טלפון אמריקאי (+1) נמכר כתוספת בתשלום, עם אימות זהות, לשיחות מקומיות בלבד.",
        en: "Plans are data only. A US (+1) number is sold as a paid add-on, with an identity check, for local calls only.",
        sources: [
          { url: "https://support.saily.com/hc/en-us/articles/27948598334620-What-is-a-Saily-phone-number", quote: "A Saily phone number is an optional add-on that gives you a real, US-based wireless phone number alongside your Saily data eSIM." },
        ],
      },
      company: {
        he: "לפי התנאים, מחוץ לאזור הכלכלי האירופי ולאוסטרליה השירות ניתן על ידי Saily Inc. מדלאוור שבארה״ב. Saily שייכת ל־Nord Security.",
        en: "Their terms: outside the European Economic Area and Australia, the service is provided by Saily Inc. of Delaware, USA. Saily belongs to Nord Security.",
        sources: [
          { url: "https://saily.com/legal/terms-of-service/", quote: "Saily Inc., a corporation organized under the laws of the State of Delaware" },
        ],
      },
    },
  },
];

export function getProviderProfile(providerId: string): ProviderProfile | undefined {
  return providerProfiles.find((profile) => profile.providerId === providerId);
}
