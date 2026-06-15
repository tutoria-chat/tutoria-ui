# -*- coding: utf-8 -*-
"""
User-guide content for TutorIA, in 3 languages. Single source for both the
.docx export and the in-app viewer (see build_user_guide.py).

Block tuples: ('h3', text) ('p', text) ('ul', [..]) ('ol', [..])
              ('tip'|'warn'|'info', text)
"""

EN = {
    "title": "User Guide",
    "subtitle": "The complete guide for administrators, managers and professors",
    "updated": "Updated June 2026",
    "tocTitle": "Table of contents",
    "sections": [
        ("introduction", "1. Welcome to TutorIA", [
            ("p", "TutorIA is an AI-powered tutoring platform that lets your institution offer students 24/7 help based on your own course materials. You upload the content (PDFs, slides, documents, video transcripts); TutorIA reads it and answers students' questions in context — like a teaching assistant that has read every page and never sleeps."),
            ("p", "This guide covers everything the people who run TutorIA need: how to set up institutions, courses and the AI tutor, how to load materials and quizzes, how the student experience works, and how to read the analytics. You do not need to be technical to follow it."),
            ("h3", "The two surfaces"),
            ("ul", [
                "Management dashboard — where administrators, managers and professors log in to set everything up and view analytics. That is the app you are reading this guide in.",
                "Student widget (“Erwin”) — a lightweight chat that students open through a link or embedded on your portal. Students never create an account or log in.",
            ]),
            ("tip", "Students don't log in. They reach the tutor through a course link (an “access token”). You decide what each link can do."),
        ]),

        ("roles", "2. Roles & access levels", [
            ("p", "What you can see and do in TutorIA depends on your role. There are three staff roles plus the (login-free) student."),
            ("h3", "Super administrator"),
            ("p", "Platform-wide access. Manages every institution, creates other administrators, and can scope any screen to any institution. This role is for the TutorIA platform owners."),
            ("h3", "Manager (admin professor)"),
            ("p", "Full control of a single institution: its courses, modules, professors, students, analytics and billing. Everything they see is automatically limited to their own institution."),
            ("h3", "Professor"),
            ("p", "Works within the courses they are assigned to: uploads materials, configures the tutor, builds quizzes, manages the calendar and sees analytics for their courses."),
            ("h3", "Student"),
            ("p", "Uses only the widget. No password, no dashboard. Identified optionally by a student ID so professors can see per-student activity."),
            ("info", "If a menu item or button described in this guide isn't visible to you, it's almost always because your role doesn't include it. Ask a manager or super admin."),
        ]),

        ("getting-started", "3. Logging in & getting around", [
            ("ol", [
                "Open the dashboard URL your institution gave you and sign in with your username and password.",
                "If you forgot your password, use “Forgot password” on the login screen to receive a reset link by email.",
                "Use the left sidebar to navigate. The items you see depend on your role.",
                "Use the language switcher to read the dashboard in Portuguese, English or Spanish. The interface language is independent of the language your AI tutor replies in.",
            ]),
            ("p", "The Dashboard (home) shows a quick overview: recent activity, a daily AI-written summary of what students asked, and shortcuts to the areas you use most."),
            ("tip", "Access tokens for the access expire after 30 minutes of inactivity for security; just sign in again. You won't lose any work."),
        ]),

        ("institutions", "4. Institutions", [
            ("p", "An institution (“Instituição de Ensino”) is the top-level container — a university, school or training company. Super admins create and manage them; managers see only their own."),
            ("h3", "Creating an institution (super admin)"),
            ("ol", [
                "Go to Institutions in the sidebar and click New institution.",
                "Fill in the name and code.",
                "Save. You can now create courses, professors and students under it.",
            ]),
            ("p", "Opening an institution shows its courses, staff and a summary of usage. Most day-to-day work happens one level down, inside a course."),
        ]),

        ("courses", "5. Courses", [
            ("p", "A course is a subject or class — e.g. “Calculus I” or “Organic Chemistry”. Courses hold modules, students, a calendar and (optionally) an ENEM question bank."),
            ("h3", "Creating a course"),
            ("ol", [
                "Go to Courses and click New course.",
                "Give it a name and (optionally) a description and the institution it belongs to.",
                "Optionally set the discipline tracks used for student titles (see Titles) — e.g. math, science, language. If you leave them blank, TutorIA infers them from the course name.",
                "Save, then open the course to add modules and enroll students.",
            ]),
            ("p", "Inside a course you'll find tabs for its Modules, Students, Calendar and Assignments. Each is covered in its own section below."),
        ]),

        ("modules", "6. Modules & the AI tutor", [
            ("p", "A module is a unit within a course (a chapter, topic or class). The AI tutor is configured per module, so each one can have its own materials, personality and language."),
            ("h3", "Creating a module"),
            ("ol", [
                "Open a course and go to the Modules tab; click New module.",
                "Name it and write the system prompt — the instructions that shape how the tutor behaves (tone, what to focus on, what to avoid).",
                "Choose the tutor's reply language (Portuguese, English or Spanish).",
                "Pick which AI model powers it (or leave the institution default).",
                "Save, then upload the module's materials.",
            ]),
            ("h3", "How the tutor answers"),
            ("p", "When a student asks something, TutorIA searches the module's uploaded materials for the most relevant passages and sends them to the AI model together with your system prompt. The answer is therefore grounded in your content, not the model's general knowledge."),
            ("p", "The tutor automatically mirrors the student: it replies in whatever language the student writes in, falling back to the module's configured language when that's unclear. It also adopts a teaching style suited to the discipline (a maths tutor works through steps; a history tutor explains context)."),
            ("tip", "Use “Improve prompt” to have AI rewrite your system prompt into a clearer, more effective version — then tweak it."),
            ("warn", "Keep the system prompt focused. “Answer only using the course materials; if it's not covered, say so” is far more reliable than a long, vague prompt."),
        ]),

        ("materials", "7. Course materials & files", [
            ("p", "Materials are the source of truth for the tutor's answers. The more complete your uploads, the better the help students get."),
            ("h3", "Uploading files"),
            ("ol", [
                "Open a module and upload files (PDF, Word, PowerPoint, Excel, text).",
                "TutorIA automatically extracts the text in the background — large PDFs may take a minute.",
                "Once a file shows as ready, its content is available to the tutor and for quiz generation.",
            ]),
            ("h3", "Video transcripts"),
            ("p", "You can add YouTube videos; TutorIA fetches or generates a transcript so the tutor can answer questions about the video's content too."),
            ("info", "Supported file types: PDF, DOCX/DOC, PPTX, XLSX/XLS, CSV and TXT. Maximum 10 MB per file for the quiz/calendar importers."),
        ]),

        ("quizzes", "8. Quizzes", [
            ("p", "Quizzes let students test themselves. TutorIA can generate them automatically from your materials, or you can import a question bank you already have."),
            ("h3", "Auto-generated quizzes"),
            ("p", "After a module's materials are processed, TutorIA generates multiple-choice questions (with explanations for each option) drawn from the content. Students answer them in the widget and get instant feedback."),
            ("h3", "Importing questions from a file"),
            ("ol", [
                "In the module, choose to upload a quiz file (PDF, Word, Excel, CSV).",
                "TutorIA reads it and extracts the questions, options and correct answers.",
                "Review the extracted questions, fix anything that's off, then confirm to publish them.",
            ]),
            ("warn", "Always review imported questions before confirming — automatic extraction is good but not perfect, especially the marked correct answer."),
        ]),

        ("enem", "9. ENEM / Vestibular question bank", [
            ("p", "For Brazilian institutions, TutorIA includes a bank of real, past ENEM exam questions with explanations, plus the ability to practice by knowledge area. ENEM is enabled per course, so institutions that don't need it never see it."),
            ("h3", "Enabling ENEM for a course"),
            ("ol", [
                "Open the course's settings and turn on the ENEM / Vestibular module.",
                "Choose the knowledge area(s) relevant to the course (Languages, Humanities, Natural Sciences, Mathematics).",
                "Questions are immediately available to students — they don't have to generate anything.",
            ]),
            ("h3", "The ENEM bank (staff)"),
            ("p", "Managers and professors can browse the available questions by year and area from the ENEM Bank page. Super admins can import additional past-exam years into the shared bank."),
            ("p", "Students practice through the widget's ENEM/Vestibular tab as a timed or untimed simulado, with explanations after each answer."),
        ]),

        ("calendar", "10. Course calendar", [
            ("p", "Every course has a calendar of dated events — tests, assignment due dates, holidays, field trips and anything else. Events appear for students in the widget and can trigger reminder emails."),
            ("h3", "Adding an event"),
            ("ol", [
                "Open a course and go to the Calendar tab; click Add event.",
                "Pick the type (test, assignment, holiday, field event, other), title, date and time.",
                "Choose which email reminders to send students: 7 days, 3 days, 2 days and/or 24 hours before.",
                "Save. The event shows on the month grid and in the student's upcoming list.",
            ]),
            ("info", "All times are entered and shown in Brasília time (America/São_Paulo) and stored consistently, so students and staff always see the same moment."),
            ("tip", "Assignments created in the Assignments tab automatically appear on the calendar on their due date — you only need to add separate events for things that aren't assignments."),
        ]),

        ("calendar-import", "11. Importing the calendar (PDF & external calendars)", [
            ("p", "Typing every date by hand is tedious, so TutorIA can build the calendar for you in two ways. Both end the same way: you review and edit the suggested events, then confirm — nothing is added until you approve it."),
            ("h3", "Import from a PDF or document"),
            ("ol", [
                "On the Calendar tab, click Import from PDF and keep the “Upload file” option.",
                "Upload your syllabus or schedule (PDF, Word, Excel, CSV).",
                "AI reads the file and extracts the dated events into an editable table.",
                "Fix titles, types, dates and times as needed, choose the reminder defaults, and click Confirm to add them.",
            ]),
            ("h3", "Import from Google / Outlook / Apple Calendar"),
            ("p", "You can pull events straight from an existing calendar using its private iCal link — no account connection required."),
            ("ol", [
                "Click Import from PDF, then switch to the “From calendar link” tab.",
                "Paste your calendar's secret iCal address. In Google Calendar: Settings → your calendar → “Secret address in iCal format”. In Outlook: Settings → Calendar → Shared calendars → Publish → copy the ICS link.",
                "TutorIA fetches the calendar and lists its events in the same review table.",
                "Review, set reminders, and Confirm.",
            ]),
            ("warn", "Treat the secret iCal address like a password — anyone with it can read that calendar. Paste only calendars you own or manage."),
        ]),

        ("students", "12. Students & access", [
            ("p", "Students are records used to link activity to a real person and to give them access to the tutor. They never log in."),
            ("h3", "Adding students"),
            ("ul", [
                "Import a spreadsheet (CSV) of students — name, email and student ID — to create many at once.",
                "Enroll students into the courses they belong to.",
                "Remove students in bulk from the Students overview when needed.",
            ]),
            ("h3", "Access tokens (how students reach the tutor)"),
            ("p", "An access token is a long, unique link tied to a module. Share it with students (or embed it in your portal) and they can chat with the tutor. For each token you control whether students can chat, download files, and whether a student ID / matrícula must be verified first."),
            ("ol", [
                "Go to Access Tokens (Chaves de Acesso) and create a token for a module.",
                "Set its permissions and, if you want per-student tracking, require a student ID.",
                "Copy the link, or copy the ready-made embed snippet to put the widget inside an existing web page.",
            ]),
            ("tip", "Add “&student_id=...” to a token link to attribute that session to a specific student, so their questions show up in analytics under their name."),
        ]),

        ("widget", "13. The student experience (Erwin widget)", [
            ("p", "Everything students touch lives in the widget. It's deliberately simple, works on phones, and needs no installation. Here's what students can do, so you know what you're enabling for them."),
            ("ul", [
                "Chat with the tutor — ask questions and get answers grounded in the course materials, with math and code nicely formatted.",
                "Past conversations — pick up where they left off.",
                "Study plans — generate a personalized plan for a course (one per course per week).",
                "Flashcards — review key concepts, with spaced repetition that brings back the ones they struggle with.",
                "Quizzes & ENEM — practice and get instant, explained feedback.",
                "Home & upcoming — see the next test or deadline at a glance.",
                "Progress, leaderboards & titles — track XP, level and achievements (see the next two sections).",
            ]),
            ("h3", "Customizing the widget"),
            ("p", "The embed link accepts options for dark mode, streaming answers, and brand colors (button, student bubble, tutor bubble), so the widget can match your institution's look."),
            ("info", "Some things are global to the student, not per-course: their XP, level, streak and titles are the same everywhere they study. Quizzes, materials and the tutor are per module."),
        ]),

        ("gamification", "14. Gamification: XP, levels & badges", [
            ("p", "TutorIA rewards consistent studying to keep students engaged. It's automatic — you don't have to configure anything — but it helps to understand how it works."),
            ("h3", "XP and levels"),
            ("p", "Students earn XP (experience points) for studying: asking good questions, completing quizzes, reviewing flashcards, generating study plans and practicing ENEM. Daily caps stop point-farming. XP accumulates into levels, and levels into tiers: Bronze → Silver → Gold → Platinum → Diamond → Crystal."),
            ("info", "Level, tier, XP and streak are GLOBAL per student — a single total across every course they're enrolled in. Students don't grind a separate level for each subject."),
            ("h3", "Streaks"),
            ("p", "Studying on consecutive days builds a streak. Streaks are the strongest signal of a committed student, and feed several of the titles below. A reminder email nudges students whose streak is about to break."),
            ("h3", "Badges & weekly challenges"),
            ("p", "Students earn one-off badges for milestones (first steps, 10/50 questions, a perfect quiz, 7- and 30-day streaks, reaching level 10, making a study plan). Each week there are small challenges (e.g. 10 questions, 3 quizzes) that grant bonus XP when completed."),
        ]),

        ("titles", "15. Titles & achievements", [
            ("p", "Titles are collectible, equippable honors students can show off. They're a big part of what keeps students coming back — and yes, staff can see which titles students have earned."),
            ("h3", "Track titles"),
            ("p", "Per-discipline ladders (Apprentice → Master → Legend) earned by accumulating XP in a subject area such as math, science or languages."),
            ("h3", "Global titles"),
            ("p", "Prestige titles for overall milestones — long streaks, high levels and large total XP (e.g. Dedicated, Relentless, Veteran, Centurion, Scholar, Immortal)."),
            ("h3", "Hidden & easter-egg titles"),
            ("p", "Some titles are secret, shown as “???” until unlocked, with playful cryptic hints. There's one prestige hidden title for sustained mastery (a 90-day streak at a high level), plus themed “easter-egg” titles students discover by chatting about popular franchises — e.g. asking the tutor to explain something “in a Naruto way” or mentioning Star Wars, JoJo, football or the gym flips the tutor into that style for one reply and unlocks a title."),
            ("h3", "The One — semester champion"),
            ("p", "At the end of a configured semester, the #1 student by XP in each course is crowned with a permanent “The One” trophy showing the course and term (e.g. “The One — Calculus I 2026.1”). See Semesters to set the term dates."),
            ("h3", "Celebrations"),
            ("p", "When a student earns a title, the widget pops a toast with a sound and a confetti burst. Students can choose which earned title to display on their profile."),
            ("tip", "Show off student titles in your classes — they appear next to students' names in the Students screens and in the analytics Rankings tab, and recognizing them publicly drives engagement."),
        ]),

        ("analytics", "16. Analytics & reports", [
            ("p", "Analytics turn student activity into insight. Open Analytics from the sidebar; use the date range and (for super admins) the institution filter at the top. The page is organized into tabs."),
            ("ul", [
                "Overview — a daily AI-written briefing, unique active students, questions per module and most-asked topics.",
                "Engagement & Risk — students who have gone quiet, plus AI risk predictions of who may be falling behind (exportable as CSV).",
                "Courses — engagement per course and discipline, with pedagogical alerts (e.g. a class emptying out, or a concept most students fail).",
                "Content — what students ask about most, useful for spotting gaps in your materials.",
                "Quizzes — concept-level pass/fail rates, a difficulty heatmap and the hardest concepts. If it's empty, use “Refresh quiz data” (it otherwise rebuilds nightly).",
                "Rankings — student leaderboards and positive highlights (next section).",
            ]),
            ("h3", "Exports"),
            ("p", "Download the analytics as a PDF, or generate an Executive Report for a higher-level summary suitable for sharing with leadership."),
            ("info", "Most analytics are pre-computed nightly for speed, so brand-new activity may take until the next day to appear. Quiz data has a “Refresh” button for when you need it immediately."),
        ]),

        ("rankings", "17. Rankings & highlights", [
            ("p", "The Rankings tab in Analytics gives professors and managers a positive, motivating view of their students — the counterpart to the at-risk lists."),
            ("ul", [
                "Top performers — the leaderboard by total XP, with each student's level, tier and equipped title.",
                "Most improved — the biggest XP gains over the selected period, celebrating effort rather than just standing.",
                "Engagement wins — longest streaks, most active students, and totals for questions asked, quizzes taken and study plans made.",
                "Achievements — who has earned the most badges, and the titles students are wearing.",
            ]),
            ("tip", "Use “Most improved” to recognize students who are working hard even if they're not at the top — it's often more motivating than the raw leaderboard."),
        ]),

        ("semesters", "18. Semesters & the semester champion", [
            ("p", "Semesters let your institution define term date ranges. They power the “The One” champion title: when a term ends, TutorIA looks at each course's activity during that window and crowns the top student."),
            ("ol", [
                "Open Semesters from the sidebar (managers and above).",
                "Create a semester with a label (e.g. “2026.1”) and its start and end dates.",
                "When the end date passes, champions are awarded automatically — no further action needed.",
            ]),
            ("info", "If you don't configure semesters, the champion simply isn't crowned; everything else keeps working."),
        ]),

        ("plans", "19. Plans, subscriptions & AI models", [
            ("h3", "Plans & subscriptions"),
            ("p", "Plans define what an institution can do (limits and features such as assignments). Subscriptions tie an institution to a plan and handle billing. Super admins manage the catalog of plans; managers see their institution's current subscription."),
            ("h3", "AI models"),
            ("p", "TutorIA can use several AI providers. From the AI Models screen you manage which models are available and toggle special roles for each:"),
            ("ul", [
                "Used for file extraction — reads documents to pull out text.",
                "Used for formatting — cleans up the tutor's answers into tidy Markdown and math.",
                "Used for topic classification — groups student questions into topics for analytics.",
            ]),
            ("p", "Institutions can also supply their own provider API keys, which are stored encrypted."),
        ]),

        ("admin", "20. Permissions, audit logs & privacy (LGPD)", [
            ("h3", "Permissions"),
            ("p", "Fine-grained permissions let you grant or restrict specific abilities beyond the basic roles. Managers and super admins manage them from the Permissions screen."),
            ("h3", "Audit logs"),
            ("p", "Every significant change (who created, edited or deleted what) is recorded in the Audit Logs, filterable by user, action and date and exportable to CSV — useful for accountability and compliance."),
            ("h3", "Privacy / LGPD"),
            ("p", "TutorIA is built for Brazilian data-protection rules. Students can give consent, export their data, and request deletion through the widget's privacy options. Raw chat and quiz data auto-expire after 90 days; only anonymized aggregates are kept long-term for analytics."),
        ]),

        ("tips", "21. Tips, best practices & troubleshooting", [
            ("h3", "Getting the best answers"),
            ("ul", [
                "Upload complete, text-based materials. Scanned image-only PDFs extract poorly — prefer real text.",
                "Write a focused system prompt and tell the tutor to stay within the course content.",
                "Add a few quizzes and flashcards early; they drive engagement and give you analytics signal.",
            ]),
            ("h3", "Common questions"),
            ("ul", [
                "“A student says the tutor doesn't know something.” Check that the relevant file is uploaded and shows as ready, and that the module's materials actually cover it.",
                "“The Quizzes analytics tab is empty.” Either no quizzes have been answered yet, or the nightly aggregation hasn't run — click Refresh quiz data.",
                "“My progress / a student's progress isn't moving.” Activity is rewarded with daily caps; make sure the student is identified (student_id on the link) so it's attributed to them.",
                "“Reminders aren't arriving.” Confirm the event has reminder options switched on and that the student has a valid email on file.",
            ]),
            ("p", "Still stuck? Contact your TutorIA administrator or the platform team — and check this guide's matching DOCX download for an offline copy you can share."),
        ]),
    ],
}

PT = {
    "title": "Guia do Usuário",
    "subtitle": "O guia completo para administradores, gestores e professores",
    "updated": "Atualizado em junho de 2026",
    "tocTitle": "Sumário",
    "sections": [
        ("introduction", "1. Bem-vindo à TutorIA", [
            ("p", "A TutorIA é uma plataforma de tutoria com inteligência artificial que permite à sua instituição oferecer aos alunos ajuda 24 horas por dia, baseada no seu próprio material didático. Você envia o conteúdo (PDFs, slides, documentos, transcrições de vídeo); a TutorIA o lê e responde às perguntas dos alunos no contexto — como um monitor que leu cada página e nunca dorme."),
            ("p", "Este guia cobre tudo o que quem opera a TutorIA precisa: como configurar instituições, cursos e o tutor de IA, como carregar materiais e quizzes, como funciona a experiência do aluno e como ler as análises. Você não precisa ser técnico para acompanhá-lo."),
            ("h3", "As duas interfaces"),
            ("ul", [
                "Painel de gestão — onde administradores, gestores e professores fazem login para configurar tudo e ver análises. É o aplicativo em que você está lendo este guia.",
                "Widget do aluno (“Erwin”) — um chat leve que os alunos abrem por um link ou incorporado ao seu portal. Os alunos nunca criam conta nem fazem login.",
            ]),
            ("tip", "Os alunos não fazem login. Eles acessam o tutor por um link do curso (uma “chave de acesso”). Você decide o que cada link pode fazer."),
        ]),

        ("roles", "2. Perfis e níveis de acesso", [
            ("p", "O que você pode ver e fazer na TutorIA depende do seu perfil. São três perfis de equipe, além do aluno (sem login)."),
            ("h3", "Super administrador"),
            ("p", "Acesso a toda a plataforma. Gerencia todas as instituições, cria outros administradores e pode filtrar qualquer tela por qualquer instituição. Este perfil é para os donos da plataforma TutorIA."),
            ("h3", "Gestor (professor administrador)"),
            ("p", "Controle total de uma única instituição: seus cursos, módulos, professores, alunos, análises e cobrança. Tudo o que vê fica automaticamente limitado à sua instituição."),
            ("h3", "Professor"),
            ("p", "Atua nos cursos a que está vinculado: envia materiais, configura o tutor, cria quizzes, gerencia o calendário e vê análises dos seus cursos."),
            ("h3", "Aluno"),
            ("p", "Usa apenas o widget. Sem senha, sem painel. Identificado opcionalmente por uma matrícula, para que os professores vejam a atividade por aluno."),
            ("info", "Se algum item de menu ou botão descrito neste guia não aparecer para você, quase sempre é porque seu perfil não o inclui. Fale com um gestor ou super administrador."),
        ]),

        ("getting-started", "3. Login e navegação", [
            ("ol", [
                "Abra o endereço do painel que sua instituição forneceu e entre com seu usuário e senha.",
                "Se esqueceu a senha, use “Esqueci minha senha” na tela de login para receber um link de redefinição por e-mail.",
                "Use a barra lateral esquerda para navegar. Os itens visíveis dependem do seu perfil.",
                "Use o seletor de idioma para ler o painel em português, inglês ou espanhol. O idioma da interface é independente do idioma em que o tutor de IA responde.",
            ]),
            ("p", "O Painel (início) mostra uma visão rápida: atividade recente, um resumo diário escrito por IA sobre o que os alunos perguntaram e atalhos para as áreas que você mais usa."),
            ("tip", "Por segurança, a sessão expira após 30 minutos de inatividade; basta entrar novamente. Você não perderá nenhum trabalho."),
        ]),

        ("institutions", "4. Instituições de ensino", [
            ("p", "Uma instituição de ensino é o contêiner de nível mais alto — uma universidade, escola ou empresa de treinamento. Super admins as criam e gerenciam; gestores veem apenas a sua."),
            ("h3", "Criando uma instituição (super admin)"),
            ("ol", [
                "Vá em Instituições de Ensino na barra lateral e clique em Nova instituição.",
                "Preencha o nome e o código.",
                "Salve. Agora você pode criar cursos, professores e alunos dentro dela.",
            ]),
            ("p", "Ao abrir uma instituição, você vê seus cursos, sua equipe e um resumo de uso. A maior parte do trabalho do dia a dia acontece um nível abaixo, dentro de um curso."),
        ]),

        ("courses", "5. Cursos", [
            ("p", "Um curso é uma disciplina ou turma — por exemplo, “Cálculo I” ou “Química Orgânica”. Os cursos contêm módulos, alunos, um calendário e (opcionalmente) um banco de questões do ENEM."),
            ("h3", "Criando um curso"),
            ("ol", [
                "Vá em Cursos e clique em Novo curso.",
                "Dê um nome e (opcionalmente) uma descrição e a instituição a que pertence.",
                "Opcionalmente, defina as trilhas de disciplina usadas para os títulos dos alunos (veja Títulos) — ex.: matemática, ciências, linguagens. Se deixar em branco, a TutorIA infere a partir do nome do curso.",
                "Salve e abra o curso para adicionar módulos e matricular alunos.",
            ]),
            ("p", "Dentro de um curso há abas para Módulos, Alunos, Calendário e Atividades. Cada uma é detalhada nas seções abaixo."),
        ]),

        ("modules", "6. Módulos e o tutor de IA", [
            ("p", "Um módulo é uma unidade dentro de um curso (um capítulo, tópico ou aula). O tutor de IA é configurado por módulo, então cada um pode ter seus próprios materiais, personalidade e idioma."),
            ("h3", "Criando um módulo"),
            ("ol", [
                "Abra um curso, vá na aba Módulos e clique em Novo módulo.",
                "Dê um nome e escreva o prompt do sistema — as instruções que moldam o comportamento do tutor (tom, foco, o que evitar).",
                "Escolha o idioma de resposta do tutor (português, inglês ou espanhol).",
                "Selecione qual modelo de IA o alimenta (ou deixe o padrão da instituição).",
                "Salve e então envie os materiais do módulo.",
            ]),
            ("h3", "Como o tutor responde"),
            ("p", "Quando um aluno pergunta algo, a TutorIA busca nos materiais do módulo os trechos mais relevantes e os envia ao modelo de IA junto com o seu prompt do sistema. A resposta, portanto, é fundamentada no seu conteúdo, não no conhecimento geral do modelo."),
            ("p", "O tutor espelha automaticamente o aluno: responde no idioma em que o aluno escreve, recorrendo ao idioma configurado do módulo quando isso não está claro. Ele também adota um estilo de ensino adequado à disciplina (um tutor de matemática resolve passo a passo; um de história explica o contexto)."),
            ("tip", "Use “Melhorar prompt” para a IA reescrever seu prompt do sistema em uma versão mais clara e eficaz — depois ajuste."),
            ("warn", "Mantenha o prompt do sistema focado. “Responda apenas com base no material do curso; se não estiver coberto, diga isso” é muito mais confiável do que um prompt longo e vago."),
        ]),

        ("materials", "7. Materiais e arquivos do curso", [
            ("p", "Os materiais são a fonte da verdade para as respostas do tutor. Quanto mais completos os envios, melhor a ajuda que os alunos recebem."),
            ("h3", "Enviando arquivos"),
            ("ol", [
                "Abra um módulo e envie arquivos (PDF, Word, PowerPoint, Excel, texto).",
                "A TutorIA extrai o texto automaticamente em segundo plano — PDFs grandes podem levar um minuto.",
                "Quando um arquivo aparece como pronto, seu conteúdo fica disponível para o tutor e para a geração de quizzes.",
            ]),
            ("h3", "Transcrições de vídeo"),
            ("p", "Você pode adicionar vídeos do YouTube; a TutorIA obtém ou gera uma transcrição para que o tutor também responda sobre o conteúdo do vídeo."),
            ("info", "Tipos de arquivo aceitos: PDF, DOCX/DOC, PPTX, XLSX/XLS, CSV e TXT. Máximo de 10 MB por arquivo nos importadores de quiz/calendário."),
        ]),

        ("quizzes", "8. Quizzes", [
            ("p", "Os quizzes permitem que os alunos se testem. A TutorIA pode gerá-los automaticamente a partir dos seus materiais, ou você pode importar um banco de questões que já tenha."),
            ("h3", "Quizzes gerados automaticamente"),
            ("p", "Depois que os materiais de um módulo são processados, a TutorIA gera questões de múltipla escolha (com explicação para cada alternativa) a partir do conteúdo. Os alunos respondem no widget e recebem feedback imediato."),
            ("h3", "Importando questões de um arquivo"),
            ("ol", [
                "No módulo, escolha enviar um arquivo de quiz (PDF, Word, Excel, CSV).",
                "A TutorIA o lê e extrai as questões, alternativas e respostas corretas.",
                "Revise as questões extraídas, corrija o que estiver errado e confirme para publicá-las.",
            ]),
            ("warn", "Sempre revise as questões importadas antes de confirmar — a extração automática é boa, mas não perfeita, especialmente quanto à alternativa correta marcada."),
        ]),

        ("enem", "9. Banco de questões do ENEM / Vestibular", [
            ("p", "Para instituições brasileiras, a TutorIA inclui um banco de questões reais de provas anteriores do ENEM com explicações, além de prática por área de conhecimento. O ENEM é ativado por curso, então instituições que não precisam dele nunca o veem."),
            ("h3", "Ativando o ENEM em um curso"),
            ("ol", [
                "Abra as configurações do curso e ative o módulo ENEM / Vestibular.",
                "Escolha a(s) área(s) de conhecimento relevante(s) para o curso (Linguagens, Humanas, Natureza, Matemática).",
                "As questões ficam disponíveis imediatamente para os alunos — eles não precisam gerar nada.",
            ]),
            ("h3", "O banco ENEM (equipe)"),
            ("p", "Gestores e professores podem navegar pelas questões disponíveis por ano e área na página Banco ENEM. Super admins podem importar anos adicionais de provas para o banco compartilhado."),
            ("p", "Os alunos praticam pela aba ENEM/Vestibular do widget como um simulado, com ou sem tempo, com explicações após cada resposta."),
        ]),

        ("calendar", "10. Calendário do curso", [
            ("p", "Todo curso tem um calendário de eventos com data — provas, prazos de atividades, feriados, visitas de campo e o que mais houver. Os eventos aparecem para os alunos no widget e podem disparar e-mails de lembrete."),
            ("h3", "Adicionando um evento"),
            ("ol", [
                "Abra um curso e vá na aba Calendário; clique em Adicionar evento.",
                "Escolha o tipo (prova, atividade, feriado, evento de campo, outro), o título, a data e a hora.",
                "Escolha quais lembretes por e-mail enviar aos alunos: 7 dias, 3 dias, 2 dias e/ou 24 horas antes.",
                "Salve. O evento aparece na grade do mês e na lista de próximos do aluno.",
            ]),
            ("info", "Todos os horários são inseridos e exibidos no horário de Brasília (America/São_Paulo) e armazenados de forma consistente, para que alunos e equipe vejam sempre o mesmo momento."),
            ("tip", "Atividades criadas na aba Atividades aparecem automaticamente no calendário na data de entrega — você só precisa adicionar eventos separados para coisas que não sejam atividades."),
        ]),

        ("calendar-import", "11. Importando o calendário (PDF e calendários externos)", [
            ("p", "Digitar cada data à mão é cansativo, então a TutorIA pode montar o calendário para você de duas formas. Ambas terminam igual: você revisa e edita os eventos sugeridos e confirma — nada é adicionado até você aprovar."),
            ("h3", "Importar de um PDF ou documento"),
            ("ol", [
                "Na aba Calendário, clique em Importar de PDF e mantenha a opção “Enviar arquivo”.",
                "Envie seu plano de ensino ou cronograma (PDF, Word, Excel, CSV).",
                "A IA lê o arquivo e extrai os eventos com data em uma tabela editável.",
                "Ajuste títulos, tipos, datas e horários conforme necessário, escolha os lembretes padrão e clique em Confirmar para adicioná-los.",
            ]),
            ("h3", "Importar do Google / Outlook / Apple Agenda"),
            ("p", "Você pode trazer eventos diretamente de uma agenda existente usando o link iCal privado dela — sem precisar conectar a conta."),
            ("ol", [
                "Clique em Importar de PDF e mude para a aba “De um link de calendário”.",
                "Cole o endereço iCal secreto da sua agenda. No Google Agenda: Configurações → sua agenda → “Endereço secreto no formato iCal”. No Outlook: Configurações → Calendário → Calendários compartilhados → Publicar → copie o link ICS.",
                "A TutorIA busca a agenda e lista os eventos na mesma tabela de revisão.",
                "Revise, defina os lembretes e Confirme.",
            ]),
            ("warn", "Trate o endereço iCal secreto como uma senha — qualquer pessoa com ele pode ler aquela agenda. Cole apenas agendas que você possui ou administra."),
        ]),

        ("students", "12. Alunos e acesso", [
            ("p", "Alunos são registros usados para vincular a atividade a uma pessoa real e dar acesso ao tutor. Eles nunca fazem login."),
            ("h3", "Adicionando alunos"),
            ("ul", [
                "Importe uma planilha (CSV) de alunos — nome, e-mail e matrícula — para criar vários de uma vez.",
                "Matricule os alunos nos cursos a que pertencem.",
                "Remova alunos em massa pela visão geral de Alunos quando necessário.",
            ]),
            ("h3", "Chaves de acesso (como os alunos acessam o tutor)"),
            ("p", "Uma chave de acesso é um link longo e único associado a um módulo. Compartilhe-o com os alunos (ou incorpore-o ao seu portal) e eles poderão conversar com o tutor. Para cada chave, você controla se os alunos podem conversar, baixar arquivos e se uma matrícula precisa ser verificada antes."),
            ("ol", [
                "Vá em Chaves de Acesso e crie uma chave para um módulo.",
                "Defina suas permissões e, se quiser acompanhamento por aluno, exija uma matrícula.",
                "Copie o link, ou copie o trecho de incorporação pronto para colocar o widget dentro de uma página da web existente.",
            ]),
            ("tip", "Adicione “&student_id=...” ao link da chave para atribuir aquela sessão a um aluno específico, de modo que as perguntas dele apareçam nas análises com o nome dele."),
        ]),

        ("widget", "13. A experiência do aluno (widget Erwin)", [
            ("p", "Tudo o que os alunos usam fica no widget. Ele é deliberadamente simples, funciona no celular e não precisa de instalação. Veja o que os alunos podem fazer, para você saber o que está habilitando."),
            ("ul", [
                "Conversar com o tutor — fazer perguntas e receber respostas fundamentadas no material do curso, com matemática e código bem formatados.",
                "Conversas anteriores — retomar de onde pararam.",
                "Planos de estudo — gerar um plano personalizado para um curso (um por curso por semana).",
                "Flashcards — revisar conceitos-chave, com repetição espaçada que retoma os que têm mais dificuldade.",
                "Quizzes e ENEM — praticar e receber feedback imediato e explicado.",
                "Início e próximos — ver a próxima prova ou prazo num relance.",
                "Progresso, rankings e títulos — acompanhar XP, nível e conquistas (veja as duas próximas seções).",
            ]),
            ("h3", "Personalizando o widget"),
            ("p", "O link de incorporação aceita opções de modo escuro, respostas em streaming e cores da marca (botão, balão do aluno, balão do tutor), para o widget combinar com a identidade da sua instituição."),
            ("info", "Algumas coisas são globais do aluno, não por curso: XP, nível, sequência e títulos são os mesmos em todos os lugares onde ele estuda. Quizzes, materiais e o tutor são por módulo."),
        ]),

        ("gamification", "14. Gamificação: XP, níveis e medalhas", [
            ("p", "A TutorIA recompensa o estudo constante para manter os alunos engajados. É automático — você não precisa configurar nada — mas ajuda entender como funciona."),
            ("h3", "XP e níveis"),
            ("p", "Os alunos ganham XP (pontos de experiência) por estudar: fazer boas perguntas, completar quizzes, revisar flashcards, gerar planos de estudo e praticar ENEM. Limites diários evitam o acúmulo artificial de pontos. O XP se acumula em níveis, e os níveis em patamares: Bronze → Prata → Ouro → Platina → Diamante → Cristal."),
            ("info", "Nível, patamar, XP e sequência são GLOBAIS por aluno — um único total em todos os cursos em que está matriculado. O aluno não precisa subir um nível separado para cada disciplina."),
            ("h3", "Sequências (streaks)"),
            ("p", "Estudar em dias consecutivos cria uma sequência. As sequências são o sinal mais forte de um aluno comprometido e alimentam vários dos títulos abaixo. Um e-mail de lembrete cutuca os alunos cuja sequência está prestes a quebrar."),
            ("h3", "Medalhas e desafios semanais"),
            ("p", "Os alunos ganham medalhas pontuais por marcos (primeiros passos, 10/50 perguntas, um quiz perfeito, sequências de 7 e 30 dias, chegar ao nível 10, montar um plano de estudo). A cada semana há pequenos desafios (ex.: 10 perguntas, 3 quizzes) que dão XP bônus ao serem cumpridos."),
        ]),

        ("titles", "15. Títulos e conquistas", [
            ("p", "Títulos são honrarias colecionáveis e equipáveis que os alunos podem exibir. São uma grande parte do que faz os alunos voltarem — e sim, a equipe pode ver quais títulos os alunos conquistaram."),
            ("h3", "Títulos de trilha"),
            ("p", "Escadas por disciplina (Aprendiz → Mestre → Lenda) conquistadas acumulando XP em uma área como matemática, ciências ou linguagens."),
            ("h3", "Títulos globais"),
            ("p", "Títulos de prestígio por marcos gerais — sequências longas, níveis altos e muito XP total (ex.: Dedicado, Incansável, Veterano, Centurião, Erudito, Imortal)."),
            ("h3", "Títulos ocultos e secretos (easter eggs)"),
            ("p", "Alguns títulos são secretos, exibidos como “???” até serem desbloqueados, com dicas enigmáticas e divertidas. Há um título oculto de prestígio para maestria sustentada (uma sequência de 90 dias em um nível alto), além de títulos secretos temáticos que os alunos descobrem conversando sobre franquias populares — por exemplo, pedir ao tutor para explicar algo “estilo Naruto” ou mencionar Star Wars, JoJo, futebol ou academia faz o tutor responder naquele estilo por uma mensagem e desbloqueia um título."),
            ("h3", "O Escolhido — campeão do semestre"),
            ("p", "Ao fim de um semestre configurado, o aluno nº 1 em XP de cada curso é coroado com um troféu permanente “O Escolhido”, mostrando o curso e o período (ex.: “O Escolhido — Cálculo I 2026.1”). Veja Semestres para definir as datas do período."),
            ("h3", "Comemorações"),
            ("p", "Quando um aluno conquista um título, o widget exibe um aviso (toast) com som e uma explosão de confete. Os alunos podem escolher qual título conquistado exibir no perfil."),
            ("tip", "Valorize os títulos dos alunos nas suas aulas — eles aparecem ao lado dos nomes nas telas de Alunos e na aba Rankings das análises, e reconhecê-los publicamente aumenta o engajamento."),
        ]),

        ("analytics", "16. Análises e relatórios", [
            ("p", "As análises transformam a atividade dos alunos em insights. Abra Análises na barra lateral; use o intervalo de datas e (para super admins) o filtro de instituição no topo. A página é organizada em abas."),
            ("ul", [
                "Visão Geral — um resumo diário escrito por IA, alunos ativos únicos, perguntas por módulo e tópicos mais perguntados.",
                "Engajamento e Risco — alunos que ficaram em silêncio, além de previsões de risco por IA de quem pode estar ficando para trás (exportável em CSV).",
                "Cursos — engajamento por curso e disciplina, com alertas pedagógicos (ex.: uma turma esvaziando, ou um conceito que a maioria erra).",
                "Conteúdo — o que os alunos mais perguntam, útil para identificar lacunas no seu material.",
                "Quizzes — taxas de acerto/erro por conceito, um mapa de calor de dificuldade e os conceitos mais difíceis. Se estiver vazio, use “Atualizar dados de quiz” (caso contrário, reconstrói durante a noite).",
                "Rankings — placares dos alunos e destaques positivos (próxima seção).",
            ]),
            ("h3", "Exportações"),
            ("p", "Baixe as análises em PDF, ou gere um Relatório Executivo para um resumo de mais alto nível, adequado para compartilhar com a liderança."),
            ("info", "A maioria das análises é pré-calculada durante a noite por desempenho, então atividades muito recentes podem só aparecer no dia seguinte. Os dados de quiz têm um botão “Atualizar” para quando você precisar na hora."),
        ]),

        ("rankings", "17. Rankings e destaques", [
            ("p", "A aba Rankings em Análises dá a professores e gestores uma visão positiva e motivadora dos seus alunos — a contraparte das listas de risco."),
            ("ul", [
                "Melhores estudantes — o placar por XP total, com nível, patamar e título equipado de cada aluno.",
                "Maior evolução — os maiores ganhos de XP no período selecionado, celebrando o esforço, não apenas a posição.",
                "Mais ativos — maiores sequências, alunos mais ativos e totais de perguntas feitas, quizzes feitos e planos de estudo criados.",
                "Conquistas — quem ganhou mais medalhas e os títulos que os alunos estão usando.",
            ]),
            ("tip", "Use “Maior evolução” para reconhecer alunos que estão se esforçando mesmo sem estar no topo — costuma ser mais motivador do que o placar bruto."),
        ]),

        ("semesters", "18. Semestres e o campeão do semestre", [
            ("p", "Os semestres permitem à sua instituição definir intervalos de datas do período letivo. Eles alimentam o título de campeão “O Escolhido”: quando um período termina, a TutorIA olha a atividade de cada curso naquela janela e coroa o melhor aluno."),
            ("ol", [
                "Abra Semestres na barra lateral (gestores e acima).",
                "Crie um semestre com um rótulo (ex.: “2026.1”) e suas datas de início e fim.",
                "Quando a data de fim passa, os campeões são premiados automaticamente — sem mais nenhuma ação.",
            ]),
            ("info", "Se você não configurar semestres, o campeão simplesmente não é coroado; todo o resto continua funcionando."),
        ]),

        ("plans", "19. Planos, assinaturas e modelos de IA", [
            ("h3", "Planos e assinaturas"),
            ("p", "Os planos definem o que uma instituição pode fazer (limites e recursos, como atividades). As assinaturas ligam uma instituição a um plano e cuidam da cobrança. Super admins gerenciam o catálogo de planos; gestores veem a assinatura atual da sua instituição."),
            ("h3", "Modelos de IA"),
            ("p", "A TutorIA pode usar vários provedores de IA. Na tela Modelos de IA você gerencia quais modelos estão disponíveis e ativa funções especiais para cada um:"),
            ("ul", [
                "Usado para extração de arquivos — lê documentos para extrair o texto.",
                "Usado para formatação — organiza as respostas do tutor em Markdown e matemática limpos.",
                "Usado para classificação de tópicos — agrupa as perguntas dos alunos em tópicos para as análises.",
            ]),
            ("p", "As instituições também podem fornecer suas próprias chaves de API de provedores, que são armazenadas de forma criptografada."),
        ]),

        ("admin", "20. Permissões, registros de auditoria e privacidade (LGPD)", [
            ("h3", "Permissões"),
            ("p", "Permissões granulares permitem conceder ou restringir habilidades específicas além dos perfis básicos. Gestores e super admins as gerenciam na tela Permissões."),
            ("h3", "Registros de auditoria"),
            ("p", "Toda alteração relevante (quem criou, editou ou excluiu o quê) é registrada nos Registros de Auditoria, filtráveis por usuário, ação e data e exportáveis em CSV — útil para prestação de contas e conformidade."),
            ("h3", "Privacidade / LGPD"),
            ("p", "A TutorIA foi feita pensando na proteção de dados brasileira. Os alunos podem dar consentimento, exportar seus dados e solicitar exclusão pelas opções de privacidade do widget. Os dados brutos de chat e quiz expiram automaticamente após 90 dias; apenas agregados anonimizados são mantidos a longo prazo para as análises."),
        ]),

        ("tips", "21. Dicas, boas práticas e solução de problemas", [
            ("h3", "Obtendo as melhores respostas"),
            ("ul", [
                "Envie materiais completos e em texto. PDFs apenas com imagens digitalizadas extraem mal — prefira texto de verdade.",
                "Escreva um prompt do sistema focado e diga ao tutor para se manter dentro do conteúdo do curso.",
                "Adicione alguns quizzes e flashcards cedo; eles impulsionam o engajamento e geram sinal para as análises.",
            ]),
            ("h3", "Perguntas frequentes"),
            ("ul", [
                "“Um aluno diz que o tutor não sabe algo.” Verifique se o arquivo relevante foi enviado e aparece como pronto, e se os materiais do módulo realmente cobrem aquilo.",
                "“A aba Quizzes das análises está vazia.” Ou nenhum quiz foi respondido ainda, ou a agregação noturna não rodou — clique em Atualizar dados de quiz.",
                "“Meu progresso / o progresso de um aluno não anda.” A atividade é recompensada com limites diários; garanta que o aluno está identificado (student_id no link) para ser atribuída a ele.",
                "“Os lembretes não chegam.” Confirme que o evento tem as opções de lembrete ligadas e que o aluno tem um e-mail válido cadastrado.",
            ]),
            ("p", "Ainda com dúvidas? Fale com o administrador da TutorIA ou com a equipe da plataforma — e baixe a versão DOCX correspondente deste guia para ter uma cópia offline que você pode compartilhar."),
        ]),
    ],
}

ES = {
    "title": "Guía del Usuario",
    "subtitle": "La guía completa para administradores, gestores y profesores",
    "updated": "Actualizado en junio de 2026",
    "tocTitle": "Índice",
    "sections": [
        ("introduction", "1. Bienvenido a TutorIA", [
            ("p", "TutorIA es una plataforma de tutoría con inteligencia artificial que permite a tu institución ofrecer a los estudiantes ayuda 24/7 basada en tu propio material de clase. Tú subes el contenido (PDF, diapositivas, documentos, transcripciones de video); TutorIA lo lee y responde las preguntas de los estudiantes en contexto — como un asistente que ha leído cada página y nunca duerme."),
            ("p", "Esta guía cubre todo lo que necesita quien opera TutorIA: cómo configurar instituciones, cursos y el tutor de IA, cómo cargar materiales y cuestionarios, cómo funciona la experiencia del estudiante y cómo leer las analíticas. No necesitas ser técnico para seguirla."),
            ("h3", "Las dos interfaces"),
            ("ul", [
                "Panel de gestión — donde administradores, gestores y profesores inician sesión para configurarlo todo y ver analíticas. Es la app en la que estás leyendo esta guía.",
                "Widget del estudiante (“Erwin”) — un chat ligero que los estudiantes abren mediante un enlace o incrustado en tu portal. Los estudiantes nunca crean cuenta ni inician sesión.",
            ]),
            ("tip", "Los estudiantes no inician sesión. Acceden al tutor por un enlace del curso (una “clave de acceso”). Tú decides qué puede hacer cada enlace."),
        ]),

        ("roles", "2. Roles y niveles de acceso", [
            ("p", "Lo que puedes ver y hacer en TutorIA depende de tu rol. Hay tres roles de equipo, además del estudiante (sin inicio de sesión)."),
            ("h3", "Súper administrador"),
            ("p", "Acceso a toda la plataforma. Gestiona todas las instituciones, crea otros administradores y puede filtrar cualquier pantalla por cualquier institución. Este rol es para los dueños de la plataforma TutorIA."),
            ("h3", "Gestor (profesor administrador)"),
            ("p", "Control total de una sola institución: sus cursos, módulos, profesores, estudiantes, analíticas y facturación. Todo lo que ve queda limitado automáticamente a su institución."),
            ("h3", "Profesor"),
            ("p", "Trabaja dentro de los cursos a los que está asignado: sube materiales, configura el tutor, crea cuestionarios, gestiona el calendario y ve analíticas de sus cursos."),
            ("h3", "Estudiante"),
            ("p", "Usa solo el widget. Sin contraseña, sin panel. Identificado opcionalmente por una matrícula, para que los profesores vean la actividad por estudiante."),
            ("info", "Si algún elemento de menú o botón descrito en esta guía no aparece para ti, casi siempre es porque tu rol no lo incluye. Consulta a un gestor o súper administrador."),
        ]),

        ("getting-started", "3. Inicio de sesión y navegación", [
            ("ol", [
                "Abre la dirección del panel que te dio tu institución e inicia sesión con tu usuario y contraseña.",
                "Si olvidaste la contraseña, usa “Olvidé mi contraseña” en la pantalla de inicio para recibir un enlace de restablecimiento por correo.",
                "Usa la barra lateral izquierda para navegar. Los elementos visibles dependen de tu rol.",
                "Usa el selector de idioma para leer el panel en portugués, inglés o español. El idioma de la interfaz es independiente del idioma en que responde el tutor de IA.",
            ]),
            ("p", "El Panel (inicio) muestra una vista rápida: actividad reciente, un resumen diario escrito por IA de lo que preguntaron los estudiantes y accesos directos a las áreas que más usas."),
            ("tip", "Por seguridad, la sesión expira tras 30 minutos de inactividad; solo vuelve a iniciar sesión. No perderás ningún trabajo."),
        ]),

        ("institutions", "4. Instituciones educativas", [
            ("p", "Una institución educativa es el contenedor de nivel más alto — una universidad, escuela o empresa de formación. Los súper admins las crean y gestionan; los gestores ven solo la suya."),
            ("h3", "Crear una institución (súper admin)"),
            ("ol", [
                "Ve a Instituciones educativas en la barra lateral y haz clic en Nueva institución.",
                "Completa el nombre y el código.",
                "Guarda. Ahora puedes crear cursos, profesores y estudiantes dentro de ella.",
            ]),
            ("p", "Al abrir una institución ves sus cursos, su equipo y un resumen de uso. La mayor parte del trabajo diario ocurre un nivel más abajo, dentro de un curso."),
        ]),

        ("courses", "5. Cursos", [
            ("p", "Un curso es una asignatura o clase — por ejemplo, “Cálculo I” o “Química Orgánica”. Los cursos contienen módulos, estudiantes, un calendario y (opcionalmente) un banco de preguntas del ENEM."),
            ("h3", "Crear un curso"),
            ("ol", [
                "Ve a Cursos y haz clic en Nuevo curso.",
                "Dale un nombre y (opcionalmente) una descripción y la institución a la que pertenece.",
                "Opcionalmente, define las áreas de disciplina usadas para los títulos de los estudiantes (ver Títulos) — p. ej. matemáticas, ciencias, lenguajes. Si las dejas en blanco, TutorIA las infiere a partir del nombre del curso.",
                "Guarda y abre el curso para añadir módulos y matricular estudiantes.",
            ]),
            ("p", "Dentro de un curso encontrarás pestañas para Módulos, Estudiantes, Calendario y Actividades. Cada una se detalla en las secciones siguientes."),
        ]),

        ("modules", "6. Módulos y el tutor de IA", [
            ("p", "Un módulo es una unidad dentro de un curso (un capítulo, tema o clase). El tutor de IA se configura por módulo, así que cada uno puede tener sus propios materiales, personalidad e idioma."),
            ("h3", "Crear un módulo"),
            ("ol", [
                "Abre un curso, ve a la pestaña Módulos y haz clic en Nuevo módulo.",
                "Ponle un nombre y escribe el prompt del sistema — las instrucciones que moldean el comportamiento del tutor (tono, foco, qué evitar).",
                "Elige el idioma de respuesta del tutor (portugués, inglés o español).",
                "Selecciona qué modelo de IA lo impulsa (o deja el predeterminado de la institución).",
                "Guarda y luego sube los materiales del módulo.",
            ]),
            ("h3", "Cómo responde el tutor"),
            ("p", "Cuando un estudiante pregunta algo, TutorIA busca en los materiales del módulo los pasajes más relevantes y los envía al modelo de IA junto con tu prompt del sistema. La respuesta, por tanto, se basa en tu contenido, no en el conocimiento general del modelo."),
            ("p", "El tutor refleja automáticamente al estudiante: responde en el idioma en que el estudiante escribe, recurriendo al idioma configurado del módulo cuando no está claro. También adopta un estilo de enseñanza adecuado a la disciplina (un tutor de matemáticas resuelve paso a paso; uno de historia explica el contexto)."),
            ("tip", "Usa “Mejorar prompt” para que la IA reescriba tu prompt del sistema en una versión más clara y eficaz — luego ajústalo."),
            ("warn", "Mantén el prompt del sistema enfocado. “Responde solo con base en el material del curso; si no está cubierto, dilo” es mucho más fiable que un prompt largo y vago."),
        ]),

        ("materials", "7. Materiales y archivos del curso", [
            ("p", "Los materiales son la fuente de verdad de las respuestas del tutor. Cuanto más completos sean tus archivos, mejor será la ayuda que reciben los estudiantes."),
            ("h3", "Subir archivos"),
            ("ol", [
                "Abre un módulo y sube archivos (PDF, Word, PowerPoint, Excel, texto).",
                "TutorIA extrae el texto automáticamente en segundo plano — los PDF grandes pueden tardar un minuto.",
                "Cuando un archivo aparece como listo, su contenido queda disponible para el tutor y para la generación de cuestionarios.",
            ]),
            ("h3", "Transcripciones de video"),
            ("p", "Puedes añadir videos de YouTube; TutorIA obtiene o genera una transcripción para que el tutor también responda sobre el contenido del video."),
            ("info", "Tipos de archivo admitidos: PDF, DOCX/DOC, PPTX, XLSX/XLS, CSV y TXT. Máximo 10 MB por archivo en los importadores de cuestionario/calendario."),
        ]),

        ("quizzes", "8. Cuestionarios", [
            ("p", "Los cuestionarios permiten a los estudiantes ponerse a prueba. TutorIA puede generarlos automáticamente a partir de tus materiales, o puedes importar un banco de preguntas que ya tengas."),
            ("h3", "Cuestionarios generados automáticamente"),
            ("p", "Tras procesar los materiales de un módulo, TutorIA genera preguntas de opción múltiple (con explicación para cada opción) a partir del contenido. Los estudiantes las responden en el widget y reciben retroalimentación inmediata."),
            ("h3", "Importar preguntas desde un archivo"),
            ("ol", [
                "En el módulo, elige subir un archivo de cuestionario (PDF, Word, Excel, CSV).",
                "TutorIA lo lee y extrae las preguntas, opciones y respuestas correctas.",
                "Revisa las preguntas extraídas, corrige lo que esté mal y confirma para publicarlas.",
            ]),
            ("warn", "Revisa siempre las preguntas importadas antes de confirmar — la extracción automática es buena, pero no perfecta, especialmente la opción correcta marcada."),
        ]),

        ("enem", "9. Banco de preguntas del ENEM / Vestibular", [
            ("p", "Para instituciones brasileñas, TutorIA incluye un banco de preguntas reales de exámenes ENEM anteriores con explicaciones, además de práctica por área de conocimiento. El ENEM se activa por curso, así que las instituciones que no lo necesitan nunca lo ven."),
            ("h3", "Activar el ENEM en un curso"),
            ("ol", [
                "Abre la configuración del curso y activa el módulo ENEM / Vestibular.",
                "Elige el/las área(s) de conocimiento relevante(s) para el curso (Lenguajes, Humanas, Naturaleza, Matemáticas).",
                "Las preguntas quedan disponibles de inmediato para los estudiantes — no tienen que generar nada.",
            ]),
            ("h3", "El banco ENEM (equipo)"),
            ("p", "Gestores y profesores pueden explorar las preguntas disponibles por año y área desde la página Banco ENEM. Los súper admins pueden importar años adicionales de exámenes al banco compartido."),
            ("p", "Los estudiantes practican mediante la pestaña ENEM/Vestibular del widget como un simulacro, con o sin tiempo, con explicaciones tras cada respuesta."),
        ]),

        ("calendar", "10. Calendario del curso", [
            ("p", "Cada curso tiene un calendario de eventos con fecha — exámenes, fechas de entrega, feriados, salidas y lo que haga falta. Los eventos aparecen para los estudiantes en el widget y pueden disparar correos de recordatorio."),
            ("h3", "Añadir un evento"),
            ("ol", [
                "Abre un curso y ve a la pestaña Calendario; haz clic en Añadir evento.",
                "Elige el tipo (examen, actividad, feriado, evento de campo, otro), el título, la fecha y la hora.",
                "Elige qué recordatorios por correo enviar a los estudiantes: 7 días, 3 días, 2 días y/o 24 horas antes.",
                "Guarda. El evento aparece en la cuadrícula del mes y en la lista de próximos del estudiante.",
            ]),
            ("info", "Todas las horas se ingresan y muestran en horario de Brasilia (America/São_Paulo) y se almacenan de forma consistente, para que estudiantes y equipo vean siempre el mismo momento."),
            ("tip", "Las actividades creadas en la pestaña Actividades aparecen automáticamente en el calendario en su fecha de entrega — solo necesitas añadir eventos aparte para lo que no sea una actividad."),
        ]),

        ("calendar-import", "11. Importar el calendario (PDF y calendarios externos)", [
            ("p", "Escribir cada fecha a mano es tedioso, así que TutorIA puede construir el calendario por ti de dos formas. Ambas terminan igual: revisas y editas los eventos sugeridos y confirmas — nada se añade hasta que lo apruebas."),
            ("h3", "Importar desde un PDF o documento"),
            ("ol", [
                "En la pestaña Calendario, haz clic en Importar desde PDF y mantén la opción “Subir archivo”.",
                "Sube tu programa o cronograma (PDF, Word, Excel, CSV).",
                "La IA lee el archivo y extrae los eventos con fecha en una tabla editable.",
                "Ajusta títulos, tipos, fechas y horas según haga falta, elige los recordatorios predeterminados y haz clic en Confirmar para añadirlos.",
            ]),
            ("h3", "Importar desde Google / Outlook / Apple Calendar"),
            ("p", "Puedes traer eventos directamente de un calendario existente usando su enlace iCal privado — sin necesidad de conectar la cuenta."),
            ("ol", [
                "Haz clic en Importar desde PDF y cambia a la pestaña “Desde enlace de calendario”.",
                "Pega la dirección iCal secreta de tu calendario. En Google Calendar: Configuración → tu calendario → “Dirección secreta en formato iCal”. En Outlook: Configuración → Calendario → Calendarios compartidos → Publicar → copia el enlace ICS.",
                "TutorIA obtiene el calendario y lista sus eventos en la misma tabla de revisión.",
                "Revisa, define los recordatorios y Confirma.",
            ]),
            ("warn", "Trata la dirección iCal secreta como una contraseña — cualquiera con ella puede leer ese calendario. Pega solo calendarios que poseas o administres."),
        ]),

        ("students", "12. Estudiantes y acceso", [
            ("p", "Los estudiantes son registros usados para vincular la actividad a una persona real y darles acceso al tutor. Nunca inician sesión."),
            ("h3", "Añadir estudiantes"),
            ("ul", [
                "Importa una planilla (CSV) de estudiantes — nombre, correo y matrícula — para crear muchos a la vez.",
                "Matricula a los estudiantes en los cursos a los que pertenecen.",
                "Elimina estudiantes en masa desde la vista general de Estudiantes cuando sea necesario.",
            ]),
            ("h3", "Claves de acceso (cómo llegan los estudiantes al tutor)"),
            ("p", "Una clave de acceso es un enlace largo y único asociado a un módulo. Compártelo con los estudiantes (o incrústalo en tu portal) y podrán conversar con el tutor. Para cada clave controlas si los estudiantes pueden conversar, descargar archivos y si debe verificarse antes una matrícula."),
            ("ol", [
                "Ve a Claves de Acceso y crea una clave para un módulo.",
                "Define sus permisos y, si quieres seguimiento por estudiante, exige una matrícula.",
                "Copia el enlace, o copia el fragmento de incrustación listo para poner el widget dentro de una página web existente.",
            ]),
            ("tip", "Añade “&student_id=...” al enlace de la clave para atribuir esa sesión a un estudiante específico, de modo que sus preguntas aparezcan en las analíticas con su nombre."),
        ]),

        ("widget", "13. La experiencia del estudiante (widget Erwin)", [
            ("p", "Todo lo que usan los estudiantes vive en el widget. Es deliberadamente simple, funciona en el móvil y no requiere instalación. Esto es lo que pueden hacer los estudiantes, para que sepas qué les estás habilitando."),
            ("ul", [
                "Conversar con el tutor — hacer preguntas y recibir respuestas basadas en el material del curso, con matemáticas y código bien formateados.",
                "Conversaciones anteriores — retomar donde lo dejaron.",
                "Planes de estudio — generar un plan personalizado para un curso (uno por curso por semana).",
                "Tarjetas (flashcards) — repasar conceptos clave, con repetición espaciada que retoma los que más cuestan.",
                "Cuestionarios y ENEM — practicar y recibir retroalimentación inmediata y explicada.",
                "Inicio y próximos — ver el siguiente examen o entrega de un vistazo.",
                "Progreso, clasificaciones y títulos — seguir XP, nivel y logros (ver las dos secciones siguientes).",
            ]),
            ("h3", "Personalizar el widget"),
            ("p", "El enlace de incrustación admite opciones de modo oscuro, respuestas en streaming y colores de marca (botón, burbuja del estudiante, burbuja del tutor), para que el widget combine con la identidad de tu institución."),
            ("info", "Algunas cosas son globales del estudiante, no por curso: su XP, nivel, racha y títulos son los mismos en todos los lugares donde estudia. Los cuestionarios, materiales y el tutor son por módulo."),
        ]),

        ("gamification", "14. Gamificación: XP, niveles y medallas", [
            ("p", "TutorIA recompensa el estudio constante para mantener el interés de los estudiantes. Es automático — no tienes que configurar nada — pero ayuda entender cómo funciona."),
            ("h3", "XP y niveles"),
            ("p", "Los estudiantes ganan XP (puntos de experiencia) por estudiar: hacer buenas preguntas, completar cuestionarios, repasar tarjetas, generar planes de estudio y practicar ENEM. Hay límites diarios que evitan acumular puntos artificialmente. El XP se acumula en niveles, y los niveles en rangos: Bronce → Plata → Oro → Platino → Diamante → Cristal."),
            ("info", "Nivel, rango, XP y racha son GLOBALES por estudiante — un único total en todos los cursos en que está matriculado. El estudiante no sube un nivel aparte por cada asignatura."),
            ("h3", "Rachas (streaks)"),
            ("p", "Estudiar en días consecutivos crea una racha. Las rachas son la señal más fuerte de un estudiante comprometido y alimentan varios de los títulos de abajo. Un correo de recordatorio avisa a los estudiantes cuya racha está por romperse."),
            ("h3", "Medallas y desafíos semanales"),
            ("p", "Los estudiantes ganan medallas puntuales por hitos (primeros pasos, 10/50 preguntas, un cuestionario perfecto, rachas de 7 y 30 días, llegar al nivel 10, hacer un plan de estudio). Cada semana hay pequeños desafíos (p. ej. 10 preguntas, 3 cuestionarios) que otorgan XP extra al completarlos."),
        ]),

        ("titles", "15. Títulos y logros", [
            ("p", "Los títulos son honores coleccionables y equipables que los estudiantes pueden lucir. Son una gran parte de lo que hace que los estudiantes vuelvan — y sí, el equipo puede ver qué títulos han ganado los estudiantes."),
            ("h3", "Títulos de área"),
            ("p", "Escalas por disciplina (Aprendiz → Maestro → Leyenda) que se ganan acumulando XP en un área como matemáticas, ciencias o lenguajes."),
            ("h3", "Títulos globales"),
            ("p", "Títulos de prestigio por hitos generales — rachas largas, niveles altos y mucho XP total (p. ej. Dedicado, Incansable, Veterano, Centurión, Erudito, Inmortal)."),
            ("h3", "Títulos ocultos y secretos (easter eggs)"),
            ("p", "Algunos títulos son secretos, mostrados como “???” hasta desbloquearse, con pistas enigmáticas y divertidas. Hay un título oculto de prestigio por maestría sostenida (una racha de 90 días en un nivel alto), además de títulos secretos temáticos que los estudiantes descubren conversando sobre franquicias populares — por ejemplo, pedirle al tutor que explique algo “al estilo Naruto” o mencionar Star Wars, JoJo, fútbol o el gimnasio hace que el tutor responda en ese estilo por un mensaje y desbloquea un título."),
            ("h3", "El Elegido — campeón del semestre"),
            ("p", "Al final de un semestre configurado, el estudiante n.º 1 en XP de cada curso es coronado con un trofeo permanente “El Elegido”, que muestra el curso y el período (p. ej. “El Elegido — Cálculo I 2026.1”). Ver Semestres para definir las fechas del período."),
            ("h3", "Celebraciones"),
            ("p", "Cuando un estudiante gana un título, el widget muestra un aviso (toast) con sonido y una explosión de confeti. Los estudiantes pueden elegir qué título ganado mostrar en su perfil."),
            ("tip", "Destaca los títulos de los estudiantes en tus clases — aparecen junto a los nombres en las pantallas de Estudiantes y en la pestaña Clasificaciones de las analíticas, y reconocerlos públicamente impulsa la participación."),
        ]),

        ("analytics", "16. Analíticas e informes", [
            ("p", "Las analíticas convierten la actividad de los estudiantes en información útil. Abre Analíticas en la barra lateral; usa el rango de fechas y (para súper admins) el filtro de institución en la parte superior. La página se organiza en pestañas."),
            ("ul", [
                "Visión General — un resumen diario escrito por IA, estudiantes activos únicos, preguntas por módulo y temas más preguntados.",
                "Compromiso y Riesgo — estudiantes que se han quedado en silencio, además de predicciones de riesgo por IA de quién podría estar quedándose atrás (exportable en CSV).",
                "Cursos — compromiso por curso y disciplina, con alertas pedagógicas (p. ej. una clase vaciándose, o un concepto que la mayoría falla).",
                "Contenido — lo que más preguntan los estudiantes, útil para detectar vacíos en tu material.",
                "Cuestionarios — tasas de acierto/fallo por concepto, un mapa de calor de dificultad y los conceptos más difíciles. Si está vacío, usa “Actualizar datos de quiz” (de lo contrario se reconstruye por la noche).",
                "Clasificaciones — tablas de los estudiantes y destacados positivos (siguiente sección).",
            ]),
            ("h3", "Exportaciones"),
            ("p", "Descarga las analíticas en PDF, o genera un Informe Ejecutivo para un resumen de más alto nivel, adecuado para compartir con la dirección."),
            ("info", "La mayoría de las analíticas se precalculan por la noche por rendimiento, así que la actividad muy reciente puede tardar hasta el día siguiente en aparecer. Los datos de cuestionarios tienen un botón “Actualizar” para cuando los necesites al instante."),
        ]),

        ("rankings", "17. Clasificaciones y destacados", [
            ("p", "La pestaña Clasificaciones en Analíticas ofrece a profesores y gestores una visión positiva y motivadora de sus estudiantes — la contraparte de las listas de riesgo."),
            ("ul", [
                "Mejores estudiantes — la tabla por XP total, con el nivel, rango y título equipado de cada estudiante.",
                "Mayor progreso — las mayores ganancias de XP en el período seleccionado, celebrando el esfuerzo, no solo la posición.",
                "Más activos — rachas más largas, estudiantes más activos y totales de preguntas hechas, cuestionarios realizados y planes de estudio creados.",
                "Logros — quién ha ganado más medallas y los títulos que los estudiantes están usando.",
            ]),
            ("tip", "Usa “Mayor progreso” para reconocer a estudiantes que se esfuerzan aunque no estén en la cima — suele ser más motivador que la tabla bruta."),
        ]),

        ("semesters", "18. Semestres y el campeón del semestre", [
            ("p", "Los semestres permiten a tu institución definir rangos de fechas del período. Impulsan el título de campeón “El Elegido”: cuando un período termina, TutorIA mira la actividad de cada curso en esa ventana y corona al mejor estudiante."),
            ("ol", [
                "Abre Semestres en la barra lateral (gestores y superiores).",
                "Crea un semestre con una etiqueta (p. ej. “2026.1”) y sus fechas de inicio y fin.",
                "Cuando pasa la fecha de fin, los campeones se otorgan automáticamente — sin más acciones.",
            ]),
            ("info", "Si no configuras semestres, simplemente no se corona al campeón; todo lo demás sigue funcionando."),
        ]),

        ("plans", "19. Planes, suscripciones y modelos de IA", [
            ("h3", "Planes y suscripciones"),
            ("p", "Los planes definen lo que una institución puede hacer (límites y funciones, como actividades). Las suscripciones vinculan una institución a un plan y gestionan la facturación. Los súper admins gestionan el catálogo de planes; los gestores ven la suscripción actual de su institución."),
            ("h3", "Modelos de IA"),
            ("p", "TutorIA puede usar varios proveedores de IA. Desde la pantalla Modelos de IA gestionas qué modelos están disponibles y activas funciones especiales para cada uno:"),
            ("ul", [
                "Usado para extracción de archivos — lee documentos para extraer el texto.",
                "Usado para formato — ordena las respuestas del tutor en Markdown y matemáticas limpios.",
                "Usado para clasificación de temas — agrupa las preguntas de los estudiantes en temas para las analíticas.",
            ]),
            ("p", "Las instituciones también pueden aportar sus propias claves de API de proveedores, que se almacenan cifradas."),
        ]),

        ("admin", "20. Permisos, registros de auditoría y privacidad (LGPD)", [
            ("h3", "Permisos"),
            ("p", "Los permisos granulares permiten conceder o restringir capacidades específicas más allá de los roles básicos. Gestores y súper admins los gestionan desde la pantalla Permisos."),
            ("h3", "Registros de auditoría"),
            ("p", "Todo cambio relevante (quién creó, editó o eliminó qué) se registra en los Registros de Auditoría, filtrables por usuario, acción y fecha y exportables a CSV — útil para rendición de cuentas y cumplimiento."),
            ("h3", "Privacidad / LGPD"),
            ("p", "TutorIA está hecha pensando en la protección de datos brasileña. Los estudiantes pueden dar consentimiento, exportar sus datos y solicitar su eliminación mediante las opciones de privacidad del widget. Los datos brutos de chat y cuestionarios expiran automáticamente tras 90 días; solo se conservan agregados anonimizados a largo plazo para las analíticas."),
        ]),

        ("tips", "21. Consejos, buenas prácticas y solución de problemas", [
            ("h3", "Obtener las mejores respuestas"),
            ("ul", [
                "Sube materiales completos y en texto. Los PDF que son solo imágenes escaneadas se extraen mal — prefiere texto real.",
                "Escribe un prompt del sistema enfocado y dile al tutor que se mantenga dentro del contenido del curso.",
                "Añade algunos cuestionarios y tarjetas pronto; impulsan la participación y generan señal para las analíticas.",
            ]),
            ("h3", "Preguntas frecuentes"),
            ("ul", [
                "“Un estudiante dice que el tutor no sabe algo.” Verifica que el archivo relevante esté subido y aparezca como listo, y que los materiales del módulo realmente lo cubran.",
                "“La pestaña Cuestionarios de las analíticas está vacía.” O no se ha respondido ningún cuestionario aún, o la agregación nocturna no se ejecutó — haz clic en Actualizar datos de quiz.",
                "“Mi progreso / el progreso de un estudiante no avanza.” La actividad se recompensa con límites diarios; asegúrate de que el estudiante esté identificado (student_id en el enlace) para que se le atribuya.",
                "“Los recordatorios no llegan.” Confirma que el evento tiene activadas las opciones de recordatorio y que el estudiante tiene un correo válido registrado.",
            ]),
            ("p", "¿Aún con dudas? Contacta al administrador de TutorIA o al equipo de la plataforma — y descarga la versión DOCX correspondiente de esta guía para tener una copia sin conexión que puedas compartir."),
        ]),
    ],
}

CONTENT = {"en": EN, "pt-br": PT, "es": ES}


