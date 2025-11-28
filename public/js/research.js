
// Translation dictionary
const translations = {
    research_header: {
        en: "Our Research",
        bn: "আমাদের গবেষণা"
    },
    research_intro_title: {
        en: "Research Behind KrishiRokkha",
        bn: "কৃষি রক্ষা পেছনের গবেষণা"
    },
    research_intro_text: {
        en: "Our team conducted extensive research on food loss across Bangladesh. Data from BIDS, FAO, and Financial Express shows that 12–32% of staple food is lost every year during post-harvest stages.",
        bn: "বাংলাদেশে খাদ্য অপচয় নিয়ে আমাদের টিম ব্যাপক গবেষণা করেছে। BIDS, FAO এবং ফিনান্সিয়াল এক্সপ্রেস-এর তথ্য অনুযায়ী প্রতিবছর ১২–৩২% খাদ্যশস্য পর-সংরক্ষণ ধাপে নষ্ট হয়।"
    },
    key_findings_title: {
        en: "Key Findings",
        bn: "গবেষণার মূল তথ্য"
    },
    finding_1: {
        en: "Weather unpredictability causes grain damage.",
        bn: "আবহাওয়ার অস্থিরতা খাদ্যশস্য নষ্ট করে।"
    },
    finding_2: {
        en: "Poor storage bags increase moisture & mold.",
        bn: "খারাপ সংরক্ষণ ব্যাগে আর্দ্রতা ও ফাঙ্গাস বৃদ্ধি পায়।"
    },
    finding_3: {
        en: "Farmers lack real-time guidance.",
        bn: "চাষিরা রিয়েল-টাইম পরামর্শ পান না।"
    },
    finding_4: {
        en: "Existing solutions are too complex.",
        bn: "বর্তমান সমাধানগুলো খুব জটিল।"
    },
    tech_op_title: {
        en: "Technology Opportunities",
        bn: "প্রযুক্তিগত সুযোগ"
    },
    tech_1: { en: "Hyper-local weather mapping", bn: "হাইপার-লোকাল আবহাওয়া বিশ্লেষণ" },
    tech_2: { en: "AI-based moisture prediction", bn: "এআই-ভিত্তিক আর্দ্রতা পূর্বাভাস" },
    tech_3: { en: "Offline-first mobile web apps", bn: "অফলাইন-ফার্স্ট মোবাইল ওয়েব অ্যাপস" },
    tech_4: { en: "Farmer-friendly Bangla advisories", bn: "চাষি-বান্ধব বাংলা নির্দেশনা" },
    tech_5: { en: "Low-bandwidth crop health scanning", bn: "লো-ব্যান্ডউইথ ফসল স্বাস্থ্য স্ক্যান" },
    research_conclusion_title: {
        en: "Conclusion",
        bn: "উপসংহার"
    },
    research_conclusion_text: {
        en: "With proper digital tools, Bangladesh can reduce food loss, increase farmer profit, and ensure long-term food security.",
        bn: "সঠিক ডিজিটাল টুল ব্যবহার করে বাংলাদেশ খাদ্য অপচয় কমাতে পারে, কৃষকের লাভ বাড়াতে পারে এবং দীর্ঘমেয়াদী খাদ্য নিরাপত্তা নিশ্চিত করতে পারে।"
    }
};

// Function to switch language
function setLanguage(lang) {
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        if (translations[key]) {
            el.innerHTML = translations[key][lang];
        } else {
            console.warn(`Translation missing for key: ${key}`);
        }
    });
}

// // Optional: set default language
// document.addEventListener("DOMContentLoaded", () => {
//     setLanguage("en"); // default English
// });
