/* Stage model, task templates, document checklist and the advisor resource library. */

window.NB_STAGES = [
  { id: "intake",    n: 1, name: "Profile & Goals",   blurb: "Who they are, what they want, what they can spend." },
  { id: "tests",     n: 2, name: "Tests & English",   blurb: "English proficiency and any GRE/GMAT the programmes ask for." },
  { id: "shortlist", n: 3, name: "School Shortlist",  blurb: "A balanced list: reach, match and safe programmes." },
  { id: "docs",      n: 4, name: "Application File",  blurb: "Transcripts, evaluation, SOP, CV, recommenders." },
  { id: "apply",     n: 5, name: "Submissions",       blurb: "Portals filled, fees paid, everything sent before the deadline." },
  { id: "offers",    n: 6, name: "Offers & I-20",     blurb: "Decisions in, one accepted, I-20 issued." },
  { id: "visa",      n: 7, name: "Funding & Visa",    blurb: "SEVIS fee, DS-160, interview, stamped visa." },
  { id: "depart",    n: 8, name: "Pre-Departure",     blurb: "Flights, housing, insurance, arrival check-in." }
];

/* owner: who does the work — c = client, a = advisor */
window.NB_TASKS = [
  { id: "t01", s: "intake", o: "a", t: "Intake call completed", h: "Background, degree, class of award, work history, family situation, timeline." },
  { id: "t02", s: "intake", o: "c", t: "Academic history collected", h: "Every institution attended, with dates and the grading scale used." },
  { id: "t03", s: "intake", o: "a", t: "Target intake agreed", h: "Fall is the largest intake and carries the most funding. Spring is smaller and faster." },
  { id: "t04", s: "intake", o: "a", t: "Field and programme type agreed", h: "Taught MS/MA, thesis MS, MBA or MEng — they fund and hire very differently." },
  { id: "t05", s: "intake", o: "c", t: "Budget and funding plan set", h: "What the family can commit per year, and what must come from an assistantship or loan." },
  { id: "t06", s: "intake", o: "a", t: "Engagement agreement signed", h: "Scope, fee, what the client is responsible for, what you are not." },

  { id: "t07", s: "tests",  o: "c", t: "English test chosen and booked", h: "TOEFL iBT, IELTS Academic, Duolingo English Test or PTE Academic — confirm which ones each target school accepts." },
  { id: "t08", s: "tests",  o: "c", t: "English test sat", h: "Book 6-8 weeks before the first deadline so there is room for a retake." },
  { id: "t09", s: "tests",  o: "a", t: "English score reviewed against targets", h: "Check the programme minimum and the separate section minimums, which are often the binding constraint." },
  { id: "t10", s: "tests",  o: "a", t: "GRE/GMAT requirement checked per school", h: "Many programmes are now test-optional or have waivers for work experience. Confirm in writing on the programme page." },
  { id: "t11", s: "tests",  o: "c", t: "GRE/GMAT sat (if required)", h: "Only where it is genuinely required or where a strong score offsets a weaker transcript." },
  { id: "t12", s: "tests",  o: "c", t: "Official scores sent to schools", h: "Score reports go direct from the testing body. Order them early — delivery is not instant." },

  { id: "t13", s: "shortlist", o: "a", t: "Longlist built from the directory", h: "Start wide — 20 to 30 programmes — then cut." },
  { id: "t14", s: "shortlist", o: "a", t: "Shortlist balanced 2 / 4 / 2", h: "Two reach, four match, two safe. A list of only reaches is the most common way a season is lost." },
  { id: "t15", s: "shortlist", o: "c", t: "Deadlines recorded for every school", h: "Priority/funding deadlines are usually weeks before the final deadline — the funding one is the real one." },
  { id: "t16", s: "shortlist", o: "c", t: "Faculty and labs identified", h: "For thesis and PhD-track programmes, two or three named faculty per school changes the SOP completely." },
  { id: "t17", s: "shortlist", o: "a", t: "Cost per school estimated", h: "Tuition plus fees, health insurance, and living cost for the city. Get the figures from the school's own cost-of-attendance page." },

  { id: "t18", s: "docs", o: "c", t: "Official transcripts requested", h: "Sealed, from every institution attended. Allow weeks, not days." },
  { id: "t19", s: "docs", o: "c", t: "Degree certificate obtained", h: "If it has not been issued yet, an attestation or provisional letter from the registrar usually works." },
  { id: "t20", s: "docs", o: "c", t: "Credential evaluation ordered", h: "Course-by-course from a NACES member (WES, ECE, SpanTran, Josef Silny) where the school asks for one." },
  { id: "t21", s: "docs", o: "c", t: "CV rewritten to US format", h: "Two pages maximum, no photo, no date of birth, no marital status. Results with numbers." },
  { id: "t22", s: "docs", o: "c", t: "Statement of Purpose drafted", h: "What they want to study, why that is the natural next step, why this department, what they will do after." },
  { id: "t23", s: "docs", o: "a", t: "SOP reviewed and tailored per school", h: "One base statement, then a named paragraph per programme. A generic SOP reads as a generic applicant." },
  { id: "t24", s: "docs", o: "c", t: "Three recommenders confirmed", h: "Ask by email with a deadline, the CV, the SOP draft and a reminder of specific work they supervised." },
  { id: "t25", s: "docs", o: "c", t: "Recommendation letters submitted", h: "Recommenders upload through each portal. Chase at two weeks out, not two days." },
  { id: "t26", s: "docs", o: "c", t: "Portfolio or writing sample ready", h: "Only where the programme asks — design, architecture, creative writing, some research MS." },

  { id: "t27", s: "apply", o: "c", t: "Application portals created", h: "One login per school. Keep every username and password in one place the client controls." },
  { id: "t28", s: "apply", o: "c", t: "Applications filled and reviewed", h: "Review every form once cold, a day later. Name spelling must match the passport exactly." },
  { id: "t29", s: "apply", o: "c", t: "Fee waivers requested where available", h: "Some departments waive fees on request for international applicants or for early applications." },
  { id: "t30", s: "apply", o: "c", t: "All applications submitted", h: "Submit against the funding deadline, not the final deadline." },
  { id: "t31", s: "apply", o: "a", t: "Submission confirmations filed", h: "Save every confirmation email and application ID to the client's file." },
  { id: "t32", s: "apply", o: "c", t: "Assistantship applications sent", h: "GA/TA/RA applications are often separate from admission, and separately deadlined." },

  { id: "t33", s: "offers", o: "a", t: "Decisions tracked as they land", h: "Update the shortlist status the day each decision arrives." },
  { id: "t34", s: "offers", o: "a", t: "Offers compared on net cost", h: "Sticker tuition means little. Compare tuition minus award, plus fees, insurance and living cost." },
  { id: "t35", s: "offers", o: "c", t: "Offer accepted and deposit paid", h: "Decline the others in writing so the seats and any funding move on." },
  { id: "t36", s: "offers", o: "c", t: "Financial documents submitted to the school", h: "Bank statement and sponsor affidavit covering at least the first year, in the school's required format." },
  { id: "t37", s: "offers", o: "c", t: "I-20 received and checked", h: "Check the spelling of the name, date of birth, programme, start date and funding figure against the passport." },

  { id: "t38", s: "visa", o: "c", t: "SEVIS I-901 fee paid", h: "Pay at fmjfee.com using the SEVIS ID on the I-20. Print the receipt." },
  { id: "t39", s: "visa", o: "c", t: "DS-160 completed", h: "One form per applicant at ceac.state.gov. Keep the confirmation barcode page." },
  { id: "t40", s: "visa", o: "c", t: "Visa interview booked", h: "Book as early as the embassy calendar allows — slots, not documents, are usually the bottleneck." },
  { id: "t41", s: "visa", o: "a", t: "Mock interview done", h: "Study plan, choice of school, funding, ties to home. Short, consistent, honest answers." },
  { id: "t42", s: "visa", o: "c", t: "Interview attended", h: "Carry the I-20, DS-160 confirmation, SEVIS receipt, passport, financials and academic records." },
  { id: "t43", s: "visa", o: "c", t: "Visa issued and collected", h: "Check the visa page for the correct name, classification and annotation before leaving the counter." },

  { id: "t44", s: "depart", o: "c", t: "Flight booked", h: "Arrive inside the 30 days before the I-20 start date — entry earlier than that is not permitted." },
  { id: "t45", s: "depart", o: "c", t: "Housing secured", h: "On-campus grad housing if it exists. Otherwise a short first lease or temporary stay, viewed in person before signing long." },
  { id: "t46", s: "depart", o: "c", t: "Health insurance and immunisations sorted", h: "Most schools enrol students in their own plan automatically and require specific immunisation records." },
  { id: "t47", s: "depart", o: "c", t: "Funds for the first 60 days arranged", h: "Tuition deposit, first rent, deposit, phone, groceries — before any stipend or loan disbursement lands." },
  { id: "t48", s: "depart", o: "c", t: "Arrival checklist reviewed", h: "Documents in hand luggage, address of first night, campus contact, airport transfer." },
  { id: "t49", s: "depart", o: "a", t: "Post-arrival check-in scheduled", h: "A call in week one and week four catches problems while they are still small." }
];

window.NB_DOCS = [
  { id: "d01", t: "Passport bio page", h: "Must be valid at least six months beyond the intended entry date." },
  { id: "d02", t: "Academic transcripts (all institutions)", h: "Official and sealed, with the grading scale explained." },
  { id: "d03", t: "Degree certificate / provisional letter", h: "Attestation from the registrar is accepted where the certificate is not yet issued." },
  { id: "d04", t: "Credential evaluation report", h: "Course-by-course, from a NACES member agency." },
  { id: "d05", t: "English test score report", h: "TOEFL, IELTS, Duolingo or PTE — sent officially from the testing body." },
  { id: "d06", t: "GRE / GMAT score report", h: "Only where the programme requires it." },
  { id: "d07", t: "CV / résumé (US format)", h: "Two pages, no photo, no personal details." },
  { id: "d08", t: "Statement of Purpose", h: "Tailored per programme." },
  { id: "d09", t: "Personal / diversity statement", h: "Where separately requested." },
  { id: "d10", t: "Recommendation letters (3)", h: "Submitted by the recommenders through each portal." },
  { id: "d11", t: "Bank statement / financial proof", h: "Covering at least the first year's cost of attendance." },
  { id: "d12", t: "Sponsor affidavit of support", h: "Signed, with the sponsor's own bank evidence attached." },
  { id: "d13", t: "Work experience letters", h: "On letterhead, with dates, title and duties." },
  { id: "d14", t: "Passport photographs", h: "To the visa specification — 2x2 inches, white background." },
  { id: "d15", t: "I-20", h: "Issued by the school once admission is accepted and finances are verified." },
  { id: "d16", t: "SEVIS I-901 receipt", h: "Printed, carried to the interview." },
  { id: "d17", t: "DS-160 confirmation page", h: "The barcode page, printed." }
];

window.NB_DOC_STATES = ["Not started", "Requested", "Received", "Verified"];

window.NB_RESOURCES = [
  {
    id: "timeline",
    name: "The 18-month timeline",
    lede: "Work backwards from the intake, not forwards from today. Almost every failed season is a timeline problem, not a merit problem.",
    items: [
      { t: "18-15 months out", b: "Intake and goal-setting. Decide the intake term and the field. Start saving for test fees, application fees and the credential evaluation — together these commonly run to several hundred dollars before a single application is submitted." },
      { t: "15-12 months out", b: "Sit the English test. Order official transcripts from every institution. Start the credential evaluation, which is the slowest moving part of the file." },
      { t: "12-9 months out", b: "Build the longlist, then cut it to eight to ten programmes. Draft the SOP. Approach recommenders with a clear deadline." },
      { t: "9-6 months out", b: "Submit. Aim at each school's priority or funding deadline, which is usually weeks ahead of the final one. Submit assistantship applications separately where they exist." },
      { t: "6-4 months out", b: "Decisions arrive. Compare offers on net cost, accept one, decline the rest, pay the deposit and send financial documents for the I-20." },
      { t: "4-2 months out", b: "I-20 in hand: pay the SEVIS fee, file the DS-160, book the interview as early as the calendar allows. Interview slots are the usual bottleneck." },
      { t: "2-0 months out", b: "Visa collected, flight booked, housing secured, insurance and immunisations done, first-60-days money arranged." }
    ]
  },
  {
    id: "tests",
    name: "Tests & English proficiency",
    lede: "Confirm the exact requirement on each programme's own page. Requirements differ between the graduate school and the department, and the department's rule wins.",
    items: [
      { t: "Which English test", b: "TOEFL iBT and IELTS Academic are accepted almost everywhere. The Duolingo English Test and PTE Academic are widely but not universally accepted — check each school before booking, because a cheaper test that one target school rejects is not cheaper." },
      { t: "Section minimums matter more than the total", b: "Many programmes set a floor on the speaking or writing section as well as the overall score. A comfortable total with one weak section is still a rejection, and it is the most common avoidable one." },
      { t: "Waivers", b: "Schools frequently waive the English requirement for applicants whose entire degree was taught in English, or who hold a degree from a recognised English-medium institution. Ask the graduate admissions office directly and keep the reply in writing." },
      { t: "GRE and GMAT", b: "Far fewer programmes require these than applicants assume, and many that do will waive them for relevant work experience. Where a transcript is weaker than the programme's usual intake, a strong quantitative score is one of the few levers that still moves an admissions committee." },
      { t: "Sending scores", b: "Official scores go from the testing body to the institution code, not from the applicant. Order them with the booking where possible — free reports at registration are cheaper than reports ordered later." },
      { t: "Retakes", b: "Build one retake window into the plan before the first deadline. A plan with no room for a retake is a plan that depends on a single sitting going well." }
    ],
    links: [
      { t: "TOEFL & GRE (ETS)", u: "https://www.ets.org" },
      { t: "IELTS", u: "https://ielts.org" },
      { t: "Duolingo English Test", u: "https://englishtest.duolingo.com" },
      { t: "Pearson PTE Academic", u: "https://www.pearsonpte.com" },
      { t: "GMAT (GMAC)", u: "https://www.mba.com" }
    ]
  },
  {
    id: "credentials",
    name: "Transcripts & credential evaluation",
    lede: "The slowest item in the file. Start it first.",
    items: [
      { t: "What a course-by-course evaluation is", b: "An agency converts a foreign transcript into US credit hours and a US GPA, subject by subject. Some schools require it, some accept a document-by-document report, and some accept the transcript directly. Check per school before paying for the most expensive report." },
      { t: "Use a NACES member", b: "US institutions generally recognise evaluations from members of the National Association of Credential Evaluation Services. WES, ECE, SpanTran and Josef Silny are the names that come up most often." },
      { t: "Sealed documents", b: "Most agencies require transcripts sent directly by the issuing institution in a sealed envelope, or through a verified institutional channel. Anything the applicant has opened themselves is usually rejected." },
      { t: "Timing", b: "Allow six to twelve weeks from request to delivered report, and longer where the issuing registrar is slow to respond to verification requests. This is the single most common cause of a missed deadline." },
      { t: "Keep digital copies", b: "Scan every document before it is sealed and sent. The same set will be needed again for the visa interview and again on arrival." }
    ],
    links: [
      { t: "NACES member directory", u: "https://www.naces.org/members" },
      { t: "World Education Services", u: "https://www.wes.org" },
      { t: "Educational Credential Evaluators", u: "https://www.ece.org" }
    ]
  },
  {
    id: "writing",
    name: "The application file",
    lede: "Admissions committees read hundreds of these. Specificity is the only thing that separates one from the next.",
    items: [
      { t: "Statement of Purpose", b: "Four movements: what they want to study, the experience that made that the obvious next question, why this department in particular — named faculty, named labs, named courses — and what they intend to do afterwards. The third movement is what is usually missing and what usually decides it." },
      { t: "One base, many tails", b: "Write one strong statement, then replace the department paragraph for each school. Never send a statement that could be addressed to any programme, and never leave another school's name in it — reviewers see this every year." },
      { t: "Personal statement is a different document", b: "Where a school asks for both, the SOP is academic and the personal statement is biographical: obstacles, context, what the applicant brings that the transcript does not show." },
      { t: "Recommenders", b: "Three is standard and academic referees outweigh employers for research programmes. Ask at least six weeks out, by email, with the CV, the draft SOP, the deadline and a short reminder of the specific work they supervised. A vague letter is worse than no letter." },
      { t: "CV in US format", b: "Two pages, reverse chronological, no photograph, no date of birth, no marital status, no nationality. Achievements with figures attached: how many, how much, how much faster." },
      { t: "Proofreading", b: "Read it aloud once. Then have someone who has never heard the plan read it and say back what the applicant wants to study. If they cannot, the statement is not finished." }
    ]
  },
  {
    id: "funding",
    name: "Paying for it",
    lede: "Federal student aid is not available to international students. Everything below is the realistic set of sources.",
    items: [
      { t: "Assistantships", b: "Teaching, research and graduate assistantships are the largest source of funding for international master's students, typically combining a tuition waiver with a stipend for a set number of hours per week. They are usually awarded by the department, often on a separate application, and frequently earlier than the admission decision." },
      { t: "Departmental scholarships and fellowships", b: "Many are awarded automatically from the admission file, but a meaningful number require a separate form. Ask the graduate coordinator which ones need an application and when they close." },
      { t: "External scholarships", b: "Fulbright Foreign Student Program, AAUW International Fellowships, Rotary and a long tail of country-specific and field-specific awards. Deadlines for the largest ones fall roughly a year before the intake — earlier than most applicants realise." },
      { t: "Private loans", b: "Some lenders offer no-cosigner loans to international students at US institutions. Compare the total repayable, the interest rate, the origination fee and whether repayment starts during study — not the monthly figure the marketing leads with. This is information, not a recommendation; the client should compare offers themselves and read the terms." },
      { t: "Sponsors", b: "A family sponsor needs to provide their own bank evidence plus a signed affidavit of support. The school sets the format; use the school's form where one exists." },
      { t: "On-campus work", b: "F-1 students are generally permitted to work on campus up to 20 hours per week while classes are in session. Treat it as supplementary income, never as the funding plan in the financial documents." },
      { t: "Cost realism", b: "Get the total from the school's published cost-of-attendance page, which includes fees, health insurance and living costs, rather than the tuition figure alone. Public in-state, public out-of-state and private programmes sit at very different levels, and the same programme can cost twice as much in one city as another." }
    ],
    links: [
      { t: "Fulbright Foreign Student Program", u: "https://foreign.fulbrightonline.org" },
      { t: "EducationUSA advising centres", u: "https://educationusa.state.gov" },
      { t: "International scholarship search (IEFA)", u: "https://www.iefa.org" }
    ]
  },
  {
    id: "i20",
    name: "Proving funds for the I-20",
    lede: "The school will not issue an I-20 until it is satisfied the first year is funded. This is a documentation exercise, and it is where otherwise strong applicants stall.",
    items: [
      { t: "What the figure is", b: "Normally one full academic year of the published cost of attendance, less any assistantship or scholarship already awarded. The school states the exact number it wants to see." },
      { t: "What counts as evidence", b: "Bank statements or bank letters in the name of the student or the sponsor, usually dated within the last three to six months, showing liquid funds. Property, vehicles and unrealised assets generally do not count." },
      { t: "Sponsor affidavit", b: "A signed statement naming the student, the relationship, the amount committed and the period covered, attached to the sponsor's own bank evidence." },
      { t: "Consistency", b: "The figures on the I-20, the financial documents and the DS-160 should tell the same story. Inconsistency between them is a visible problem at the interview." },
      { t: "Check the I-20 on arrival", b: "Name spelling, date of birth, country of birth, programme, start date, and the funding amount. An error here is far cheaper to correct before the interview than after." }
    ]
  },
  {
    id: "visa",
    name: "The F-1 visa",
    lede: "General information for planning, not legal advice. Requirements and procedures differ by embassy and change — confirm everything on the official sites below and with the client's own embassy.",
    items: [
      { t: "Order of operations", b: "I-20 issued, then pay the SEVIS I-901 fee, then complete the DS-160, then pay the visa fee and book the interview. Doing these out of order wastes time and occasionally money." },
      { t: "SEVIS I-901", b: "Paid at fmjfee.com using the SEVIS ID printed on the I-20. Print the receipt and carry it to the interview." },
      { t: "DS-160", b: "Completed online at the Consular Electronic Application Center. Names must match the passport exactly. Keep the confirmation page with the barcode — the interview cannot proceed without it." },
      { t: "Booking the interview", b: "Wait times vary enormously by post and by season, and are longest in the months before a Fall intake. Book the moment the DS-160 is filed rather than waiting for other documents." },
      { t: "What to carry", b: "Passport, I-20, DS-160 confirmation, SEVIS receipt, visa fee receipt, appointment letter, academic transcripts and test scores, financial evidence and the sponsor affidavit, and photographs to specification." },
      { t: "What the interview is actually about", b: "Three questions under the surface: is this a genuine student, is the programme funded, and will they comply with the terms of the visa. Answers should be short, specific and consistent with the paperwork." },
      { t: "If the application is refused", b: "A refusal under section 214(b) means the officer was not satisfied on those points. It is not a permanent bar, and reapplying is possible — but only with something materially different to show, such as clearer funding or a clearer study plan." }
    ],
    links: [
      { t: "Study in the States (DHS)", u: "https://studyinthestates.dhs.gov" },
      { t: "SEVIS I-901 fee payment", u: "https://www.fmjfee.com" },
      { t: "DS-160 (CEAC)", u: "https://ceac.state.gov/genniv" },
      { t: "Student visa overview (State Dept)", u: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" },
      { t: "Visa appointment wait times", u: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html" }
    ]
  },
  {
    id: "predeparture",
    name: "Pre-departure",
    lede: "The month where a well-run file turns into a person who actually arrives in good shape.",
    items: [
      { t: "Entry window", b: "Entry is permitted no earlier than 30 days before the programme start date shown on the I-20. Book the flight accordingly." },
      { t: "Hand luggage", b: "Passport, I-20, admission letter, SEVIS receipt, financial documents, transcripts, test scores and immunisation records travel in the cabin bag. Never in the hold." },
      { t: "Housing", b: "On-campus graduate housing where it exists, otherwise a short first lease or a few weeks of temporary accommodation. Signing a twelve-month lease on a property seen only in photographs is the most common expensive mistake of the first month." },
      { t: "Health insurance", b: "Most institutions enrol students in their own plan automatically and charge it with tuition. Check whether a waiver is possible and whether it is actually cheaper before assuming it is." },
      { t: "Money for the first 60 days", b: "Deposit, first rent, furniture, phone, groceries and books all land before any stipend or loan disbursement does. Plan the gap explicitly." },
      { t: "Phone and banking", b: "A US number and a student bank account are usually set up in the first week. Most banks will open an account with a passport and I-20; some will want a local address first." },
      { t: "Climate", b: "Winter in Minnesota and winter in Florida are not the same event. Buy the heavy coat there, not at home." }
    ],
    links: [
      { t: "CDC travellers' health", u: "https://wwwnc.cdc.gov/travel" }
    ]
  },
  {
    id: "arrival",
    name: "After they land",
    lede: "Status is maintained by doing a small number of things on time. Most problems here are administrative, not dramatic.",
    items: [
      { t: "Check in with the DSO", b: "Report to the international student office in the first days on campus. This registers the student in SEVIS for the term and is not optional." },
      { t: "Full course load", b: "F-1 students are normally required to enrol full time each term, with limited exceptions that must be authorised in advance by the DSO. Dropping below without authorisation puts status at risk." },
      { t: "On-campus employment", b: "Generally up to 20 hours per week while classes are in session, and full time during official breaks. Confirm the rules with the DSO before accepting anything." },
      { t: "CPT and OPT", b: "Curricular Practical Training covers work that is part of the curriculum, usually an internship tied to a course. Optional Practical Training is work authorisation related to the field of study, applied for through the DSO with USCIS and with its own timing rules. Both start with the DSO, months ahead." },
      { t: "Social Security number", b: "Issued once the student has a qualifying job offer, through the Social Security Administration. It is not needed to open most student bank accounts." },
      { t: "Keep the DSO informed", b: "Address changes, programme changes, funding changes and any plan to travel out of the country all go through the international student office first." }
    ],
    links: [
      { t: "Maintaining F-1 status (Study in the States)", u: "https://studyinthestates.dhs.gov/students" },
      { t: "Social Security Administration", u: "https://www.ssa.gov" },
      { t: "NAFSA international student resources", u: "https://www.nafsa.org" }
    ]
  }
];
