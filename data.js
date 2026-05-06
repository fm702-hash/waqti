.// ── قاعدة بیانات المھام والأسئلة ──────────────────────────────────────────────
أیام الاستحمام: الأحد والأربعاء //
const SHOWER_DAYS = [0, 3]; // الأحد، 3=الأربعاء= 0
دالة للتحقق من وقت الصلاة (بالدقائق من منتصف اللیل) //
function getCurrentMinutes() {
const now = new Date();
return now.getHours() * 60 + now.getMinutes();
}
function getDayOfWeek() {
return new Date().getDay();
}
أوقات الصلاة التقریبیة (بالدقائق) — یمكن تعدیلھا حسب المنطقة //
ھذه أوقات تقریبیة للریاض //
export const PRAYER_TIMES = {
fajr: { label: " الفجر ", start: 4*60+30, end: 5*60+30 }, // 4:30 - 5:30
dhuhr: { label: " الظھر ", start: 11*60+45, end: 13*60+0 }, // 11:45 - 1:00
asr: { label: " العصر ", start: 15*60+15, end: 16*60+30 }, // 3:15 - 4:30
maghrib: { label: " المغرب ", start: 18*60+0, end: 18*60+45 }, // 6:00 - 6:45
isha: { label: " العشاء ", start: 19*60+30, end: 21*60+0 }, // 7:30 - 9:00
};
التحقق من الوقت الحالي //
function isTimeAvailable(startMin, endMin) {
const now = getCurrentMinutes();
return now >= startMin && now <= endMin;
}
function isShowerDay() {
return SHOWER_DAYS.includes(getDayOfWeek());
}
export const TASKS = [
// ── الصلوات ──────────────────────────────────────────────────────────────
{
id: 101, icon: " ", title: " ,"صلاة الفجر
subject: " صلاة ", grade: "",
reward: 25, color: "#C3A6FF",
timeLabel: "4:30 - ,"ص 5:30
isAvailable: () => isTimeAvailable(PRAYER_TIMES.fajr.start, PRAYER_TIMES.fajr.end),
availabilityMsg: " 5:30 ص - ,"متاحة وقت الفجر 4:30
questions: []
},
{
id: 102, icon: " ", title: " ,"صلاة الظھر
subject: " صلاة ", grade: "",
reward: 20, color: "#C3A6FF",
timeLabel: "11:45 - ,"م 1:00
isAvailable: () => isTimeAvailable(PRAYER_TIMES.dhuhr.start, PRAYER_TIMES.dhuhr.end),
availabilityMsg: " 1:00 م - ,"متاحة وقت الظھر 11:45
questions: []
},
{
id: 103, icon: " ", title: " ,"صلاة العصر
subject: " صلاة ", grade: "",
reward: 20, color: "#C3A6FF",
timeLabel: "3:15 - ,"م 4:30
isAvailable: () => isTimeAvailable(PRAYER_TIMES.asr.start, PRAYER_TIMES.asr.end),
availabilityMsg: " 4:30 م - ,"متاحة وقت العصر 3:15
questions: []
},
{
id: 104, icon: " ", title: " ,"صلاة المغرب
subject: " صلاة ", grade: "",
reward: 20, color: "#C3A6FF",
timeLabel: "6:00 - ,"م 6:45
isAvailable: () => isTimeAvailable(PRAYER_TIMES.maghrib.start, PRAYER_TIMES.maghrib.end),
availabilityMsg: " 6:45 م - ,"متاحة وقت المغرب 6:00
questions: []
},
{
id: 105, icon: " ", title: " ,"صلاة العشاء
subject: " صلاة ", grade: "",
reward: 20, color: "#C3A6FF",
timeLabel: "7:30 - ,"م 9:00
isAvailable: () => isTimeAvailable(PRAYER_TIMES.isha.start, PRAYER_TIMES.isha.end),
availabilityMsg: " 9:00 م - ,"متاحة وقت العشاء 7:30
questions: []
},
// ── المھام الیومیة ────────────────────────────────────────────────────────
{
id: 1, icon: " ", title: " ,"الاستیقاظ الباكر
subject: " یومي ", grade: "",
reward: 30, color: "#FFD700",
timeLabel: "5:30 - ,"ص 6:30
isAvailable: () => isTimeAvailable(5*60+30, 6*60+30),
availabilityMsg: " 6:30 ص - ,"متاحة 5:30
questions: []
},
{
id: 2, icon: " ", title: " ,"تفریش الأسنان
subject: " نظافة ", grade: "",
reward: 10, color: "#4ECDC4",
timeLabel: " ,"متاحة طوال الیوم
isAvailable: () => true,
availabilityMsg: "",
questions: []
},
{
id: 3, icon: " ", title: " ,"الإفطار
subject: " یومي ", grade: "",
reward: 15, color: "#FFE66D",
timeLabel: "5:30 - ,"ص 8:00
isAvailable: () => isTimeAvailable(5*60+30, 8*60),
availabilityMsg: " 8:00 ص - ,"متاحة 5:30
questions: []
},
{
id: 4, icon: " ", title: " ,"القیلولة بعد المدرسة
subject: " راحة ", grade: "",
reward: 15, color: "#A8E6CF",
timeLabel: "1:00 - ,"م 3:00
isAvailable: () => isTimeAvailable(13*60, 15*60),
availabilityMsg: " 3:00 م - ,"متاحة 1:00
questions: []
},
{
id: 5, icon: " ", title: " ,"المذاكرة وحل الواجبات
subject: " دراسي ", grade: "",
reward: 30, color: "#FF6B6B",
timeLabel: "3:00 - ,"م 6:00
isAvailable: () => isTimeAvailable(15*60, 18*60),
availabilityMsg: " 6:00 م - ,"متاحة 3:00
questions: [
{ q: "؟ ھل أكملت جمیع واجباتك المدرسیة ", opts: [" أكملتھا كلھا ", "أكملت معظمھا", "لم أكمل { q: "؟ ھل راجعت دروس الیوم ", opts: [" نعم راجعتھا ", "راجعت بعضھا", "لم أراجع "], ans: ]
},
{
id: 6, icon: " ", title: " ,"الاستحمام
subject: " نظافة ", grade: "",
reward: 20, color: "#667eea",
timeLabel: isShowerDay() ? " ,"متاح الیوم " : "الأحد والأربعاء فقط
isAvailable: () => isShowerDay(),
availabilityMsg: " ,"متاح یومي الأحد والأربعاء فقط
questions: []
},
{
id: 7, icon: " ", title: " ,"النوم في وقتھ
subject: " یومي ", grade: "",
reward: 20, color: "#764ba2",
timeLabel: "9:00 - ,"م 9:30
isAvailable: () => isTimeAvailable(21*60, 21*60+30),
availabilityMsg: " 9:30 م - ,"متاحة 9:00
questions: []
},
// ── الكویزات الدراسیة ─────────────────────────────────────────────────────
{
id: 8, icon: " ", title: " ,"كویز الریاضیات
subject: " ریاضیات ", grade: " ,"الصف الثالث
reward: 20, color: "#FF6B6B",
timeLabel: " ,"متاح طوال الیوم
isAvailable: () => true,
availabilityMsg: "",
questions: [
{ q: "؟8 × كم ناتج 7 ", opts: ["54","56","64","48"], ans: 1 },
{ q: "؟ ما ھو ربع العدد 100 ", opts: ["20","40","25","50"], ans: 2 },
{ q: "؟27 + كم یساوي 15 ", opts: ["42","40","44","38"], ans: 0 },
{ q: "؟6 × كم ناتج 9 ", opts: ["52","54","56","48"], ans: 1 },
{ q: "؟ ما ھو نصف العدد 84 ", opts: ["40","42","44","48"], ans: 1 },
]
},
{
id: 9, icon: " ", title: " ,"كویز اللغة العربیة
subject: " عربي ", grade: " ,"الصف الثاني
reward: 15, color: "#4ECDC4",
timeLabel: " ,"متاح طوال الیوم
isAvailable: () => true,
availabilityMsg: "",
questions: [
{ q: "؟' ما جمع كلمة 'كتاب ", opts: [" كتابات","كتب","أكتب","مكتوب "], ans: 1 },
{ q: "؟' ما مضاد كلمة 'كبیر ", opts: [" طویل","قصیر","صغیر","واسع "], ans: 2 },
{ q: "؟' ما مفرد كلمة 'أقلام ", opts: [" قلم","قلام","مقلمة","أقلام "], ans: 0 },
]
},
{
id: 10, icon: " ", title: " ,"كویز العلوم
subject: " علوم ", grade: " ,"الصف الرابع
reward: 25, color: "#A8E6CF",
timeLabel: " ,"متاح طوال الیوم
isAvailable: () => true,
availabilityMsg: "",
questions: [
{ q: "؟ كم عدد أضلاع المثلث ", opts: ["2","3","4","5"], ans: 1 },
{ q: "؟ أي الكواكب الأقرب للشمس ", opts: [" الأرض","الزھرة","عطارد","المریخ "], ans: 2 },
{ q: "؟ ما وحدة قیاس الكھرباء ", opts: [" نیوتن","أمبیر","متر","كیلوجرام "], ans: 1 },
]
},
];
export const CODE_TTL = 120;
export const MAX_DAILY_MINUTES = 120;
