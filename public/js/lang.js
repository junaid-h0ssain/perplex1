const translations = {
    en: {
        about_header: "About KrishiRokkha",
        nav_about: "About Us",
        nav_team: "Our Team",
        nav_research: "Research",
        nav_stories: "Farmer Stories",

        mission_title: "Our Mission",
        mission_text: "KrishiRokkha is a technology-driven solution designed to fight food loss in Bangladesh. Every year, more than 4.5 million metric tonnes of food grains are lost due to poor storage, weather risks, and mismanagement. Our platform uses weather forecasting, crop monitoring, and early-warning alerts to help farmers protect their harvests.",

        why_title: "Why We Built This",
        why_text: "Food loss affects farmer incomes, national food security, and long-term sustainability. Our goal is to empower farmers with simple, mobile-friendly digital tools so they can make better decisions, reduce waste, and improve their livelihoods.",

        offer_title: "What KrishiRokkha Offers",
        offer_1: "Real-time storage risk prediction",
        offer_2: "Hyper-local weather insights in Bangla",
        offer_3: "Farmer-friendly advisories",
        offer_4: "Offline support + data sync",
        offer_5: "AI-based crop scan (fresh vs rotten)",


    // Team Page
        team_header: "Meet Our Team",
        team_intro_title: "The People Behind KrishiRokkha",
        team_intro_text: "We are a passionate group of innovators working to create an impact in the agricultural sector of Bangladesh.",
        member1_name: "Fardina Tahsin",
        member1_role: "Role - Frontend Developer\nCSE undergraduate at East Delta University",
        member2_name: "Junaid Hossain",
        member2_role: "Role - Backend Developer\nCSE undergraduate at East Delta University",
        member3_name: "Sujit Mohajan",
        member3_role: "Role - Backend Developer\nCSE undergraduate at East Delta University",
      
    },

    bn: {
        about_header: "কৃষি রক্ষা সম্পর্কে",
        nav_about: "আমাদের সম্পর্কে",
        nav_team: "আমাদের টিম",
        nav_research: "গবেষণা",
        nav_stories: "কৃষকের গল্প",

        mission_title: "আমাদের লক্ষ্য",
        mission_text: "কৃষি রক্ষা বাংলাদেশে খাদ্য অপচয় রোধের একটি প্রযুক্তি-চালিত সমাধান। প্রতি বছর ৪.৫ মিলিয়ন মেট্রিক টনের বেশি খাদ্য শস্য নষ্ট হয় — খারাপ সংরক্ষণ, আবহাওয়ার ঝুঁকি, ও ব্যবস্থাপনার অভাবে। আমাদের প্ল্যাটফর্ম আবহাওয়া পূর্বাভাস, ফসল মনিটরিং, এবং আগাম সতর্কতা দিয়ে কৃষকদের ফসল রক্ষা করতে সাহায্য করে।",

        why_title: "আমরা এটি কেন তৈরি করেছি",
        why_text: "খাদ্য অপচয় কৃষকের আয়, জাতীয় খাদ্য নিরাপত্তা ও দীর্ঘমেয়াদী স্থায়িত্বকে প্রভাবিত করে। আমাদের লক্ষ্য হলো কৃষকদের সহজ, মোবাইল-ফ্রেন্ডলি ডিজিটাল টুল দিয়ে আরও ভালো সিদ্ধান্ত নিতে সাহায্য করা।",

        offer_title: "কৃষি রক্ষা কী অফার করে?",
        offer_1: "রিয়েল-টাইম সংরক্ষণ ঝুঁকি পূর্বাভাস",
        offer_2: "হাইপার-লোকাল আবহাওয়া তথ্য (বাংলায়)",
        offer_3: "কৃষক-বান্ধব পরামর্শ",
        offer_4: "অফলাইন সাপোর্ট + ডেটা সিঙ্ক",
        offer_5: "এআই ভিত্তিক ফসল স্ক্যান (তাজা/পচা)",

        // ===== TEAM PAGE KEYS =====
        team_header: "আমাদের দল",
        team_intro_title: "কৃষি রক্ষা-এর পেছনের মানুষরা",
        team_intro_text: "আমরা উদ্ভাবকদের একটি উত্সাহী দল, যারা বাংলাদেশের কৃষি ক্ষেত্রে প্রভাব তৈরি করতে কাজ করছে।",
        member1_name: "ফারদিনা তাহসীন",
        member1_role: "ভূমিকা - ফ্রন্টএন্ড ডেভেলপার\nইস্ট ডেল্টা ইউনিভার্সিটির সিএসই অনার্স ছাত্র",
        member2_name: "জুনায়েদ হোসাইন",
        member2_role: "ভূমিকা - ব্যাকএন্ড ডেভেলপার\nইস্ট ডেল্টা ইউনিভার্সিটির সিএসই অনার্স ছাত্র",
        member3_name: "সুজিত মহাজন",
        member3_role: "ভূমিকা - ব্যাকএন্ড ডেভেলপার\nইস্ট ডেল্টা ইউনিভার্সিটির সিএসই অনার্স ছাত্র",
    }

};

function setLanguage(lang) {
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        el.innerHTML = translations[lang][key];
    });
}
